const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:060511@localhost:5432/kama_education'
});

async function debugActivitiesSubjects() {
  const client = await pool.connect();

  try {
    console.log('=== Checking educational_activities table ===\n');

    const activitiesResult = await client.query(
      `
      SELECT
        ea.id,
        ea.student_id,
        ea.class_id,
        ea.subject_id,
        ea.activity_title,
        u.name as student_name,
        c.name as class_name,
        s.name as subject_name,
        s.id as actual_subject_id
      FROM educational_activities ea
      JOIN users u ON ea.student_id = u.id
      JOIN classes c ON ea.class_id = c.id
      LEFT JOIN subjects s ON ea.subject_id = s.id
      ORDER BY ea.created_at DESC
      LIMIT 10
      `
    );

    console.log('Recent activities (last 10):');
    console.log('Total:', activitiesResult.rows.length);
    console.log('');

    activitiesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.activity_title}`);
      console.log(`   Student: ${row.student_name}`);
      console.log(`   Class: ${row.class_name}`);
      console.log(`   Subject ID in activities table: ${row.subject_id || 'NULL'}`);
      console.log(`   Subject name from join: ${row.subject_name || 'NULL'}`);
      console.log(`   Actual subject ID from subjects table: ${row.actual_subject_id || 'NULL'}`);
      console.log('');
    });

    console.log('=== Checking if subject_id exists in subjects table ===\n');

    const subjectsCheck = await client.query(
      `
      SELECT DISTINCT ea.subject_id, s.name as subject_name
      FROM educational_activities ea
      LEFT JOIN subjects s ON ea.subject_id = s.id
      WHERE ea.subject_id IS NOT NULL
      `
    );

    console.log('Subjects used in activities:');
    subjectsCheck.rows.forEach((row) => {
      console.log(`  Subject ID: ${row.subject_id} -> Name: ${row.subject_name || 'NOT FOUND IN SUBJECTS TABLE!'}`);
    });
    console.log('');

    console.log('=== Checking teacher assignments ===\n');

    const teacherResult = await client.query(
      `SELECT id, name FROM users WHERE role = 'teacher' LIMIT 1`
    );

    if (teacherResult.rows.length > 0) {
      const teacher = teacherResult.rows[0];
      console.log(`Checking assignments for teacher: ${teacher.name} (${teacher.id})`);
      console.log('');

      const assignmentsResult = await client.query(
        `
        SELECT
          ta.id,
          ta.class_id,
          ta.subject_id,
          c.name as class_name,
          s.name as subject_name
        FROM teacher_assignments ta
        JOIN classes c ON ta.class_id = c.id
        LEFT JOIN subjects s ON ta.subject_id = s.id
        WHERE ta.teacher_id = $1 AND ta.removed_at IS NULL
        `,
        [teacher.id]
      );

      console.log('Teacher assignments:');
      assignmentsResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. Class: ${row.class_name}, Subject: ${row.subject_name || 'NULL'}, Subject ID: ${row.subject_id || 'NULL'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugActivitiesSubjects();
