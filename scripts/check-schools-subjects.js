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

async function checkSchoolsSubjects() {
  const client = await pool.connect();

  try {
    // Get all schools
    const schoolsResult = await client.query(`
      SELECT DISTINCT school_id
      FROM users
      WHERE school_id IS NOT NULL
    `);

    console.log(`🏫 پیدا شد ${schoolsResult.rows.length} مدرسه\n`);

    for (const school of schoolsResult.rows) {
      const schoolId = school.school_id;

      // Get school name
      const schoolInfo = await client.query(
        'SELECT name FROM users WHERE school_id = $1 AND role = \'principal\' LIMIT 1',
        [schoolId]
      );

      const schoolName = schoolInfo.rows[0]?.name || 'بدون نام';

      // Count subjects
      const subjectsCount = await client.query(
        'SELECT COUNT(*) as count FROM subjects WHERE school_id = $1',
        [schoolId]
      );

      // Count teachers
      const teachersCount = await client.query(
        'SELECT COUNT(*) as count FROM users WHERE school_id = $1 AND role = \'teacher\'',
        [schoolId]
      );

      // Count teacher assignments with subject_id
      const assignmentsWithSubject = await client.query(
        `SELECT COUNT(*) as count
         FROM teacher_assignments ta
         JOIN users u ON ta.teacher_id = u.id
         WHERE u.school_id = $1 AND ta.subject_id IS NOT NULL AND ta.removed_at IS NULL`,
        [schoolId]
      );

      console.log(`مدرسه: ${schoolName}`);
      console.log(`  School ID: ${schoolId}`);
      console.log(`  تعداد دروس: ${subjectsCount.rows[0].count}`);
      console.log(`  تعداد معلمان: ${teachersCount.rows[0].count}`);
      console.log(`  تخصیص‌های دارای subject_id: ${assignmentsWithSubject.rows[0].count}`);

      if (parseInt(subjectsCount.rows[0].count) === 0) {
        console.log(`  ⚠️  این مدرسه هیچ درسی ندارد!`);
      }

      console.log('');
    }

  } catch (error) {
    console.error('❌ خطا:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchoolsSubjects()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error.message);
    process.exit(1);
  });
