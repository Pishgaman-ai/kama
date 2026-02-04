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

async function checkTeacher() {
  const client = await pool.connect();

  try {
    // Get teacher from login
    const teacherEmail = process.argv[2] || 'teacher09@teacher.com';

    const teacherResult = await client.query(
      'SELECT id, name, email, school_id FROM users WHERE email = $1 AND role = \'teacher\'',
      [teacherEmail]
    );

    if (teacherResult.rows.length === 0) {
      console.log('❌ Teacher not found:', teacherEmail);
      return;
    }

    const teacher = teacherResult.rows[0];
    console.log('👨‍🏫 Teacher:', teacher.name, `(${teacher.email})`);
    console.log('   ID:', teacher.id);
    console.log('   School ID:', teacher.school_id);

    // Check subjects in school
    console.log('\n📚 Subjects in this school:');
    const subjectsResult = await client.query(
      'SELECT id, name, grade_level FROM subjects WHERE school_id = $1 ORDER BY name',
      [teacher.school_id]
    );

    if (subjectsResult.rows.length === 0) {
      console.log('   ⚠️  NO subjects defined in this school!');
    } else {
      subjectsResult.rows.forEach((s, i) => {
        console.log(`   ${i+1}. ${s.name} (Grade: ${s.grade_level || 'N/A'})`);
      });
    }

    // Check classes
    console.log('\n🏫 Classes in this school:');
    const classesResult = await client.query(
      'SELECT id, name, grade_level, subject FROM classes WHERE school_id = $1 ORDER BY name',
      [teacher.school_id]
    );

    classesResult.rows.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.name} - Subject field: "${c.subject || 'NULL'}"`);
    });

    // Check teacher_assignments
    console.log('\n📋 Teacher Assignments:');
    const assignmentsResult = await client.query(`
      SELECT
        ta.id,
        c.name as class_name,
        ta.subject_id,
        ta.subject,
        s.name as subject_name
      FROM teacher_assignments ta
      JOIN classes c ON ta.class_id = c.id
      LEFT JOIN subjects s ON ta.subject_id = s.id
      WHERE ta.teacher_id = $1 AND ta.removed_at IS NULL
    `, [teacher.id]);

    assignmentsResult.rows.forEach((a, i) => {
      console.log(`   ${i+1}. Class: ${a.class_name}`);
      console.log(`      subject_id: ${a.subject_id || 'NULL'}`);
      console.log(`      subject (text): "${a.subject || 'NULL'}"`);
      console.log(`      subject_name (from subjects table): ${a.subject_name || 'NULL'}`);
    });

    // Simulate API query
    console.log('\n🔍 Simulating API Query:');
    const apiResult = await client.query(`
      SELECT
        ta.id as assignment_id,
        COALESCE(s.id, ta.class_id) as subject_id,
        COALESCE(s.name, ta.subject, c.subject, c.name) as subject_name,
        c.id as class_id,
        c.name as class_name,
        c.grade_level,
        c.section,
        c.academic_year,
        s.name as real_subject_name,
        ta.subject as ta_subject,
        c.subject as c_subject
      FROM teacher_assignments ta
      JOIN classes c ON ta.class_id = c.id
      LEFT JOIN subjects s ON ta.subject_id = s.id
      WHERE ta.teacher_id = $1 AND ta.removed_at IS NULL
      ORDER BY c.name
    `, [teacher.id]);

    apiResult.rows.forEach((row, i) => {
      console.log(`\n   ${i+1}. Class: ${row.class_name}`);
      console.log(`      subject_name (returned): "${row.subject_name}"`);
      console.log(`      Breakdown:`);
      console.log(`        - s.name (subjects table): ${row.real_subject_name || 'NULL'}`);
      console.log(`        - ta.subject (assignment): ${row.ta_subject || 'NULL'}`);
      console.log(`        - c.subject (class): ${row.c_subject || 'NULL'}`);
      console.log(`        - c.name (class name): ${row.class_name}`);

      if (row.subject_name === row.class_name) {
        console.log(`      ⚠️  PROBLEM: Subject name is same as class name!`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkTeacher()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
