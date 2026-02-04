import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserById } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    // Verify user exists and is a principal
    const user = await getUserById(userData.id);
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    if (user.role !== "principal") {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const { currentPassword, newPassword } = await request.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "رمز عبور فعلی و جدید الزامی است" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "رمز عبور باید حداقل ۶ کاراکتر باشد" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Get current password hash from database
      const result = await client.query(
        "SELECT password_hash FROM users WHERE id = $1",
        [userData.id]
      );

      if (result.rows.length === 0) {
        client.release();
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const currentUser = result.rows[0];

      // Check if current password is correct
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        currentUser.password_hash
      );

      if (!isValidPassword) {
        client.release();
        return NextResponse.json(
          { error: "رمز عبور فعلی اشتباه است" },
          { status: 400 }
        );
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await client.query(
        "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [passwordHash, userData.id]
      );

      client.release();

      return NextResponse.json({
        success: true,
        message: "رمز عبور با موفقیت تغییر کرد",
      });
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    console.error("Change password API error:", error);
    return NextResponse.json(
      { error: "خطایی در سرور رخ داد" },
      { status: 500 }
    );
  }
}
