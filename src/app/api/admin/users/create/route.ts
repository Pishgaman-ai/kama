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

// POST /api/admin/users/create - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie) {
      logger.error(
        "Unauthorized access to user creation API - no admin session cookie"
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
      logger.error("Access denied to user creation API - invalid role", {
        role: admin.role,
      });
      return NextResponse.json(
        { error: "Access restricted to administrators only" },
        { status: 403 }
      );
    }

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

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!school_id) {
      return NextResponse.json(
        { error: "School is required" },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

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
      let hashedPassword = null;

      // Hash password if provided
      if (password && password.length >= 6) {
        const saltRounds = 12;
        hashedPassword = await bcrypt.hash(password, saltRounds);
      }

      // Create user
      const result = await client.query(
        `INSERT INTO users (
          school_id, name, email, phone, national_id, 
          role, is_active, password_hash, profile, profile_picture_url, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
          jsonb_strip_nulls(
            jsonb_build_object(
              'telegram_chat_id', $9::text,
              'bale_chat_id', $10::text
            )
          ),
          $11, NOW(), NOW())
        RETURNING id`,
        [
          school_id,
          name.trim(),
          email || null,
          phone || null,
          national_id || null,
          role,
          is_active !== undefined ? is_active === "true" : true,
          hashedPassword,
          telegramChatId,
          baleChatId,
          profilePictureUrl,
        ]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }

      const userId = result.rows[0].id;

      logger.info("User created successfully", { userId, createdBy: admin.id });

      return NextResponse.json({
        success: true,
        message: "User created successfully",
        data: { id: userId },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error creating user", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
