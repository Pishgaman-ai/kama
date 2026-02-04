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

async function createAiQuestionResultsTable() {
  const client = await pool.connect();

  try {
    // Create ai_question_results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_question_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        educational_activity_id UUID REFERENCES educational_activities(id) ON DELETE CASCADE,
        question_number INTEGER NOT NULL,
        question_text TEXT,
        student_answer TEXT,
        score NUMERIC,
        max_score NUMERIC,
        analysis JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_question_results_activity_id ON ai_question_results(educational_activity_id);
      CREATE INDEX IF NOT EXISTS idx_ai_question_results_question_number ON ai_question_results(question_number);
    `);

    // Create trigger function for updating updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_ai_question_results_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_ai_question_results_updated_at ON ai_question_results;
      CREATE TRIGGER update_ai_question_results_updated_at 
      BEFORE UPDATE ON ai_question_results 
      FOR EACH ROW 
      EXECUTE FUNCTION update_ai_question_results_updated_at_column();
    `);

    // Add comments to describe the columns
    await client.query(`
      COMMENT ON COLUMN ai_question_results.educational_activity_id IS 'Reference to the educational activity';
      COMMENT ON COLUMN ai_question_results.question_number IS 'Question number in the exam/activity';
      COMMENT ON COLUMN ai_question_results.question_text IS 'The text of the question';
      COMMENT ON COLUMN ai_question_results.student_answer IS 'Student''s answer to the question';
      COMMENT ON COLUMN ai_question_results.score IS 'Score assigned by AI for this question';
      COMMENT ON COLUMN ai_question_results.max_score IS 'Maximum possible score for this question';
      COMMENT ON COLUMN ai_question_results.analysis IS 'JSON analysis including positives, negatives, mistakes, and corrected version';
    `);

    console.log("AI question results table created successfully");
  } catch (error) {
    console.error("Error creating AI question results table:", error);
  } finally {
    client.release();
  }
}

// Run the function
createAiQuestionResultsTable()
  .then(() => {
    console.log("Database update completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during database update:", error);
    process.exit(1);
  });
