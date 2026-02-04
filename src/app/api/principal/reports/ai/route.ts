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
        "Unauthorized access attempt to AI reports",
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

    // Get AI performance data
    const client = await pool.connect();

    try {
      sendProgress(5, null, "در حال اتصال به پایگاه داده...");

      // Get processing time statistics
      sendProgress(10, null, "در حال بارگذاری آمار زمان پردازش...");
      const processingTimeResult = await client.query(
        `
        SELECT 
          AVG(processing_time_ms) as avg_processing_time,
          MIN(processing_time_ms) as min_processing_time,
          MAX(processing_time_ms) as max_processing_time,
          COUNT(*) as total_processed,
          COUNT(CASE WHEN success = true THEN 1 END) as successful,
          COUNT(CASE WHEN success = false THEN 1 END) as failed
        FROM ai_logs al
        JOIN answers a ON al.answer_id = a.id
        JOIN exams e ON a.exam_id = e.id
        JOIN classes c ON e.class_id = c.id
        WHERE c.school_id = $1
        `,
        [schoolId]
      );

      // Get accuracy statistics
      sendProgress(25, null, "در حال بارگذاری آمار دقت...");
      const accuracyResult = await client.query(
        `
        SELECT 
          AVG(ABS(a.ai_score - a.final_score)) as avg_score_difference,
          AVG(CASE WHEN ABS(a.ai_score - a.final_score) <= 2 THEN 1 ELSE 0 END) as accuracy_rate,
          COUNT(*) as total_comparisons,
          AVG(a.ai_confidence) as avg_confidence
        FROM answers a
        JOIN exams e ON a.exam_id = e.id
        JOIN classes c ON e.class_id = c.id
        WHERE c.school_id = $1 AND a.ai_score IS NOT NULL AND a.final_score IS NOT NULL
        `,
        [schoolId]
      );

      // Get model version performance
      sendProgress(45, null, "در حال بارگذاری عملکرد مدل‌های مختلف...");
      const modelVersionResult = await client.query(
        `
        SELECT 
          ai_model_version,
          AVG(processing_time_ms) as avg_processing_time,
          AVG(CASE WHEN ABS(a.ai_score - a.final_score) <= 2 THEN 1 ELSE 0 END) as accuracy_rate,
          COUNT(*) as total_processed
        FROM ai_logs al
        JOIN answers a ON al.answer_id = a.id
        JOIN exams e ON a.exam_id = e.id
        JOIN classes c ON e.class_id = c.id
        WHERE c.school_id = $1 AND al.success = true AND al.ai_model_version IS NOT NULL
        GROUP BY ai_model_version
        ORDER BY ai_model_version
        `,
        [schoolId]
      );

      // Get trend data
      sendProgress(65, null, "در حال بارگذاری روند بهبود عملکرد...");
      const trendResult = await client.query(
        `
        SELECT 
          DATE_TRUNC('week', al.created_at) as week,
          AVG(ABS(a.ai_score - a.final_score)) as avg_score_difference,
          AVG(CASE WHEN ABS(a.ai_score - a.final_score) <= 2 THEN 1 ELSE 0 END) as accuracy_rate,
          AVG(processing_time_ms) as avg_processing_time
        FROM ai_logs al
        JOIN answers a ON al.answer_id = a.id
        JOIN exams e ON a.exam_id = e.id
        JOIN classes c ON e.class_id = c.id
        WHERE c.school_id = $1 AND al.success = true
        GROUP BY DATE_TRUNC('week', al.created_at)
        ORDER BY week
        `,
        [schoolId]
      );

      sendProgress(85, null, "در حال نهایی‌سازی داده‌ها...");

      const aiReportData = {
        processingStats: {
          averageTime: processingTimeResult.rows[0]?.avg_processing_time
            ? parseFloat(
                processingTimeResult.rows[0].avg_processing_time
              ).toFixed(2)
            : "0.00",
          minTime: parseInt(
            processingTimeResult.rows[0]?.min_processing_time || "0"
          ),
          maxTime: parseInt(
            processingTimeResult.rows[0]?.max_processing_time || "0"
          ),
          totalProcessed: parseInt(
            processingTimeResult.rows[0]?.total_processed || "0"
          ),
          successRate: processingTimeResult.rows[0]?.total_processed
            ? (
                (parseInt(processingTimeResult.rows[0]?.successful || "0") /
                  parseInt(
                    processingTimeResult.rows[0]?.total_processed || "1"
                  )) *
                100
              ).toFixed(2)
            : "0.00",
        },
        accuracyStats: {
          averageDifference: accuracyResult.rows[0]?.avg_score_difference
            ? parseFloat(accuracyResult.rows[0].avg_score_difference).toFixed(2)
            : "0.00",
          accuracyRate: accuracyResult.rows[0]?.accuracy_rate
            ? (parseFloat(accuracyResult.rows[0].accuracy_rate) * 100).toFixed(
                2
              )
            : "0.00",
          totalComparisons: parseInt(
            accuracyResult.rows[0]?.total_comparisons || "0"
          ),
          averageConfidence: accuracyResult.rows[0]?.avg_confidence
            ? (parseFloat(accuracyResult.rows[0].avg_confidence) * 100).toFixed(
                2
              )
            : "0.00",
        },
        modelPerformance: modelVersionResult.rows.map((row) => ({
          modelVersion: row.ai_model_version,
          averageTime: parseFloat(row.avg_processing_time || "0").toFixed(2),
          accuracyRate: row.accuracy_rate
            ? (parseFloat(row.accuracy_rate) * 100).toFixed(2)
            : "0.00",
          totalProcessed: parseInt(row.total_processed || "0"),
        })),
        trendData: trendResult.rows.map((row) => ({
          week: row.week,
          averageDifference: parseFloat(
            row.avg_score_difference || "0"
          ).toFixed(2),
          accuracyRate: row.accuracy_rate
            ? (parseFloat(row.accuracy_rate) * 100).toFixed(2)
            : "0.00",
          averageTime: parseFloat(row.avg_processing_time || "0").toFixed(2),
        })),
      };

      const responseTime = Date.now() - startTime;

      logger.logHttpRequest("info", "AI reports accessed successfully", {
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

      sendComplete(aiReportData);
      client.release();
      return response;
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    logger.error("AI reports API error", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    logger.logHttpRequest("error", "AI reports API error", {
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

    sendError("خطا در بارگذاری داده‌های گزارش هوش مصنوعی");
    return response;
  }
}
