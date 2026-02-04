import { Client } from 'pg';

/**
 * Migration script to create activity_types table
 * This table allows each school to define their own activity types
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function createActivityTypesTable() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create activity_types table
    await client.query(`
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
    `);

    console.log('✅ activity_types table created successfully');

    // Create unique index to prevent duplicate type_key per school
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_types_school_type_key
      ON activity_types(school_id, type_key);
    `);

    console.log('✅ Unique index on (school_id, type_key) created');

    // Create index on school_id for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_types_school_id
      ON activity_types(school_id);
    `);

    console.log('✅ Index on school_id created');

    // Create index on is_active for filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_types_is_active
      ON activity_types(is_active);
    `);

    console.log('✅ Index on is_active created');

    // Add updated_at trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_activity_types_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS activity_types_updated_at_trigger ON activity_types;
      CREATE TRIGGER activity_types_updated_at_trigger
      BEFORE UPDATE ON activity_types
      FOR EACH ROW
      EXECUTE FUNCTION update_activity_types_updated_at();
    `);

    console.log('✅ Updated_at trigger created');

    // Add comment to table
    await client.query(`
      COMMENT ON TABLE activity_types IS 'Stores customizable activity types for each school';
      COMMENT ON COLUMN activity_types.type_key IS 'Unique identifier for activity type (e.g., midterm_exam, photo_activity)';
      COMMENT ON COLUMN activity_types.persian_name IS 'Display name in Persian (e.g., آزمون میان‌ترم)';
      COMMENT ON COLUMN activity_types.requires_quantitative_score IS 'Whether this activity type requires a numerical score';
      COMMENT ON COLUMN activity_types.requires_qualitative_evaluation IS 'Whether this activity type requires qualitative evaluation text';
      COMMENT ON COLUMN activity_types.display_order IS 'Order in which activity types should be displayed in UI';
    `);

    console.log('✅ Table comments added');

    console.log('\n🎉 Activity types table migration completed successfully!');

  } catch (error) {
    console.error('❌ Error creating activity_types table:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run migration
createActivityTypesTable()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
