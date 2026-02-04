import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("admin_session");

    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          error: "غیر مجاز",
        },
        { status: 401 }
      );
    }

    const adminData = JSON.parse(sessionCookie.value);

    // Verify admin user in database
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id, email, name, role FROM users WHERE id = $1 AND role = 'school_admin'",
        [adminData.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "غیر مجاز",
          },
          { status: 401 }
        );
      }

      const user = result.rows[0];

      return NextResponse.json({
        success: true,
        admin: {
          id: user.id,
          username: user.email || user.name,
          email: user.email,
          role: user.role,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Admin session check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "خطا در بررسی احراز هویت",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "خروج موفق",
  });

  // Clear admin session cookie
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
  });

  return response;
}
