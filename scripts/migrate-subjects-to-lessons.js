const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

async function migrateSubjectsToLessons() {
  const client = await pool.connect();

  try {
    console.log('🔄 شروع مایگریشن از subjects به lessons...\n');

    await client.query('BEGIN');

    // Step 1: For each activity with subject_id from subjects table,
    // find a matching lesson and update the activity
    console.log('مرحله 1: پیدا کردن تطابق‌ها و به‌روزرسانی educational_activities...\n');

    const updateResult = await client.query(`
      WITH matched_lessons AS (
        SELECT DISTINCT ON (ea.id)
          ea.id as activity_id,
          l.id as lesson_id,
          s.name as subject_name,
          l.title as lesson_title
        FROM educational_activities ea
        JOIN subjects s ON ea.subject_id = s.id
        JOIN lessons l ON LOWER(TRIM(s.name)) = LOWER(TRIM(l.title))
          AND s.school_id = l.school_id
        ORDER BY ea.id, l.created_at DESC
      )
      UPDATE educational_activities ea
      SET subject_id = ml.lesson_id
      FROM matched_lessons ml
      WHERE ea.id = ml.activity_id
      RETURNING ea.id, ml.subject_name, ml.lesson_id
    `);

    console.log(`✅ ${updateResult.rowCount} فعالیت به‌روزرسانی شد\n`);

    if (updateResult.rowCount > 0) {
      console.log('نمونه به‌روزرسانی‌ها:');
      updateResult.rows.slice(0, 5).forEach((row, i) => {
        console.log(`${i + 1}. ${row.subject_name} → Lesson ID: ${row.lesson_id.substring(0, 8)}...`);
      });
      console.log('');
    }

    // Step 2: Check if there are any activities that couldn't be matched
    const unmatchedResult = await client.query(`
      SELECT
        ea.id,
        ea.activity_title,
        ea.subject_id,
        s.name as subject_name
      FROM educational_activities ea
      JOIN subjects s ON ea.subject_id = s.id
      WHERE NOT EXISTS (
        SELECT 1 FROM lessons l
        WHERE l.id = ea.subject_id
      )
    `);

    if (unmatchedResult.rows.length > 0) {
      console.log(`⚠️  ${unmatchedResult.rows.length} فعالیت که تطابقی برایشان یافت نشد:\n`);
      unmatchedResult.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.activity_title || 'بدون عنوان'}`);
        console.log(`   Subject: ${row.subject_name}`);
        console.log(`   Subject ID: ${row.subject_id}`);
      });
      console.log('');
      console.log('⚠️  این فعالیت‌ها همچنان به subjects اشاره می‌کنند');
      console.log('   باید به صورت دستی بررسی شوند\n');
    } else {
      console.log('✅ همه فعالیت‌ها با موفقیت به lessons تطابق یافتند\n');
    }

    // Step 3: Now we can safely change the FK constraint
    console.log('═'.repeat(70));
    console.log('مرحله 2: تغییر Foreign Key Constraint...\n');

    // Drop old constraint
    const constraintResult = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'educational_activities'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%subject%'
    `);

    if (constraintResult.rows.length > 0) {
      const constraintName = constraintResult.rows[0].constraint_name;
      console.log(`🗑️  حذف constraint قدیمی: ${constraintName}`);

      await client.query(`
        ALTER TABLE educational_activities
        DROP CONSTRAINT ${constraintName}
      `);

      console.log('✅ Constraint قدیمی حذف شد\n');
    }

    // Add new constraint
    console.log('➕ افزودن constraint جدید به lessons...');

    await client.query(`
      ALTER TABLE educational_activities
      ADD CONSTRAINT educational_activities_lesson_id_fkey
      FOREIGN KEY (subject_id)
      REFERENCES lessons(id)
      ON DELETE CASCADE
    `);

    console.log('✅ Constraint جدید اضافه شد\n');

    await client.query('COMMIT');

    console.log('═'.repeat(70));
    console.log('✅ مایگریشن با موفقیت تکمیل شد!\n');

    // Final verification
    const finalCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM educational_activities ea
      WHERE NOT EXISTS (
        SELECT 1 FROM lessons l WHERE l.id = ea.subject_id
      )
    `);

    console.log('📊 بررسی نهایی:');
    console.log(`   فعالیت‌های با subject_id نامعتبر: ${finalCheck.rows[0].count}`);

    if (parseInt(finalCheck.rows[0].count) === 0) {
      console.log('\n🎉 همه چیز آماده است! حالا معلمان می‌توانند فعالیت ثبت کنند');
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطا:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateSubjectsToLessons()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
