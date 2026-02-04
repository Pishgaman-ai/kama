import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { uploadFileToStorage } from "@/lib/fileUpload";

// Utility function to validate phone number format
const isValidPhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, "");

  // Check if it's a valid Iranian phone number (starts with 09 and has 11 digits)
  // or a valid landline (starts with 0 and has 10-11 digits)
  const mobileRegex = /^09\d{9}$/;
  const landlineRegex = /^0\d{9,10}$/;

  return mobileRegex.test(digitsOnly) || landlineRegex.test(digitsOnly);
};

interface FormFields {
  name?: string;
  address?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  established_year?: string;
  grade_level?: string;
  region?: string;
  gender_type?: string;
  website_url?: string;
  contact_persons?: string;
  latitude?: string;
  longitude?: string;
}

interface FormFiles {
  logo?: File;
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const admin = JSON.parse(sessionCookie.value);
    if (admin.role !== "school_admin") {
      return NextResponse.json(
        { error: "دسترسی محدود به ادمین" },
        { status: 403 }
      );
    }

    const client = await pool.connect();

    try {
      // Get all schools with user counts and coordinates
      const schoolsResult = await client.query(`
        SELECT 
          s.id,
          s.name,
          s.address,
          s.postal_code,
          s.phone,
          s.email,
          s.established_year,
          s.grade_level,
          s.region,
          s.gender_type,
          s.website_url,
          s.contact_persons,
          s.latitude,
          s.longitude,
          s.logo_url,
          s.created_at,
          COUNT(DISTINCT u.id) as user_count,
          COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END) as teacher_count,
          COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as student_count,
          COUNT(DISTINCT CASE WHEN u.role = 'principal' THEN u.id END) as principal_count,
          COUNT(DISTINCT c.id) as class_count
        FROM schools s
        LEFT JOIN users u ON s.id = u.school_id AND u.is_active = true
        LEFT JOIN classes c ON s.id = c.school_id
        GROUP BY s.id, s.name, s.address, s.postal_code, s.phone, s.email, s.established_year, s.grade_level, s.region, s.gender_type, s.website_url, s.contact_persons, s.latitude, s.longitude, s.logo_url, s.created_at
        ORDER BY s.created_at DESC
      `);

      const schools = schoolsResult.rows.map((school) => ({
        ...school,
        user_count: parseInt(school.user_count),
        teacher_count: parseInt(school.teacher_count),
        student_count: parseInt(school.student_count),
        class_count: parseInt(school.class_count),
        principal_count: parseInt(school.principal_count),
        created_at: school.created_at ? new Date(school.created_at).toLocaleString("fa-IR") : null,
      }));

      return NextResponse.json({
        success: true,
        data: { schools },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Schools API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات مدارس" },
      { status: 500 }
    );
  }
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
      if (key === "logo") {
        files.logo = value;
      }
    } else {
      // Type assertion to ensure key is a valid field name
      fields[key as keyof FormFields] = value as string;
    }
  }

  return { fields, files };
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const admin = JSON.parse(sessionCookie.value);
    if (admin.role !== "school_admin") {
      return NextResponse.json(
        { error: "دسترسی محدود به ادمین" },
        { status: 403 }
      );
    }

    // Parse form data (including file uploads)
    const { fields, files } = await parseFormData(request);

    const {
      name,
      address,
      postal_code,
      phone,
      email,
      established_year,
      grade_level,
      region,
      gender_type,
      website_url,
      contact_persons,
      latitude,
      longitude,
    } = fields;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "نام مدرسه الزامی است" },
        { status: 400 }
      );
    }

    // Validate school phone number if provided
    if (phone && phone.trim() && !isValidPhoneNumber(phone.trim())) {
      return NextResponse.json(
        {
          error:
            "شماره تماس مدرسه نامعتبر است. لطفاً یک شماره تماس معتبر وارد کنید.",
        },
        { status: 400 }
      );
    }

    // Validate contact persons if provided
    let parsedContactPersonsArray = [];
    if (contact_persons) {
      try {
        parsedContactPersonsArray = JSON.parse(contact_persons);
        if (Array.isArray(parsedContactPersonsArray)) {
          // Validate each contact person
          for (const person of parsedContactPersonsArray) {
            if (!person.name || !person.name.trim()) {
              return NextResponse.json(
                { error: "نام همه اشخاص تماس الزامی است" },
                { status: 400 }
              );
            }

            if (!person.phone || !person.phone.trim()) {
              return NextResponse.json(
                { error: "شماره تماس همه اشخاص تماس الزامی است" },
                { status: 400 }
              );
            }

            if (!isValidPhoneNumber(person.phone)) {
              return NextResponse.json(
                {
                  error: `شماره تماس برای "${person.name}" نامعتبر است. لطفاً یک شماره تماس معتبر وارد کنید.`,
                },
                { status: 400 }
              );
            }
          }
        }
      } catch (e) {
        return NextResponse.json(
          { error: "فرمت اشخاص تماس نامعتبر است" },
          { status: 400 }
        );
      }
    }

    let logoUrl: string | null = null;

    // Handle logo upload if provided
    if (files.logo) {
      try {
        logoUrl = await uploadFileToStorage(files.logo, "schools/logos");
      } catch (uploadError) {
        console.error("Logo upload error:", uploadError);
        return NextResponse.json(
          { error: "خطا در آپلود لوگوی مدرسه" },
          { status: 500 }
        );
      }
    }

    const client = await pool.connect();

    try {
      // Check for duplicate school name
      const duplicateCheck = await client.query(
        "SELECT id FROM schools WHERE name = $1",
        [name.trim()]
      );

      if (duplicateCheck.rows.length > 0) {
        return NextResponse.json(
          { error: "مدرسه‌ای با این نام از قبل وجود دارد" },
          { status: 400 }
        );
      }

      // Parse contact persons if provided
      let parsedContactPersons = "[]";
      if (contact_persons) {
        try {
          parsedContactPersons = contact_persons;
        } catch (e) {
          // If parsing fails, use empty array
          parsedContactPersons = "[]";
        }
      }

      // Create new school
      const schoolResult = await client.query(
        `
        INSERT INTO schools (name, address, postal_code, phone, email, established_year, grade_level, region, gender_type, website_url, contact_persons, latitude, longitude, logo_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, name, address, postal_code, phone, email, established_year, grade_level, region, gender_type, website_url, contact_persons, latitude, longitude, logo_url, created_at
      `,
        [
          name.trim(),
          address?.trim() || null,
          postal_code?.trim() || null,
          phone?.trim() || null,
          email?.trim() || null,
          established_year ? parseInt(established_year) : null,
          grade_level?.trim() || null,
          region?.trim() || null,
          gender_type || null,
          website_url?.trim() || null,
          parsedContactPersons,
          latitude !== undefined ? parseFloat(latitude) : null,
          longitude !== undefined ? parseFloat(longitude) : null,
          logoUrl,
        ]
      );

      const newSchool = schoolResult.rows[0];

      // Parse contact_persons for the response
      let responseContactPersons = [];
      if (typeof newSchool.contact_persons === "string") {
        try {
          responseContactPersons = JSON.parse(newSchool.contact_persons);
        } catch (parseError) {
          console.error(
            "Error parsing contact_persons in response:",
            parseError
          );
          responseContactPersons = [];
        }
      } else if (Array.isArray(newSchool.contact_persons)) {
        responseContactPersons = newSchool.contact_persons;
      }

      return NextResponse.json({
        success: true,
        message: "مدرسه با موفقیت ایجاد شد",
        data: {
          school: {
            ...newSchool,
            contact_persons: responseContactPersons,
            user_count: 0,
            teacher_count: 0,
            student_count: 0,
            class_count: 0,
            principal_count: 0,
            created_at: newSchool.created_at ? new Date(newSchool.created_at).toLocaleString("fa-IR") : null,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    console.error("Create school API error:", error);

    // Check for unique constraint violations
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "مدرسه‌ای با این اطلاعات از قبل وجود دارد" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "خطا در ایجاد مدرسه" }, { status: 500 });
  }
}
