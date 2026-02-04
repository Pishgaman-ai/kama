import { readFileSync } from "fs";
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

async function createIndividualObservationsTable() {
  try {
    // Read the SQL file
    const sql = readFileSync(
      "./create-individual-observations-table.sql",
      "utf8"
    );

    // Get a client from the pool
    const client = await pool.connect();

    try {
      // Execute the SQL
      await client.query(sql);
      console.log("Individual observations table created successfully");
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error("Error creating individual observations table:", error);
    process.exit(1);
  }
}

createIndividualObservationsTable()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
