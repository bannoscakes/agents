-- ============================================================================
-- Webhook Order Processor Schema
-- ============================================================================
-- Database schema for AI-powered webhook processing system

-- ============================================================================
-- 1. Webhook Inbox Tables (if not already exist)
-- ============================================================================

-- Bannos webhook inbox
CREATE TABLE IF NOT EXISTS webhook_inbox_bannos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payload JSONB NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Flourlane webhook inbox
CREATE TABLE IF NOT EXISTS webhook_inbox_flourlane (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payload JSONB NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_bannos_processed ON webhook_inbox_bannos(processed, received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_flourlane_processed ON webhook_inbox_flourlane(processed, received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_bannos_received ON webhook_inbox_bannos(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_flourlane_received ON webhook_inbox_flourlane(received_at DESC);

-- Enable RLS
ALTER TABLE webhook_inbox_bannos ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_inbox_flourlane ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow service role full access to bannos inbox"
    ON webhook_inbox_bannos FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Allow service role full access to flourlane inbox"
    ON webhook_inbox_flourlane FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Allow authenticated users to view bannos inbox"
    ON webhook_inbox_bannos FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to view flourlane inbox"
    ON webhook_inbox_flourlane FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================================
-- 2. Extend Orders Table
-- ============================================================================

DO $$
BEGIN
    -- Add webhook tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'orders' AND column_name = 'webhook_id') THEN
        ALTER TABLE orders ADD COLUMN webhook_id UUID;
    END IF;

    -- Add split order tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'orders' AND column_name = 'is_split') THEN
        ALTER TABLE orders ADD COLUMN is_split BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'orders' AND column_name = 'parent_order_number') THEN
        ALTER TABLE orders ADD COLUMN parent_order_number TEXT;
    END IF;

    -- Add shop tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'orders' AND column_name = 'shop') THEN
        ALTER TABLE orders ADD COLUMN shop TEXT CHECK (shop IN ('bannos', 'flourlane'));
    END IF;

    -- Add customer contact info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'orders' AND column_name = 'customer_email') THEN
        ALTER TABLE orders ADD COLUMN customer_email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'orders' AND column_name = 'customer_phone') THEN
        ALTER TABLE orders ADD COLUMN customer_phone TEXT;
    END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_orders_webhook ON orders(webhook_id);
CREATE INDEX IF NOT EXISTS idx_orders_split ON orders(is_split) WHERE is_split = true;
CREATE INDEX IF NOT EXISTS idx_orders_parent ON orders(parent_order_number) WHERE parent_order_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop);

