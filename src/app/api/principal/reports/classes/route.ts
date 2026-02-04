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
        "Unauthorized access attempt to class reports",
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

    // Get class performance data
    const client = await pool.connect();

    try {
      sendProgress(5, null, "در حال اتصال به پایگاه داده...");

      // Get all classes in the school
      const classesResult = await client.query(
        `
        SELECT
          c.id,
          CASE
            WHEN c.section IS NOT NULL THEN c.name || '-' || c.section
            ELSE c.name
          END as name,
          c.grade_level,
          COUNT(DISTINCT u.id) as student_count
        FROM classes c
        LEFT JOIN users u ON u.id IN (
          SELECT student_id FROM educational_activities WHERE class_id = c.id
        )
        WHERE c.school_id = $1
        GROUP BY c.id, c.name, c.section, c.grade_level
        ORDER BY c.grade_level, c.name
        `,
        [schoolId]
      );

      sendProgress(10, null, "در حال بارگذاری لیست کلاس‌ها...");

      const totalClasses = classesResult.rows.length;
      if (totalClasses === 0) {
        sendComplete([]);
        client.release();
        return response;
      }

      // Get detailed performance data for each class
      const classDetails = [];

      // Send initial progress
      sendProgress(10, null, "در حال بارگذاری اطلاعات کلاس‌ها...");

      for (let i = 0; i < classesResult.rows.length; i++) {
        const classRow = classesResult.rows[i];

        // Get subject performance
        const subjectPerformanceResult = await client.query(
          `
          SELECT
            l.title as subject,
            AVG(ea.quantitative_score) as average_score,
            COUNT(ea.id) as exam_count
          FROM educational_activities ea
          JOIN lessons l ON ea.subject_id = l.id
          WHERE ea.class_id = $1 AND ea.quantitative_score IS NOT NULL
          GROUP BY l.id, l.title
          ORDER BY average_score DESC
          `,
          [classRow.id]
        );

        // Get attendance/activity data (simplified)
        const activityResult = await client.query(
          `
          SELECT
            COUNT(DISTINCT ea.student_id) as active_students,
            AVG(ea.quantitative_score) as class_average
          FROM educational_activities ea
          WHERE ea.class_id = $1 AND ea.quantitative_score IS NOT NULL
          `,
          [classRow.id]
        );

        // Get learning indicators (16+ = high, 10-15.99 = average, <10 = struggling)
        const learningIndicatorsResult = await client.query(
          `
          SELECT
            AVG(CASE WHEN quantitative_score >= 16 THEN 1 ELSE 0 END) as high_achievers,
            AVG(CASE WHEN quantitative_score >= 10 AND quantitative_score < 16 THEN 1 ELSE 0 END) as average_performers,
            AVG(CASE WHEN quantitative_score < 10 THEN 1 ELSE 0 END) as struggling_students
          FROM educational_activities ea
          WHERE ea.class_id = $1 AND ea.quantitative_score IS NOT NULL
          `,
          [classRow.id]
        );

        // Get class performance trend
        const trendResult = await client.query(
          `
          SELECT
            DATE_TRUNC('month', ea.activity_date) as month,
            AVG(ea.quantitative_score) as average_score
          FROM educational_activities ea
          WHERE ea.class_id = $1 AND ea.quantitative_score IS NOT NULL
          GROUP BY DATE_TRUNC('month', ea.activity_date)
          ORDER BY month DESC
          LIMIT 6
          `,
          [classRow.id]
        );

        classDetails.push({
          id: classRow.id,
          name: classRow.name,
          gradeLevel: classRow.grade_level,
          studentCount: parseInt(classRow.student_count || "0"),
          subjectPerformance: subjectPerformanceResult.rows.map((row) => ({
            subject: row.subject,
            averageScore: parseFloat(row.average_score || "0").toFixed(2),
            examCount: parseInt(row.exam_count || "0"),
          })),
          activityData: {
            activeStudents: parseInt(
              activityResult.rows[0]?.active_students || "0"
            ),
            classAverage: parseFloat(
              activityResult.rows[0]?.class_average || "0"
            ).toFixed(2),
          },
          learningIndicators: {
            highAchievers: learningIndicatorsResult.rows[0]?.high_achievers
              ? (
                  parseFloat(learningIndicatorsResult.rows[0].high_achievers) *
                  100
                ).toFixed(2)
              : "0.00",
            averagePerformers: learningIndicatorsResult.rows[0]
              ?.average_performers
              ? (
                  parseFloat(
                    learningIndicatorsResult.rows[0].average_performers
                  ) * 100
                ).toFixed(2)
              : "0.00",
            strugglingStudents: learningIndicatorsResult.rows[0]
              ?.struggling_students
              ? (
                  parseFloat(
                    learningIndicatorsResult.rows[0].struggling_students
                  ) * 100
                ).toFixed(2)
              : "0.00",
          },
          performanceTrend: trendResult.rows.map((row) => ({
            month: row.month,
            averageScore: parseFloat(row.average_score || "0").toFixed(2),
          })),
        });

        // Send progress update every few classes
        if (i % 3 === 0 || i === classesResult.rows.length - 1) {
          const progress =
            10 + Math.floor(((i + 1) / classesResult.rows.length) * 80);
          sendProgress(progress, null, "در حال بارگذاری اطلاعات کلاس‌ها...");
        }
      }

      sendProgress(95, null, "در حال نهایی‌سازی داده‌ها...");

      const responseTime = Date.now() - startTime;

      logger.logHttpRequest("info", "Class reports accessed successfully", {
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

      sendComplete(classDetails);
      client.release();
      return response;
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    logger.error("Class reports API error", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    logger.logHttpRequest("error", "Class reports API error", {
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

    sendError("خطا در بارگذاری داده‌های گزارش کلاس‌ها");
    return response;
  }
}
