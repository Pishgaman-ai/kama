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

async function assignSubject() {
  const client = await pool.connect();

  try {
    console.log('🔧 تنظیم درس برای آناهیتا شیرازی\n');

    await client.query('BEGIN');

    // Find teacher
    const teacherResult = await client.query(
      "SELECT id, name, school_id FROM users WHERE name LIKE '%آناهیتا%' AND role = 'teacher'"
    );

    if (teacherResult.rows.length === 0) {
      console.log('❌ معلم یافت نشد');
      return;
    }

    const teacher = teacherResult.rows[0];
    console.log(`معلم: ${teacher.name}`);
    console.log(`School ID: ${teacher.school_id}\n`);

    // Find "ریاضی" subject
    const subjectResult = await client.query(
      "SELECT id, name FROM subjects WHERE school_id = $1 AND name LIKE '%ریاضی%'",
      [teacher.school_id]
    );

    if (subjectResult.rows.length === 0) {
      console.log('❌ درس ریاضی یافت نشد. لیست دروس موجود:');

      const allSubjects = await client.query(
        'SELECT id, name FROM subjects WHERE school_id = $1 ORDER BY name',
        [teacher.school_id]
      );

      allSubjects.rows.forEach((s, i) => {
        console.log(`  ${i+1}. ${s.name} (ID: ${s.id})`);
      });

      console.log('\n⚠️  لطفاً یکی از درس‌های بالا را انتخاب کنید و script را با آن درس اجرا کنید');
      return;
    }

    const subject = subjectResult.rows[0];
    console.log(`درس انتخابی: ${subject.name}`);
    console.log(`Subject ID: ${subject.id}\n`);

    // Find class "نهم الف"
    const classResult = await client.query(
      "SELECT id, name FROM classes WHERE name LIKE '%نهم%' AND name LIKE '%الف%' AND school_id = $1",
      [teacher.school_id]
    );

    if (classResult.rows.length === 0) {
      console.log('❌ کلاس نهم الف یافت نشد');
      return;
    }

    const classInfo = classResult.rows[0];
    console.log(`کلاس: ${classInfo.name}`);
    console.log(`Class ID: ${classInfo.id}\n`);

    // Update teacher_assignments
    const updateResult = await client.query(`
      UPDATE teacher_assignments
      SET subject_id = $1
      WHERE teacher_id = $2
        AND class_id = $3
        AND removed_at IS NULL
      RETURNING id
    `, [subject.id, teacher.id, classInfo.id]);

    if (updateResult.rowCount > 0) {
      console.log(`✅ ${updateResult.rowCount} تخصیص به‌روزرسانی شد`);
      console.log(`   معلم: ${teacher.name}`);
      console.log(`   کلاس: ${classInfo.name}`);
      console.log(`   درس: ${subject.name}`);
    } else {
      console.log('⚠️  هیچ تخصیصی یافت نشد. ایجاد تخصیص جدید...');

      const insertResult = await client.query(`
        INSERT INTO teacher_assignments (teacher_id, class_id, subject_id, assigned_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id
      `, [teacher.id, classInfo.id, subject.id]);

      console.log(`✅ تخصیص جدید ایجاد شد (ID: ${insertResult.rows[0].id})`);
    }

    await client.query('COMMIT');

    console.log('\n' + '═'.repeat(60));
    console.log('✅ تکمیل شد!');
    console.log('═'.repeat(60));
    console.log('\nحالا معلم آناهیتا شیرازی فقط درس ریاضی را برای کلاس نهم الف می‌بیند');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطا:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

assignSubject()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
