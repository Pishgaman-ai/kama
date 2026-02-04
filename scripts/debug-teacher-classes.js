const { Pool } = require('pg');

// Database configuration (matching src/lib/database.ts)
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

async function debugTeacherClasses() {
  const client = await pool.connect();

  try {
    console.log('🔍 Debugging teacher classes issue...\n');

    // Get a sample teacher who might be logged in
    const teachersResult = await client.query(`
      SELECT id, name, email, school_id
      FROM users
      WHERE role = 'teacher'
      ORDER BY last_login DESC NULLS LAST
      LIMIT 5
    `);

    console.log('Recently active teachers:');
    teachersResult.rows.forEach((t, i) => {
      console.log(`${i+1}. ${t.name} (${t.email}) - ID: ${t.id}`);
    });

    // Check each teacher
    for (const teacher of teachersResult.rows) {
      console.log('\n' + '='.repeat(80));
      console.log(`Checking: ${teacher.name} (${teacher.email})`);
      console.log('='.repeat(80));

      // Check class_memberships
      const membershipsResult = await client.query(`
        SELECT
          cm.id,
          cm.class_id,
          cm.role,
          c.name as class_name,
          c.school_id as class_school_id,
          cm.joined_at
        FROM class_memberships cm
        LEFT JOIN classes c ON cm.class_id = c.id
        WHERE cm.user_id = $1 AND cm.role = 'teacher'
      `, [teacher.id]);

      console.log(`\n1️⃣ Class Memberships: ${membershipsResult.rows.length} found`);
      membershipsResult.rows.forEach((m, i) => {
        console.log(`   ${i+1}. Class: ${m.class_name || 'NULL'} (ID: ${m.class_id})`);
        console.log(`      School Match: ${m.class_school_id === teacher.school_id ? '✅' : '❌ MISMATCH!'}`);
        if (m.class_school_id !== teacher.school_id) {
          console.log(`      Teacher School: ${teacher.school_id}, Class School: ${m.class_school_id}`);
        }
      });

      // Check teacher_assignments
      const assignmentsResult = await client.query(`
        SELECT
          ta.id,
          ta.class_id,
          ta.subject_id,
          ta.subject,
          ta.removed_at,
          c.name as class_name,
          c.school_id as class_school_id,
          s.name as subject_name
        FROM teacher_assignments ta
        LEFT JOIN classes c ON ta.class_id = c.id
        LEFT JOIN subjects s ON ta.subject_id = s.id
        WHERE ta.teacher_id = $1
      `, [teacher.id]);

      console.log(`\n2️⃣ Teacher Assignments: ${assignmentsResult.rows.length} found`);
      assignmentsResult.rows.forEach((a, i) => {
        const status = a.removed_at ? '❌ Removed' : '✅ Active';
        console.log(`   ${i+1}. ${status} - Class: ${a.class_name || 'NULL'} (ID: ${a.class_id})`);
        console.log(`      Subject: ${a.subject_name || a.subject || 'NULL'}`);
        console.log(`      School Match: ${a.class_school_id === teacher.school_id ? '✅' : '❌ MISMATCH!'}`);
      });

      // Simulate the API query
      const apiResult = await client.query(`
        SELECT
          ta.id as assignment_id,
          s.id as subject_id,
          s.name as subject_name,
          c.id as class_id,
          c.name as class_name,
          c.grade_level,
          c.section,
          c.academic_year,
          COUNT(cm_student.user_id) as student_count
        FROM teacher_assignments ta
        JOIN subjects s ON ta.subject_id = s.id
        JOIN classes c ON ta.class_id = c.id
        LEFT JOIN class_memberships cm_student ON c.id = cm_student.class_id AND cm_student.role = 'student'
        WHERE ta.teacher_id = $1 AND ta.removed_at IS NULL
        GROUP BY ta.id, s.id, s.name, c.id, c.name, c.grade_level, c.section, c.academic_year
        ORDER BY c.grade_level, c.name, s.name
      `, [teacher.id]);

      console.log(`\n3️⃣ API Query Result: ${apiResult.rows.length} subjects`);
      if (apiResult.rows.length === 0) {
        console.log('   ⚠️  API would return EMPTY - this is the problem!');

        // Find out why
        console.log('\n   Debugging why API returns empty:');

        // Check if assignments have subject_id
        const noSubjectId = await client.query(`
          SELECT COUNT(*) as count
          FROM teacher_assignments ta
          WHERE ta.teacher_id = $1 AND ta.removed_at IS NULL AND ta.subject_id IS NULL
        `, [teacher.id]);

        if (parseInt(noSubjectId.rows[0].count) > 0) {
          console.log(`   ❌ ${noSubjectId.rows[0].count} assignments have NULL subject_id`);
          console.log(`      → This causes JOIN with subjects table to fail!`);
        }

        // Check if subject_id points to non-existent subjects
        const invalidSubjects = await client.query(`
          SELECT ta.subject_id, ta.subject
          FROM teacher_assignments ta
          LEFT JOIN subjects s ON ta.subject_id = s.id
          WHERE ta.teacher_id = $1 AND ta.removed_at IS NULL AND ta.subject_id IS NOT NULL AND s.id IS NULL
        `, [teacher.id]);

        if (invalidSubjects.rows.length > 0) {
          console.log(`   ❌ ${invalidSubjects.rows.length} assignments have invalid subject_id`);
          invalidSubjects.rows.forEach(a => {
            console.log(`      → Subject ID: ${a.subject_id}, Text: ${a.subject || 'NULL'}`);
          });
        }
      } else {
        console.log('   ✅ API would return data correctly');
        apiResult.rows.forEach((row, i) => {
          console.log(`   ${i+1}. ${row.class_name} - ${row.subject_name} (${row.student_count} students)`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run debug
debugTeacherClasses()
  .then(() => {
    console.log('\n✨ Debug complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Debug failed:', error.message);
    process.exit(1);
  });
