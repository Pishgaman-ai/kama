-- Migration: Create activity_types table
-- Date: 2025-12-29
-- Description: Allows principals to define custom activity types for their school

-- Create the activity_types table
CREATE TABLE IF NOT EXISTS activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  type_key VARCHAR(100) NOT NULL,
  persian_name VARCHAR(255) NOT NULL,
  requires_quantitative_score BOOLEAN DEFAULT true,
  requires_qualitative_evaluation BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index to prevent duplicate type_key per school
CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_types_school_type_key
ON activity_types(school_id, type_key);

-- Create index on school_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_activity_types_school_id
ON activity_types(school_id);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_activity_types_is_active
ON activity_types(is_active);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_activity_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS activity_types_updated_at_trigger ON activity_types;
CREATE TRIGGER activity_types_updated_at_trigger
BEFORE UPDATE ON activity_types
FOR EACH ROW
EXECUTE FUNCTION update_activity_types_updated_at();

-- Add comments
COMMENT ON TABLE activity_types IS 'Stores customizable activity types for each school';
COMMENT ON COLUMN activity_types.type_key IS 'Unique identifier for activity type (e.g., midterm_exam, photo_activity)';
COMMENT ON COLUMN activity_types.persian_name IS 'Display name in Persian (e.g., آزمون میان‌ترم)';
COMMENT ON COLUMN activity_types.requires_quantitative_score IS 'Whether this activity type requires a numerical score';
COMMENT ON COLUMN activity_types.requires_qualitative_evaluation IS 'Whether this activity type requires qualitative evaluation text';
COMMENT ON COLUMN activity_types.display_order IS 'Order in which activity types should be displayed in UI';
