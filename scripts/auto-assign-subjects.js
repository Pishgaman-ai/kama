const { Pool } = require('pg');

// Database configuration
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

async function autoAssignSubjects() {
  const client = await pool.connect();

  try {
    console.log('🔄 Auto-assigning subjects to teacher_assignments...\n');

    await client.query('BEGIN');

    // Get all teacher_assignments with NULL subject_id
    const assignmentsResult = await client.query(`
      SELECT
        ta.id,
        ta.class_id,
        ta.teacher_id,
        c.name as class_name,
        c.school_id,
        c.subject as class_subject
      FROM teacher_assignments ta
      JOIN classes c ON ta.class_id = c.id
      WHERE ta.subject_id IS NULL AND ta.removed_at IS NULL
    `);

    console.log(`Found ${assignmentsResult.rows.length} assignments without subject_id\n`);

    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const assignment of assignmentsResult.rows) {
      // Try to find matching subject by name similarity
      const subjectsResult = await client.query(`
        SELECT id, name
        FROM subjects
        WHERE school_id = $1
        ORDER BY name
      `, [assignment.school_id]);

      let matchedSubjectId = null;
      const className = assignment.class_name.toLowerCase();

      // Try exact match or contains
      for (const subject of subjectsResult.rows) {
        const subjectName = subject.name.toLowerCase();

        // Check if class name contains subject name or vice versa
        if (className.includes(subjectName) || subjectName.includes(className)) {
          matchedSubjectId = subject.id;
          console.log(`✅ Matched: "${assignment.class_name}" → "${subject.name}"`);
          break;
        }
      }

      if (matchedSubjectId) {
        // Update the assignment
        await client.query(
          'UPDATE teacher_assignments SET subject_id = $1 WHERE id = $2',
          [matchedSubjectId, assignment.id]
        );
        matchedCount++;
      } else {
        console.log(`⚠️  No match: "${assignment.class_name}" (School has ${subjectsResult.rows.length} subjects)`);
        unmatchedCount++;

        // Set the subject text field to class name as fallback
        await client.query(
          'UPDATE teacher_assignments SET subject = $1 WHERE id = $2',
          [assignment.class_name, assignment.id]
        );
      }
    }

    await client.query('COMMIT');

    console.log('\n' + '─'.repeat(60));
    console.log('📊 Summary:');
    console.log(`✅ Matched and assigned: ${matchedCount}`);
    console.log(`⚠️  No match found: ${unmatchedCount}`);
    console.log('─'.repeat(60));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

autoAssignSubjects()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
