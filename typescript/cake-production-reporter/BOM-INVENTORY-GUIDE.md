# BOM & Inventory Integration Guide

This guide shows you how to extend the Cake Production Reporter with Bill of Materials (BOM) and inventory tracking capabilities.

## 🎯 What You Get

With BOM/Inventory integration, the agent will:

✅ **Calculate Ingredient Requirements** - Exact quantities needed for production
✅ **Check Stock Availability** - Verify you have enough ingredients
✅ **Generate Shopping Lists** - What to buy and estimated costs
✅ **Alert on Low Stock** - Warn when ingredients are running low
✅ **Track Usage** - Automatically deduct from inventory after production
✅ **Cost Estimation** - Calculate total ingredient costs

## 📋 Setup (3 Steps)

### Step 1: Run the Inventory Schema

```bash
# In Supabase SQL Editor, run:
typescript/supabase-examples/database/inventory-schema.sql
```

This creates:
- `ingredients` table - Your inventory
- `cake_recipes` table - BOMs for each cake type
- `inventory_transactions` table - Stock movement history
- Helper functions for calculations

### Step 2: Add Your Recipes (BOMs)

Example: Chocolate Cake Recipe

```sql
-- Add ingredients first
INSERT INTO ingredients (name, unit, current_stock, minimum_stock, cost_per_unit) VALUES
    ('Flour', 'kg', 50, 20, 1.50),
    ('Sugar', 'kg', 30, 15, 2.00),
    ('Cocoa Powder', 'kg', 10, 5, 12.00),
    ('Eggs', 'units', 100, 50, 0.30),
    ('Butter', 'kg', 20, 10, 8.00),
    ('Milk', 'L', 25, 10, 1.20);

-- Add recipe (quantities per cake)
INSERT INTO cake_recipes (cake_type, ingredient_id, quantity_per_cake)
SELECT 'Chocolate Cake', id, quantity FROM (
    VALUES
        ((SELECT id FROM ingredients WHERE name = 'Flour'), 0.5),        -- 500g flour
        ((SELECT id FROM ingredients WHERE name = 'Sugar'), 0.4),        -- 400g sugar
        ((SELECT id FROM ingredients WHERE name = 'Cocoa Powder'), 0.1), -- 100g cocoa
        ((SELECT id FROM ingredients WHERE name = 'Eggs'), 4.0),         -- 4 eggs
        ((SELECT id FROM ingredients WHERE name = 'Butter'), 0.2),       -- 200g butter
        ((SELECT id FROM ingredients WHERE name = 'Milk'), 0.3)          -- 300ml milk
) AS recipe(id, quantity);
```

### Step 3: Use the Extended Agent

```typescript
import { CakeProductionReporterWithBOM } from './CakeProductionReporterWithBOM';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

const agent = new CakeProductionReporterWithBOM({
  supabaseClient: supabase,
  reportFormat: 'text',
  checkInventory: true,
  includeShoppingList: true,
  alertOnLowStock: true,
  autoDeductInventory: false, // Set to true to auto-deduct after production
});

const report = await agent.execute();
console.log(report.ingredient_requirements);
console.log(report.shopping_list);
```

## 📊 Example Report Output

```
======================================================================
🎂 CAKE PRODUCTION REPORT WITH INVENTORY ANALYSIS
======================================================================
Report Generated: 2025-11-13 08:00
Period: 2025-11-06 to 2025-11-13
Total Orders: 15

PRODUCTION REQUIREMENTS:
----------------------------------------------------------------------
  Chocolate Cake                          14 cakes
  Vanilla Cake                            10 cakes
  Red Velvet Cake                          6 cakes
----------------------------------------------------------------------
TOTAL CAKES TO PRODUCE: 30 cakes

INVENTORY STATUS:
----------------------------------------------------------------------
⚠ WARNING: 2 ingredient(s) are insufficient
  Estimated shortage cost: $45.60

INGREDIENT REQUIREMENTS:
----------------------------------------------------------------------
  ✓ Flour                  15.00 kg (in stock: 50.00 kg)
  ✓ Sugar                  12.50 kg (in stock: 30.00 kg)
  ⚠ Cocoa Powder            1.80 kg (need 0.30 kg more)
  ✓ Eggs                   98.00 units (in stock: 100.00 units)
  ⚠ Butter                  7.50 kg (need 2.00 kg more)
  ✓ Milk                    8.40 L (in stock: 25.00 L)

⚠ LOW STOCK ALERTS:
----------------------------------------------------------------------
  Butter: 5.5 kg (minimum: 10 kg, short by 4.50)
  Cocoa Powder: 1.5 kg (minimum: 5 kg, short by 3.50)

SHOPPING LIST
==================================================
☐ Cocoa Powder: 0.30 kg (~$3.60)
☐ Butter: 2.00 kg (~$16.00)
==================================================
TOTAL ESTIMATED COST: $19.60
======================================================================
```

