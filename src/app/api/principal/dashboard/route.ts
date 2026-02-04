import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined = undefined;
  
  try {
    // Check authentication
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      logger.logHttpRequest("warn", "Unauthorized access attempt to principal dashboard", {
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
        userAgent: request.headers.get("user-agent") || "",
        url: request.url,
        method: request.method,
        statusCode: 401,
        responseTime: Date.now() - startTime
      });
      
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
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
        userAgent: request.headers.get("user-agent") || "",
        url: request.url,
        method: request.method,
        statusCode: 401,
        responseTime: Date.now() - startTime
      });
      
      return NextResponse.json({ error: "نشست نامعتبر" }, { status: 401 });
    }

    if (user.role !== "principal") {
      logger.logHttpRequest("warn", "Access denied - user not a principal", {
        userId,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
        userAgent: request.headers.get("user-agent") || "",
        url: request.url,
        method: request.method,
        statusCode: 403,
        responseTime: Date.now() - startTime
      });
      
      return NextResponse.json(
        { error: "دسترسی محدود به مدیر" },
        { status: 403 }
      );
    }

    const client = await pool.connect();

    try {
      // Get school info
      const schoolResult = await client.query(
        "SELECT id, name FROM schools WHERE id = $1",
        [user.school_id]
      );

      const schoolName = schoolResult.rows[0]?.name || "مدرسه";
      const schoolId = schoolResult.rows[0]?.id || user.school_id;

      // Get dashboard stats
      const statsResult = await client.query(
        `
        SELECT 
          COUNT(DISTINCT CASE WHEN role = 'teacher' AND is_active = true THEN id END) as total_teachers,
          COUNT(DISTINCT CASE WHEN role = 'student' AND is_active = true THEN id END) as total_students,  
          COUNT(DISTINCT CASE WHEN role = 'parent' AND is_active = true THEN id END) as total_parents,
          (SELECT COUNT(*) FROM classes WHERE school_id = $1) as total_classes
        FROM users 
        WHERE school_id = $1
      `,
        [schoolId]
      );

      const stats = {
        totalClasses: parseInt(statsResult.rows[0]?.total_classes || "0"),
        totalTeachers: parseInt(statsResult.rows[0]?.total_teachers || "0"),
        totalStudents: parseInt(statsResult.rows[0]?.total_students || "0"),
        totalParents: parseInt(statsResult.rows[0]?.total_parents || "0"),
      };

      // Mock recent activities for now
      const recentActivities = [
        {
          type: "system",
          title: "سیستم آماده است",
          description: "پنل مدیریت مدرسه راه‌اندازی شده",
          time: "هم‌اکنون",
          status: "completed",
        },
      ];

      // Get recent classes (if any)
      const classesResult = await client.query(
        `
        SELECT id, name, grade_level, section,
               (SELECT COUNT(*) FROM class_memberships WHERE class_id = classes.id AND role = 'student') as student_count
        FROM classes 
        WHERE school_id = $1 
        ORDER BY created_at DESC 
        LIMIT 5
      `,
        [schoolId]
      );

      const responseTime = Date.now() - startTime;
      
      logger.logHttpRequest("info", "Principal dashboard accessed successfully", {
        userId,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
        userAgent: request.headers.get("user-agent") || "",
        url: request.url,
        method: request.method,
        statusCode: 200,
        responseTime
      });
      
      return NextResponse.json({
        success: true,
        data: {
          stats,
          recentActivities,
          classes: classesResult.rows,
          schoolName,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Principal dashboard API error", { 
      error: error instanceof Error ? error.message : String(error),
      userId,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    logger.logHttpRequest("error", "Principal dashboard API error", {
      userId,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      userAgent: request.headers.get("user-agent") || "",
      url: request.url,
      method: request.method,
      statusCode: 500,
      responseTime: Date.now() - startTime
    });
    
    return NextResponse.json(
      { error: "خطا در بارگذاری داده‌های داشبورد" },
      { status: 500 }
    );
  }
}