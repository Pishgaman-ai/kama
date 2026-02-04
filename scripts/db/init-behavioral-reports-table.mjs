import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

// Database connection configuration
const client = new Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

async function createBehavioralReportsTable() {
  try {
    await client.connect();
    console.log("Connected to database");

    // Create behavioral_reports table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS behavioral_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await client.query(createTableQuery);
    console.log("behavioral_reports table created successfully");

    // Create indexes for better performance
    const createIndexesQuery = `
      CREATE INDEX IF NOT EXISTS idx_behavioral_reports_teacher_id 
      ON behavioral_reports(teacher_id);
      
      CREATE INDEX IF NOT EXISTS idx_behavioral_reports_student_id 
      ON behavioral_reports(student_id);
      
      CREATE INDEX IF NOT EXISTS idx_behavioral_reports_class_id 
      ON behavioral_reports(class_id);
      
      CREATE INDEX IF NOT EXISTS idx_behavioral_reports_category 
      ON behavioral_reports(category);
      
      CREATE INDEX IF NOT EXISTS idx_behavioral_reports_created_at 
      ON behavioral_reports(created_at);
    `;

    await client.query(createIndexesQuery);
    console.log("Indexes created successfully");

    console.log("Behavioral reports table setup completed");
  } catch (err) {
    console.error("Error creating behavioral_reports table:", err);
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

// Run the function
createBehavioralReportsTable();
