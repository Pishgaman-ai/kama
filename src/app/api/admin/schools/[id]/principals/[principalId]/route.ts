import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { uploadFileToStorage } from "@/lib/fileUpload";

interface FormFields {
  name?: string;
  phone?: string;
  email?: string;
  is_active?: string;
  telegram_chat_id?: string;
  bale_chat_id?: string;
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

// PUT: Update a principal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; principalId: string }> }
) {
  try {
    // Check admin authentication
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const admin = JSON.parse(sessionCookie.value);
    if (admin.role !== "admin" && admin.role !== "school_admin") {
      return NextResponse.json(
        { error: "دسترسی محدود به ادمین" },
        { status: 403 }
      );
    }

    const { principalId } = await params;

    // Parse form data (including file uploads)
    const { fields, files } = await parseFormData(request);
    const { name, phone, email, is_active, telegram_chat_id, bale_chat_id } =
      fields;
    const telegramChatId = telegram_chat_id?.trim() || null;
    const baleChatId = bale_chat_id?.trim() || null;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "نام مدیر الزامی است" },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: "شماره همراه الزامی است" },
        { status: 400 }
      );
    }

    // Validate phone number
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json(
        { error: "شماره همراه باید با 09 شروع شده و ۱۱ رقم باشد" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: "فرمت ایمیل صحیح نیست" },
          { status: 400 }
        );
      }
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
          { error: "خطا در آپلود تصویر پروفایل" },
          { status: 500 }
        );
      }
    }

    const client = await pool.connect();

    try {
      // Check if phone number already exists (for other users)
      const existingPhone = await client.query(
        "SELECT id, profile_picture_url FROM users WHERE phone = $1 AND id != $2",
        [phone.trim(), principalId]
      );

      if (existingPhone.rows.length > 0) {
        return NextResponse.json(
          { error: "شماره همراه قبلاً ثبت شده است" },
          { status: 400 }
        );
      }

      // Check if email already exists (if provided, for other users)
      if (email && email.trim()) {
        const existingEmail = await client.query(
          "SELECT id FROM users WHERE email = $1 AND id != $2",
          [email.trim(), principalId]
        );

        if (existingEmail.rows.length > 0) {
          return NextResponse.json(
            { error: "ایمیل قبلاً ثبت شده است" },
            { status: 400 }
          );
        }
      }

      // Get current profile picture URL
      const currentUser = await client.query(
        "SELECT profile_picture_url FROM users WHERE id = $1",
        [principalId]
      );

      const currentProfilePictureUrl =
        currentUser.rows[0]?.profile_picture_url || null;
      // Update principal user record
      let query = `
        UPDATE users
        SET
          name = $1,
          phone = $2,
          email = $3,
          is_active = $4,
          profile = COALESCE(profile, '{}'::jsonb) || jsonb_build_object(
            'telegram_chat_id', $5::text,
            'bale_chat_id', $6::text
          ),
          updated_at = NOW()
      `;

      const queryParams = [
        name.trim(),
        phone.trim(),
        email?.trim() || null,
        is_active !== "false",
        telegramChatId,
        baleChatId,
      ];

      // Add profile picture URL to query if it's being updated
      if (profilePictureUrl !== null) {
        query += `, profile_picture_url = $7`;
        queryParams.push(profilePictureUrl);
      }

      queryParams.push(principalId);
      query += ` WHERE id = $${queryParams.length} AND role = 'principal' RETURNING id, school_id, name, phone, email, role, is_active, profile, profile_picture_url, created_at, updated_at`;

      const principalResult = await client.query(query, queryParams);

      // If a new profile picture was uploaded and there was an existing one, delete the old one
      if (profilePictureUrl && currentProfilePictureUrl) {
        try {
          // Import the delete function
          const { deleteFileFromStorage } = await import("@/lib/fileUpload");
          await deleteFileFromStorage(currentProfilePictureUrl);
        } catch (deleteError) {
          console.error("Error deleting old profile picture:", deleteError);
          // We don't return an error here because the update was successful
        }
      }

      if (principalResult.rows.length === 0) {
        return NextResponse.json({ error: "مدیر یافت نشد" }, { status: 404 });
      }

      const updatedPrincipal = principalResult.rows[0];

      return NextResponse.json({
        success: true,
        message:
          email && email.trim()
            ? "اطلاعات مدیر با موفقیت به‌روزرسانی شد - می‌تواند با شماره همراه یا ایمیل وارد شود"
            : "اطلاعات مدیر با موفقیت به‌روزرسانی شد - می‌تواند با شماره همراه وارد شود",
        data: {
          principal: {
            ...updatedPrincipal,
            created_at: updatedPrincipal.created_at ? new Date(updatedPrincipal.created_at).toLocaleString(
              "fa-IR"
            ) : null,
            updated_at: updatedPrincipal.updated_at ? new Date(updatedPrincipal.updated_at).toLocaleString(
              "fa-IR"
            ) : null,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update principal API error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی اطلاعات مدیر" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a principal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; principalId: string }> }
) {
  try {
    // Check admin authentication
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const admin = JSON.parse(sessionCookie.value);
    if (admin.role !== "admin" && admin.role !== "school_admin") {
      return NextResponse.json(
        { error: "دسترسی محدود به ادمین" },
        { status: 403 }
      );
    }

    const { principalId } = await params;

    const client = await pool.connect();

    try {
      // Delete principal user record
      const deleteResult = await client.query(
        "DELETE FROM users WHERE id = $1 AND role = 'principal' RETURNING id, name",
        [principalId]
      );

      if (deleteResult.rows.length === 0) {
        return NextResponse.json({ error: "مدیر یافت نشد" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `مدیر "${deleteResult.rows[0].name}" با موفقیت حذف شد`,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Delete principal API error:", error);
    return NextResponse.json({ error: "خطا در حذف مدیر" }, { status: 500 });
  }
}
