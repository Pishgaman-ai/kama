import pool from "@/lib/database";

// School-wide statistics
export async function getSchoolStatistics(schoolId: string) {
  const client = await pool.connect();

  try {
    // Basic counts
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

    // Average scores by subject (lesson)
    const subjectScoresResult = await client.query(
      `
      SELECT
        l.title as subject_name,
        AVG(ea.quantitative_score) as average_score,
        COUNT(ea.id) as exam_count
      FROM educational_activities ea
      JOIN lessons l ON ea.subject_id = l.id
      JOIN classes c ON ea.class_id = c.id
      WHERE c.school_id = $1 AND ea.quantitative_score IS NOT NULL
      GROUP BY l.id, l.title
      ORDER BY average_score DESC
      `,
      [schoolId]
    );

    // Passing rate and failure rate (assuming 10 is passing grade)
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

    // Grade level performance
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

    return {
      basicStats: {
        totalClasses: parseInt(statsResult.rows[0]?.total_classes || "0"),
        totalTeachers: parseInt(statsResult.rows[0]?.total_teachers || "0"),
        totalStudents: parseInt(statsResult.rows[0]?.total_students || "0"),
        totalParents: parseInt(statsResult.rows[0]?.total_parents || "0"),
        totalExams: parseInt(statsResult.rows[0]?.total_exams || "0"),
      },
      subjectPerformance: subjectScoresResult.rows.map((row) => ({
        subject: row.subject_name,
        averageScore: parseFloat(row.average_score || "0").toFixed(2),
        examCount: parseInt(row.exam_count || "0"),
      })),
      passFailRates: {
        passed: parseInt(passFailResult.rows[0]?.passed_count || "0"),
        failed: parseInt(passFailResult.rows[0]?.failed_count || "0"),
        total: parseInt(passFailResult.rows[0]?.total_grades || "0"),
        passRate: passFailResult.rows[0]?.total_grades
          ? (
              (parseInt(passFailResult.rows[0]?.passed_count || "0") /
                parseInt(passFailResult.rows[0]?.total_grades || "1")) *
              100
            ).toFixed(2)
          : "0.00",
        failRate: passFailResult.rows[0]?.total_grades
          ? (
              (parseInt(passFailResult.rows[0]?.failed_count || "0") /
                parseInt(passFailResult.rows[0]?.total_grades || "1")) *
              100
            ).toFixed(2)
          : "0.00",
      },
      gradeLevelPerformance: gradeLevelResult.rows.map((row) => ({
        gradeLevel: row.grade_level,
        averageScore: parseFloat(row.average_score || "0").toFixed(2),
        count: parseInt(row.grade_count || "0"),
      })),
    };
  } finally {
    client.release();
  }
}

// Class comparison data
export async function getClassComparisonData(schoolId: string) {
  const client = await pool.connect();

  try {
    const result = await client.query(
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

    return result.rows.map((row) => ({
      className: row.class_name,
      gradeLevel: row.grade_level,
      averageScore: parseFloat(row.average_score || "0").toFixed(2),
      studentCount: parseInt(row.student_count || "0"),
    }));
  } finally {
    client.release();
  }
}

// Teacher performance data
export async function getTeacherPerformanceData(schoolId: string) {
  const client = await pool.connect();

  try {
    const result = await client.query(
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

    return result.rows.map((row) => ({
      teacherName: row.teacher_name,
      activitiesCreated: parseInt(row.activities_created || "0"),
      studentsTaught: parseInt(row.students_taught || "0"),
      averageStudentScore: row.average_student_score
        ? parseFloat(row.average_student_score).toFixed(2)
        : "0.00",
    }));
  } finally {
    client.release();
  }
}

// AI performance data
export async function getAiPerformanceData(schoolId: string) {
  const client = await pool.connect();

  try {
    // Average processing time
    const processingTimeResult = await client.query(
      `
      SELECT 
        AVG(processing_time_ms) as avg_processing_time,
        COUNT(*) as total_processed
      FROM ai_logs al
      JOIN answers a ON al.answer_id = a.id
      JOIN exams e ON a.exam_id = e.id
      JOIN classes c ON e.class_id = c.id
      WHERE c.school_id = $1 AND al.success = true
      `,
      [schoolId]
    );

    // Accuracy comparison
    const accuracyResult = await client.query(
      `
      SELECT 
        AVG(ABS(a.ai_score - a.final_score)) as avg_score_difference,
        COUNT(*) as total_comparisons,
        AVG(CASE WHEN ABS(a.ai_score - a.final_score) <= 2 THEN 1 ELSE 0 END) as accuracy_rate
      FROM answers a
      JOIN exams e ON a.exam_id = e.id
      JOIN classes c ON e.class_id = c.id
      WHERE c.school_id = $1 AND a.ai_score IS NOT NULL AND a.final_score IS NOT NULL
      `,
      [schoolId]
    );

    return {
      processingStats: {
        averageProcessingTime: parseFloat(
          processingTimeResult.rows[0]?.avg_processing_time || "0"
        ).toFixed(2),
        totalProcessed: parseInt(
          processingTimeResult.rows[0]?.total_processed || "0"
        ),
      },
      accuracyStats: {
        averageScoreDifference: parseFloat(
          accuracyResult.rows[0]?.avg_score_difference || "0"
        ).toFixed(2),
        totalComparisons: parseInt(
          accuracyResult.rows[0]?.total_comparisons || "0"
        ),
        accuracyRate: (
          parseFloat(accuracyResult.rows[0]?.accuracy_rate || "0") * 100
        ).toFixed(2),
      },
    };
  } finally {
    client.release();
  }
}
