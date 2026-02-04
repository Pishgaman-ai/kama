import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

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

// Function to generate a secure password
function generateSecurePassword(length = 16) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let password = "";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);

  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length];
  }

  return password;
}

async function createSystemAdminUser() {
  const client = await pool.connect();

  try {
    console.log("Connecting to database...");

    // Check what roles are available
    const rolesResult = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    `);

    console.log(
      "Available roles:",
      rolesResult.rows.map((row) => row.enumlabel)
    );

    // Use 'school_admin' role as it seems to be available
    const adminRole = "school_admin";
    console.log("Using role:", adminRole);

    // Create a system admin user with the special UUID
    const systemAdminId = "00000000-0000-0000-0000-000000000000";
    const systemAdminEmail = "system@eduhelper.ir";
    const systemAdminName = "System Administrator";

    // Generate a unique national ID for the system admin
    const systemAdminNationalId = "9999999999"; // Unique national ID for system admin

    // Generate a secure password
    const systemAdminPassword = generateSecurePassword(20);
    console.log("Generated secure password for system admin");

    // Hash the password using bcryptjs (same as auth library)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(systemAdminPassword, saltRounds);

    // Check if the user already exists
    const existingUser = await client.query(
      "SELECT id FROM users WHERE id = $1",
      [systemAdminId]
    );

    if (existingUser.rows.length > 0) {
      console.log("System admin user already exists");
      // Update the password instead
      await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
        hashedPassword,
        systemAdminId,
      ]);
      console.log("System admin password updated successfully");
      console.log("Email:", systemAdminEmail);
      console.log("Password:", systemAdminPassword);
      console.log(
        "PLEASE STORE THIS PASSWORD SECURELY - IT WILL NOT BE SHOWN AGAIN"
      );
      return;
    }

    // Create the system admin user with password
    await client.query(
      `
      INSERT INTO users (
        id, name, email, phone, national_id, role, password_hash, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `,
      [
        systemAdminId,
        systemAdminName,
        systemAdminEmail,
        "09120000000", // Default phone
        systemAdminNationalId, // Unique national ID
        adminRole, // Use valid role
        hashedPassword, // Store hashed password
        true,
      ]
    );

    console.log("System admin user created successfully");
    console.log("Email:", systemAdminEmail);
    console.log("Password:", systemAdminPassword);
    console.log(
      "PLEASE STORE THIS PASSWORD SECURELY - IT WILL NOT BE SHOWN AGAIN"
    );
  } catch (error) {
    console.error("Error creating system admin user:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
createSystemAdminUser().catch(console.error);
