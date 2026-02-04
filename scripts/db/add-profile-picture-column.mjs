import pg from "pg";

const pool = new pg.Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
});

async function addProfilePictureColumn() {
  try {
    // Add profile_picture_url column to users table
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT`
    );
    console.log("profile_picture_url column added to users table");

    console.log("Column added successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error adding column:", error);
    process.exit(1);
  }
}

addProfilePictureColumn();
