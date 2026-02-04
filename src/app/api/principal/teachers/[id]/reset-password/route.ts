import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import bcrypt from "bcryptjs";
import { encryptPassword } from "@/lib/passwordEncryption";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const body = await request.json();
    const { newPassword } = body;
    const { id: teacherId } = await params;

    // Validation
    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { error: "رمز عبور باید حداقل 4 کاراکتر باشد" },
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

      // Check if teacher exists and belongs to the same school
      const teacherResult = await client.query(
        "SELECT id, name FROM users WHERE id = $1 AND school_id = $2 AND role = 'teacher'",
        [teacherId, schoolId]
      );

      if (teacherResult.rows.length === 0) {
        return NextResponse.json(
          { error: "معلم یافت نشد یا دسترسی ندارید" },
          { status: 404 }
        );
      }

      const teacher = teacherResult.rows[0];

      // Hash the new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Encrypt the password for storage (for later retrieval)
      const encryptedInitialPassword = encryptPassword(newPassword);

      // Update the password
      await client.query(
        `UPDATE users
         SET password_hash = $1, initial_password = $2, updated_at = NOW()
         WHERE id = $3`,
        [passwordHash, encryptedInitialPassword, teacherId]
      );

      return NextResponse.json({
        success: true,
        message: `رمز عبور ${teacher.name} با موفقیت تغییر یافت`,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Reset password API error:", error);
    return NextResponse.json(
      { error: "خطا در تغییر رمز عبور. لطفاً مجدداً تلاش کنید." },
      { status: 500 }
    );
  }
}
