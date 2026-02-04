import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    // Only allow principals to run migrations for now
    if (!userData || !["principal", "admin"].includes(userData.role)) {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const client = await pool.connect();

    try {
      console.log("Starting password migration...");

      // Add initial_password column if it doesn't exist
      await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS initial_password TEXT;
      `);

      console.log("initial_password column added successfully");

      // Add comment
      await client.query(`
        COMMENT ON COLUMN users.initial_password IS 'Encrypted initial password for the user (for administrative recovery)';
      `);

      // Create index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_initial_password ON users(initial_password) WHERE initial_password IS NOT NULL;
      `);

      console.log("Migration completed successfully");

      return NextResponse.json({
        success: true,
        message: "Migration completed successfully. Column 'initial_password' added to users table.",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Password migration error:", error);
    return NextResponse.json(
      { error: "خطا در اجرای migration" },
      { status: 500 }
    );
  }
}
