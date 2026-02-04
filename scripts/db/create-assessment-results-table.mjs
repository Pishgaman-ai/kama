#!/usr/bin/env node

import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Pool } from "pg";

// Database configuration
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createAssessmentResultsTables() {
  let client;
  try {
    // Get a client from the pool
    client = await pool.connect();

    // Read the SQL file
    const sqlFilePath = join(__dirname, "create-assessment-results-table.sql");
    const sql = await readFile(sqlFilePath, "utf8");

    // Execute the SQL
    await client.query(sql);

    console.log("Assessment results tables created successfully");
  } catch (error) {
    console.error("Error creating assessment results tables:", error);
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
    // End the pool
    await pool.end();
  }
}

// Run the function
createAssessmentResultsTables();
