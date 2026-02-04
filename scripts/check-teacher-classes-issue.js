const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:060511@localhost:5432/kama_education'
});

async function checkTeacherClasses() {
  const client = await pool.connect();

  try {
    console.log('=== Finding teacher Parvane Bahrami ===');
    const teacherResult = await client.query(
      `SELECT id, name, email FROM users WHERE name = 'پروانه بهرامی' AND role = 'teacher'`
    );

    if (teacherResult.rows.length === 0) {
      console.log('Teacher not found!');
      return;
    }

    const teacher = teacherResult.rows[0];
    console.log('Teacher found:', teacher);
    console.log('');

    console.log('=== Teacher Assignments ===');
    const assignmentsResult = await client.query(
      `
      SELECT
        ta.id as assignment_id,
        ta.subject_id,
        s.name as subject_name,
        ta.class_id,
        c.name as class_name,
        c.grade_level,
        c.section
      FROM teacher_assignments ta
      JOIN classes c ON ta.class_id = c.id
      LEFT JOIN subjects s ON ta.subject_id = s.id
      WHERE ta.teacher_id = $1 AND ta.removed_at IS NULL
      ORDER BY c.name
      `,
      [teacher.id]
    );

    console.log('Total assignments:', assignmentsResult.rows.length);
    assignmentsResult.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. Assignment:`, {
        assignment_id: row.assignment_id,
        class_name: row.class_name,
        subject_id: row.subject_id,
        subject_name: row.subject_name,
        grade_level: row.grade_level,
        section: row.section
      });
    });

    console.log('\n=== Checking class memberships ===');
    const membershipResult = await client.query(
      `
      SELECT
        cm.id,
        cm.class_id,
        c.name as class_name,
        cm.role
      FROM class_memberships cm
      JOIN classes c ON cm.class_id = c.id
      WHERE cm.user_id = $1 AND cm.role = 'teacher'
      ORDER BY c.name
      `,
      [teacher.id]
    );

    console.log('Total class memberships:', membershipResult.rows.length);
    membershipResult.rows.forEach((row, index) => {
      console.log(`${index + 1}.`, row);
    });

    console.log('\n=== Testing API query for each class ===');
    for (const assignment of assignmentsResult.rows) {
      console.log(`\nTesting class: ${assignment.class_name} - Subject: ${assignment.subject_name || 'NULL'}`);
      console.log(`Class ID: ${assignment.class_id}, Subject ID: ${assignment.subject_id || 'NULL'}`);

      // Test the query used in the API
      if (assignment.subject_id) {
        const apiTestResult = await client.query(
          `
          SELECT cm.id, cm.role, u.name as teacher_name,
                 s.name as subject_name, s.id as subject_id
          FROM class_memberships cm
          JOIN users u ON cm.user_id = u.id
          JOIN teacher_assignments ta ON cm.class_id = ta.class_id AND cm.user_id = ta.teacher_id
          JOIN subjects s ON ta.subject_id = s.id
          WHERE cm.class_id = $1 AND cm.user_id = $2 AND cm.role = 'teacher'
                AND ta.subject_id = $3 AND ta.removed_at IS NULL
          `,
          [assignment.class_id, teacher.id, assignment.subject_id]
        );

        if (apiTestResult.rows.length > 0) {
          console.log('✓ API query would succeed:', apiTestResult.rows[0]);
        } else {
          console.log('✗ API query would FAIL - No access found!');

          // Debug: check each part of the query
          console.log('  Debugging...');

          const cmCheck = await client.query(
            `SELECT * FROM class_memberships WHERE class_id = $1 AND user_id = $2 AND role = 'teacher'`,
            [assignment.class_id, teacher.id]
          );
          console.log('  Class membership exists:', cmCheck.rows.length > 0, cmCheck.rows.length);

          const taCheck = await client.query(
            `SELECT * FROM teacher_assignments WHERE class_id = $1 AND teacher_id = $2 AND subject_id = $3 AND removed_at IS NULL`,
            [assignment.class_id, teacher.id, assignment.subject_id]
          );
          console.log('  Teacher assignment exists:', taCheck.rows.length > 0, taCheck.rows.length);
        }
      } else {
        console.log('  Subject ID is NULL - skipping API test');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTeacherClasses();
