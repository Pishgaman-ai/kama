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

async function checkAiResults() {
  const client = await pool.connect();

  try {
    // The specific activity ID you mentioned
    const activityId = "32be880d-0211-4fb3-8f1e-23e8bbc4b2b3";

    // Fetch AI question results for this activity
    const aiResults = await client.query(
      `SELECT question_number, score, max_score FROM ai_question_results 
       WHERE educational_activity_id = $1 
       ORDER BY question_number`,
      [activityId]
    );

    console.log("AI Question Results:");
    let totalMaxScore = 0;
    aiResults.rows.forEach((row) => {
      console.log(`  Q${row.question_number}: ${row.score}/${row.max_score}`);
      totalMaxScore += row.max_score || 0;
    });

    console.log(`Total Max Score: ${totalMaxScore}`);
  } catch (error) {
    console.error("Error checking AI results:", error);
  } finally {
    client.release();
    process.exit(0);
  }
}

// Run the function
checkAiResults();
