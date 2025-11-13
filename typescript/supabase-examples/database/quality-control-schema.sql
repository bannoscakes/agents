-- ============================================================================
-- Cake Quality Control Schema
-- ============================================================================
-- Database schema for AI-powered cake quality control system
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. Cake Photos Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cake_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    file_size INTEGER,
    mime_type TEXT,
    notes TEXT,
    CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cake_photos_order ON cake_photos(order_id);
CREATE INDEX IF NOT EXISTS idx_cake_photos_uploaded_at ON cake_photos(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_cake_photos_uploaded_by ON cake_photos(uploaded_by);

-- Enable RLS
ALTER TABLE cake_photos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users to upload photos"
    ON cake_photos FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view photos"
    ON cake_photos FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access to photos"
    ON cake_photos FOR ALL
    TO service_role
    USING (true);

-- ============================================================================
-- 2. Quality Control Results Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS quality_control_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID NOT NULL REFERENCES cake_photos(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- AI Analysis Results
    quality_score DECIMAL(3, 1) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 10),
    text_on_cake TEXT,
    spelling_correct BOOLEAN NOT NULL DEFAULT true,
    spelling_errors JSONB DEFAULT '[]'::JSONB,

    -- Order Verification
    matches_order BOOLEAN NOT NULL DEFAULT true,
    order_discrepancies JSONB DEFAULT '[]'::JSONB,

    -- Quality Assessment
    issues_detected JSONB DEFAULT '[]'::JSONB,
    visual_quality JSONB NOT NULL, -- {decoration: 8.5, cleanliness: 9.0, presentation: 8.0, color_accuracy: 9.0}

    -- Decision
    approved BOOLEAN NOT NULL DEFAULT false,
    requires_review BOOLEAN NOT NULL DEFAULT true,
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,

    -- Metadata
    ai_provider TEXT, -- 'anthropic' or 'openai'
    ai_confidence DECIMAL(3, 2), -- 0.00 to 1.00
    analysis_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qc_results_photo ON quality_control_results(photo_id);
CREATE INDEX IF NOT EXISTS idx_qc_results_order ON quality_control_results(order_id);
CREATE INDEX IF NOT EXISTS idx_qc_results_approved ON quality_control_results(approved);
CREATE INDEX IF NOT EXISTS idx_qc_results_requires_review ON quality_control_results(requires_review)
    WHERE requires_review = true;
CREATE INDEX IF NOT EXISTS idx_qc_results_quality_score ON quality_control_results(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_qc_results_timestamp ON quality_control_results(analysis_timestamp DESC);

-- Enable RLS
ALTER TABLE quality_control_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users to view QC results"
    ON quality_control_results FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access to QC results"
    ON quality_control_results FOR ALL
    TO service_role
    USING (true);

-- ============================================================================
-- 3. Extend Orders Table (if not already present)
-- ============================================================================

-- Add quality control fields to orders table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'orders' AND column_name = 'message_on_cake') THEN
        ALTER TABLE orders ADD COLUMN message_on_cake TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'orders' AND column_name = 'decoration_notes') THEN
        ALTER TABLE orders ADD COLUMN decoration_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'orders' AND column_name = 'color_scheme') THEN
        ALTER TABLE orders ADD COLUMN color_scheme TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'orders' AND column_name = 'special_instructions') THEN
        ALTER TABLE orders ADD COLUMN special_instructions TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'orders' AND column_name = 'qc_status') THEN
        ALTER TABLE orders ADD COLUMN qc_status TEXT DEFAULT 'pending'
            CHECK (qc_status IN ('pending', 'in_progress', 'passed', 'failed', 'needs_review'));
    END IF;
END $$;

-- ============================================================================
-- 4. Views
-- ============================================================================

-- View: Orders requiring QC
CREATE OR REPLACE VIEW orders_pending_qc AS
SELECT
    o.id,
    o.cake_type,
    o.customer_name,
    o.message_on_cake,
    o.order_date,
    o.delivery_date,
    o.status,
    o.qc_status,
    COUNT(cp.id) as photos_uploaded,
    COUNT(qcr.id) as qc_checks_completed
FROM orders o
LEFT JOIN cake_photos cp ON o.id = cp.order_id
LEFT JOIN quality_control_results qcr ON o.id = qcr.order_id
WHERE o.status IN ('in_production', 'ready')
GROUP BY o.id
HAVING COUNT(qcr.id) = 0 OR o.qc_status = 'needs_review';

-- View: Failed QC cakes needing attention
CREATE OR REPLACE VIEW qc_failed_cakes AS
SELECT
    qcr.id as qc_id,
    o.id as order_id,
    o.cake_type,
    o.customer_name,
    o.message_on_cake,
    qcr.quality_score,
    qcr.spelling_correct,
    qcr.spelling_errors,
    qcr.issues_detected,
    qcr.approved,
    cp.image_url,
    qcr.analysis_timestamp
FROM quality_control_results qcr
JOIN orders o ON qcr.order_id = o.id
JOIN cake_photos cp ON qcr.photo_id = cp.id
WHERE qcr.approved = false
ORDER BY qcr.analysis_timestamp DESC;

-- View: QC statistics
CREATE OR REPLACE VIEW qc_statistics AS
SELECT
    DATE(analysis_timestamp) as date,
    COUNT(*) as total_checks,
    COUNT(*) FILTER (WHERE approved = true) as passed,
    COUNT(*) FILTER (WHERE approved = false) as failed,
    AVG(quality_score) as avg_quality_score,
    COUNT(*) FILTER (WHERE spelling_correct = false) as spelling_errors_count,
    COUNT(*) FILTER (WHERE requires_review = true) as needs_review_count
