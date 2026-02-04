import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    // Get user from session cookie
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "دسترسی محدود به معلمان" },
        { status: 403 }
      );
    }

    // Get class_id from query parameters
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("class_id");

    const client = await pool.connect();

    try {
      let subjectsResult;

      if (classId) {
        // Get lessons (subjects) this teacher teaches in the specified class
        subjectsResult = await client.query(
          `SELECT DISTINCT
            l.id,
            l.title as name,
            '' as code,
            l.description,
            l.grade_level,
            l.created_at
          FROM teacher_assignments ta
          JOIN lessons l ON ta.subject_id = l.id
          WHERE ta.teacher_id = $1
            AND ta.class_id = $2
            AND ta.removed_at IS NULL
          ORDER BY l.grade_level, l.title`,
          [user.id, classId]
        );

        // If no lessons found (subject_id is NULL for this teacher's assignments),
        // fallback to all lessons in the school so teacher can select
        if (subjectsResult.rows.length === 0) {
          const userResult = await client.query(
            "SELECT school_id FROM users WHERE id = $1",
            [user.id]
          );

          if (userResult.rows.length > 0) {
            const schoolId = userResult.rows[0].school_id;
            subjectsResult = await client.query(
              `SELECT
                id,
                title as name,
                '' as code,
                description,
                grade_level,
                created_at
              FROM lessons
              WHERE school_id = $1
              ORDER BY grade_level, title`,
              [schoolId]
            );
          }
        }
      } else {
        // If no class_id provided, get all lessons in the teacher's school
        const userResult = await client.query(
          "SELECT school_id FROM users WHERE id = $1",
          [user.id]
        );

        if (userResult.rows.length === 0) {
          return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
        }

        const schoolId = userResult.rows[0].school_id;

        subjectsResult = await client.query(
          `SELECT
            id,
            title as name,
            '' as code,
            description,
            grade_level,
            created_at
          FROM lessons
          WHERE school_id = $1
          ORDER BY grade_level, title`,
          [schoolId]
        );
      }

      return NextResponse.json({
        success: true,
        subjects: subjectsResult.rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Teacher subjects API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات دروس" },
      { status: 500 }
    );
  }
}
