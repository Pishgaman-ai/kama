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
        "Unauthorized access attempt to parent reports",
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

    // Get parent performance data
    const client = await pool.connect();

    try {
      sendProgress(5, null, "در حال اتصال به پایگاه داده...");

      // Get all parents in the school
      const parentsResult = await client.query(
        `
        SELECT 
          u.id,
          u.name,
          u.phone,
          COUNT(psr.student_id) as children_count
        FROM users u
        LEFT JOIN parent_student_relations psr ON u.id = psr.parent_id
        WHERE u.school_id = $1 AND u.role = 'parent' AND u.is_active = true
        GROUP BY u.id, u.name, u.phone
        ORDER BY u.name
        `,
        [schoolId]
      );

      sendProgress(10, null, "در حال بارگذاری لیست والدین...");

      const totalParents = parentsResult.rows.length;
      if (totalParents === 0) {
        sendComplete([]);
        client.release();
        return response;
      }

      // Get detailed data for each parent
      const parentDetails = [];

      // Send initial progress
      sendProgress(10, null, "در حال بارگذاری اطلاعات والدین...");

      for (let i = 0; i < parentsResult.rows.length; i++) {
        const parent = parentsResult.rows[i];

        // Get children information
        const childrenResult = await client.query(
          `
          SELECT 
            s.id as student_id,
            s.name as student_name,
            c.name as class_name,
            c.grade_level
          FROM parent_student_relations psr
          JOIN users s ON psr.student_id = s.id
          LEFT JOIN class_memberships cm ON s.id = cm.user_id AND cm.role = 'student'
          LEFT JOIN classes c ON cm.class_id = c.id
          WHERE psr.parent_id = $1
          `,
          [parent.id]
        );

        // Get children performance data
        const childrenPerformance = [];

        for (const child of childrenResult.rows) {
          // Get child's subject scores
          const subjectScoresResult = await client.query(
            `
            SELECT 
              sub.name as subject,
              AVG(eg.percentage) as average_score,
              COUNT(eg.id) as exam_count
            FROM exam_grades eg
            JOIN exams e ON eg.exam_id = e.id
            JOIN subjects sub ON e.subject_id = sub.id
            WHERE eg.student_id = $1 AND eg.percentage IS NOT NULL
            GROUP BY sub.name
            ORDER BY average_score DESC
            `,
            [child.student_id]
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
            [child.student_id]
          );

          // Get overall metrics
          const metricsResult = await client.query(
            `
            SELECT 
              AVG(percentage) as overall_average,
              COUNT(*) as total_exams
            FROM exam_grades
            WHERE student_id = $1 AND percentage IS NOT NULL
            `,
            [child.student_id]
          );

          childrenPerformance.push({
            studentId: child.student_id,
            studentName: child.student_name,
            className: child.class_name,
            gradeLevel: child.grade_level,
            subjectScores: subjectScoresResult.rows.map((row) => ({
              subject: row.subject,
              averageScore: parseFloat(row.average_score || "0").toFixed(2),
              examCount: parseInt(row.exam_count || "0"),
            })),
            metrics: {
              overallAverage: metricsResult.rows[0]?.overall_average
                ? parseFloat(metricsResult.rows[0].overall_average).toFixed(2)
                : "0.00",
              totalExams: parseInt(metricsResult.rows[0]?.total_exams || "0"),
            },
            progressTrend: trendResult.rows.map((row) => ({
              month: row.month,
              averageScore: parseFloat(row.average_score || "0").toFixed(2),
            })),
          });
        }

        parentDetails.push({
          id: parent.id,
          name: parent.name,
          phone: parent.phone,
          childrenCount: parseInt(parent.children_count || "0"),
          children: childrenPerformance,
        });

        // Send progress update every few parents
        if (i % 3 === 0 || i === parentsResult.rows.length - 1) {
          const progress =
            10 + Math.floor(((i + 1) / parentsResult.rows.length) * 80);
          sendProgress(progress, null, "در حال بارگذاری اطلاعات والدین...");
        }
      }

      sendProgress(95, null, "در حال نهایی‌سازی داده‌ها...");

      const responseTime = Date.now() - startTime;

      logger.logHttpRequest("info", "Parent reports accessed successfully", {
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

      sendComplete(parentDetails);
      client.release();
      return response;
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    logger.error("Parent reports API error", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    logger.logHttpRequest("error", "Parent reports API error", {
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

    sendError("خطا در بارگذاری داده‌های گزارش والدین");
    return response;
  }
}
