-- ============================================================================
-- Inventory & BOM (Bill of Materials) Schema Extension
-- ============================================================================
-- This extends the Cake Production Reporter with inventory and BOM support
-- Run this AFTER the main schema.sql

-- ============================================================================
-- 1. Ingredients/Inventory Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    unit TEXT NOT NULL, -- 'kg', 'g', 'L', 'ml', 'units', 'cups', etc.
    current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    minimum_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    reorder_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cost_per_unit DECIMAL(10, 2),
    supplier TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_low_stock ON ingredients(current_stock, minimum_stock)
    WHERE current_stock <= minimum_stock;

-- Enable RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users to read ingredients"
    ON ingredients FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access to ingredients"
    ON ingredients FOR ALL
    TO service_role
    USING (true);

-- ============================================================================
-- 2. Cake Recipes/BOM Table
-- ============================================================================
-- Defines the ingredients needed for each cake type

CREATE TABLE IF NOT EXISTS cake_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cake_type TEXT NOT NULL,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity_per_cake DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cake_type, ingredient_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cake_recipes_cake_type ON cake_recipes(cake_type);
CREATE INDEX IF NOT EXISTS idx_cake_recipes_ingredient ON cake_recipes(ingredient_id);

-- Enable RLS
ALTER TABLE cake_recipes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users to read recipes"
    ON cake_recipes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access to recipes"
    ON cake_recipes FOR ALL
    TO service_role
    USING (true);