## 🗄️ Database Tables

### Ingredients Table

```typescript
interface Ingredient {
  id: UUID;
  name: string;           // "Flour", "Sugar", etc.
  unit: string;           // "kg", "L", "units", etc.
  current_stock: number;  // Current quantity in stock
  minimum_stock: number;  // Reorder threshold
  reorder_quantity: number; // How much to order
  cost_per_unit: number;  // Price per unit
  supplier: string;       // Supplier name
}
```

### Cake Recipes Table (BOM)

```typescript
interface CakeRecipe {
  id: UUID;
  cake_type: string;         // Must match your order cake_type
  ingredient_id: UUID;       // Reference to ingredient
  quantity_per_cake: number; // Amount needed per cake
}
```

### Inventory Transactions Table

```typescript
interface InventoryTransaction {
  id: UUID;
  ingredient_id: UUID;
  transaction_type: 'purchase' | 'usage' | 'adjustment' | 'waste';
  quantity: number;      // Positive for additions, negative for usage
  reference_id: UUID;    // Link to production report
  created_at: timestamp;
}
```

## 🔧 PostgreSQL Functions

### Calculate Ingredient Requirements

```sql
SELECT * FROM calculate_ingredient_requirements(
  '{"Chocolate Cake": 10, "Vanilla Cake": 5}'::JSONB
);
```

Returns:
- Ingredient name
- Required quantity
- Current stock
- Shortage (if any)
- Cost estimate

### Check Inventory Availability

```sql
SELECT * FROM check_inventory_availability(
  '{"Chocolate Cake": 10, "Vanilla Cake": 5}'::JSONB
);
```

Returns:
- `all_available`: boolean
- `missing_ingredients_count`: integer
- `total_shortage_cost`: decimal

### Deduct Ingredients After Production

```sql
SELECT deduct_ingredients_for_production(
  '{"Chocolate Cake": 10}'::JSONB,
  'report-uuid'::UUID
);
```

Automatically:
- Updates stock levels
- Logs transactions
- Links to production report

## 💻 Frontend Integration

### Using the React Component

```tsx
import ProductionReportWithInventory from './ProductionReportWithInventory';

function App() {
  return <ProductionReportWithInventory />;
}
```

The component shows:
- Production requirements
- Ingredient requirements with stock levels
- Visual indicators (✓ for sufficient, ⚠ for shortage)
- Shopping list with costs
- Low stock alerts
- Inventory status

### Using the Hook

```typescript
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export function useInventoryCheck(productionData: ProductionData) {
  const [requirements, setRequirements] = useState([]);
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    async function check() {
      // Calculate requirements
      const { data } = await supabase.rpc('calculate_ingredient_requirements', {
        production_data: productionData
      });
      setRequirements(data);

      // Check availability
      const { data: avail } = await supabase.rpc('check_inventory_availability', {
        production_data: productionData
      });
      setAvailability(avail[0]);
    }

    check();
  }, [productionData]);

  return { requirements, availability };
}
```

## 🔄 Workflows

### Workflow 1: Weekly Production Planning

1. **Monday Morning** - Generate report
2. Agent calculates ingredient needs
3. Review shopping list
4. Order missing ingredients
5. **Thursday** - Generate next report
6. Adjust orders if needed

### Workflow 2: Auto-Deduction After Baking

```typescript
const agent = new CakeProductionReporterWithBOM({
  supabaseClient: supabase,
  autoDeductInventory: true, // Enable auto-deduction
});

// After baking is complete
const report = await agent.execute();
// Ingredients automatically deducted from inventory
```

