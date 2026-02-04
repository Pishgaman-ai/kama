import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

const { Client } = pg;

// Database connection configuration
const client = new Client({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

async function addClassGradesTable() {
  try {
    await client.connect();
    console.log("Connected to database");

    // Create the class_grades table
    await client.query(`
      CREATE TABLE IF NOT EXISTS class_grades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
        subject_name VARCHAR(255) NOT NULL,
        grade_value NUMERIC NOT NULL,
        max_score NUMERIC DEFAULT 100,
        percentage NUMERIC,
        grade_letter VARCHAR(5),
        term VARCHAR(50),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (class_id, student_id, subject_name, term)
      )
    `);

    console.log("Class grades table created successfully");
  } catch (err) {
    console.error("Error creating class grades table:", err);
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

addClassGradesTable();
