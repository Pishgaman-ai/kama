import { NextRequest } from "next/server";
import pool from "@/lib/database";
import {
  getSchoolStatistics,
  getClassComparisonData,
  getTeacherPerformanceData,
  getAiPerformanceData,
} from "@/lib/reports";
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

  // Check if client wants streaming response (EventSource)
  const acceptHeader = request.headers.get("accept");
  const useStreaming =
    acceptHeader && acceptHeader.includes("text/event-stream");

  try {
    // Check authentication
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      const errorResponse = { error: "غیر مجاز" };

      if (useStreaming) {
        // Create a readable stream for progressive responses
        const stream = new Readable({
          read() {},
        });

        const headers = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
        };

        const progressData: ProgressData = {
          progress: 0,
          error: "غیر مجاز",
          complete: true,
        };
        stream.push(`data: ${JSON.stringify(progressData)}\n\n`);
        stream.push(null); // End the stream

        return new Response(stream as unknown as BodyInit, { headers });
      } else {
        return new Response(JSON.stringify(errorResponse), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
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

      const errorResponse = { error: "نشست نامعتبر" };

      if (useStreaming) {
        // Create a readable stream for progressive responses
        const stream = new Readable({
          read() {},
        });

        const headers = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
        };

        const progressData: ProgressData = {
          progress: 0,
          error: "نشست نامعتبر",
          complete: true,
        };
        stream.push(`data: ${JSON.stringify(progressData)}\n\n`);
        stream.push(null); // End the stream

        return new Response(stream as unknown as BodyInit, { headers });
      } else {
        return new Response(JSON.stringify(errorResponse), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
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

      const errorResponse = { error: "دسترسی محدود به مدیر" };

      if (useStreaming) {
        // Create a readable stream for progressive responses
        const stream = new Readable({
          read() {},
        });

        const headers = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
        };

        const progressData: ProgressData = {
          progress: 0,
          error: "دسترسی محدود به مدیر",
          complete: true,
        };
        stream.push(`data: ${JSON.stringify(progressData)}\n\n`);
        stream.push(null); // End the stream

        return new Response(stream as unknown as BodyInit, { headers });
      } else {
        return new Response(JSON.stringify(errorResponse), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const schoolId = user.school_id;

    // For non-streaming requests, fetch all data and return as JSON
    if (!useStreaming) {
      try {
        const schoolStats = await getSchoolStatistics(schoolId);
        const classComparison = await getClassComparisonData(schoolId);
        const teacherPerformance = await getTeacherPerformanceData(schoolId);
        const aiPerformance = await getAiPerformanceData(schoolId);

        const responseTime = Date.now() - startTime;

        logger.logHttpRequest("info", "Reports overview accessed successfully", {
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

        const responseData = {
          data: {
            schoolStats,
            classComparison,
            teacherPerformance,
            aiPerformance,
          },
        };

        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        logger.error("Reports overview API error (non-streaming)", {
          error: error instanceof Error ? error.message : String(error),
          userId,
          stack: error instanceof Error ? error.stack : undefined,
        });

        return new Response(
          JSON.stringify({
            error: "خطا در بارگذاری داده‌های گزارش",
            details: error instanceof Error ? error.message : String(error),
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // For streaming requests, use EventSource approach
    // Create a readable stream for progressive responses
    const stream = new Readable({
      read() {},
    });

    const headers = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    };

    const response = new Response(stream as unknown as BodyInit, { headers });

    const sendProgress = (
      progress: number,
      data?: unknown,
      message?: string
    ) => {
      // Progress updates removed as per user request
    };

    const sendComplete = (data: unknown) => {
      const progressData: ProgressData = {
        progress: 100,
        data,
        complete: true,
      };
      stream.push(`data: ${JSON.stringify(progressData)}\n\n`);
      stream.push(null); // End the stream
    };

    const sendError = (error: string) => {
      const progressData: ProgressData = { progress: 0, error, complete: true };
      stream.push(`data: ${JSON.stringify(progressData)}\n\n`);
      stream.push(null); // End the stream
    };

    try {
      sendProgress(5, null, "در حال اتصال به پایگاه داده...");

      // Get all report data with more granular progress updates
      sendProgress(10, null, "در حال بارگذاری آمار کلی مدرسه...");
      const schoolStats = await getSchoolStatistics(schoolId);

      sendProgress(25, null, "در حال بارگذاری مقایسه عملکرد کلاس‌ها...");
      const classComparison = await getClassComparisonData(schoolId);

      sendProgress(50, null, "در حال بارگذاری آمار عملکرد معلمان...");
      const teacherPerformance = await getTeacherPerformanceData(schoolId);

      sendProgress(75, null, "در حال بارگذاری آمار عملکرد هوش مصنوعی...");
      const aiPerformance = await getAiPerformanceData(schoolId);

      sendProgress(90, null, "در حال نهایی‌سازی داده‌ها...");

      const responseTime = Date.now() - startTime;

      logger.logHttpRequest("info", "Reports overview accessed successfully", {
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

      sendComplete({
        schoolStats,
        classComparison,
        teacherPerformance,
        aiPerformance,
      });
      return response;
    } catch (error) {
      logger.error("Reports overview API error", {
        error: error instanceof Error ? error.message : String(error),
        userId,
        stack: error instanceof Error ? error.stack : undefined,
      });

      logger.logHttpRequest("error", "Reports overview API error", {
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

      sendError("خطا در بارگذاری داده‌های گزارش");
      return response;
    }
  } catch (error) {
    logger.error("Reports overview API error", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    logger.logHttpRequest("error", "Reports overview API error", {
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

    const errorResponse = { error: "خطا در بارگذاری داده‌های گزارش" };

    if (useStreaming) {
      // Create a readable stream for progressive responses
      const stream = new Readable({
        read() {},
      });

      const headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      };

      const progressData: ProgressData = {
        progress: 0,
        error: "خطا در بارگذاری داده‌های گزارش",
        complete: true,
      };
      stream.push(`data: ${JSON.stringify(progressData)}\n\n`);
      stream.push(null); // End the stream

      return new Response(stream as unknown as BodyInit, { headers });
    } else {
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
}
