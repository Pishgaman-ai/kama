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

async function findTeacherSubjectInfo() {
  const client = await pool.connect();

  try {
    console.log('🔍 جستجوی اطلاعات درسی آناهیتا شیرازی\n');

    // Find teacher
    const teacherResult = await client.query(
      "SELECT id, name, email, school_id FROM users WHERE name LIKE '%آناهیتا%' AND role = 'teacher'"
    );

    if (teacherResult.rows.length === 0) {
      console.log('❌ معلم یافت نشد');
      return;
    }

    const teacher = teacherResult.rows[0];
    console.log(`معلم: ${teacher.name} (${teacher.email})\n`);

    // Check if there's any info in users table about subject
    const userInfo = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [teacher.id]
    );

    console.log('📋 اطلاعات کامل معلم در جدول users:');
    console.log(JSON.stringify(userInfo.rows[0], null, 2));
    console.log('');

    // Check activities to see what subjects they've taught before
    const activitiesResult = await client.query(`
      SELECT DISTINCT
        a.subject_id,
        s.name as subject_name,
        COUNT(*) as activity_count
      FROM activities a
      LEFT JOIN subjects s ON a.subject_id = s.id
      WHERE a.teacher_id = $1
      GROUP BY a.subject_id, s.name
      ORDER BY activity_count DESC
    `, [teacher.id]);

    console.log('📚 فعالیت‌های ثبت شده قبلی (برای تشخیص درس):');
    if (activitiesResult.rows.length > 0) {
      activitiesResult.rows.forEach((row, i) => {
        console.log(`${i+1}. ${row.subject_name || 'نامشخص'} - ${row.activity_count} فعالیت`);
        console.log(`   subject_id: ${row.subject_id || 'NULL'}`);
      });
    } else {
      console.log('   ❌ هیچ فعالیتی ثبت نشده');
    }
    console.log('');

    // Check class_memberships for any subject info
    const membershipsResult = await client.query(`
      SELECT
        c.name as class_name,
        c.subject as class_subject,
        cm.joined_at
      FROM class_memberships cm
      JOIN classes c ON cm.class_id = c.id
      WHERE cm.user_id = $1 AND cm.role = 'teacher'
      ORDER BY cm.joined_at DESC
    `, [teacher.id]);

    console.log('🏫 کلاس‌های معلم (از class_memberships):');
    if (membershipsResult.rows.length > 0) {
      membershipsResult.rows.forEach((row, i) => {
        console.log(`${i+1}. ${row.class_name}`);
        console.log(`   موضوع کلاس: ${row.class_subject || 'نامشخص'}`);
      });
    } else {
      console.log('   ❌ اطلاعاتی یافت نشد');
    }
    console.log('');

    // Check teacher_assignments
    const assignmentsResult = await client.query(`
      SELECT
        c.name as class_name,
        ta.subject as subject_text,
        ta.subject_id,
        ta.assigned_at
      FROM teacher_assignments ta
      JOIN classes c ON ta.class_id = c.id
      WHERE ta.teacher_id = $1 AND ta.removed_at IS NULL
      ORDER BY ta.assigned_at DESC
    `, [teacher.id]);

    console.log('📝 تخصیص‌های معلم (از teacher_assignments):');
    if (assignmentsResult.rows.length > 0) {
      assignmentsResult.rows.forEach((row, i) => {
        console.log(`${i+1}. ${row.class_name}`);
        console.log(`   subject_text: ${row.subject_text || 'NULL'}`);
        console.log(`   subject_id: ${row.subject_id || 'NULL'}`);
      });
    } else {
      console.log('   ❌ اطلاعاتی یافت نشد');
    }
    console.log('');

    console.log('═'.repeat(70));
    console.log('💡 نتیجه‌گیری:');
    console.log('');

    // Suggest based on activities
    if (activitiesResult.rows.length > 0 && activitiesResult.rows[0].subject_name) {
      const mostCommon = activitiesResult.rows[0];
      console.log(`✅ بر اساس فعالیت‌های قبلی، این معلم احتمالاً معلم "${mostCommon.subject_name}" است`);
      console.log(`   (${mostCommon.activity_count} فعالیت ثبت شده)`);
      console.log('');

      // Get the subject_id
      const subjectResult = await client.query(
        'SELECT id, name FROM subjects WHERE school_id = $1 AND name = $2',
        [teacher.school_id, mostCommon.subject_name]
      );

      if (subjectResult.rows.length > 0) {
        const subject = subjectResult.rows[0];
        console.log('📌 پیشنهاد: اجرای دستور زیر برای تنظیم subject_id:');
        console.log('');
        console.log(`UPDATE teacher_assignments`);
        console.log(`SET subject_id = '${subject.id}'`);
        console.log(`WHERE teacher_id = '${teacher.id}'`);
        console.log(`  AND removed_at IS NULL;`);
      }
    } else {
      console.log('⚠️  اطلاعات کافی برای تشخیص درس معلم وجود ندارد');
      console.log('   نیاز به ورود دستی توسط مدیر مدرسه');
    }

  } catch (error) {
    console.error('❌ خطا:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

findTeacherSubjectInfo()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
