import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserById } from "@/lib/auth";
import { uploadFileToStorage, deleteFileFromStorage } from "@/lib/fileUpload";

// Helper function to parse form data
async function parseFormData(
  request: NextRequest
): Promise<{ fields: Record<string, string>; files: Record<string, File> }> {
  const formData = await request.formData();

  const fields: Record<string, string> = {};
  const files: Record<string, File> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      files[key] = value;
    } else {
      fields[key] = value as string;
    }
  }

  return { fields, files };
}

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

    const client = await pool.connect();

    try {
      // Get the existing user data to check for existing profile picture
      const existingUserResult = await client.query(
        "SELECT profile_picture_url FROM users WHERE id = $1",
        [userData.id]
      );

      if (existingUserResult.rows.length === 0) {
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const existingProfilePictureUrl =
        existingUserResult.rows[0].profile_picture_url;

      // Parse form data (including file uploads)
      const { fields, files } = await parseFormData(request);

      const { name, email, phone, national_id } = fields;
      const telegramChatId = fields.telegram_chat_id?.trim() || null;
      const baleChatId = fields.bale_chat_id?.trim() || null;
      const telegramApiKey = fields.telegram_api_key?.trim() || null;
      const baleApiKey = fields.bale_api_key?.trim() || null;
      const telegramBotId = fields.telegram_bot_id?.trim() || null;
      const baleBotId = fields.bale_bot_id?.trim() || null;

      // Validate input
      if (email && !email.includes("@")) {
        return NextResponse.json(
          { error: "ایمیل نامعتبر است" },
          { status: 400 }
        );
      }

      if (phone && !/^09\d{9}$/.test(phone)) {
        return NextResponse.json(
          { error: "شماره موبایل نامعتبر است" },
          { status: 400 }
        );
      }

      // Validate national ID if provided (10 digits)
      if (national_id && !/^\d{10}$/.test(national_id)) {
        return NextResponse.json(
          { error: "کد ملی باید 10 رقم باشد" },
          { status: 400 }
        );
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
          console.error("Profile picture upload error:", uploadError);
          return NextResponse.json(
            { error: "خطا در آپلود عکس پروفایل" },
            { status: 500 }
          );
        }
      }

      let query = `
        UPDATE users 
        SET name = COALESCE($1, name), 
            email = COALESCE($2, email), 
            phone = COALESCE($3, phone),
            profile = COALESCE(profile, '{}'::jsonb) || jsonb_build_object(
              'telegram_chat_id', $4::text,
              'bale_chat_id', $5::text,
              'telegram_api_key', $6::text,
              'bale_api_key', $7::text,
              'telegram_bot_id', $8::text,
              'bale_bot_id', $9::text
            ),
            updated_at = CURRENT_TIMESTAMP`;

      const values = [
        name || null,
        email || null,
        phone || null,
        telegramChatId,
        baleChatId,
        telegramApiKey,
        baleApiKey,
        telegramBotId,
        baleBotId,
      ];

      // Add national_id to update if provided
      if (national_id !== undefined) {
        query += `, national_id = $${values.length + 1}`;
        values.push(national_id || null);
      }

      // Add profile picture URL to update if provided
      if (profilePictureUrl) {
        query += `, profile_picture_url = $${values.length + 1}`;
        values.push(profilePictureUrl);
      }

      query += `
        WHERE id = $${values.length + 1}
        RETURNING id, email, phone, name, national_id, role, school_id, profile_picture_url, profile, created_at`;

      values.push(userData.id);

      // Update user information
      const result = await client.query(query, values);

      // If a new profile picture was uploaded and there was an existing one, delete the old one
      if (profilePictureUrl && existingProfilePictureUrl) {
        try {
          await deleteFileFromStorage(existingProfilePictureUrl);
        } catch (deleteError) {
          console.error("Error deleting old profile picture:", deleteError);
          // We don't return an error here because the update was successful
        }
      }

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const updatedUser = result.rows[0];

      // Propagate API keys set by principal to all teachers, students, and parents of the same school
      if (updatedUser.school_id) {
        await client.query(
          `
          UPDATE users
          SET profile = COALESCE(profile, '{}'::jsonb) || jsonb_build_object(
            'telegram_api_key', $1::text,
            'bale_api_key', $2::text
          ),
          updated_at = CURRENT_TIMESTAMP
          WHERE school_id = $3
            AND role::text = ANY($4::text[])
          `,
          [telegramApiKey, baleApiKey, updatedUser.school_id, ["teacher", "student", "parent"]]
        );
      }

      // Create response
      const response = NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          phone: updatedUser.phone,
          name: updatedUser.name,
          national_id: updatedUser.national_id,
          role: updatedUser.role,
          school_id: updatedUser.school_id,
          profile_picture_url: updatedUser.profile_picture_url,
          profile: updatedUser.profile,
          created_at: updatedUser.created_at,
        },
      });

      // Update session cookie with new user data
      response.cookies.set(
        "user_session",
        JSON.stringify({
          id: updatedUser.id,
          email: updatedUser.email,
          phone: updatedUser.phone,
          name: updatedUser.name,
          national_id: updatedUser.national_id,
          role: updatedUser.role,
          school_id: updatedUser.school_id,
          profile_picture_url: updatedUser.profile_picture_url,
          profile: updatedUser.profile,
          created_at: updatedUser.created_at,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        }
      );

      return response;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update profile API error:", error);
    return NextResponse.json(
      { error: "خطایی در سرور رخ داد" },
      { status: 500 }
    );
  }
}
