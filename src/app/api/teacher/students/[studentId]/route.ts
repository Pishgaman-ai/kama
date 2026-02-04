import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
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

    const client = await pool.connect();

    try {
      // Verify the student belongs to the same school as the teacher
      const accessCheck = await client.query(
        `
        SELECT u.id, u.name
        FROM users u
        WHERE u.id = $1 
          AND u.role = 'student'
          AND u.school_id = (SELECT school_id FROM users WHERE id = $2)
      `,
        [studentId, user.id]
      );

      if (accessCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "دانش‌آموز یافت نشد یا شما دسترسی ندارید" },
          { status: 404 }
        );
      }

      // Check if student is enrolled in any classes
      const classCheck = await client.query(
        "SELECT COUNT(*) as class_count FROM class_memberships WHERE user_id = $1 AND role = 'student'",
        [studentId]
      );

      const classCount = parseInt(classCheck.rows[0].class_count);

      if (classCount > 0) {
        return NextResponse.json(
          {
            error: `این دانش‌آموز در ${classCount} کلاس ثبت‌نام کرده است. ابتدا از تمام کلاس‌ها حذف کنید.`,
          },
          { status: 400 }
        );
      }

      // Delete the student
      const deleteResult = await client.query(
        "DELETE FROM users WHERE id = $1 AND role = 'student' RETURNING name",
        [studentId]
      );

      if (deleteResult.rows.length === 0) {
        return NextResponse.json(
          { error: "خطا در حذف دانش‌آموز" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `دانش‌آموز "${deleteResult.rows[0].name}" با موفقیت حذف شد`,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Delete student API error:", error);
    return NextResponse.json(
      { error: "خطا در حذف دانش‌آموز" },
      { status: 500 }
    );
  }
}
