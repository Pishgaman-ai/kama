import { Client } from "pg";

async function testQuery() {
  const client = new Client({
    host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
    port: parseInt(process.env.DATABASE_PORT || "14102"),
    database: process.env.DATABASE_NAME || "tina",
    user: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Test simple query
    const classId = "8612361e-ed81-41e3-b838-6e26efddb438";

    console.log("Testing simple query...");
    const result1 = await client.query(
      "SELECT * FROM class_grades WHERE class_id = $1",
      [classId]
    );
    console.log("Simple query result:", result1.rows.length, "rows");

    console.log("Testing complex query...");
    const result2 = await client.query(
      `
      SELECT 
        cg.id,
        cg.student_id,
        cg.subject_name,
        cg.grade_value,
        cg.max_score,
        cg.percentage,
        cg.grade_letter,
        cg.term,
        cg.description,
        cg.created_at,
        cg.updated_at,
        u.name as student_name,
        u.national_id
      FROM class_grades cg
      JOIN users u ON cg.student_id = u.id
      WHERE cg.class_id = $1
      ORDER BY u.name, cg.subject_name, cg.term
    `,
      [classId]
    );
    console.log("Complex query result:", result2.rows.length, "rows");
  } catch (err) {
    console.error("Query error:", err);
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

testQuery();
