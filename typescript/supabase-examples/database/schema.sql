-- ============================================================================
-- Cake Production Reporter - Database Schema
-- ============================================================================
-- This file contains the database schema needed for the Cake Production Reporter Agent
-- Run this in your Supabase SQL Editor to set up the required tables and functions

-- ============================================================================
-- 1. Orders Table
-- ============================================================================
-- If you don't already have an orders table, create one like this:

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT,
    cake_type TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending',
    price DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_cake_type ON orders(cake_type);

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your security needs)
CREATE POLICY "Allow authenticated users to read orders"
    ON orders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access to orders"
    ON orders FOR ALL
    TO service_role
    USING (true);

-- ============================================================================
-- 2. Production Reports Table
-- ============================================================================
-- Stores generated production reports

CREATE TABLE IF NOT EXISTS production_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    total_orders INTEGER NOT NULL,
    production_data JSONB NOT NULL, -- {"Chocolate Cake": 15, "Vanilla Cake": 10}
    report_text TEXT,
    report_html TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_production_reports_report_date ON production_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_production_reports_period ON production_reports(period_start, period_end);

-- Enable RLS
ALTER TABLE production_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users to read reports"
    ON production_reports FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access to reports"
    ON production_reports FOR ALL
    TO service_role
    USING (true);

-- ============================================================================
-- 3. PostgreSQL Function: Get Orders for Production
-- ============================================================================
-- Optional: Create a custom function for fetching orders
-- This allows for more complex filtering logic

CREATE OR REPLACE FUNCTION get_orders_for_production(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ
)
RETURNS TABLE (
    id UUID,
    cake_type TEXT,
    quantity INTEGER,
    order_date TIMESTAMPTZ,
    customer_name TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.cake_type,
        o.quantity,
        o.order_date,
        o.customer_name,
        o.status
    FROM orders o
    WHERE o.order_date >= start_date
      AND o.order_date <= end_date
      AND o.status IN ('confirmed', 'paid')
    ORDER BY o.order_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. PostgreSQL Function: Get Production Summary
-- ============================================================================
-- Aggregates orders by cake type for a date range

CREATE OR REPLACE FUNCTION get_production_summary(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    buffer_percentage INTEGER DEFAULT 10
)
RETURNS TABLE (
    cake_type TEXT,
    total_quantity INTEGER,
    buffered_quantity INTEGER,
    order_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.cake_type,
        SUM(o.quantity)::INTEGER as total_quantity,
        CEIL(SUM(o.quantity) * (1 + buffer_percentage::DECIMAL / 100))::INTEGER as buffered_quantity,
        COUNT(*)::INTEGER as order_count
    FROM orders o
    WHERE o.order_date >= start_date
      AND o.order_date <= end_date
      AND o.status IN ('confirmed', 'paid')
    GROUP BY o.cake_type
    ORDER BY SUM(o.quantity) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. View: Latest Production Report
-- ============================================================================
-- Makes it easy to get the most recent report

CREATE OR REPLACE VIEW latest_production_report AS
SELECT *
FROM production_reports
ORDER BY report_date DESC
LIMIT 1;

-- ============================================================================
-- 6. Scheduled Function with pg_cron (Optional)
-- ============================================================================
-- Note: pg_cron extension must be enabled by Supabase support
-- Contact Supabase support to enable pg_cron for your project

-- Enable pg_cron extension (requires Supabase support)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule report generation for Monday and Thursday at 8:00 AM UTC
-- SELECT cron.schedule(
--     'production-report-monday',
--     '0 8 * * 1',  -- Every Monday at 8:00 AM
--     $$
--     SELECT net.http_post(
--         url := 'https://your-project.supabase.co/functions/v1/production-report',
--         headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::JSONB,
--         body := '{}'::JSONB
--     );
--     $$
-- );

-- SELECT cron.schedule(
--     'production-report-thursday',
--     '0 8 * * 4',  -- Every Thursday at 8:00 AM
--     $$
--     SELECT net.http_post(
--         url := 'https://your-project.supabase.co/functions/v1/production-report',
--         headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::JSONB,
--         body := '{}'::JSONB
--     );
--     $$
-- );

-- ============================================================================
-- 7. Sample Data (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample orders for testing
/*
INSERT INTO orders (customer_name, cake_type, quantity, order_date, status) VALUES
    ('John Doe', 'Chocolate Cake', 2, NOW() - INTERVAL '3 days', 'confirmed'),
    ('Jane Smith', 'Vanilla Cake', 1, NOW() - INTERVAL '3 days', 'confirmed'),
    ('Bob Johnson', 'Red Velvet Cake', 3, NOW() - INTERVAL '2 days', 'paid'),
    ('Alice Brown', 'Chocolate Cake', 1, NOW() - INTERVAL '2 days', 'confirmed'),
    ('Charlie Wilson', 'Carrot Cake', 2, NOW() - INTERVAL '1 day', 'confirmed'),
    ('Diana Davis', 'Lemon Cake', 1, NOW() - INTERVAL '1 day', 'paid'),
    ('Eve Martinez', 'Chocolate Cake', 4, NOW(), 'confirmed'),
    ('Frank Anderson', 'Vanilla Cake', 2, NOW(), 'paid');
*/

-- ============================================================================
-- 8. Helpful Queries
-- ============================================================================

-- Get production summary for last 7 days
-- SELECT * FROM get_production_summary(NOW() - INTERVAL '7 days', NOW(), 10);

-- Get all confirmed orders for the week
-- SELECT * FROM get_orders_for_production(NOW() - INTERVAL '7 days', NOW());

-- View latest report
-- SELECT * FROM latest_production_report;

-- Get all reports from the last month
-- SELECT
--     report_date,
--     period_start,
--     period_end,
--     total_orders,
--     production_data
-- FROM production_reports
-- WHERE report_date >= NOW() - INTERVAL '30 days'
-- ORDER BY report_date DESC;
