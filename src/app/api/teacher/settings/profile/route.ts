import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserById } from "@/lib/auth";
import { uploadFileToStorage } from "@/lib/fileUpload";

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

    // Verify user exists and is a teacher
    const user = await getUserById(userData.id);
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    if (user.role !== "teacher") {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    // Parse form data (including file uploads)
    const { fields, files } = await parseFormData(request);

    const { name, email, phone, national_id } = fields;

    // Validate input
    if (email && !email.includes("@")) {
      return NextResponse.json({ error: "ایمیل نامعتبر است" }, { status: 400 });
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

    const client = await pool.connect();

    try {
      let query = `
        UPDATE users 
        SET name = COALESCE($1, name), 
            email = COALESCE($2, email), 
            phone = COALESCE($3, phone),
            updated_at = CURRENT_TIMESTAMP`;

      const values = [name || null, email || null, phone || null];

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
        RETURNING id, email, phone, name, national_id, role, school_id, profile_picture_url, created_at`;

      values.push(userData.id);

      // Update user information
      const result = await client.query(query, values);

      client.release();

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const updatedUser = result.rows[0];

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
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    console.error("Update profile API error:", error);
    return NextResponse.json(
      { error: "خطایی در سرور رخ داد" },
      { status: 500 }
    );
  }
}
