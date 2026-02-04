const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log("🔄 Starting foreign key migration...");

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "..",
      "database",
      "migrations",
      "update_teacher_assignments_fk.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Execute the migration
    await client.query(migrationSQL);

    console.log("✅ Foreign key migration completed successfully!");
    console.log("   - Removed old foreign key to 'subjects' table");
    console.log("   - Added new foreign key to 'lessons' table");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
