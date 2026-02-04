import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import logger from "@/lib/logger";

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

// GET /api/admin/schools/[id] - Get a specific school
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie) {
      logger.error(
        "Unauthorized access to school API - no admin session cookie"
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
    if (admin.role !== "school_admin") {
      logger.error("Access denied to school API - invalid role", {
        role: admin.role,
      });
      return NextResponse.json(
        { error: "Access restricted to administrators only" },
        { status: 403 }
      );
    }

    const { id: schoolId } = await params;

    const client = await pool.connect();

    try {
      // Fetch school details
      const result = await client.query(
        `SELECT 
          id, name, address, postal_code, phone, email, 
          established_year, grade_level, region, gender_type,
          website_url, contact_persons, latitude, longitude, logo_url, created_at
        FROM schools 
        WHERE id = $1`,
        [schoolId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "School not found" },
          { status: 404 }
        );
      }

      const school = result.rows[0];

      // Parse contact_persons if it's a string, otherwise use as is
      let parsedContactPersons = [];
      if (typeof school.contact_persons === "string") {
        try {
          parsedContactPersons = JSON.parse(school.contact_persons);
        } catch (parseError) {
          console.error("Error parsing contact_persons:", parseError);
          parsedContactPersons = [];
        }
      } else if (Array.isArray(school.contact_persons)) {
        parsedContactPersons = school.contact_persons;
      }

      // Format the response
      const schoolData = {
        id: school.id,
        name: school.name,
        address: school.address,
        postal_code: school.postal_code,
        phone: school.phone,
        email: school.email,
        established_year: school.established_year,
        grade_level: school.grade_level,
        region: school.region,
        gender_type: school.gender_type,
        website_url: school.website_url,
        contact_persons: parsedContactPersons,
        latitude: school.latitude,
        longitude: school.longitude,
        logo_url: school.logo_url,
        created_at: school.created_at,
      };

      return NextResponse.json({
        success: true,
        data: {
          school: schoolData,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error retrieving school", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to retrieve school" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/schools/[id] - Update a specific school
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie) {
      logger.error(
        "Unauthorized access to school API - no admin session cookie"
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
    if (admin.role !== "school_admin") {
      logger.error("Access denied to school API - invalid role", {
        role: admin.role,
      });
      return NextResponse.json(
        { error: "Access restricted to administrators only" },
        { status: 403 }
      );
    }

    const { id: schoolId } = await params;

    // Parse form data (including file uploads)
    const formData = await request.formData();

    const fields: Record<string, string> = {};
    let logoFile: File | null = null;

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (key === "logo") {
          logoFile = value;
        }
      } else {
        fields[key] = value as string;
      }
    }

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

    if (!address || !address.trim()) {
      return NextResponse.json(
        { error: "آدرس مدرسه الزامی است" },
        { status: 400 }
      );
    }

    if (!grade_level || !grade_level.trim()) {
      return NextResponse.json(
        { error: "حداقل یک دوره تحصیلی باید انتخاب شود" },
        { status: 400 }
      );
    }

    if (!region || !region.trim()) {
      return NextResponse.json(
        { error: "منطقه مدرسه الزامی است" },
        { status: 400 }
      );
    }

    if (!gender_type) {
      return NextResponse.json(
        { error: "نوعیت جنسیتی مدرسه الزامی است" },
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
    if (logoFile) {
      try {
        // Import the upload function
        const { uploadFileToStorage } = await import("@/lib/fileUpload");
        logoUrl = await uploadFileToStorage(logoFile, "schools/logos");
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
      // Check if school exists
      const existingSchool = await client.query(
        "SELECT id, logo_url FROM schools WHERE id = $1",
        [schoolId]
      );

      if (existingSchool.rows.length === 0) {
        return NextResponse.json({ error: "مدرسه یافت نشد" }, { status: 404 });
      }

      // If no new logo uploaded, keep existing logo
      if (!logoFile) {
        logoUrl = existingSchool.rows[0].logo_url;
      }

      // Convert contact persons array back to JSON string for storage
      const parsedContactPersons = contact_persons || "[]";

      // Update school
      const schoolResult = await client.query(
        `
        UPDATE schools 
        SET name = $1, address = $2, postal_code = $3, phone = $4, email = $5, 
            established_year = $6, grade_level = $7, region = $8, gender_type = $9,
            website_url = $10, contact_persons = $11, latitude = $12, longitude = $13, 
            logo_url = $14
        WHERE id = $15
        RETURNING id, name, address, postal_code, phone, email, established_year, 
                  grade_level, region, gender_type, website_url, contact_persons, 
                  latitude, longitude, logo_url, created_at
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
          schoolId,
        ]
      );

      const updatedSchool = schoolResult.rows[0];

      // Parse contact_persons for the response
      let responseContactPersons = [];
      if (typeof updatedSchool.contact_persons === "string") {
        try {
          responseContactPersons = JSON.parse(updatedSchool.contact_persons);
        } catch (parseError) {
          console.error(
            "Error parsing contact_persons in response:",
            parseError
          );
          responseContactPersons = [];
        }
      } else if (Array.isArray(updatedSchool.contact_persons)) {
        responseContactPersons = updatedSchool.contact_persons;
      }

      return NextResponse.json({
        success: true,
        message: "اطلاعات مدرسه با موفقیت به‌روزرسانی شد",
        data: {
          school: {
            ...updatedSchool,
            contact_persons: responseContactPersons,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error updating school", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی مدرسه" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/schools/[id] - Delete a specific school
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie) {
      logger.error(
        "Unauthorized access to school API - no admin session cookie"
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
    if (admin.role !== "school_admin") {
      logger.error("Access denied to school API - invalid role", {
        role: admin.role,
      });
      return NextResponse.json(
        { error: "Access restricted to administrators only" },
        { status: 403 }
      );
    }

    const { id: schoolId } = await params;

    const client = await pool.connect();

    try {
      // Check if school exists
      const existingSchool = await client.query(
        "SELECT id FROM schools WHERE id = $1",
        [schoolId]
      );

      if (existingSchool.rows.length === 0) {
        return NextResponse.json({ error: "مدرسه یافت نشد" }, { status: 404 });
      }

      // Delete school
      await client.query("DELETE FROM schools WHERE id = $1", [schoolId]);

      return NextResponse.json({
        success: true,
        message: "مدرسه با موفقیت حذف شد",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error deleting school", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "خطا در حذف مدرسه" }, { status: 500 });
  }
}
