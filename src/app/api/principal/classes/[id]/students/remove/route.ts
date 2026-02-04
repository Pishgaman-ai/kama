import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "principal") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const resolvedParams = await context.params;
    const classId = resolvedParams.id;

    if (!classId) {
      return NextResponse.json(
        { error: "شناسه کلاس الزامی است" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { studentIds } = body;

    // Validation
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "لیست دانش‌آموزان الزامی است" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Get user with school_id
      const userWithSchool = await client.query(
        "SELECT school_id FROM users WHERE id = $1",
        [userData.id]
      );

      if (userWithSchool.rows.length === 0) {
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const schoolId = userWithSchool.rows[0].school_id;

      // Check if class exists and belongs to this school
      const existingClass = await client.query(
        "SELECT id FROM classes WHERE id = $1 AND school_id = $2",
        [classId, schoolId]
      );

      if (existingClass.rows.length === 0) {
        return NextResponse.json(
          { error: "کلاس یافت نشد یا متعلق به این مدرسه نیست" },
          { status: 404 }
        );
      }

      await client.query("BEGIN");

      // Remove students from the class
      for (const studentId of studentIds) {
        // Verify student exists and belongs to the same school
        const studentResult = await client.query(
          `SELECT u.id
           FROM users u 
           WHERE u.id = $1 
           AND u.school_id = $2 
           AND u.role = 'student'`,
          [studentId, schoolId]
        );

        if (studentResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            {
              error: `دانش‌آموز با شناسه ${studentId} یافت نشد یا متعلق به این مدرسه نیست`,
            },
            { status: 404 }
          );
        }

        // Remove student from class
        await client.query(
          `DELETE FROM class_memberships 
           WHERE class_id = $1 AND user_id = $2 AND role = 'student'`,
          [classId, studentId]
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "دانش‌آموزان با موفقیت از کلاس حذف شدند",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Remove students from class API error:", error);
    return NextResponse.json(
      { error: "خطا در حذف دانش‌آموزان از کلاس" },
      { status: 500 }
    );
  }
}