FROM quality_control_results
GROUP BY DATE(analysis_timestamp)
ORDER BY date DESC;

-- ============================================================================
-- 5. Functions
-- ============================================================================

-- Function: Get QC summary for an order
CREATE OR REPLACE FUNCTION get_qc_summary(p_order_id UUID)
RETURNS TABLE (
    total_photos INTEGER,
    qc_checks_completed INTEGER,
    passed INTEGER,
    failed INTEGER,
    avg_quality_score DECIMAL,
    latest_status TEXT,
    requires_action BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT cp.id)::INTEGER as total_photos,
        COUNT(qcr.id)::INTEGER as qc_checks_completed,
        COUNT(*) FILTER (WHERE qcr.approved = true)::INTEGER as passed,
        COUNT(*) FILTER (WHERE qcr.approved = false)::INTEGER as failed,
        AVG(qcr.quality_score)::DECIMAL as avg_quality_score,
        CASE
            WHEN COUNT(*) FILTER (WHERE qcr.approved = false) > 0 THEN 'failed'
            WHEN COUNT(*) FILTER (WHERE qcr.requires_review = true) > 0 THEN 'needs_review'
            WHEN COUNT(*) FILTER (WHERE qcr.approved = true) > 0 THEN 'passed'
            ELSE 'pending'
        END as latest_status,
        (COUNT(*) FILTER (WHERE qcr.approved = false OR qcr.requires_review = true) > 0) as requires_action
    FROM cake_photos cp
    LEFT JOIN quality_control_results qcr ON cp.id = qcr.photo_id
    WHERE cp.order_id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update order QC status
CREATE OR REPLACE FUNCTION update_order_qc_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update order's qc_status based on latest QC result
    UPDATE orders
    SET qc_status = CASE
        WHEN NEW.approved = true THEN 'passed'
        WHEN NEW.approved = false THEN 'failed'
        WHEN NEW.requires_review = true THEN 'needs_review'
        ELSE 'in_progress'
    END
    WHERE id = NEW.order_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-update order QC status
DROP TRIGGER IF EXISTS trigger_update_order_qc_status ON quality_control_results;
CREATE TRIGGER trigger_update_order_qc_status
    AFTER INSERT OR UPDATE ON quality_control_results
    FOR EACH ROW
    EXECUTE FUNCTION update_order_qc_status();

-- Function: Get orders needing QC
CREATE OR REPLACE FUNCTION get_orders_needing_qc(
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    order_id UUID,
    cake_type TEXT,
    customer_name TEXT,
    message_on_cake TEXT,
    delivery_date TIMESTAMPTZ,
    photos_count INTEGER,
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id as order_id,
        o.cake_type,
        o.customer_name,
        o.message_on_cake,
        o.delivery_date,
        COUNT(cp.id)::INTEGER as photos_count,
        CASE
            WHEN o.delivery_date < NOW() + INTERVAL '24 hours' THEN 3 -- Urgent
            WHEN o.delivery_date < NOW() + INTERVAL '48 hours' THEN 2 -- High priority
            ELSE 1 -- Normal
        END as priority
    FROM orders o
    LEFT JOIN cake_photos cp ON o.id = cp.order_id
    LEFT JOIN quality_control_results qcr ON o.id = qcr.order_id
    WHERE o.status IN ('in_production', 'ready')
      AND (qcr.id IS NULL OR o.qc_status = 'needs_review')
    GROUP BY o.id
    ORDER BY priority DESC, o.delivery_date ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Storage Bucket for Photos
-- ============================================================================

-- Create storage bucket for cake photos (run in Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('cake-photos', 'cake-photos', true);

-- Storage policies
-- CREATE POLICY "Allow authenticated users to upload photos"
--     ON storage.objects FOR INSERT
--     TO authenticated
--     WITH CHECK (bucket_id = 'cake-photos');

-- CREATE POLICY "Allow public to view photos"
--     ON storage.objects FOR SELECT
--     TO public
--     USING (bucket_id = 'cake-photos');

-- ============================================================================
-- 7. Sample Data (Optional - for testing)
-- ============================================================================

/*
-- Update an existing order with QC fields
UPDATE orders
SET
    message_on_cake = 'Happy Birthday Sarah!',
    decoration_notes = 'Pink roses, white frosting',
    color_scheme = 'Pink and white',
    special_instructions = 'Extra care with spelling',
    qc_status = 'pending'
WHERE id = 'your-order-id';
*/

-- ============================================================================
-- 8. Helpful Queries
-- ============================================================================

-- Get all pending QC orders
-- SELECT * FROM orders_pending_qc;

-- Get failed cakes
-- SELECT * FROM qc_failed_cakes;

-- Get QC statistics for last 7 days
-- SELECT * FROM qc_statistics WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- Get QC summary for specific order
-- SELECT * FROM get_qc_summary('order-uuid');

-- Get orders needing urgent QC
-- SELECT * FROM get_orders_needing_qc(10);

-- Get all QC results with low scores
-- SELECT
--     qcr.*,
--     o.cake_type,
--     o.customer_name,
--     cp.image_url
-- FROM quality_control_results qcr
-- JOIN orders o ON qcr.order_id = o.id
-- JOIN cake_photos cp ON qcr.photo_id = cp.id
-- WHERE qcr.quality_score < 7.0
-- ORDER BY qcr.analysis_timestamp DESC;