-- ============================================================================
-- 3. Inventory Transactions Table (Optional - for tracking stock changes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL, -- 'purchase', 'usage', 'adjustment', 'waste'
    quantity DECIMAL(10, 2) NOT NULL, -- positive for additions, negative for usage
    reference_id UUID, -- link to order/report if applicable
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_ingredient ON inventory_transactions(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(created_at DESC);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read transactions"
    ON inventory_transactions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access to transactions"
    ON inventory_transactions FOR ALL
    TO service_role
    USING (true);

-- ============================================================================
-- 4. View: Recipe Details with Ingredient Info
-- ============================================================================

CREATE OR REPLACE VIEW recipe_details AS
SELECT
    cr.cake_type,
    i.name as ingredient_name,
    cr.quantity_per_cake,
    i.unit,
    i.cost_per_unit,
    (cr.quantity_per_cake * i.cost_per_unit) as cost_per_cake
FROM cake_recipes cr
JOIN ingredients i ON cr.ingredient_id = i.id
ORDER BY cr.cake_type, i.name;

-- ============================================================================
-- 5. View: Low Stock Ingredients
-- ============================================================================

CREATE OR REPLACE VIEW low_stock_ingredients AS
SELECT
    id,
    name,
    unit,
    current_stock,
    minimum_stock,
    reorder_quantity,
    (minimum_stock - current_stock) as shortage,
    supplier
FROM ingredients
WHERE current_stock <= minimum_stock
ORDER BY (minimum_stock - current_stock) DESC;

-- ============================================================================
-- 6. Function: Calculate Ingredient Requirements
-- ============================================================================
-- Calculate total ingredients needed for production

CREATE OR REPLACE FUNCTION calculate_ingredient_requirements(
    production_data JSONB -- {"Chocolate Cake": 10, "Vanilla Cake": 5}
)
RETURNS TABLE (
    ingredient_name TEXT,
    required_quantity DECIMAL(10, 2),
    unit TEXT,
    current_stock DECIMAL(10, 2),
    shortage DECIMAL(10, 2),
    is_sufficient BOOLEAN,
    estimated_cost DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.name as ingredient_name,
        SUM(
            cr.quantity_per_cake * (production_data->>cr.cake_type)::DECIMAL
        )::DECIMAL(10, 2) as required_quantity,
        i.unit,
        i.current_stock,
        GREATEST(
            SUM(cr.quantity_per_cake * (production_data->>cr.cake_type)::DECIMAL) - i.current_stock,
            0
        )::DECIMAL(10, 2) as shortage,
        (i.current_stock >= SUM(cr.quantity_per_cake * (production_data->>cr.cake_type)::DECIMAL)) as is_sufficient,
        (SUM(cr.quantity_per_cake * (production_data->>cr.cake_type)::DECIMAL) * i.cost_per_unit)::DECIMAL(10, 2) as estimated_cost
    FROM (
        SELECT DISTINCT jsonb_object_keys(production_data) as cake_type
    ) cakes
    JOIN cake_recipes cr ON cr.cake_type = cakes.cake_type
    JOIN ingredients i ON cr.ingredient_id = i.id
    GROUP BY i.id, i.name, i.unit, i.current_stock, i.cost_per_unit
    ORDER BY ingredient_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Function: Check Inventory Availability
-- ============================================================================
-- Check if we have enough ingredients for the production plan

CREATE OR REPLACE FUNCTION check_inventory_availability(
    production_data JSONB
)
RETURNS TABLE (
    all_available BOOLEAN,
    missing_ingredients_count INTEGER,
    total_shortage_cost DECIMAL(10, 2)
) AS $$
DECLARE
    availability_result RECORD;
BEGIN
    SELECT
        (COUNT(*) FILTER (WHERE NOT is_sufficient) = 0) as all_available,
        COUNT(*) FILTER (WHERE NOT is_sufficient) as missing_count,
        SUM(shortage * cost_per_unit) as shortage_cost
    INTO availability_result
    FROM calculate_ingredient_requirements(production_data) req
    JOIN ingredients i ON req.ingredient_name = i.name;

    RETURN QUERY SELECT
        availability_result.all_available,
        availability_result.missing_count::INTEGER,
        availability_result.shortage_cost::DECIMAL(10, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. Function: Update Inventory After Production
-- ============================================================================
-- Deduct ingredients from inventory after production

CREATE OR REPLACE FUNCTION deduct_ingredients_for_production(
    production_data JSONB,
    report_id UUID
)
RETURNS VOID AS $$
DECLARE
    ingredient_record RECORD;
BEGIN
    -- Calculate and deduct each ingredient
    FOR ingredient_record IN
        SELECT
            i.id,
            i.name,
            SUM(cr.quantity_per_cake * (production_data->>cr.cake_type)::DECIMAL) as total_used
        FROM (
            SELECT DISTINCT jsonb_object_keys(production_data) as cake_type
        ) cakes
        JOIN cake_recipes cr ON cr.cake_type = cakes.cake_type
        JOIN ingredients i ON cr.ingredient_id = i.id
        GROUP BY i.id, i.name
    LOOP
        -- Update stock
        UPDATE ingredients
        SET
            current_stock = current_stock - ingredient_record.total_used,
            updated_at = NOW()
        WHERE id = ingredient_record.id;

        -- Log transaction
        INSERT INTO inventory_transactions (
            ingredient_id,
            transaction_type,
            quantity,
            reference_id,
            notes
        ) VALUES (
            ingredient_record.id,
            'usage',
            -ingredient_record.total_used,
            report_id,
            'Used for production batch'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. Sample Data (Optional - for testing)
-- ============================================================================

/*
-- Sample ingredients
INSERT INTO ingredients (name, unit, current_stock, minimum_stock, reorder_quantity, cost_per_unit) VALUES
    ('Flour', 'kg', 50, 20, 50, 1.50),
    ('Sugar', 'kg', 30, 15, 30, 2.00),
    ('Eggs', 'units', 100, 50, 100, 0.30),
    ('Butter', 'kg', 20, 10, 20, 8.00),
    ('Cocoa Powder', 'kg', 10, 5, 10, 12.00),
    ('Vanilla Extract', 'ml', 500, 200, 500, 0.05),
    ('Baking Powder', 'g', 1000, 500, 1000, 0.01),
    ('Milk', 'L', 25, 10, 30, 1.20),
    ('Cream Cheese', 'kg', 8, 5, 10, 10.00),
    ('Carrots', 'kg', 5, 3, 10, 1.50);

-- Sample recipes (BOM)
-- Chocolate Cake recipe
INSERT INTO cake_recipes (cake_type, ingredient_id, quantity_per_cake)
SELECT 'Chocolate Cake', id, quantity FROM (
    VALUES
        ((SELECT id FROM ingredients WHERE name = 'Flour'), 0.5),
        ((SELECT id FROM ingredients WHERE name = 'Sugar'), 0.4),
        ((SELECT id FROM ingredients WHERE name = 'Cocoa Powder'), 0.1),
        ((SELECT id FROM ingredients WHERE name = 'Eggs'), 4.0),
        ((SELECT id FROM ingredients WHERE name = 'Butter'), 0.2),
        ((SELECT id FROM ingredients WHERE name = 'Milk'), 0.3),
        ((SELECT id FROM ingredients WHERE name = 'Baking Powder'), 10.0)
) AS recipe(id, quantity);

-- Vanilla Cake recipe
INSERT INTO cake_recipes (cake_type, ingredient_id, quantity_per_cake)
SELECT 'Vanilla Cake', id, quantity FROM (
    VALUES
        ((SELECT id FROM ingredients WHERE name = 'Flour'), 0.5),
        ((SELECT id FROM ingredients WHERE name = 'Sugar'), 0.35),
        ((SELECT id FROM ingredients WHERE name = 'Vanilla Extract'), 10.0),
        ((SELECT id FROM ingredients WHERE name = 'Eggs'), 3.0),
        ((SELECT id FROM ingredients WHERE name = 'Butter'), 0.25),
        ((SELECT id FROM ingredients WHERE name = 'Milk'), 0.2),
        ((SELECT id FROM ingredients WHERE name = 'Baking Powder'), 8.0)
) AS recipe(id, quantity);

-- Red Velvet Cake recipe
INSERT INTO cake_recipes (cake_type, ingredient_id, quantity_per_cake)
SELECT 'Red Velvet Cake', id, quantity FROM (
    VALUES
        ((SELECT id FROM ingredients WHERE name = 'Flour'), 0.5),
        ((SELECT id FROM ingredients WHERE name = 'Sugar'), 0.4),
        ((SELECT id FROM ingredients WHERE name = 'Cocoa Powder'), 0.05),
        ((SELECT id FROM ingredients WHERE name = 'Eggs'), 3.0),
        ((SELECT id FROM ingredients WHERE name = 'Butter'), 0.15),
        ((SELECT id FROM ingredients WHERE name = 'Milk'), 0.3),
        ((SELECT id FROM ingredients WHERE name = 'Cream Cheese'), 0.3),
        ((SELECT id FROM ingredients WHERE name = 'Baking Powder'), 8.0)
) AS recipe(id, quantity);

-- Carrot Cake recipe
INSERT INTO cake_recipes (cake_type, ingredient_id, quantity_per_cake)
SELECT 'Carrot Cake', id, quantity FROM (
    VALUES
        ((SELECT id FROM ingredients WHERE name = 'Flour'), 0.4),
        ((SELECT id FROM ingredients WHERE name = 'Sugar'), 0.35),
        ((SELECT id FROM ingredients WHERE name = 'Carrots'), 0.3),
        ((SELECT id FROM ingredients WHERE name = 'Eggs'), 3.0),
        ((SELECT id FROM ingredients WHERE name = 'Butter'), 0.2),
        ((SELECT id FROM ingredients WHERE name = 'Cream Cheese'), 0.25),
        ((SELECT id FROM ingredients WHERE name = 'Baking Powder'), 10.0)
) AS recipe(id, quantity);
*/

-- ============================================================================
-- 10. Helpful Queries
-- ============================================================================

-- Calculate ingredients needed for a specific production plan
-- SELECT * FROM calculate_ingredient_requirements(
--     '{"Chocolate Cake": 10, "Vanilla Cake": 5, "Red Velvet Cake": 3}'::JSONB
-- );

-- Check if we have enough inventory
-- SELECT * FROM check_inventory_availability(
--     '{"Chocolate Cake": 10, "Vanilla Cake": 5}'::JSONB
-- );

-- View all recipes
-- SELECT * FROM recipe_details ORDER BY cake_type;

-- View low stock items
-- SELECT * FROM low_stock_ingredients;

-- Get recipe for specific cake
-- SELECT
--     i.name,
--     cr.quantity_per_cake,
--     i.unit
-- FROM cake_recipes cr
-- JOIN ingredients i ON cr.ingredient_id = i.id
-- WHERE cr.cake_type = 'Chocolate Cake';
