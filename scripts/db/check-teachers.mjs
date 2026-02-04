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

async function checkTeachers() {
  try {
    // Get a client from the pool
    const client = await pool.connect();

    try {
      // Check for teachers in the users table
      const result = await client.query(`
        SELECT national_id, name, role 
        FROM users 
        WHERE role = 'teacher' AND national_id IS NOT NULL
        LIMIT 5
      `);

      console.log("Teachers in the database:");
      console.table(result.rows);

      // Also check the specific teacher_id that was causing the error
      const specificTeacher = await client.query(`
        SELECT national_id, name, role 
        FROM users 
        WHERE national_id = '1234567890'
      `);

      console.log("Specific teacher check:");
      console.table(specificTeacher.rows);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error("Error checking teachers:", error);
    process.exit(1);
  }
}

checkTeachers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
