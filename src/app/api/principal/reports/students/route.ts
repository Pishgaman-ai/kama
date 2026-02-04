import { NextRequest } from "next/server";
import pool from "@/lib/database";
import logger from "@/lib/logger";
import { Readable } from "stream";

// Define types for our streaming responses
interface ProgressData {
  progress: number;
  data?: unknown;
  message?: string;
  error?: string;
  complete?: boolean;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined = undefined;

  // Create a readable stream for progressive responses
  const stream = new Readable({
    read() {},
  });

  // Set up the response with proper headers for streaming
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  };

  const response = new Response(stream as unknown as BodyInit, { headers });

  const sendProgress = (progress: number, data?: unknown, message?: string) => {
    // Progress updates removed as per user request
  };

  const sendComplete = (data: unknown) => {
    const progressData: ProgressData = { progress: 100, data, complete: true };
    stream.push(`data: ${JSON.stringify(progressData)}\n\n`);
    stream.push(null); // End the stream
  };

  const sendError = (error: string) => {
    const progressData: ProgressData = { progress: 0, error, complete: true };
    stream.push(`data: ${JSON.stringify(progressData)}\n\n`);
    stream.push(null); // End the stream
  };

  try {
    // Check authentication
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      logger.logHttpRequest(
        "warn",
        "Unauthorized access attempt to student reports",
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

      sendError("غیر مجاز");
      return response;
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

      sendError("نشست نامعتبر");
      return response;
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

      sendError("دسترسی محدود به مدیر");
      return response;
    }

    const schoolId = user.school_id;

    // Get student performance data
    const client = await pool.connect();

    try {
      sendProgress(5, null, "در حال اتصال به پایگاه داده...");

      // Get all students in the school
      const studentsResult = await client.query(
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
        WHERE u.school_id = $1 AND u.role = 'student' AND u.is_active = true
        ORDER BY c.grade_level, u.name
        `,
        [schoolId]
      );

      sendProgress(10, null, `در حال بارگذاری لیست دانش‌آموزان...`);

      const totalStudents = studentsResult.rows.length;
      if (totalStudents === 0) {
        sendComplete([]);
        client.release();
        return response;
      }

      // Get detailed performance data for each student
      const studentDetails = [];

      for (let i = 0; i < studentsResult.rows.length; i++) {
        const student = studentsResult.rows[i];

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
          [student.id]
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
          [student.id]
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
          [student.id]
        );

        // Get strengths
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
          [student.id]
        );

        // Get weaknesses
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
          [student.id]
        );

        // Compile student data
        const studentData = {
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
          performanceAnalysis: "در دروس ریاضی و علوم عملکرد بهتری دارد", // This would be generated by AI
        };

        studentDetails.push(studentData);
      }

      sendProgress(95, null, "در حال نهایی‌سازی داده‌ها...");

      const responseTime = Date.now() - startTime;

      logger.logHttpRequest("info", "Student reports accessed successfully", {
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

      sendComplete(studentDetails);
      client.release();
      return response;
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    logger.error("Student reports API error", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    logger.logHttpRequest("error", "Student reports API error", {
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

    sendError("خطا در بارگذاری داده‌های گزارش دانش‌آموزان");
    return response;
  }
}
