import pg from "pg";

const pool = new pg.Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
});

async function addColumns() {
  try {
    // Add postal_code column
    await pool.query(
      `ALTER TABLE schools ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10)`
    );
    console.log("postal_code column added");

    // Add grade_level column
    await pool.query(
      `ALTER TABLE schools ADD COLUMN IF NOT EXISTS grade_level VARCHAR(50)`
    );
    console.log("grade_level column added");

    // Add region column
    await pool.query(
      `ALTER TABLE schools ADD COLUMN IF NOT EXISTS region VARCHAR(10)`
    );
    console.log("region column added");

    // Add gender_type column
    await pool.query(
      `ALTER TABLE schools ADD COLUMN IF NOT EXISTS gender_type VARCHAR(10)`
    );
    console.log("gender_type column added");

    console.log("All columns added successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error adding columns:", error);
    process.exit(1);
  }
}

addColumns();
