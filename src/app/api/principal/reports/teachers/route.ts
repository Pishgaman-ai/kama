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
        "Unauthorized access attempt to teacher reports",
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

    // Get teacher performance data
    const client = await pool.connect();

    try {
      sendProgress(5, null, "در حال اتصال به پایگاه داده...");

      // Get all teachers in the school with their activities
      const teachersResult = await client.query(
        `
        SELECT
          u.id,
          u.name,
          COUNT(DISTINCT ea.id) as activities_created,
          COUNT(DISTINCT ea.student_id) as students_taught,
          AVG(ea.quantitative_score) as average_score
        FROM users u
        LEFT JOIN educational_activities ea ON u.id = ea.teacher_id
        WHERE u.school_id = $1 AND u.role = 'teacher' AND u.is_active = true
        GROUP BY u.id, u.name
        ORDER BY u.name
        `,
        [schoolId]
      );

      sendProgress(10, null, "در حال بارگذاری لیست معلمان...");

      const totalTeachers = teachersResult.rows.length;
      if (totalTeachers === 0) {
        sendComplete([]);
        client.release();
        return response;
      }

      // Get detailed performance data for each teacher
      const teacherDetails = [];

      // Send initial progress
      sendProgress(10, null, "در حال بارگذاری اطلاعات معلمان...");

      for (let i = 0; i < teachersResult.rows.length; i++) {
        const teacher = teachersResult.rows[i];

        // Get performance by grade level
        const gradePerformanceResult = await client.query(
          `
          SELECT
            c.grade_level,
            COUNT(DISTINCT ea.id) as activity_count,
            AVG(ea.quantitative_score) as average_score,
            COUNT(DISTINCT ea.student_id) as student_count
          FROM educational_activities ea
          JOIN classes c ON ea.class_id = c.id
          WHERE ea.teacher_id = $1 AND ea.quantitative_score IS NOT NULL AND c.grade_level IS NOT NULL
          GROUP BY c.grade_level
          ORDER BY c.grade_level
          `,
          [teacher.id]
        );

        // Get performance by subject/lesson
        const subjectPerformanceResult = await client.query(
          `
          SELECT
            l.title as subject_name,
            COUNT(DISTINCT ea.id) as activity_count,
            AVG(ea.quantitative_score) as average_score,
            COUNT(DISTINCT ea.student_id) as student_count
          FROM educational_activities ea
          JOIN lessons l ON ea.subject_id = l.id
          WHERE ea.teacher_id = $1 AND ea.quantitative_score IS NOT NULL
          GROUP BY l.id, l.title
          ORDER BY activity_count DESC
          `,
          [teacher.id]
        );

        // Get monthly trend
        const trendResult = await client.query(
          `
          SELECT
            DATE_TRUNC('month', ea.activity_date) as month,
            AVG(ea.quantitative_score) as average_score,
            COUNT(ea.id) as activity_count
          FROM educational_activities ea
          WHERE ea.teacher_id = $1 AND ea.quantitative_score IS NOT NULL
          GROUP BY DATE_TRUNC('month', ea.activity_date)
          ORDER BY month DESC
          LIMIT 6
          `,
          [teacher.id]
        );

        // Get recent activities
        const recentActivitiesResult = await client.query(
          `
          SELECT
            ea.activity_title,
            ea.activity_date,
            ea.activity_type,
            l.title as subject_name,
            c.name as class_name,
            c.section,
            AVG(ea.quantitative_score) as average_score,
            COUNT(DISTINCT ea.student_id) as participants
          FROM educational_activities ea
          JOIN lessons l ON ea.subject_id = l.id
          JOIN classes c ON ea.class_id = c.id
          WHERE ea.teacher_id = $1
          GROUP BY ea.activity_title, ea.activity_date, ea.activity_type, l.title, c.name, c.section
          ORDER BY ea.activity_date DESC
          LIMIT 5
          `,
          [teacher.id]
        );

        teacherDetails.push({
          id: teacher.id,
          name: teacher.name,
          activitiesCreated: parseInt(teacher.activities_created || "0"),
          studentsTaught: parseInt(teacher.students_taught || "0"),
          averageScore: parseFloat(teacher.average_score || "0").toFixed(2),
          gradePerformance: gradePerformanceResult.rows.map((row) => ({
            gradeLevel: row.grade_level,
            activityCount: parseInt(row.activity_count || "0"),
            averageScore: parseFloat(row.average_score || "0").toFixed(2),
            studentCount: parseInt(row.student_count || "0"),
          })),
          subjectPerformance: subjectPerformanceResult.rows.map((row) => ({
            subjectName: row.subject_name,
            activityCount: parseInt(row.activity_count || "0"),
            averageScore: parseFloat(row.average_score || "0").toFixed(2),
            studentCount: parseInt(row.student_count || "0"),
          })),
          performanceTrend: trendResult.rows.map((row) => ({
            month: row.month,
            averageScore: parseFloat(row.average_score || "0").toFixed(2),
            activityCount: parseInt(row.activity_count || "0"),
          })),
          recentActivities: recentActivitiesResult.rows.map((row) => ({
            title: row.activity_title,
            date: row.activity_date,
            type: row.activity_type,
            subjectName: row.subject_name,
            className: row.section
              ? `${row.class_name}-${row.section}`
              : row.class_name,
            averageScore: parseFloat(row.average_score || "0").toFixed(2),
            participants: parseInt(row.participants || "0"),
          })),
        });

        // Send progress update every few teachers
        if (i % 3 === 0 || i === teachersResult.rows.length - 1) {
          const progress =
            10 + Math.floor(((i + 1) / teachersResult.rows.length) * 80);
          sendProgress(progress, null, "در حال بارگذاری اطلاعات معلمان...");
        }
      }

      sendProgress(95, null, "در حال نهایی‌سازی داده‌ها...");

      const responseTime = Date.now() - startTime;

      logger.logHttpRequest("info", "Teacher reports accessed successfully", {
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

      sendComplete(teacherDetails);
      client.release();
      return response;
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    logger.error("Teacher reports API error", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    logger.logHttpRequest("error", "Teacher reports API error", {
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

    sendError("خطا در بارگذاری داده‌های گزارش معلمان");
    return response;
  }
}
