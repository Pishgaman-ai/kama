import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { encryptPassword } from "@/lib/passwordEncryption";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    // Only allow principals to run this update
    if (!userData || !["principal", "admin"].includes(userData.role)) {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const client = await pool.connect();

    try {
      console.log("Starting to update existing teachers with initial passwords...");

      // Get all teachers without initial_password
      const teachersResult = await client.query(`
        SELECT id, name, phone, email
        FROM users
        WHERE role = 'teacher' AND (initial_password IS NULL OR initial_password = '')
      `);

      const teachers = teachersResult.rows;

      if (teachers.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No teachers need updating. All teachers already have initial_password set.",
          updated: 0,
        });
      }

      let updatedCount = 0;

      for (const teacher of teachers) {
        // For existing teachers, use phone as the default password
        const defaultPassword = teacher.phone;
        const encryptedPassword = encryptPassword(defaultPassword);

        await client.query(
          "UPDATE users SET initial_password = $1 WHERE id = $2",
          [encryptedPassword, teacher.id]
        );

        updatedCount++;
        console.log(`Updated ${teacher.name} (${teacher.email || teacher.phone})`);
      }

      console.log(`Successfully updated ${updatedCount} teachers`);

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${updatedCount} teachers with their initial passwords.`,
        updated: updatedCount,
        teachers: teachers.map((t) => ({
          name: t.name,
          phone: t.phone,
          defaultPassword: t.phone,
        })),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update teachers passwords error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی رمز عبور معلمان" },
      { status: 500 }
    );
  }
}
