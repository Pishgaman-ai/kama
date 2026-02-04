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

async function testSpecificCase() {
  const client = await pool.connect();

  try {
    console.log('🔍 Testing: آناهیتا شیرازی → نهم الف → باران صفری\n');
    console.log('═'.repeat(70));

    // 1. Find teacher
    const teacherResult = await client.query(
      "SELECT id, name, email, school_id FROM users WHERE name LIKE '%آناهیتا%' AND role = 'teacher'"
    );

    if (teacherResult.rows.length === 0) {
      console.log('❌ معلم "آناهیتا شیرازی" یافت نشد');
      return;
    }

    const teacher = teacherResult.rows[0];
    console.log('✅ معلم یافت شد:');
    console.log(`   نام: ${teacher.name}`);
    console.log(`   ایمیل: ${teacher.email}`);
    console.log(`   ID: ${teacher.id}`);
    console.log(`   School ID: ${teacher.school_id}`);
    console.log('');

    // 2. Find class
    const classResult = await client.query(
      "SELECT id, name, grade_level, subject FROM classes WHERE name LIKE '%نهم%' AND name LIKE '%الف%' AND school_id = $1",
      [teacher.school_id]
    );

    if (classResult.rows.length === 0) {
      console.log('❌ کلاس "نهم الف" یافت نشد');
      return;
    }

    const classInfo = classResult.rows[0];
    console.log('✅ کلاس یافت شد:');
    console.log(`   نام: ${classInfo.name}`);
    console.log(`   ID: ${classInfo.id}`);
    console.log(`   مقطع: ${classInfo.grade_level}`);
    console.log(`   درس کلاس: ${classInfo.subject || 'NULL'}`);
    console.log('');

    // 3. Find student
    const studentResult = await client.query(
      "SELECT id, name FROM users WHERE name LIKE '%باران%' AND role = 'student'"
    );

    if (studentResult.rows.length === 0) {
      console.log('❌ دانش‌آموز "باران صفری" یافت نشد');
      return;
    }

    const student = studentResult.rows[0];
    console.log('✅ دانش‌آموز یافت شد:');
    console.log(`   نام: ${student.name}`);
    console.log(`   ID: ${student.id}`);
    console.log('');

    console.log('═'.repeat(70));
    console.log('📋 بررسی تخصیص معلم به کلاس:\n');

    // 4. Check teacher assignments
    const assignmentResult = await client.query(`
      SELECT
        ta.id,
        ta.subject_id,
        ta.subject as subject_text,
        s.id as subject_table_id,
        s.name as subject_name
      FROM teacher_assignments ta
      LEFT JOIN subjects s ON ta.subject_id = s.id
      WHERE ta.teacher_id = $1 AND ta.class_id = $2 AND ta.removed_at IS NULL
    `, [teacher.id, classInfo.id]);

    if (assignmentResult.rows.length === 0) {
      console.log('❌ این معلم به این کلاس تخصیص داده نشده!');
      console.log('   نیاز به ایجاد رکورد در teacher_assignments');
      console.log('');
    } else {
      console.log(`✅ ${assignmentResult.rows.length} تخصیص یافت شد:`);
      assignmentResult.rows.forEach((a, i) => {
        console.log(`\n   تخصیص ${i+1}:`);
        console.log(`   - subject_id: ${a.subject_id || 'NULL ❌'}`);
        console.log(`   - subject_text: ${a.subject_text || 'NULL'}`);
        console.log(`   - subject_name (from table): ${a.subject_name || 'NULL ❌'}`);
      });
      console.log('');
    }

    console.log('═'.repeat(70));
    console.log('📚 بررسی دروس موجود در مدرسه:\n');

    // 5. Get all subjects in school
    const subjectsResult = await client.query(
      'SELECT id, name, grade_level FROM subjects WHERE school_id = $1 ORDER BY name',
      [teacher.school_id]
    );

    console.log(`✅ ${subjectsResult.rows.length} درس در مدرسه:`);
    subjectsResult.rows.forEach((s, i) => {
      console.log(`   ${i+1}. ${s.name} (مقطع: ${s.grade_level || 'نامشخص'})`);
    });
    console.log('');

    console.log('═'.repeat(70));
    console.log('🔬 شبیه‌سازی API (وضعیت فعلی):\n');

    // 6. Simulate current API call
    const apiSimResult = await client.query(`
      SELECT DISTINCT
        s.id,
        s.name,
        s.code,
        s.description,
        s.grade_level,
        s.created_at
      FROM teacher_assignments ta
      JOIN subjects s ON ta.subject_id = s.id
      WHERE ta.teacher_id = $1
        AND ta.class_id = $2
        AND ta.removed_at IS NULL
      ORDER BY s.grade_level, s.name
    `, [teacher.id, classInfo.id]);

    console.log('API Response (با class_id):');
    if (apiSimResult.rows.length === 0) {
      console.log('   ❌ هیچ درسی برنمی‌گردد (subject_id = NULL است)');
      console.log('   → Fallback به تمام دروس مدرسه می‌رود');
      console.log('');
      console.log('Fallback Response:');
      subjectsResult.rows.forEach((s, i) => {
        console.log(`   ${i+1}. ${s.name}`);
      });
    } else {
      console.log('   ✅ دروس برگشتی:');
      apiSimResult.rows.forEach((s, i) => {
        console.log(`   ${i+1}. ${s.name}`);
      });
    }
    console.log('');

    console.log('═'.repeat(70));
    console.log('💡 راه‌حل:\n');

    if (assignmentResult.rows.length === 0) {
      console.log('❌ معلم به کلاس تخصیص داده نشده است');
      console.log('   باید رکورد teacher_assignments ایجاد شود');
    } else if (!assignmentResult.rows[0].subject_id) {
      console.log('⚠️  معلم به کلاس تخصیص دارد اما subject_id تنظیم نشده');
      console.log('');
      console.log('گزینه 1: تنظیم subject_id به صورت دستی');
      console.log(`   UPDATE teacher_assignments`);
      console.log(`   SET subject_id = '<subject_id>'`);
      console.log(`   WHERE teacher_id = '${teacher.id}'`);
      console.log(`     AND class_id = '${classInfo.id}';`);
      console.log('');
      console.log('گزینه 2: معلم از fallback استفاده می‌کند و می‌تواند هر درسی را انتخاب کند');
      console.log(`   (${subjectsResult.rows.length} درس در دسترس است)`);
    } else {
      console.log('✅ subject_id تنظیم شده است');
      console.log(`   معلم می‌تواند درس "${assignmentResult.rows[0].subject_name}" را برای این کلاس ثبت کند`);
    }

  } catch (error) {
    console.error('❌ خطا:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testSpecificCase()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
