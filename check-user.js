import pkg from "pg";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, ".env.local") });

const { Pool } = pkg;

// Database configuration
const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

async function checkUser() {
  const client = await pool.connect();

  try {
    console.log("Checking available user roles...");

    // Check available roles
    const rolesRes = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    `);

    console.log(
      "Available roles:",
      rolesRes.rows.map((row) => row.enumlabel)
    );

    console.log("\nChecking if system admin user exists...");

    // Check if the system admin user exists
    const res = await client.query(
      "SELECT id, email, role, password_hash FROM users WHERE email = $1",
      ["system@eduhelper.ir"]
    );

    if (res.rows.length > 0) {
      console.log("User found:", res.rows[0]);
    } else {
      console.log("User not found");
    }
  } catch (error) {
    console.error("Error checking user:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUser();
