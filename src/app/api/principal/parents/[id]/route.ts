import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import bcrypt from "bcryptjs";

export async function PUT(
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
    const parentId = resolvedParams.id;
    const body = await request.json();
    const { email } = body;

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

      // Verify the parent belongs to the same school
      const parentResult = await client.query(
        "SELECT id FROM users WHERE id = $1 AND role = 'parent' AND school_id = $2",
        [parentId, schoolId]
      );

      if (parentResult.rows.length === 0) {
        return NextResponse.json({ error: "والد یافت نشد" }, { status: 404 });
      }

      // Update parent email if provided
      if (email !== undefined) {
        await client.query("UPDATE users SET email = $1 WHERE id = $2", [
          email || null,
          parentId,
        ]);
      }

      // Set default password to parent's phone number
      // Get the parent's phone number
      const parentPhoneResult = await client.query(
        `
        SELECT phone 
        FROM users
        WHERE id = $1
        `,
        [parentId]
      );

      if (
        parentPhoneResult.rows.length > 0 &&
        parentPhoneResult.rows[0].phone
      ) {
        const parentPhone = parentPhoneResult.rows[0].phone;
        const hashedPassword = await bcrypt.hash(parentPhone, 12);

        await client.query(
          "UPDATE users SET password_hash = $1 WHERE id = $2",
          [hashedPassword, parentId]
        );
      }

      return NextResponse.json({
        success: true,
        message: "اطلاعات والد با موفقیت به‌روزرسانی شد",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update parent API error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی اطلاعات والد" },
      { status: 500 }
    );
  }
}