### Workflow 3: Manual Stock Updates

```sql
-- Add new stock after delivery
INSERT INTO inventory_transactions (ingredient_id, transaction_type, quantity, notes)
VALUES (
  (SELECT id FROM ingredients WHERE name = 'Flour'),
  'purchase',
  50,
  'Weekly delivery from supplier'
);

-- Update stock level
UPDATE ingredients
SET current_stock = current_stock + 50,
    updated_at = NOW()
WHERE name = 'Flour';
```

## 📈 Advanced Features

### Recipe Costing

```sql
-- Get cost breakdown for a cake type
SELECT
    cake_type,
    ingredient_name,
    quantity_per_cake,
    unit,
    cost_per_cake
FROM recipe_details
WHERE cake_type = 'Chocolate Cake'
ORDER BY cost_per_cake DESC;
```

### Inventory Value Report

```sql
-- Calculate total inventory value
SELECT
    SUM(current_stock * cost_per_unit) as total_value
FROM ingredients;
```

### Usage Analytics

```sql
-- See most used ingredients
SELECT
    i.name,
    COUNT(t.id) as transaction_count,
    SUM(ABS(t.quantity)) as total_used,
    i.unit
FROM ingredients i
JOIN inventory_transactions t ON i.id = t.ingredient_id
WHERE t.transaction_type = 'usage'
  AND t.created_at >= NOW() - INTERVAL '30 days'
GROUP BY i.id, i.name, i.unit
ORDER BY total_used DESC;
```

## 🎨 Customization

### Custom Units

Extend the unit types to match your needs:
```sql
-- Add any unit you need
-- Common: kg, g, L, ml, units, cups, tbsp, tsp, oz, lb
```

### Recipe Variations

```sql
-- Add seasonal or size variations
INSERT INTO cake_recipes (cake_type, ingredient_id, quantity_per_cake, notes)
VALUES
  (...)
WHERE notes = 'Large size variation';
```

### Waste Tracking

```sql
-- Track ingredient waste
INSERT INTO inventory_transactions (ingredient_id, transaction_type, quantity, notes)
VALUES (
  (SELECT id FROM ingredients WHERE name = 'Flour'),
  'waste',
  -2.5,
  'Spilled during preparation'
);
```

## 🚨 Troubleshooting

### "Ingredient not found" errors

**Fix**: Ensure cake_type in orders matches cake_type in recipes exactly
```sql
-- Check for mismatches
SELECT DISTINCT cake_type FROM orders
EXCEPT
SELECT DISTINCT cake_type FROM cake_recipes;
```

### Stock levels not updating

**Fix**: Check RLS policies allow updates
```sql
-- Grant update permissions
CREATE POLICY "Allow updates to ingredients"
    ON ingredients FOR UPDATE
    TO authenticated
    USING (true);
```

### Function returns empty results

**Fix**: Verify recipes exist for all cake types
```sql
-- Find cakes without recipes
SELECT DISTINCT o.cake_type
FROM orders o
LEFT JOIN cake_recipes cr ON o.cake_type = cr.cake_type
WHERE cr.id IS NULL;
```

## 🎯 Best Practices

1. **Keep Recipes Updated** - Update BOMs when recipes change
2. **Regular Stock Counts** - Verify physical inventory matches database
3. **Buffer Stock** - Set minimum_stock to cover lead times
4. **Track Costs** - Keep cost_per_unit current for accurate estimates
5. **Review Low Stock** - Check alerts before each production run
6. **Backup Data** - Regular backups of ingredient and recipe tables

## 📚 Next Steps

1. ✅ Set up your ingredient list
2. ✅ Add recipes for all your cake types
3. ✅ Test with sample production data
4. ✅ Integrate with your frontend
5. ✅ Set up automated reporting
6. ✅ Train staff on updating inventory

## 🔗 Related Files

- Main Agent: `CakeProductionReporter.ts`
- Extended Agent: `CakeProductionReporterWithBOM.ts`
- Database Schema: `inventory-schema.sql`
- React Component: `ProductionReportWithInventory.tsx`

Now you have complete visibility into your ingredient needs and inventory status! 🎉
