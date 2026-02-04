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

// Default subjects for Iranian schools
const defaultSubjects = [
  { name: 'ریاضی', code: 'MATH', grade_level: 'همه' },
  { name: 'علوم تجربی', code: 'SCI', grade_level: 'همه' },
  { name: 'فارسی', code: 'PER', grade_level: 'همه' },
  { name: 'عربی', code: 'ARA', grade_level: 'همه' },
  { name: 'انگلیسی', code: 'ENG', grade_level: 'همه' },
  { name: 'مطالعات اجتماعی', code: 'SOC', grade_level: 'همه' },
  { name: 'هنر', code: 'ART', grade_level: 'همه' },
  { name: 'تربیت بدنی', code: 'PE', grade_level: 'همه' },
  { name: 'کار و فناوری', code: 'TECH', grade_level: 'همه' },
  { name: 'قرآن', code: 'QUR', grade_level: 'همه' },
];

async function seedDefaultSubjects() {
  const client = await pool.connect();

  try {
    console.log('🌱 ایجاد دروس پیش‌فرض برای مدارسی که درس ندارند...\n');

    await client.query('BEGIN');

    // Get schools without subjects
    const schoolsResult = await client.query(`
      SELECT DISTINCT u.school_id
      FROM users u
      WHERE u.school_id IS NOT NULL
        AND u.role IN ('teacher', 'principal')
        AND NOT EXISTS (
          SELECT 1 FROM subjects s WHERE s.school_id = u.school_id
        )
    `);

    console.log(`پیدا شد ${schoolsResult.rows.length} مدرسه بدون درس\n`);

    let totalCreated = 0;

    for (const school of schoolsResult.rows) {
      const schoolId = school.school_id;

      // Get school name
      const schoolInfo = await client.query(
        'SELECT name FROM users WHERE school_id = $1 AND role = \'principal\' LIMIT 1',
        [schoolId]
      );

      const schoolName = schoolInfo.rows[0]?.name || 'بدون نام';
      console.log(`📚 ایجاد دروس برای مدرسه: ${schoolName}`);

      // Insert default subjects
      for (const subject of defaultSubjects) {
        await client.query(
          `INSERT INTO subjects (school_id, name, code, grade_level, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [schoolId, subject.name, subject.code, subject.grade_level]
        );
        totalCreated++;
      }

      console.log(`   ✅ ${defaultSubjects.length} درس ایجاد شد`);
      console.log('');
    }

    await client.query('COMMIT');

    console.log('═'.repeat(60));
    console.log(`✅ در مجموع ${totalCreated} درس برای ${schoolsResult.rows.length} مدرسه ایجاد شد`);
    console.log('═'.repeat(60));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطا:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDefaultSubjects()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
