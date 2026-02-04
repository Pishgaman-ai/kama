import { Pool } from "pg";

// Create a new pool with the same configuration as in database.ts
const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function checkTableStructure() {
  try {
    // Get a client from the pool
    const client = await pool.connect();

    try {
      // Check the structure of the individual_observations table
      const result = await client.query(`
        SELECT column_name, data_type, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_name = 'individual_observations'
        ORDER BY ordinal_position
      `);

      console.log("Table structure for individual_observations:");
      console.table(result.rows);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error("Error checking table structure:", error);
    process.exit(1);
  }
}

checkTableStructure()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
