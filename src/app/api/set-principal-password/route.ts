import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Request body parse error:", parseError);
      return NextResponse.json(
        { error: "فرمت درخواست نامعتبر است" },
        { status: 400 }
      );
    }

    const { principalId, password } = body;

    if (!principalId || !password) {
      return NextResponse.json(
        { error: "شناسه مدیر و رمز عبور الزامی است" },
        { status: 400 }
      );
    }

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const client = await pool.connect();

    try {
      // Update the principal's password
      const result = await client.query(
        "UPDATE users SET password_hash = $1 WHERE id = $2 AND role = 'principal'",
        [passwordHash, principalId]
      );

      if (result.rowCount === 0) {
        return NextResponse.json(
          { error: "مدیر یافت نشد" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "رمز عبور با موفقیت تنظیم شد",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Set principal password error:", error);
    return NextResponse.json(
      { error: "خطایی در تنظیم رمز عبور رخ داد" },
      { status: 500 }
    );
  }
}