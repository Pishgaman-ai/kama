import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

// GET endpoint allows teachers to view students in their classes
// POST and DELETE are restricted to principals only
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const classId = resolvedParams.id;
    const client = await pool.connect();

    try {
      // Verify teacher has access to this class
      // Check both teacher_assignments and class_memberships for backwards compatibility
      const accessCheck = await client.query(
        `SELECT COUNT(*) as count
         FROM (
           SELECT teacher_id FROM teacher_assignments
           WHERE teacher_id = $1 AND class_id = $2 AND removed_at IS NULL
           UNION
           SELECT user_id as teacher_id FROM class_memberships
           WHERE user_id = $1 AND class_id = $2 AND role = 'teacher'
         ) as access`,
        [user.id, classId]
      );

      if (parseInt(accessCheck.rows[0].count) === 0) {
        return NextResponse.json(
          { error: "شما به این کلاس دسترسی ندارید" },
          { status: 403 }
        );
      }

      // Get class and subject information
      const classInfoResult = await client.query(
        `SELECT
          c.name as class_name,
          c.grade_level,
          ta.subject_id,
          COALESCE(l.title, ta.subject, c.subject) as subject_name
         FROM classes c
         LEFT JOIN teacher_assignments ta ON ta.class_id = c.id AND ta.teacher_id = $1 AND ta.removed_at IS NULL
         LEFT JOIN lessons l ON ta.subject_id = l.id
         WHERE c.id = $2
         LIMIT 1`,
        [user.id, classId]
      );

      // Get students in the class
      const studentsResult = await client.query(
        `SELECT
          u.id,
          u.name,
          u.email,
          u.national_id
         FROM class_memberships cm
         JOIN users u ON cm.user_id = u.id
         WHERE cm.class_id = $1 AND cm.role = 'student'
         ORDER BY u.name`,
        [classId]
      );

      return NextResponse.json({
        success: true,
        students: studentsResult.rows,
        classInfo: classInfoResult.rows[0] || null,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get students API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست دانش‌آموزان" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "دسترسی محدود به مدیران" },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "دسترسی محدود به مدیران" },
    { status: 403 }
  );
}
