import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database configuration
const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

async function createResourcesTable() {
  const client = await pool.connect();

  try {
    // Create the resources table
    await client.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT,
        file_type VARCHAR(100),
        grade_level VARCHAR(20),
        subject VARCHAR(100),
        description TEXT,
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE, -- Allow NULL for system uploads
        visibility_level VARCHAR(20) NOT NULL DEFAULT 'school', -- 'public', 'school', 'class', 'private'
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Modify the uploaded_by column to allow NULL values
    await client.query(`
      ALTER TABLE resources 
      ALTER COLUMN uploaded_by DROP NOT NULL;
    `);

    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_resources_school_id ON resources(school_id);
      CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON resources(uploaded_by);
      CREATE INDEX IF NOT EXISTS idx_resources_grade_level ON resources(grade_level);
      CREATE INDEX IF NOT EXISTS idx_resources_subject ON resources(subject);
      CREATE INDEX IF NOT EXISTS idx_resources_visibility ON resources(visibility_level);
    `);

    // Create trigger function for updating updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_resources_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
      CREATE TRIGGER update_resources_updated_at 
      BEFORE UPDATE ON resources 
      FOR EACH ROW 
      EXECUTE FUNCTION update_resources_updated_at_column();
    `);

    console.log("Resources table created/updated successfully");
  } catch (error) {
    console.error("Error creating/updating resources table:", error);
  } finally {
    client.release();
  }
}

// Run the function
createResourcesTable()
  .then(() => {
    console.log("Database update completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during database update:", error);
    process.exit(1);
  });
