const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

async function testQuery() {
  try {
    console.log("🔍 Testing teacher students query...\n");

    // ابتدا یک معلم پیدا کنیم که دانش‌آموز دارد
    const teacherResult = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.school_id
      FROM users u
      INNER JOIN class_memberships cm ON cm.user_id = u.id AND cm.role = 'teacher'
      WHERE u.role = 'teacher' AND u.is_active = true
      LIMIT 1
    `);

    if (teacherResult.rows.length === 0) {
      console.log("❌ No teacher found in database");
      process.exit(1);
    }

    const teacher = teacherResult.rows[0];
    console.log(`✅ Found teacher: ${teacher.name} (ID: ${teacher.id})`);
    console.log(`   School ID: ${teacher.school_id}\n`);

    // Query جدید با EXISTS
    console.log("📝 Testing new query with EXISTS clause:\n");
    const newQuery = `
      SELECT DISTINCT
        u.id,
        u.name,
        u.national_id,
        c.id as class_id,
        c.name as class_name,
        c.grade_level,
        ta.subject_id,
        COALESCE(l.title, ta.subject, c.subject) as subject_name
      FROM users u
      INNER JOIN class_memberships cm_student ON u.id = cm_student.user_id AND cm_student.role = 'student'
      INNER JOIN classes c ON cm_student.class_id = c.id
      LEFT JOIN teacher_assignments ta ON ta.class_id = c.id AND ta.teacher_id = $1 AND ta.removed_at IS NULL
      LEFT JOIN lessons l ON ta.subject_id = l.id
      WHERE u.role = 'student'
        AND u.school_id = $2
        AND u.is_active = true
        AND EXISTS (
          SELECT 1 FROM class_memberships cm_teacher
          WHERE cm_teacher.class_id = c.id
            AND cm_teacher.user_id = $1
            AND cm_teacher.role = 'teacher'
          UNION
          SELECT 1 FROM teacher_assignments ta2
          WHERE ta2.class_id = c.id
            AND ta2.teacher_id = $1
            AND ta2.removed_at IS NULL
        )
      ORDER BY u.name
    `;

    const newResult = await pool.query(newQuery, [teacher.id, teacher.school_id]);
    console.log(`✅ New query returned ${newResult.rows.length} students\n`);

    if (newResult.rows.length > 0) {
      console.log("Students found:");
      newResult.rows.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.name} (Class: ${student.class_name}, Subject: ${student.subject_name || 'N/A'})`);
      });
      console.log("");
    } else {
      console.log("⚠️  No students found with new query\n");

      // بررسی کنیم که آیا اصلاً دانش‌آموزی در مدرسه وجود دارد
      const allStudents = await pool.query(`
        SELECT COUNT(*) as count
        FROM users u
        WHERE u.role = 'student' AND u.school_id = $1 AND u.is_active = true
      `, [teacher.school_id]);
      console.log(`📊 Total active students in school: ${allStudents.rows[0].count}`);

      // بررسی class_memberships
      const classMemberships = await pool.query(`
        SELECT COUNT(DISTINCT cm.user_id) as student_count
        FROM class_memberships cm
        INNER JOIN users u ON cm.user_id = u.id
        WHERE cm.role = 'student' AND u.school_id = $1
      `, [teacher.school_id]);
      console.log(`📊 Students in class_memberships: ${classMemberships.rows[0].student_count}`);

      // بررسی teacher's classes
      const teacherClasses = await pool.query(`
        SELECT DISTINCT c.id, c.name
        FROM classes c
        INNER JOIN class_memberships cm ON cm.class_id = c.id
        WHERE cm.user_id = $1 AND cm.role = 'teacher'
      `, [teacher.id]);
      console.log(`📊 Teacher's classes: ${teacherClasses.rows.length}`);
      if (teacherClasses.rows.length > 0) {
        teacherClasses.rows.forEach((cls, idx) => {
          console.log(`  ${idx + 1}. ${cls.name} (ID: ${cls.id})`);
        });
      }
    }

    // تست الگوریتم matching
    console.log("\n🔍 Testing name matching algorithm:");
    const testNames = ["آتنا احمدی", "آتنا", "احمدی"];

    if (newResult.rows.length > 0) {
      testNames.forEach(testName => {
        const match = findMatchingStudent(testName, newResult.rows);
        if (match) {
          console.log(`  ✅ "${testName}" → Found: ${match.name}`);
        } else {
          console.log(`  ❌ "${testName}" → Not found`);
        }
      });
    }

    await pool.end();
    console.log("\n✅ Test completed");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

function findMatchingStudent(searchName, students) {
  if (!searchName || !students || students.length === 0) {
    return null;
  }

  const normalizedSearch = searchName.trim().toLowerCase();

  // جستجوی دقیق - نام کامل
  let match = students.find((s) => s.name.toLowerCase() === normalizedSearch);
  if (match) return { id: match.id, name: match.name };

  // جستجوی با فاصله‌های اضافی
  match = students.find(
    (s) =>
      s.name.toLowerCase().replace(/\s+/g, " ") ===
      normalizedSearch.replace(/\s+/g, " ")
  );
  if (match) return { id: match.id, name: match.name };

  // جستجوی نام یا نام خانوادگی
  const searchParts = normalizedSearch.split(/\s+/);
  match = students.find((s) => {
    const nameParts = s.name.toLowerCase().split(/\s+/);
    return searchParts.every((part) => nameParts.some((np) => np.includes(part)));
  });
  if (match) return { id: match.id, name: match.name };

  // جستجوی با شباهت بالا (حداقل 70% مشترک)
  const bestMatch = students
    .map((s) => {
      const nameLower = s.name.toLowerCase();
      const matchCount = searchParts.filter((part) => nameLower.includes(part))
        .length;
      const similarity = matchCount / searchParts.length;
      return { student: s, similarity };
    })
    .filter((item) => item.similarity >= 0.7)
    .sort((a, b) => b.similarity - a.similarity)[0];

  if (bestMatch) {
    return { id: bestMatch.student.id, name: bestMatch.student.name };
  }

  return null;
}

testQuery();
