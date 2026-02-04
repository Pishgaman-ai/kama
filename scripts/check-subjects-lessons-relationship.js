const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

async function checkRelationship() {
  const client = await pool.connect();

  try {
    console.log('🔍 بررسی رابطه بین جداول subjects و lessons...\n');

    // Check subjects table
    const subjectsResult = await client.query(`
      SELECT id, name, school_id, created_at
      FROM subjects
      ORDER BY created_at
      LIMIT 10
    `);

    console.log(`📚 نمونه از جدول subjects (${subjectsResult.rows.length} رکورد):`);
    subjectsResult.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.name}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   School: ${row.school_id}`);
    });
    console.log('');

    // Check lessons table
    const lessonsResult = await client.query(`
      SELECT id, title, grade_level, school_id, created_at
      FROM lessons
      ORDER BY created_at
      LIMIT 10
    `);

    console.log(`📖 نمونه از جدول lessons (${lessonsResult.rows.length} رکورد):`);
    lessonsResult.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.title}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Grade: ${row.grade_level || 'نامشخص'}`);
      console.log(`   School: ${row.school_id}`);
    });
    console.log('');

    // Check if there are any matching names
    console.log('═'.repeat(70));
    console.log('🔗 بررسی تطابق نام‌ها:\n');

    const matchingResult = await client.query(`
      SELECT
        s.id as subject_id,
        s.name as subject_name,
        l.id as lesson_id,
        l.title as lesson_title,
        s.school_id
      FROM subjects s
      JOIN lessons l ON LOWER(TRIM(s.name)) = LOWER(TRIM(l.title))
        AND s.school_id = l.school_id
      ORDER BY s.name
    `);

    if (matchingResult.rows.length > 0) {
      console.log(`✅ یافت شد ${matchingResult.rows.length} تطابق بین subjects و lessons:\n`);
      matchingResult.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.subject_name}`);
        console.log(`   Subject ID: ${row.subject_id}`);
        console.log(`   Lesson ID: ${row.lesson_id}`);
      });
    } else {
      console.log('❌ هیچ تطابقی بین نام‌های subjects و lessons یافت نشد');
    }
    console.log('');

    // Total counts
    const subjectsCount = await client.query('SELECT COUNT(*) as count FROM subjects');
    const lessonsCount = await client.query('SELECT COUNT(*) as count FROM lessons');

    console.log('═'.repeat(70));
    console.log('📊 آمار کلی:');
    console.log(`   تعداد subjects: ${subjectsCount.rows[0].count}`);
    console.log(`   تعداد lessons: ${lessonsCount.rows[0].count}`);
    console.log(`   تطابق‌ها: ${matchingResult.rows.length}`);

  } finally {
    client.release();
    await pool.end();
  }
}

checkRelationship()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
