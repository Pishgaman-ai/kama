import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined = undefined;

  try {
    // Check authentication
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      logger.logHttpRequest(
        "warn",
        "Unauthorized access attempt to delete grade",
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

    const { gradeLevel } = await request.json();

    if (!gradeLevel) {
      return NextResponse.json(
        { error: "پایه تحصیلی مشخص نشده است" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Get all students in the grade level
      const studentsResult = await client.query(
        `
        SELECT id FROM users 
        WHERE school_id = $1 AND role = 'student' AND profile->>'grade_level' = $2
        `,
        [user.school_id, gradeLevel]
      );

      const studentIds = studentsResult.rows.map((row) => row.id);

      if (studentIds.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "دانش‌آموزی در این پایه یافت نشد" },
          { status: 404 }
        );
      }

      // Get all parent IDs related to these students
      const parentsResult = await client.query(
        `
        SELECT DISTINCT parent_id FROM parent_student_relations 
        WHERE student_id = ANY($1)
        `,
        [studentIds]
      );

      const parentIds = parentsResult.rows.map((row) => row.parent_id);

      // Log the operation for audit purposes
      logger.info("Grade deletion operation", {
        userId,
        schoolId: user.school_id,
        gradeLevel,
        studentCount: studentIds.length,
        parentCount: parentIds.length,
      });

      // Delete parent-student relations
      if (studentIds.length > 0) {
        await client.query(
          "DELETE FROM parent_student_relations WHERE student_id = ANY($1)",
          [studentIds]
        );
      }

      // Delete class memberships for students
      if (studentIds.length > 0) {
        await client.query(
          "DELETE FROM class_memberships WHERE user_id = ANY($1)",
          [studentIds]
        );
      }

      // Delete exam grades for students
      if (studentIds.length > 0) {
        await client.query(
          "DELETE FROM exam_grades WHERE student_id = ANY($1)",
          [studentIds]
        );
      }

      // Delete answers for students
      if (studentIds.length > 0) {
        await client.query("DELETE FROM answers WHERE student_id = ANY($1)", [
          studentIds,
        ]);
      }

      // Delete teacher reports for students
      if (studentIds.length > 0) {
        await client.query(
          "DELETE FROM teacher_reports WHERE student_id = ANY($1)",
          [studentIds]
        );
      }

      // Delete AI reports for students
      if (studentIds.length > 0) {
        await client.query(
          "DELETE FROM ai_reports WHERE student_id = ANY($1)",
          [studentIds]
        );
      }

      // Delete notifications for students
      if (studentIds.length > 0) {
        await client.query(
          "DELETE FROM notifications WHERE user_id = ANY($1)",
          [studentIds]
        );
      }

      // Delete students
      if (studentIds.length > 0) {
        await client.query("DELETE FROM users WHERE id = ANY($1)", [
          studentIds,
        ]);
      }

      // Delete parents (only if they have no other children in other grades)
      if (parentIds.length > 0) {
        // Check if parents have children in other grades
        const parentsWithOtherChildrenResult = await client.query(
          `
          SELECT DISTINCT psr.parent_id 
          FROM parent_student_relations psr
          JOIN users s ON psr.student_id = s.id
          WHERE psr.parent_id = ANY($1) 
          AND s.profile->>'grade_level' != $2
          AND s.school_id = $3
          `,
          [parentIds, gradeLevel, user.school_id]
        );

        const parentsWithOtherChildren =
          parentsWithOtherChildrenResult.rows.map((row) => row.parent_id);
        const parentsToDelete = parentIds.filter(
          (id) => !parentsWithOtherChildren.includes(id)
        );

        if (parentsToDelete.length > 0) {
          // Delete parent-student relations for these parents
          await client.query(
            "DELETE FROM parent_student_relations WHERE parent_id = ANY($1)",
            [parentsToDelete]
          );

          // Delete notifications for parents
          await client.query(
            "DELETE FROM notifications WHERE user_id = ANY($1)",
            [parentsToDelete]
          );

          // Delete parents
          await client.query("DELETE FROM users WHERE id = ANY($1)", [
            parentsToDelete,
          ]);

          logger.info("Parents deleted with grade", {
            userId,
            parentCount: parentsToDelete.length,
          });
        }
      }

      await client.query("COMMIT");

      const responseTime = Date.now() - startTime;

      logger.logHttpRequest("info", "Grade level deleted successfully", {
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
        message: `پایه ${gradeLevel} با موفقیت حذف شد. تعداد دانش‌آموزان حذف شده: ${studentIds.length}`,
        deletedStudents: studentIds.length,
        deletedParents: parentIds.length,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Grade deletion API error", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    logger.logHttpRequest("error", "Grade deletion API error", {
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
      { error: "خطا در حذف پایه تحصیلی" },
      { status: 500 }
    );
  }
}
