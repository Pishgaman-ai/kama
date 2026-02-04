const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

async function syncSubjectsToLessons() {
  const client = await pool.connect();

  try {
    console.log('🔄 همگام‌سازی subjects با lessons...\n');

    await client.query('BEGIN');

    // Find all subjects used in educational_activities
    const usedSubjectsResult = await client.query(`
      SELECT DISTINCT
        s.id,
        s.name,
        s.school_id
      FROM educational_activities ea
      JOIN subjects s ON ea.subject_id = s.id
      WHERE s.id NOT IN (SELECT id FROM lessons)
    `);

    console.log(`📚 ${usedSubjectsResult.rows.length} subject یافت شد که در lessons وجود ندارد\n`);

    let createdCount = 0;
    const subjectToLessonMap = [];

    for (const subject of usedSubjectsResult.rows) {
      // Check if a lesson with the same name already exists
      const existingLessonResult = await client.query(`
        SELECT id FROM lessons
        WHERE LOWER(TRIM(title)) = LOWER(TRIM($1))
          AND school_id = $2
        LIMIT 1
      `, [subject.name, subject.school_id]);

      let lessonId;
      let principalId;

      if (existingLessonResult.rows.length > 0) {
        // Use existing lesson
        lessonId = existingLessonResult.rows[0].id;
        console.log(`✓ استفاده از lesson موجود برای "${subject.name}"`);
      } else {
        // Get a principal from this school to use as created_by
        const principalResult = await client.query(`
          SELECT id FROM users
          WHERE school_id = $1 AND role = 'principal'
          LIMIT 1
        `, [subject.school_id]);

        if (principalResult.rows.length === 0) {
          console.log(`⚠️  هیچ مدیری برای مدرسه "${subject.school_id}" یافت نشد، از اولین principal استفاده می‌کنیم`);
          // Use any principal user from any school
          const anyPrincipalResult = await client.query(`
            SELECT id FROM users WHERE role = 'principal' LIMIT 1
          `);

          if (anyPrincipalResult.rows.length === 0) {
            throw new Error('No principal user found to use as created_by');
          }

          principalId = anyPrincipalResult.rows[0].id;
        } else {
          principalId = principalResult.rows[0].id;
        }

        // Create new lesson with the same ID as the subject for easier mapping
        const insertResult = await client.query(`
          INSERT INTO lessons (id, title, school_id, grade_level, created_by, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id
        `, [subject.id, subject.name, subject.school_id, 'همه', principalId]);

        lessonId = insertResult.rows[0].id;
        createdCount++;
        console.log(`➕ ایجاد lesson جدید: "${subject.name}" (ID: ${lessonId.substring(0, 8)}...)`);
      }

      subjectToLessonMap.push({
        subjectId: subject.id,
        lessonId: lessonId,
        name: subject.name
      });
    }

    console.log(`\n✅ ${createdCount} lesson جدید ایجاد شد\n`);

    // Now update educational_activities to use lesson IDs
    console.log('═'.repeat(70));
    console.log('به‌روزرسانی educational_activities...\n');

    let updatedCount = 0;
    for (const mapping of subjectToLessonMap) {
      const updateResult = await client.query(`
        UPDATE educational_activities
        SET subject_id = $1
        WHERE subject_id = $2
      `, [mapping.lessonId, mapping.subjectId]);

      updatedCount += updateResult.rowCount;
      console.log(`✓ ${updateResult.rowCount} فعالیت "${mapping.name}" به‌روزرسانی شد`);
    }

    console.log(`\n✅ کل ${updatedCount} فعالیت به‌روزرسانی شد\n`);

    // Update teacher_assignments
    console.log('═'.repeat(70));
    console.log('به‌روزرسانی teacher_assignments...\n');

    let assignmentsUpdated = 0;
    for (const mapping of subjectToLessonMap) {
      const updateResult = await client.query(`
        UPDATE teacher_assignments
        SET subject_id = $1
        WHERE subject_id = $2
      `, [mapping.lessonId, mapping.subjectId]);

      if (updateResult.rowCount > 0) {
        assignmentsUpdated += updateResult.rowCount;
        console.log(`✓ ${updateResult.rowCount} تخصیص "${mapping.name}" به‌روزرسانی شد`);
      }
    }

    console.log(`\n✅ کل ${assignmentsUpdated} تخصیص به‌روزرسانی شد\n`);

    // Now add the FK constraint
    console.log('═'.repeat(70));
    console.log('تغییر Foreign Key Constraint...\n');

    // Drop old constraint if it exists
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
    console.log('🎉 همگام‌سازی با موفقیت تکمیل شد!\n');

    // Verification
    const verifyResult = await client.query(`
      SELECT COUNT(*) as count
      FROM educational_activities ea
      WHERE NOT EXISTS (
        SELECT 1 FROM lessons l WHERE l.id = ea.subject_id
      )
    `);

    console.log('📊 بررسی نهایی:');
    console.log(`   فعالیت‌های با subject_id نامعتبر: ${verifyResult.rows[0].count}`);
    console.log(`   Lessons جدید ایجاد شده: ${createdCount}`);
    console.log(`   فعالیت‌های به‌روزرسانی شده: ${updatedCount}`);
    console.log(`   تخصیص‌های به‌روزرسانی شده: ${assignmentsUpdated}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطا:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

syncSubjectsToLessons()
  .then(() => {
    console.log('\n✨ Done!');
    console.log('\nحالا معلمان می‌توانند فعالیت ثبت کنند و همه چیز از جدول lessons استفاده می‌کند');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
