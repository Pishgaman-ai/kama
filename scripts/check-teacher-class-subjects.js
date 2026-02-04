const { Pool } = require('pg');

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

async function checkTeacherClassSubjects() {
  const client = await pool.connect();

  try {
    // Get a sample teacher
    const teacherResult = await client.query(
      "SELECT id, name, email, school_id FROM users WHERE role = 'teacher' LIMIT 1"
    );

    if (teacherResult.rows.length === 0) {
      console.log('❌ No teachers found');
      return;
    }

    const teacher = teacherResult.rows[0];
    console.log('👨‍🏫 Teacher:', teacher.name, '(' + teacher.email + ')');
    console.log('School ID:', teacher.school_id);
    console.log('');

    // Get teacher's assignments with class and subject info
    const assignmentsResult = await client.query(`
      SELECT
        ta.id,
        c.id as class_id,
        c.name as class_name,
        ta.subject_id,
        ta.subject as subject_text,
        s.id as subject_table_id,
        s.name as subject_name
      FROM teacher_assignments ta
      JOIN classes c ON ta.class_id = c.id
      LEFT JOIN subjects s ON ta.subject_id = s.id
      WHERE ta.teacher_id = $1 AND ta.removed_at IS NULL
      ORDER BY c.name
    `, [teacher.id]);

    console.log('📋 Teacher Assignments:', assignmentsResult.rows.length);
    console.log('');

    assignmentsResult.rows.forEach((a, i) => {
      console.log(`${i+1}. Class: ${a.class_name} (ID: ${a.class_id})`);
      console.log(`   subject_id: ${a.subject_id || 'NULL'}`);
      console.log(`   subject_text: ${a.subject_text || 'NULL'}`);
      console.log(`   subject from table: ${a.subject_name || 'NULL'}`);
      console.log('');
    });

    // Now test what the current API would return for a specific class
    if (assignmentsResult.rows.length > 0) {
      const testClass = assignmentsResult.rows[0];
      console.log('─'.repeat(60));
      console.log('🔍 Testing: What subjects should show for class:', testClass.class_name);
      console.log('─'.repeat(60));
      console.log('');

      // Current approach: Get ALL subjects in school
      const allSubjectsResult = await client.query(
        'SELECT id, name FROM subjects WHERE school_id = $1 ORDER BY name',
        [teacher.school_id]
      );

      console.log('❌ CURRENT (WRONG): Shows ALL subjects in school (' + allSubjectsResult.rows.length + '):');
      allSubjectsResult.rows.forEach((s, i) => {
        console.log(`   ${i+1}. ${s.name}`);
      });
      console.log('');

      // Correct approach: Get only subjects this teacher teaches in this class
      const teacherClassSubjectsResult = await client.query(`
        SELECT DISTINCT
          s.id,
          s.name
        FROM teacher_assignments ta
        LEFT JOIN subjects s ON ta.subject_id = s.id
        WHERE ta.teacher_id = $1
          AND ta.class_id = $2
          AND ta.removed_at IS NULL
          AND s.id IS NOT NULL
      `, [teacher.id, testClass.class_id]);

      console.log('✅ CORRECT: Should show only this teacher\'s subjects in this class (' + teacherClassSubjectsResult.rows.length + '):');
      if (teacherClassSubjectsResult.rows.length > 0) {
        teacherClassSubjectsResult.rows.forEach((s, i) => {
          console.log(`   ${i+1}. ${s.name}`);
        });
      } else {
        console.log('   ⚠️ No subjects found! This teacher has no subject_id set for this class.');
        console.log('   Need to fix teacher_assignments.subject_id for this class.');
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

checkTeacherClassSubjects()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
