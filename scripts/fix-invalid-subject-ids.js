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

async function fixInvalidSubjectIds() {
  const client = await pool.connect();

  try {
    console.log('🔧 بررسی و رفع subject_id های نامعتبر...\n');

    await client.query('BEGIN');

    // Find teacher_assignments with invalid subject_id
    const invalidResult = await client.query(`
      SELECT
        ta.id,
        ta.subject_id,
        u.name as teacher_name,
        c.name as class_name
      FROM teacher_assignments ta
      JOIN users u ON ta.teacher_id = u.id
      JOIN classes c ON ta.class_id = c.id
      WHERE ta.subject_id IS NOT NULL
        AND ta.removed_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM subjects s WHERE s.id = ta.subject_id
        )
    `);

    console.log(`پیدا شد ${invalidResult.rows.length} تخصیص با subject_id نامعتبر\n`);

    if (invalidResult.rows.length > 0) {
      console.log('لیست تخصیص‌های نامعتبر:');
      invalidResult.rows.forEach((row, i) => {
        console.log(`${i+1}. ${row.teacher_name} → ${row.class_name}`);
        console.log(`   Invalid subject_id: ${row.subject_id}`);
      });
      console.log('');

      // Fix them by setting subject_id to NULL
      const fixResult = await client.query(`
        UPDATE teacher_assignments
        SET subject_id = NULL
        WHERE subject_id IS NOT NULL
          AND removed_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM subjects s WHERE s.id = teacher_assignments.subject_id
          )
      `);

      console.log(`✅ ${fixResult.rowCount} تخصیص رفع شد (subject_id → NULL)`);
      console.log('');
      console.log('⚠️  معلمان می‌توانند از fallback استفاده کنند و درس مناسب را انتخاب کنند');
    } else {
      console.log('✅ همه subject_id ها معتبر هستند!');
    }

    await client.query('COMMIT');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطا:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixInvalidSubjectIds()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
