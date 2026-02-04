import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import bcrypt from "bcryptjs";
import { uploadFileToStorage } from "@/lib/fileUpload";

interface FormFields {
  name?: string;
  phone?: string;
  email?: string;
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

// GET: Get all principals for a specific school
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: schoolId } = await params;

    const client = await pool.connect();

    try {
      // Verify school exists
      const schoolCheck = await client.query(
        "SELECT id, name FROM schools WHERE id = $1",
        [schoolId]
      );

      if (schoolCheck.rows.length === 0) {
        return NextResponse.json({ error: "مدرسه یافت نشد" }, { status: 404 });
      }

      // Get all principals for this school from users table
      const principalsResult = await client.query(
        `
        SELECT 
          id,
          school_id,
          name,
          phone,
          email,
          is_active,
          profile,
          profile_picture_url,
          created_at,
          updated_at
        FROM users
        WHERE school_id = $1 AND role = 'principal'
        ORDER BY created_at DESC
      `,
        [schoolId]
      );

      const principals = principalsResult.rows.map((principal) => ({
        ...principal,
        created_at: principal.created_at ? new Date(principal.created_at).toLocaleString("fa-IR") : null,
        updated_at: principal.updated_at ? new Date(principal.updated_at).toLocaleString("fa-IR") : null,
      }));

      return NextResponse.json({
        success: true,
        data: {
          school: schoolCheck.rows[0],
          principals,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get principals API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات مدیران" },
      { status: 500 }
    );
  }
}

// POST: Create a new principal for a school
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: schoolId } = await params;

    // Parse form data (including file uploads)
    const { fields, files } = await parseFormData(request);
    const { name, phone, email, password } = fields;

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

    // Validate phone number (Iranian mobile format)
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

    // Validate password if provided
    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return NextResponse.json(
          { error: "رمز عبور باید حداقل ۶ کاراکتر باشد" },
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
      // Verify school exists
      const schoolCheck = await client.query(
        "SELECT id, name FROM schools WHERE id = $1",
        [schoolId]
      );

      if (schoolCheck.rows.length === 0) {
        return NextResponse.json({ error: "مدرسه یافت نشد" }, { status: 404 });
      }

      // Check if phone number already exists in users table
      const existingUser = await client.query(
        "SELECT id FROM users WHERE phone = $1",
        [phone.trim()]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: "شماره همراه قبلاً ثبت شده است" },
          { status: 400 }
        );
      }

      // Check if email already exists (if provided)
      if (email && email.trim()) {
        const existingEmail = await client.query(
          "SELECT id FROM users WHERE email = $1",
          [email.trim()]
        );

        if (existingEmail.rows.length > 0) {
          return NextResponse.json(
            { error: "ایمیل قبلاً ثبت شده است" },
            { status: 400 }
          );
        }
      }

      // Hash password if provided
      let passwordHash = null;
      if (password && password.trim()) {
        const saltRounds = 12;
        passwordHash = await bcrypt.hash(password.trim(), saltRounds);
      }

      // Create user account for the principal (only create in users table)
      const userResult = await client.query(
        `
        INSERT INTO users (school_id, phone, email, name, role, profile, profile_picture_url, is_active, password_hash)
        VALUES ($1, $2, $3, $4, 'principal', '{"position": "principal"}'::jsonb, $5, true, $6)
        RETURNING id, school_id, phone, email, name, role, is_active, profile, profile_picture_url, created_at, updated_at
      `,
        [
          schoolId,
          phone.trim(),
          email?.trim() || null,
          name.trim(),
          profilePictureUrl,
          passwordHash,
        ]
      );

      const newPrincipal = userResult.rows[0];

      return NextResponse.json({
        success: true,
        message:
          password && password.trim()
            ? "مدیر با موفقیت ایجاد شد - می‌تواند با شماره همراه، ایمیل یا رمز عبور وارد شود"
            : email && email.trim()
            ? "مدیر با موفقیت ایجاد شد - می‌تواند با شماره همراه یا ایمیل وارد شود"
            : "مدیر با موفقیت ایجاد شد - می‌تواند با شماره همراه وارد شود",
        data: {
          principal: {
            ...newPrincipal,
            created_at: newPrincipal.created_at ? new Date(newPrincipal.created_at).toLocaleString(
              "fa-IR"
            ) : null,
            updated_at: newPrincipal.updated_at ? new Date(newPrincipal.updated_at).toLocaleString(
              "fa-IR"
            ) : null,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    console.error("Create principal API error:", error);

    // Check for unique constraint violations
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      if ("constraint" in error && typeof error.constraint === "string") {
        if (error.constraint.includes("phone")) {
          return NextResponse.json(
            { error: "شماره همراه تکراری است" },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json({ error: "خطا در ایجاد مدیر" }, { status: 500 });
  }
}
