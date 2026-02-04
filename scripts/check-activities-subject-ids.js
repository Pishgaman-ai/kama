const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

async function checkActivitiesSubjectIds() {
  const client = await pool.connect();

  try {
    console.log('🔍 بررسی subject_id های موجود در educational_activities...\n');

    // Check total activities
    const totalResult = await client.query(
      'SELECT COUNT(*) as count FROM educational_activities'
    );
    console.log(`📊 تعداد کل فعالیت‌ها: ${totalResult.rows[0].count}\n`);

    // Check activities with subject_id that exists in subjects table
    const validInSubjectsResult = await client.query(`
      SELECT COUNT(*) as count
      FROM educational_activities ea
      WHERE ea.subject_id IS NOT NULL
        AND EXISTS (SELECT 1 FROM subjects s WHERE s.id = ea.subject_id)
    `);
    console.log(`✅ فعالیت‌هایی که subject_id آنها در جدول subjects وجود دارد: ${validInSubjectsResult.rows[0].count}`);

    // Check activities with subject_id that exists in lessons table
    const validInLessonsResult = await client.query(`
      SELECT COUNT(*) as count
      FROM educational_activities ea
      WHERE ea.subject_id IS NOT NULL
        AND EXISTS (SELECT 1 FROM lessons l WHERE l.id = ea.subject_id)
    `);
    console.log(`✅ فعالیت‌هایی که subject_id آنها در جدول lessons وجود دارد: ${validInLessonsResult.rows[0].count}`);

    // Check activities with subject_id that doesn't exist in either table
    const invalidResult = await client.query(`
      SELECT COUNT(*) as count
      FROM educational_activities ea
      WHERE ea.subject_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM subjects s WHERE s.id = ea.subject_id)
        AND NOT EXISTS (SELECT 1 FROM lessons l WHERE l.id = ea.subject_id)
    `);
    console.log(`❌ فعالیت‌هایی که subject_id آنها در هیچکدام از جداول وجود ندارد: ${invalidResult.rows[0].count}\n`);

    // Show some sample invalid records
    if (parseInt(invalidResult.rows[0].count) > 0) {
      console.log('═'.repeat(70));
      console.log('نمونه‌هایی از subject_id های نامعتبر:\n');

      const samplesResult = await client.query(`
        SELECT
          ea.id,
          ea.subject_id,
          ea.title,
          ea.created_at,
          u.name as teacher_name
        FROM educational_activities ea
        LEFT JOIN users u ON ea.teacher_id = u.id
        WHERE ea.subject_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM subjects s WHERE s.id = ea.subject_id)
          AND NOT EXISTS (SELECT 1 FROM lessons l WHERE l.id = ea.subject_id)
        ORDER BY ea.created_at DESC
        LIMIT 5
      `);

      samplesResult.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.title || 'بدون عنوان'}`);
        console.log(`   معلم: ${row.teacher_name || 'نامشخص'}`);
        console.log(`   subject_id نامعتبر: ${row.subject_id}`);
        console.log(`   تاریخ: ${row.created_at}`);
        console.log('');
      });
    }

    // Check activities with NULL subject_id
    const nullResult = await client.query(`
      SELECT COUNT(*) as count
      FROM educational_activities
      WHERE subject_id IS NULL
    `);
    console.log(`⚠️  فعالیت‌های با subject_id = NULL: ${nullResult.rows[0].count}\n`);

    console.log('═'.repeat(70));
    console.log('📊 خلاصه:');
    console.log(`   کل فعالیت‌ها: ${totalResult.rows[0].count}`);
    console.log(`   معتبر در subjects: ${validInSubjectsResult.rows[0].count}`);
    console.log(`   معتبر در lessons: ${validInLessonsResult.rows[0].count}`);
    console.log(`   نامعتبر: ${invalidResult.rows[0].count}`);
    console.log(`   NULL: ${nullResult.rows[0].count}`);

  } finally {
    client.release();
    await pool.end();
  }
}

checkActivitiesSubjectIds()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
