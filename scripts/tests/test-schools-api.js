// Simple test script to verify the schools API is working
const { Pool } = require('pg');
require('dotenv').config();

// Create a pool using the same configuration as in your database.ts file
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

async function testSchoolsQuery() {
  const client = await pool.connect();
  
  try {
    // Test the query that was failing before
    const result = await client.query(`
      SELECT 
        s.id,
        s.name,
        s.address,
        s.postal_code,
        s.phone,
        s.email,
        s.established_year,
        s.grade_level,
        s.region,
        s.gender_type,
        s.website_url,
        s.contact_persons,
        s.latitude,
        s.longitude,
        s.logo_url,
        s.created_at,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END) as teacher_count,
        COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as student_count,
        COUNT(DISTINCT CASE WHEN u.role = 'principal' THEN u.id END) as principal_count,
        COUNT(DISTINCT c.id) as class_count
      FROM schools s
      LEFT JOIN users u ON s.id = u.school_id AND u.is_active = true
      LEFT JOIN classes c ON s.id = c.school_id
      GROUP BY s.id, s.name, s.address, s.postal_code, s.phone, s.email, s.established_year, s.grade_level, s.region, s.gender_type, s.website_url, s.contact_persons, s.latitude, s.longitude, s.logo_url, s.created_at
      ORDER BY s.created_at DESC
    `);
    
    console.log("Query executed successfully!");
    console.log(`Found ${result.rows.length} schools`);
    console.log("Sample row:", result.rows[0] || "No schools found");
    
  } catch (error) {
    console.error("Error executing query:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testSchoolsQuery();