import { NextRequest, NextResponse } from "next/server";
import { PoolClient } from "pg";
import pool from "@/lib/database";
import logger from "@/lib/logger";
import bcrypt from "bcryptjs";
import { uploadFileToStorage } from "@/lib/fileUpload";

interface FormFields {
  name?: string;
  email?: string;
  phone?: string;
  national_id?: string;
  telegram_chat_id?: string;
  bale_chat_id?: string;
  role?: string;
  is_active?: string;
  school_id?: string;
  password?: string;
}

interface FormFiles {
  profile_picture?: File;
}

// Helper function to parse form data
async function parseFormData(
  request: NextRequest
): Promise<{ fields: FormFields; files: FormFiles }> {
  const formData = await request.formData();

  const fields: FormFields = {};
  const files: FormFiles = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      if (key === "profile_picture") {
        files.profile_picture = value;
      }
    } else {
      // Type assertion to ensure key is a valid field name
      fields[key as keyof FormFields] = value as string;
    }
  }

  return { fields, files };
}

// GET /api/admin/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie) {
      logger.error("Unauthorized access to user API - no admin session cookie");
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
      logger.error("Access denied to user API - invalid role", {
        role: admin.role,
      });
      return NextResponse.json(
        { error: "Access restricted to administrators only" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const client: PoolClient = await pool.connect();

    try {
      // Fetch user details
      const result = await client.query(
        `SELECT 
          u.id, u.school_id, u.name, u.email, u.phone, u.national_id, 
          u.role, u.is_active, u.created_at, u.last_login, u.profile, u.profile_picture_url,
          s.name as school_name
        FROM users u
        LEFT JOIN schools s ON u.school_id = s.id
        WHERE u.id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const user = result.rows[0];

      // Format the response
      const userData = {
        id: user.id,
        school_id: user.school_id,
        school_name: user.school_name || "نامشخص",
        name: user.name,
        email: user.email,
        phone: user.phone,
        national_id: user.national_id,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        last_login: user.last_login,
        profile: user.profile,
        profile_picture_url: user.profile_picture_url,
      };

      return NextResponse.json({
        success: true,
        data: {
          user: userData,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error retrieving user", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to retrieve user" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie) {
      logger.error(
        "Unauthorized access to user update API - no admin session cookie"
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
      logger.error("Access denied to user update API - invalid role", {
        role: admin.role,
      });
      return NextResponse.json(
        { error: "Access restricted to administrators only" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // Parse form data (including file uploads)
    const { fields, files } = await parseFormData(request);

    const {
      name,
      email,
      phone,
      national_id,
      telegram_chat_id,
      bale_chat_id,
      role,
      is_active,
      school_id,
      password,
    } = fields;
    const telegramChatId = telegram_chat_id?.trim() || null;
    const baleChatId = bale_chat_id?.trim() || null;

    let profilePictureUrl: string | null = null;

    // Handle profile picture upload if provided
    if (files.profile_picture) {
      try {
        profilePictureUrl = await uploadFileToStorage(
          files.profile_picture,
          "users/profile_pictures"
        );
      } catch (uploadError) {
        logger.error("Profile picture upload error", { error: uploadError });
        return NextResponse.json(
          { error: "Failed to upload profile picture" },
          { status: 500 }
        );
      }
    }

    const client: PoolClient = await pool.connect();

    try {
      // Check if user exists
      const existingUser = await client.query(
        "SELECT id, profile_picture_url FROM users WHERE id = $1",
        [userId]
      );

      if (existingUser.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const currentProfilePictureUrl = existingUser.rows[0].profile_picture_url;

      // Update user
      let query = `
        UPDATE users SET 
          name = $1,
          email = $2,
          phone = $3,
          national_id = $4,
          role = $5,
          is_active = $6,
          school_id = $7,
          profile = COALESCE(profile, '{}'::jsonb) || jsonb_build_object(
            'telegram_chat_id', $8::text,
            'bale_chat_id', $9::text
          ),
          updated_at = NOW()
      `;

      const queryParams: (
        | string
        | boolean
        | null
        | undefined
      )[] = [
        name,
        email,
        phone,
        national_id,
        role,
        is_active === "true",
        school_id,
        telegramChatId,
        baleChatId,
      ];

      // Add profile picture URL to query if it's being updated
      if (profilePictureUrl !== null) {
        query += `, profile_picture_url = $10`;
        queryParams.push(profilePictureUrl);
      }

      queryParams.push(userId);
      query += ` WHERE id = $${queryParams.length} RETURNING id`;

      const result = await client.query(query, queryParams);

      // If a new profile picture was uploaded and there was an existing one, delete the old one
      if (profilePictureUrl && currentProfilePictureUrl) {
        try {
          // Import the delete function
          const { deleteFileFromStorage } = await import("@/lib/fileUpload");
          await deleteFileFromStorage(currentProfilePictureUrl);
        } catch (deleteError) {
          logger.error("Error deleting old profile picture", {
            error: deleteError,
          });
          // We don't return an error here because the update was successful
        }
      }

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 }
        );
      }

      logger.info("User updated successfully", { userId, updatedBy: admin.id });

      return NextResponse.json({
        success: true,
        message: "User updated successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error updating user", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie) {
      logger.error(
        "Unauthorized access to user delete API - no admin session cookie"
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
      logger.error("Access denied to user delete API - invalid role", {
        role: admin.role,
      });
      return NextResponse.json(
        { error: "Access restricted to administrators only" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
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

      // Delete user
      await client.query("DELETE FROM users WHERE id = $1", [userId]);

      logger.info("User deleted successfully", { userId, deletedBy: admin.id });

      return NextResponse.json({
        success: true,
        message: "User deleted successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error deleting user", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
