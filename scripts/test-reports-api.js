const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Javad1378@localhost:5432/school_management'
});

async function testReportsAPI() {
  const client = await pool.connect();

  try {
    console.log('Testing reports API queries...\n');

    // Get a school_id from database
    const schoolResult = await client.query('SELECT id FROM schools LIMIT 1');
    if (schoolResult.rows.length === 0) {
      console.log('No schools found in database');
      return;
    }

    const schoolId = schoolResult.rows[0].id;
    console.log('Using school_id:', schoolId);
    console.log('\n--- Testing Basic Stats ---');

    try {
      const statsResult = await client.query(
        `
        SELECT
          COUNT(DISTINCT CASE WHEN role = 'teacher' AND is_active = true THEN id END) as total_teachers,
          COUNT(DISTINCT CASE WHEN role = 'student' AND is_active = true THEN id END) as total_students,
          COUNT(DISTINCT CASE WHEN role = 'parent' AND is_active = true THEN id END) as total_parents,
          (SELECT COUNT(*) FROM classes WHERE school_id = $1) as total_classes,
          (SELECT COUNT(*) FROM educational_activities ea
           JOIN classes c ON ea.class_id = c.id
           WHERE c.school_id = $1) as total_exams
        FROM users
        WHERE school_id = $1
        `,
        [schoolId]
      );
      console.log('Basic Stats:', statsResult.rows[0]);
    } catch (error) {
      console.error('Error in Basic Stats query:', error.message);
    }

    console.log('\n--- Testing Subject Performance ---');
    try {
      const subjectScoresResult = await client.query(
        `
        SELECT
          l.name as subject_name,
          AVG(ea.quantitative_score) as average_score,
          COUNT(ea.id) as exam_count
        FROM educational_activities ea
        JOIN lessons l ON ea.subject_id = l.id
        JOIN classes c ON ea.class_id = c.id
        WHERE c.school_id = $1 AND ea.quantitative_score IS NOT NULL
        GROUP BY l.name
        ORDER BY average_score DESC
        `,
        [schoolId]
      );
      console.log('Subject Performance:', subjectScoresResult.rows);
    } catch (error) {
      console.error('Error in Subject Performance query:', error.message);
    }

    console.log('\n--- Testing Pass/Fail Rates ---');
    try {
      const passFailResult = await client.query(
        `
        SELECT
          COUNT(CASE WHEN quantitative_score >= 10 THEN 1 END) as passed_count,
          COUNT(CASE WHEN quantitative_score < 10 THEN 1 END) as failed_count,
          COUNT(*) as total_grades
        FROM educational_activities ea
        JOIN classes c ON ea.class_id = c.id
        WHERE c.school_id = $1 AND ea.quantitative_score IS NOT NULL
        `,
        [schoolId]
      );
      console.log('Pass/Fail Rates:', passFailResult.rows[0]);
    } catch (error) {
      console.error('Error in Pass/Fail Rates query:', error.message);
    }

    console.log('\n--- Testing Grade Level Performance ---');
    try {
      const gradeLevelResult = await client.query(
        `
        SELECT
          c.grade_level,
          AVG(ea.quantitative_score) as average_score,
          COUNT(ea.id) as grade_count
        FROM educational_activities ea
        JOIN classes c ON ea.class_id = c.id
        WHERE c.school_id = $1 AND ea.quantitative_score IS NOT NULL AND c.grade_level IS NOT NULL
        GROUP BY c.grade_level
        ORDER BY c.grade_level
        `,
        [schoolId]
      );
      console.log('Grade Level Performance:', gradeLevelResult.rows);
    } catch (error) {
      console.error('Error in Grade Level Performance query:', error.message);
    }

    console.log('\n--- Testing Class Comparison ---');
    try {
      const classResult = await client.query(
        `
        SELECT
          CASE
            WHEN c.section IS NOT NULL THEN c.name || '-' || c.section
            ELSE c.name
          END as class_name,
          c.grade_level,
          AVG(ea.quantitative_score) as average_score,
          COUNT(DISTINCT ea.student_id) as student_count
        FROM classes c
        LEFT JOIN educational_activities ea ON c.id = ea.class_id
        WHERE c.school_id = $1 AND ea.quantitative_score IS NOT NULL
        GROUP BY c.id, c.name, c.section, c.grade_level
        ORDER BY c.grade_level, average_score DESC
        `,
        [schoolId]
      );
      console.log('Class Comparison:', classResult.rows);
    } catch (error) {
      console.error('Error in Class Comparison query:', error.message);
    }

    console.log('\n--- Testing Teacher Performance ---');
    try {
      const teacherResult = await client.query(
        `
        SELECT
          u.name as teacher_name,
          COUNT(DISTINCT ea.id) as activities_created,
          COUNT(DISTINCT ea.student_id) as students_taught,
          AVG(ea.quantitative_score) as average_student_score
        FROM users u
        LEFT JOIN educational_activities ea ON u.id = ea.teacher_id
        WHERE u.school_id = $1 AND u.role = 'teacher' AND u.is_active = true
        GROUP BY u.id, u.name
        ORDER BY average_student_score DESC NULLS LAST
        `,
        [schoolId]
      );
      console.log('Teacher Performance:', teacherResult.rows);
    } catch (error) {
      console.error('Error in Teacher Performance query:', error.message);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

testReportsAPI().catch(console.error);
