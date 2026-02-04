const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

async function checkAssignments() {
  const client = await pool.connect();
  try {
    // Find نهم الف class
    const classResult = await client.query(
      "SELECT id, name, school_id FROM classes WHERE name LIKE '%نهم%' AND name LIKE '%الف%' LIMIT 1"
    );

    if (classResult.rows.length > 0) {
      const cls = classResult.rows[0];
      console.log('کلاس:', cls.name);
      console.log('ID:', cls.id);
      console.log('School ID:', cls.school_id);
      console.log('');

      // Check teacher assignments
      const assignments = await client.query(
        `SELECT
          ta.id,
          ta.teacher_id,
          ta.subject_id,
          ta.assigned_at,
          ta.removed_at,
          u.name as teacher_name,
          s.name as subject_name
        FROM teacher_assignments ta
        LEFT JOIN users u ON ta.teacher_id = u.id
        LEFT JOIN subjects s ON ta.subject_id = s.id
        WHERE ta.class_id = $1
        ORDER BY ta.removed_at NULLS FIRST, ta.assigned_at DESC`,
        [cls.id]
      );

      console.log('📋 تخصیص‌ها:');
      if (assignments.rows.length === 0) {
        console.log('  ❌ هیچ تخصیصی وجود ندارد!');
      } else {
        const active = assignments.rows.filter(a => !a.removed_at);
        const removed = assignments.rows.filter(a => a.removed_at);

        console.log(`  تعداد کل: ${assignments.rows.length}`);
        console.log(`  فعال: ${active.length}`);
        console.log(`  حذف شده: ${removed.length}`);
        console.log('');

        if (active.length > 0) {
          console.log('تخصیص‌های فعال:');
          active.forEach((a, i) => {
            console.log(`  ${i+1}. ${a.teacher_name} → ${a.subject_name || 'NULL'}`);
            console.log(`     teacher_id: ${a.teacher_id}`);
            console.log(`     subject_id: ${a.subject_id || 'NULL'}`);
            console.log(`     assigned_at: ${a.assigned_at}`);
          });
        }

        if (removed.length > 0) {
          console.log('');
          console.log('تخصیص‌های حذف شده:');
          removed.forEach((a, i) => {
            console.log(`  ${i+1}. ${a.teacher_name} → ${a.subject_name || 'NULL'}`);
            console.log(`     removed_at: ${a.removed_at}`);
          });
        }
      }

      console.log('');
      console.log('═'.repeat(60));
      console.log('بررسی دروس موجود در مدرسه:');
      console.log('');

      const subjects = await client.query(
        'SELECT id, name FROM subjects WHERE school_id = $1 ORDER BY name',
        [cls.school_id]
      );

      console.log(`${subjects.rows.length} درس موجود:`);
      subjects.rows.forEach((s, i) => {
        console.log(`  ${i+1}. ${s.name} (ID: ${s.id})`);
      });
    } else {
      console.log('❌ کلاس نهم الف یافت نشد');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

checkAssignments()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
