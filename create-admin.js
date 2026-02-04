import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, ".env.local") });

import pkg from "pg";
import bcrypt from "bcryptjs";

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

async function createAdminUser() {
  const client = await pool.connect();

  try {
    console.log("Connecting to database...");

    // Create a super admin user with the special UUID
    const systemAdminId = "00000000-0000-0000-0000-000000000000";
    const adminEmail = "admin10";
    const adminName = "Super Administrator";
    const adminNationalId = "9999999999";
    const adminPassword = "Mahdi@1404";

    console.log("Creating super admin user...");

    // Hash the password using bcryptjs
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Check if the user already exists
    const existingUser = await client.query(
      "SELECT id FROM users WHERE id = $1",
      [systemAdminId]
    );

    if (existingUser.rows.length > 0) {
      console.log("Super admin user already exists. Updating...");
      // Update the user
      await client.query(
        "UPDATE users SET email = $1, password_hash = $2, name = $3 WHERE id = $4",
        [adminEmail, hashedPassword, adminName, systemAdminId]
      );
      console.log("Super admin user updated successfully");
    } else {
      // Create the system admin user with password
      await client.query(
        `
        INSERT INTO users (
          id, name, email, phone, national_id, role, password_hash, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `,
        [
          systemAdminId,
          adminName,
          adminEmail,
          "09120000000",
          adminNationalId,
          "school_admin",
          hashedPassword,
          true,
        ]
      );

      console.log("Super admin user created successfully");
    }

    console.log("\n=================================");
    console.log("Login Credentials:");
    console.log("Username:", adminEmail);
    console.log("Password:", adminPassword);
    console.log("=================================\n");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
createAdminUser().catch(console.error);
