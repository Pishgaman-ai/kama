import { NextRequest, NextResponse } from "next/server";
import { PoolClient } from "pg";
import pool from "@/lib/database";
import logger from "@/lib/logger";
import bcrypt from "bcryptjs";

// POST /api/admin/users/[id]/reset-password - Reset a user's password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie) {
      logger.error(
        "Unauthorized access to password reset API - no admin session cookie"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse session cookie with error handling
    let admin;
    try {
      admin = JSON.parse(sessionCookie.value);
    } catch (parseError) {
      logger.error("Admin session cookie parse error", { error: parseError });
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Only allow admin users to access
    if (admin.role !== "admin") {
      logger.error("Access denied to password reset API - invalid role", {
        role: admin.role,
      });
      return NextResponse.json(
        { error: "Access restricted to administrators only" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const body = await request.json();

    const { newPassword } = body;

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const client: PoolClient = await pool.connect();

    try {
      // Check if user exists
      const existingUser = await client.query(
        "SELECT id FROM users WHERE id = $1",
        [userId]
      );

      if (existingUser.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user password
      const result = await client.query(
        `UPDATE users SET 
          password_hash = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING id`,
        [hashedPassword, userId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Failed to reset password" },
          { status: 500 }
        );
      }

      logger.info("User password reset successfully", {
        userId,
        resetBy: admin.id,
      });

      return NextResponse.json({
        success: true,
        message: "Password reset successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error resetting user password", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
