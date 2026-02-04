import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import logger from "@/lib/logger";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  let userId: string | undefined = undefined;

  try {
    // Check authentication
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      logger.logHttpRequest(
        "warn",
        "Unauthorized access attempt to student report",
        {
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "",
          userAgent: request.headers.get("user-agent") || "",
          url: request.url,
          method: request.method,
          statusCode: 401,
          responseTime: Date.now() - startTime,
        }
      );

      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    // Parse session cookie with error handling
    let user;
    try {
      user = JSON.parse(sessionCookie.value);
      userId = user.id;
    } catch (parseError) {
      logger.error("Session cookie parse error", { error: parseError });

      logger.logHttpRequest("error", "Invalid session cookie", {
        userId,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "",
        userAgent: request.headers.get("user-agent") || "",
        url: request.url,
        method: request.method,
        statusCode: 401,
        responseTime: Date.now() - startTime,
      });

      return NextResponse.json({ error: "نشست نامعتبر" }, { status: 401 });
    }

    if (user.role !== "principal") {
      logger.logHttpRequest("warn", "Access denied - user not a principal", {
        userId,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "",
        userAgent: request.headers.get("user-agent") || "",
        url: request.url,
        method: request.method,
        statusCode: 403,
        responseTime: Date.now() - startTime,
      });

      return NextResponse.json(
        { error: "دسترسی محدود به مدیر" },
        { status: 403 }
      );
    }

    // Resolve params promise to get studentId
    const { id: studentId } = await context.params;

    // Get student performance data
    const client = await pool.connect();

    try {
      // Get student info
      const studentResult = await client.query(
        `
        SELECT 
          u.id,
          u.name,
          u.national_id,
          c.name as class_name,
          c.grade_level
        FROM users u
        LEFT JOIN class_memberships cm ON u.id = cm.user_id AND cm.role = 'student'
        LEFT JOIN classes c ON cm.class_id = c.id
        WHERE u.id = $1 AND u.school_id = $2 AND u.role = 'student' AND u.is_active = true
        `,
        [studentId, user.school_id]
      );

      if (studentResult.rows.length === 0) {
        return NextResponse.json(
          { error: "دانش‌آموز یافت نشد" },
          { status: 404 }
        );
      }

      const student = studentResult.rows[0];

      // Get subject scores
      const subjectScoresResult = await client.query(
        `
        SELECT 
          s.name as subject,
          AVG(eg.percentage) as average_score,
          COUNT(eg.id) as exam_count,
          MAX(eg.created_at) as last_exam_date
        FROM exam_grades eg
        JOIN exams e ON eg.exam_id = e.id
        JOIN subjects s ON e.subject_id = s.id
        WHERE eg.student_id = $1 AND eg.percentage IS NOT NULL
        GROUP BY s.name
        ORDER BY average_score DESC
        `,
        [studentId]
      );

      // Get overall metrics
      const metricsResult = await client.query(
        `
        SELECT 
          AVG(percentage) as overall_average,
          COUNT(*) as total_exams,
          MIN(percentage) as lowest_score,
          MAX(percentage) as highest_score
        FROM exam_grades
        WHERE student_id = $1 AND percentage IS NOT NULL
        `,
        [studentId]
      );

      // Get progress trend
      const trendResult = await client.query(
        `
        SELECT 
          DATE_TRUNC('month', eg.created_at) as month,
          AVG(eg.percentage) as average_score
        FROM exam_grades eg
        WHERE eg.student_id = $1 AND eg.percentage IS NOT NULL
        GROUP BY DATE_TRUNC('month', eg.created_at)
        ORDER BY month
        `,
        [studentId]
      );

      // Get strengths and weaknesses
      const strengthsResult = await client.query(
        `
        SELECT 
          s.name as subject,
          AVG(eg.percentage) as average_score
        FROM exam_grades eg
        JOIN exams e ON eg.exam_id = e.id
        JOIN subjects s ON e.subject_id = s.id
        WHERE eg.student_id = $1 AND eg.percentage IS NOT NULL
        GROUP BY s.name
        ORDER BY average_score DESC
        LIMIT 3
        `,
        [studentId]
      );

      const weaknessesResult = await client.query(
        `
        SELECT 
          s.name as subject,
          AVG(eg.percentage) as average_score
        FROM exam_grades eg
        JOIN exams e ON eg.exam_id = e.id
        JOIN subjects s ON e.subject_id = s.id
        WHERE eg.student_id = $1 AND eg.percentage IS NOT NULL
        GROUP BY s.name
        ORDER BY average_score ASC
        LIMIT 3
        `,
        [studentId]
      );

      // Generate performance analysis (in a real implementation, this might come from AI)
      const performanceAnalysis = "در دروس ریاضی و علوم عملکرد بهتری دارد";

      const studentReportData = {
        id: student.id,
        name: student.name,
        nationalId: student.national_id,
        className: student.class_name,
        gradeLevel: student.grade_level,
        subjectScores: subjectScoresResult.rows.map((row) => ({
          subject: row.subject,
          averageScore: parseFloat(row.average_score || "0").toFixed(2),
          examCount: parseInt(row.exam_count || "0"),
          lastExamDate: row.last_exam_date,
        })),
        metrics: {
          overallAverage: metricsResult.rows[0]?.overall_average
            ? parseFloat(metricsResult.rows[0].overall_average).toFixed(2)
            : "0.00",
          totalExams: parseInt(metricsResult.rows[0]?.total_exams || "0"),
          lowestScore: metricsResult.rows[0]?.lowest_score
            ? parseFloat(metricsResult.rows[0].lowest_score).toFixed(2)
            : "0.00",
          highestScore: metricsResult.rows[0]?.highest_score
            ? parseFloat(metricsResult.rows[0].highest_score).toFixed(2)
            : "0.00",
          progressPercentage: "0.00", // This would need to be calculated based on previous periods
        },
        progressTrend: trendResult.rows.map((row) => ({
          month: row.month,
          averageScore: parseFloat(row.average_score || "0").toFixed(2),
        })),
        strengths: strengthsResult.rows.map((row) => ({
          subject: row.subject,
          averageScore: parseFloat(row.average_score || "0").toFixed(2),
        })),
        weaknesses: weaknessesResult.rows.map((row) => ({
          subject: row.subject,
          averageScore: parseFloat(row.average_score || "0").toFixed(2),
        })),
        performanceAnalysis,
      };

      const responseTime = Date.now() - startTime;

      logger.logHttpRequest("info", "Student report accessed successfully", {
        userId,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "",
        userAgent: request.headers.get("user-agent") || "",
        url: request.url,
        method: request.method,
        statusCode: 200,
        responseTime,
      });

      return NextResponse.json({
        success: true,
        data: studentReportData,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Student report API error", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    logger.logHttpRequest("error", "Student report API error", {
      userId,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "",
      userAgent: request.headers.get("user-agent") || "",
      url: request.url,
      method: request.method,
      statusCode: 500,
      responseTime: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: "خطا در بارگذاری داده‌های گزارش دانش‌آموز" },
      { status: 500 }
    );
  }
}
