import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string; classId: string }> }
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
    const studentId = resolvedParams.studentId;
    const classId = resolvedParams.classId;

    const client = await pool.connect();

    try {
      // Verify that the teacher has access to this class and student
      const verification = await client.query(
        `
        SELECT 1
        FROM class_memberships cm_student
        JOIN class_memberships cm_teacher ON cm_student.class_id = cm_teacher.class_id
        WHERE cm_student.user_id = $1 
          AND cm_student.class_id = $2 
          AND cm_student.role = 'student'
          AND cm_teacher.user_id = $3
          AND cm_teacher.role = 'teacher'
      `,
        [studentId, classId, user.id]
      );

      if (verification.rows.length === 0) {
        return NextResponse.json(
          { error: "شما دسترسی به این دانش‌آموز یا کلاس ندارید" },
          { status: 403 }
        );
      }

      // Get teacher reports for this student in this class
      const result = await client.query(
        `
        SELECT *
        FROM teacher_reports
        WHERE teacher_id = $1 AND student_id = $2 AND class_id = $3
        ORDER BY created_at DESC
      `,
        [user.id, studentId, classId]
      );

      return NextResponse.json({
        success: true,
        data: { reports: result.rows },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Teacher reports API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت گزارش‌های معلم" },
      { status: 500 }
    );
  }
}
