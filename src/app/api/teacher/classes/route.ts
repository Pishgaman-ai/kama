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

    const client = await pool.connect();

    try {
      // Get teacher's assigned subjects with class information
      // Using LEFT JOIN for subjects to handle cases where subject_id is NULL
      const subjectsResult = await client.query(
        `
        SELECT
          ta.id as assignment_id,
          l.id as subject_id,
          CASE
            WHEN l.title IS NOT NULL THEN l.title
            WHEN ta.subject IS NOT NULL AND ta.subject != c.name THEN ta.subject
            WHEN c.subject IS NOT NULL AND c.subject != c.name THEN c.subject
            ELSE CONCAT(c.name, ' (چند درسی)')
          END as subject_name,
          c.id as class_id,
          c.name as class_name,
          c.grade_level,
          c.section,
          c.academic_year,
          COUNT(cm_student.user_id) as student_count
        FROM teacher_assignments ta
        JOIN classes c ON ta.class_id = c.id
        LEFT JOIN lessons l ON ta.subject_id = l.id
        LEFT JOIN class_memberships cm_student ON c.id = cm_student.class_id AND cm_student.role = 'student'
        WHERE ta.teacher_id = $1 AND ta.removed_at IS NULL
        GROUP BY ta.id, l.id, l.title, ta.subject, c.id, c.name, c.subject, c.grade_level, c.section, c.academic_year
        ORDER BY c.grade_level, c.name, l.title, ta.subject
        `,
        [user.id]
      );

      const subjects = subjectsResult.rows.map((subject) => ({
        ...subject,
        student_count: parseInt(subject.student_count),
      }));

      return NextResponse.json({
        success: true,
        data: { subjects },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Classes API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات کلاس‌ها" },
      { status: 500 }
    );
  }
}
