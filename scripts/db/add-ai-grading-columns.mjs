import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database configuration
const pool = new pg.Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

async function addAiGradingColumns() {
  const client = await pool.connect();

  try {
    // Add columns for AI grading functionality
    await client.query(`
      ALTER TABLE educational_activities 
      ADD COLUMN IF NOT EXISTS question_file_url TEXT,
      ADD COLUMN IF NOT EXISTS answer_file_url TEXT,
      ADD COLUMN IF NOT EXISTS teacher_note TEXT,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS ai_results JSONB,
      ADD COLUMN IF NOT EXISTS ai_score NUMERIC
    `);

    // Add comments to describe the new columns
    await client.query(`
      COMMENT ON COLUMN educational_activities.question_file_url IS 'URL to the question file stored in cloud storage';
      COMMENT ON COLUMN educational_activities.answer_file_url IS 'URL to the answer file stored in cloud storage';
      COMMENT ON COLUMN educational_activities.teacher_note IS 'Teacher notes for the activity';
      COMMENT ON COLUMN educational_activities.status IS 'Status of the activity (e.g., pending, graded, reviewed)';
      COMMENT ON COLUMN educational_activities.ai_results IS 'JSON results from AI grading';
      COMMENT ON COLUMN educational_activities.ai_score IS 'Score assigned by AI grading';
    `);

    console.log(
      "AI grading columns added successfully to educational_activities table"
    );
  } catch (error) {
    console.error("Error adding AI grading columns:", error);
  } finally {
    client.release();
  }
}

// Run the function
addAiGradingColumns()
  .then(() => {
    console.log("Database update completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during database update:", error);
    process.exit(1);
  });
