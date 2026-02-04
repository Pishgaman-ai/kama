import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

// This API is intentionally left empty to prevent teachers from removing students
// Only principals should be able to manage student enrollments in classes
export async function GET() {
  return NextResponse.json(
    { error: "دسترسی محدود به مدیران" },
    { status: 403 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; studentId: string }> }
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
    const studentId = resolvedParams.studentId;

    const client = await pool.connect();

    try {
      // Verify teacher has access to this class
      const accessCheck = await client.query(
        `
        SELECT cm.id
        FROM class_memberships cm
        WHERE cm.class_id = $1 AND cm.user_id = $2 AND cm.role = 'teacher'
      `,
        [classId, user.id]
      );

      if (accessCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "شما دسترسی به این کلاس ندارید" },
          { status: 403 }
        );
      }

      // Remove student from class
      const deleteResult = await client.query(
        `
        DELETE FROM class_memberships 
        WHERE class_id = $1 AND user_id = $2 AND role = 'student'
        RETURNING user_id
      `,
        [classId, studentId]
      );

      if (deleteResult.rows.length === 0) {
        return NextResponse.json(
          { error: "دانش‌آموز در این کلاس یافت نشد" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "دانش‌آموز از کلاس حذف شد",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Remove student API error:", error);
    return NextResponse.json(
      { error: "خطا در حذف دانش‌آموز" },
      { status: 500 }
    );
  }
}
