const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

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

async function testAPI() {
  const client = await pool.connect();

  try {
    const schoolResult = await client.query('SELECT id FROM schools LIMIT 1');
    const schoolId = schoolResult.rows[0].id;

    // Get lesson counts from database for existing grade levels
    const gradeLevelsResult = await client.query(
      `
      SELECT
        grade_level,
        COUNT(*) as lesson_count
      FROM lessons
      WHERE school_id = $1
      GROUP BY grade_level
    `,
      [schoolId]
    );

    // Create a map of existing lesson counts
    const lessonCountMap = {};
    gradeLevelsResult.rows.forEach((row) => {
      lessonCountMap[row.grade_level] = parseInt(row.lesson_count) || 0;
    });

    // Define ALL possible grade levels from curriculum structure
    const elementaryGrades = ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم'];
    const middleSchoolGrades = ['هفتم', 'هشتم', 'نهم'];
    const highSchoolTracks = ['مشترک', 'ریاضی', 'تجربی', 'انسانی', 'معارف', 'فنی'];
    const highSchoolGrades = ['دهم', 'یازدهم', 'دوازدهم'];

    const trackLabels = {
      'مشترک': 'دروس مشترک',
      'ریاضی': 'ریاضی و فیزیک',
      'تجربی': 'علوم تجربی',
      'انسانی': 'علوم انسانی',
      'معارف': 'معارف اسلامی',
      'فنی': 'فنی و حرفه‌ای',
    };

    const gradeLevels = {
      elementary: [],
      middleSchool: [],
      highSchool: [],
    };

    // Add all elementary grades
    elementaryGrades.forEach((grade) => {
      gradeLevels.elementary.push({
        value: grade,
        label: `پایه ${grade}`,
        lessonCount: lessonCountMap[grade] || 0
      });
    });

    // Add all middle school grades
    middleSchoolGrades.forEach((grade) => {
      gradeLevels.middleSchool.push({
        value: grade,
        label: `پایه ${grade}`,
        lessonCount: lessonCountMap[grade] || 0
      });
    });

    // Add all high school grades with all tracks
    highSchoolGrades.forEach((grade) => {
      highSchoolTracks.forEach((track) => {
        const gradeLevel = `${grade}-${track}`;
        gradeLevels.highSchool.push({
          value: gradeLevel,
          label: `${grade} - ${trackLabels[track]}`,
          lessonCount: lessonCountMap[gradeLevel] || 0
        });
      });
    });

    // Calculate total unique grade levels (from curriculum definition)
    const totalGradeLevels = elementaryGrades.length +
                             middleSchoolGrades.length +
                             (highSchoolGrades.length * highSchoolTracks.length);

    console.log('\n📊 API Simulation Results (All Curriculum Grades):\n');

    console.log('Elementary (ابتدایی):');
    gradeLevels.elementary.forEach(g => console.log(`  - ${g.label} (${g.lessonCount} درس)`));

    console.log('\nMiddle School (متوسطه اول):');
    gradeLevels.middleSchool.forEach(g => console.log(`  - ${g.label} (${g.lessonCount} درس)`));

    console.log('\nHigh School (متوسطه دوم):');
    gradeLevels.highSchool.forEach(g => console.log(`  - ${g.label} (${g.lessonCount} درس)`));

    console.log(`\n📦 Total Grade Levels: ${totalGradeLevels}`);
    console.log(`✅ Grades with lessons: ${Object.keys(lessonCountMap).length}`);
    console.log(`⚪ Grades without lessons: ${totalGradeLevels - Object.keys(lessonCountMap).length}`);

    console.log('\n📦 JSON Response:');
    console.log(JSON.stringify({ success: true, gradeLevels, total: totalGradeLevels }, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testAPI();
