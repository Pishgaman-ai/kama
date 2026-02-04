import { Client } from "pg";

async function testApi() {
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

    // First, assign the teacher to the class
    const classId = "8612361e-ed81-41e3-b838-6e26efddb438";
    const userId = "494ea263-62b1-4f93-8073-6e1d2c250590"; // Teacher ID

    console.log("Assigning teacher to class...");
    try {
      await client.query(
        "INSERT INTO class_memberships (class_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (class_id, user_id) DO UPDATE SET role = $3",
        [classId, userId, "teacher"]
      );
      console.log("Teacher assigned to class successfully");
    } catch (err) {
      console.error("Error assigning teacher to class:", err);
      // Try without ON CONFLICT clause
      try {
        await client.query(
          "INSERT INTO class_memberships (class_id, user_id, role) VALUES ($1, $2, $3)",
          [classId, userId, "teacher"]
        );
        console.log(
          "Teacher assigned to class successfully (without conflict handling)"
        );
      } catch (err2) {
        console.error(
          "Error assigning teacher to class (second attempt):",
          err2
        );
      }
    }

    // Test the class access verification query
    console.log("Testing class access verification...");
    const classCheck = await client.query(
      "SELECT cm.id FROM class_memberships cm WHERE cm.class_id = $1 AND cm.user_id = $2 AND cm.role = $3",
      [classId, userId, "teacher"]
    );

    console.log(
      "Class access verification result:",
      classCheck.rows.length,
      "rows"
    );

    if (classCheck.rows.length === 0) {
      console.log("User does not have access to this class");
    } else {
      console.log("User has access to this class");
    }

    // Test getting class details
    console.log("Testing class details query...");
    const classResult = await client.query(
      "SELECT c.name as class_name, c.grade_level FROM classes c WHERE c.id = $1",
      [classId]
    );

    console.log("Class details result:", classResult.rows.length, "rows");
    if (classResult.rows.length > 0) {
      console.log("Class details:", classResult.rows[0]);
    }

    // Test getting students in class
    console.log("Testing students query...");
    const studentsResult = await client.query(
      "SELECT u.id as student_id, u.name as student_name, u.national_id FROM users u JOIN class_memberships cm ON u.id = cm.user_id WHERE cm.class_id = $1 AND cm.role = $2 ORDER BY u.name",
      [classId, "student"]
    );

    console.log("Students result:", studentsResult.rows.length, "rows");

    // Test getting all class memberships
    console.log("Testing all class memberships...");
    const allMemberships = await client.query(
      "SELECT cm.id, cm.user_id, cm.role, u.name FROM class_memberships cm JOIN users u ON cm.user_id = u.id WHERE cm.class_id = $1",
      [classId]
    );

    console.log("All class memberships:", allMemberships.rows);
  } catch (err) {
    console.error("Query error:", err);
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

testApi();