-- ============================================================================
-- 3. Order Carts Table (for item details)
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('cake', 'accessory')),
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10, 2),
    details JSONB, -- Cake details (size, flavor, etc.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_carts_order ON order_carts(order_id);
CREATE INDEX IF NOT EXISTS idx_order_carts_type ON order_carts(item_type);

-- Enable RLS
ALTER TABLE order_carts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users to view order carts"
    ON order_carts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access to order carts"
    ON order_carts FOR ALL
    TO service_role
    USING (true);

-- ============================================================================
-- 4. Webhook Processing Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_processing_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL,
    shop TEXT NOT NULL CHECK (shop IN ('bannos', 'flourlane')),
    action TEXT NOT NULL, -- 'started', 'completed', 'failed'
    orders_created INTEGER DEFAULT 0,
    error_message TEXT,
    processing_time_ms INTEGER,
    ai_tokens_used INTEGER,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_webhook_log_webhook ON webhook_processing_log(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_log_timestamp ON webhook_processing_log(timestamp DESC);

-- Enable RLS
ALTER TABLE webhook_processing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view processing log"
    ON webhook_processing_log FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access to processing log"
    ON webhook_processing_log FOR ALL
    TO service_role
    USING (true);

-- ============================================================================
-- 5. Views
-- ============================================================================

-- View: Pending webhooks summary
CREATE OR REPLACE VIEW pending_webhooks_summary AS
SELECT
    'bannos' as shop,
    COUNT(*) as pending_count,
    MIN(received_at) as oldest_webhook,
    MAX(received_at) as newest_webhook
FROM webhook_inbox_bannos
WHERE processed = false
UNION ALL
SELECT
    'flourlane' as shop,
    COUNT(*) as pending_count,
    MIN(received_at) as oldest_webhook,
    MAX(received_at) as newest_webhook
FROM webhook_inbox_flourlane
WHERE processed = false;

-- View: Processing errors
CREATE OR REPLACE VIEW webhook_processing_errors AS
SELECT
    'bannos' as shop,
    id,
    received_at,
    error,
    payload
FROM webhook_inbox_bannos
WHERE error IS NOT NULL
UNION ALL
SELECT
    'flourlane' as shop,
    id,
    received_at,
    error,
    payload
FROM webhook_inbox_flourlane
WHERE error IS NOT NULL
ORDER BY received_at DESC;

-- View: Split orders
CREATE OR REPLACE VIEW split_orders AS
SELECT
    o.id,
    o.order_number,
    o.parent_order_number,
    o.customer_name,
    o.cake_type,
    o.shop,
    o.delivery_date,
    o.status,
    COUNT(oc.id) as item_count
FROM orders o
LEFT JOIN order_carts oc ON o.id = oc.order_id
WHERE o.is_split = true
GROUP BY o.id, o.order_number, o.parent_order_number, o.customer_name, o.cake_type, o.shop, o.delivery_date, o.status
ORDER BY o.created_at DESC;

-- View: Order processing stats
CREATE OR REPLACE VIEW webhook_processing_stats AS
SELECT
    DATE(timestamp) as date,
    shop,
    COUNT(*) FILTER (WHERE action = 'completed') as successful,
    COUNT(*) FILTER (WHERE action = 'failed') as failed,
    SUM(orders_created) as total_orders_created,
    AVG(processing_time_ms) as avg_processing_time_ms,
    SUM(ai_tokens_used) as total_tokens_used
FROM webhook_processing_log
GROUP BY DATE(timestamp), shop
ORDER BY date DESC, shop;

-- ============================================================================
-- 6. Functions
-- ============================================================================

-- Function: Get pending webhooks count
CREATE OR REPLACE FUNCTION get_pending_webhooks_count()
RETURNS TABLE (
    shop TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'bannos'::TEXT as shop, COUNT(*)::BIGINT
    FROM webhook_inbox_bannos
    WHERE processed = false
    UNION ALL
    SELECT 'flourlane'::TEXT as shop, COUNT(*)::BIGINT
    FROM webhook_inbox_flourlane
    WHERE processed = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get orders from webhook
CREATE OR REPLACE FUNCTION get_orders_from_webhook(p_webhook_id UUID)
RETURNS TABLE (
    order_id UUID,
    order_number TEXT,
    customer_name TEXT,
    cake_type TEXT,
    is_split BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id as order_id,
        o.order_number,
        o.customer_name,
        o.cake_type,
        o.is_split,
        o.created_at
    FROM orders o
    WHERE o.webhook_id = p_webhook_id
    ORDER BY o.order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Retry failed webhook
CREATE OR REPLACE FUNCTION retry_failed_webhook(
    p_webhook_id UUID,
    p_shop TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_shop = 'bannos' THEN
        UPDATE webhook_inbox_bannos
        SET processed = false,
            error = NULL,
            processed_at = NULL
        WHERE id = p_webhook_id;
    ELSIF p_shop = 'flourlane' THEN
        UPDATE webhook_inbox_flourlane
        SET processed = false,
            error = NULL,
            processed_at = NULL
        WHERE id = p_webhook_id;
    ELSE
        RETURN false;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Triggers
-- ============================================================================

-- Function: Notify on new webhook
CREATE OR REPLACE FUNCTION notify_new_webhook()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify application that new webhook arrived
    PERFORM pg_notify(
        'new_webhook',
        json_build_object(
            'id', NEW.id,
            'shop', TG_TABLE_NAME,
            'received_at', NEW.received_at
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bannos
DROP TRIGGER IF EXISTS trigger_new_webhook_bannos ON webhook_inbox_bannos;
CREATE TRIGGER trigger_new_webhook_bannos
    AFTER INSERT ON webhook_inbox_bannos
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_webhook();

-- Trigger for flourlane
DROP TRIGGER IF EXISTS trigger_new_webhook_flourlane ON webhook_inbox_flourlane;
CREATE TRIGGER trigger_new_webhook_flourlane
    AFTER INSERT ON webhook_inbox_flourlane
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_webhook();

-- ============================================================================
-- 8. Sample Data (for testing)
-- ============================================================================

/*
-- Insert sample webhook (complex structure)
INSERT INTO webhook_inbox_bannos (payload) VALUES (
'{
  "order": {
    "id": "B21345",
    "customer": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "555-1234"
    },
    "items": [
      {
        "product": "Custom Cake",
        "quantity": 1,
        "price": 45.00,
        "options": {
          "size": "Large",
          "flavor": "Chocolate",
          "message": "Happy Birthday Sarah!",
          "decorations": "Pink roses, white frosting",
          "colors": "Pink and white"
        }
      },
      {
        "product": "Custom Cake",
        "quantity": 1,
        "price": 35.00,
        "options": {
          "size": "Medium",
          "flavor": "Vanilla",
          "message": "Congrats!",
          "decorations": "Simple border"
        }
      },
      {
        "product": "Birthday Candles",
        "quantity": 1,
        "price": 5.00
      }
    ],
    "delivery": {
      "date": "2025-11-15",
      "time": "2:00 PM"
    },
    "total": 85.00
  }
}'::jsonb
);
*/

-- ============================================================================
-- 9. Helpful Queries
-- ============================================================================

-- Get pending webhooks
-- SELECT * FROM pending_webhooks_summary;

-- Get failed webhooks
-- SELECT * FROM webhook_processing_errors;

-- Get split orders
-- SELECT * FROM split_orders;

-- Get processing stats
-- SELECT * FROM webhook_processing_stats WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- Get orders from specific webhook
-- SELECT * FROM get_orders_from_webhook('webhook-uuid');

-- Retry failed webhook
-- SELECT retry_failed_webhook('webhook-uuid', 'bannos');

-- Get pending count
-- SELECT * FROM get_pending_webhooks_count();
