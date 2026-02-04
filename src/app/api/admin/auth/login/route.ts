import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/database";

// Special UUID for system admin
const SYSTEM_ADMIN_UUID = "00000000-0000-0000-0000-000000000000";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Connect to database
    const client = await pool.connect();

    try {
      // Look for user in database with matching email and school_admin role
      const result = await client.query(
        `SELECT id, email, name, password_hash, role 
         FROM users 
         WHERE email = $1 AND role = 'school_admin'`,
        [username]
      );

      // If no user found with email, try with national_id
      if (result.rows.length === 0) {
        const nationalIdResult = await client.query(
          `SELECT id, email, name, password_hash, role 
           FROM users 
           WHERE national_id = $1 AND role = 'school_admin'`,
          [username]
        );

        if (nationalIdResult.rows.length > 0) {
          result.rows = nationalIdResult.rows;
        }
      }

      if (result.rows.length > 0) {
        const user = result.rows[0];

        // Verify password
        if (user.password_hash) {
          const isValidPassword = await bcrypt.compare(
            password,
            user.password_hash
          );

          if (isValidPassword) {
            // Create admin session
            const adminSession = {
              id: user.id,
              username: user.email || user.name || username,
              email: user.email,
              role: user.role,
              loginTime: new Date().toISOString(),
            };

            const response = NextResponse.json({
              success: true,
              message: "ورود موفق",
              admin: {
                username: adminSession.username,
                email: adminSession.email,
                role: adminSession.role,
              },
            });

            // Set session cookie
            response.cookies.set(
              "admin_session",
              JSON.stringify(adminSession),
              {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
              }
            );

            return response;
          }
        }
      }
    } finally {
      client.release();
    }

    return NextResponse.json(
      {
        success: false,
        error: "نام کاربری یا رمز عبور اشتباه است",
      },
      { status: 401 }
    );
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "خطا در ورود به سیستم",
      },
      { status: 500 }
    );
  }
}
