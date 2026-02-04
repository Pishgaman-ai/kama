import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create a pool using the same configuration as in your database.ts file
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add any other configuration options you're using
});

async function addLogoUrlColumn() {
  const client = await pool.connect();

  try {
    // Add logo_url column to schools table
    await client.query(`
      ALTER TABLE schools 
      ADD COLUMN IF NOT EXISTS logo_url TEXT
    `);

    console.log("Successfully added logo_url column to schools table");
  } catch (error) {
    console.error("Error adding logo_url column:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
addLogoUrlColumn().catch(console.error);