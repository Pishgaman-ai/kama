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

async function addEducationalActivitiesTable() {
  const client = await pool.connect();

  try {
    // Create the educational_activities table
    await client.query(`
      CREATE TABLE IF NOT EXISTS educational_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL, -- 'midterm_exam', 'monthly_exam', 'weekly_exam', 'class_activity', 'class_homework', 'home_homework'
        activity_title VARCHAR(255) NOT NULL,
        activity_date DATE NOT NULL,
        quantitative_score NUMERIC, -- For activities that have quantitative evaluation
        qualitative_evaluation TEXT, -- For activities that have qualitative evaluation
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_educational_activities_class_id ON educational_activities(class_id);
      CREATE INDEX IF NOT EXISTS idx_educational_activities_subject_id ON educational_activities(subject_id);
      CREATE INDEX IF NOT EXISTS idx_educational_activities_student_id ON educational_activities(student_id);
      CREATE INDEX IF NOT EXISTS idx_educational_activities_teacher_id ON educational_activities(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_educational_activities_activity_date ON educational_activities(activity_date);
      CREATE INDEX IF NOT EXISTS idx_educational_activities_activity_type ON educational_activities(activity_type);
    `);

    // Add comments to describe the activity types and evaluation rules
    await client.query(`
      COMMENT ON COLUMN educational_activities.activity_type IS 'Allowed values: midterm_exam, monthly_exam, weekly_exam, class_activity, class_homework, home_homework';
      COMMENT ON COLUMN educational_activities.quantitative_score IS 'Required for: midterm_exam, monthly_exam, weekly_exam, class_activity, class_homework, home_homework';
      COMMENT ON COLUMN educational_activities.qualitative_evaluation IS 'Required for: class_activity, class_homework';
    `);

    // Create trigger function for updating updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_educational_activities_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_educational_activities_updated_at ON educational_activities;
      CREATE TRIGGER update_educational_activities_updated_at 
      BEFORE UPDATE ON educational_activities 
      FOR EACH ROW 
      EXECUTE FUNCTION update_educational_activities_updated_at_column();
    `);

    console.log("Educational activities table created successfully");
  } catch (error) {
    console.error("Error creating educational activities table:", error);
  } finally {
    client.release();
  }
}

// Run the function
addEducationalActivitiesTable()
  .then(() => {
    console.log("Database update completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during database update:", error);
    process.exit(1);
  });
