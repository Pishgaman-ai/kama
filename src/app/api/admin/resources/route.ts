import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { uploadFileToStorage, deleteFileFromStorage } from "@/lib/fileUpload";

// Special UUID for system admin
const SYSTEM_ADMIN_UUID = "00000000-0000-0000-0000-000000000000";

// GET /api/admin/resources - Get all resources for admin
export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const sessionCookie = req.cookies.get("admin_session");
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
      const { searchParams } = new URL(req.url);
      const schoolId = searchParams.get("schoolId") || undefined;
      const gradeLevel = searchParams.get("gradeLevel") || undefined;
      const subject = searchParams.get("subject") || undefined;
      const search = searchParams.get("search") || undefined;

      let query = `
        SELECT r.*, u.name as uploaded_by_name, s.name as school_name
        FROM resources r
        LEFT JOIN users u ON r.uploaded_by = u.id
        LEFT JOIN schools s ON r.school_id = s.id
        WHERE 1=1
      `;

      const params: (string | undefined)[] = [];
      let paramIndex = 1;

      if (schoolId) {
        query += ` AND r.school_id = $${paramIndex}`;
        params.push(schoolId);
        paramIndex++;
      }

      if (gradeLevel) {
        query += ` AND r.grade_level = $${paramIndex}`;
        params.push(gradeLevel);
        paramIndex++;
      }

      if (subject) {
        query += ` AND r.subject = $${paramIndex}`;
        params.push(subject);
        paramIndex++;
      }

      if (search) {
        query += ` AND (r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      query += ` ORDER BY r.created_at DESC`;

      const result = await client.query(query, params);
      const resources = result.rows;

      return NextResponse.json({
        success: true,
        data: { resources },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching admin resources:", error);
    return NextResponse.json({ error: "خطا در دریافت منابع" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    const sessionCookie = req.cookies.get("admin_session");
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

    // Validate admin ID
    if (!admin.id) {
      return NextResponse.json(
        { error: "شناسه ادمین نامعتبر است" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const gradeLevel = formData.get("gradeLevel") as string;
    const subject = formData.get("subject") as string;
    const description = formData.get("description") as string;
    const schoolId = formData.get("schoolId") as string;
    const visibilityLevel = formData.get("visibilityLevel") as string;

    if (!file || !title) {
      return NextResponse.json(
        { error: "فایل و عنوان الزامی هستند" },
        { status: 400 }
      );
    }

    // Upload file to storage
    const fileUrl = await uploadFileToStorage(
      file,
      `schools/${schoolId || "public"}/resources`
    );

    const client = await pool.connect();

    try {
      // Determine the uploaded_by value
      // For system admin, we'll use NULL to bypass the foreign key constraint
      const uploadedById = admin.id === SYSTEM_ADMIN_UUID ? null : admin.id;

      // Create resource record in database
      const result = await client.query(
        `INSERT INTO resources (
          title, file_url, file_name, file_size, file_type, 
          grade_level, subject, description, school_id, 
          uploaded_by, visibility_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          title,
          fileUrl,
          file.name,
          file.size,
          file.type,
          gradeLevel,
          subject,
          description,
          schoolId,
          uploadedById, // Use NULL for system admin to bypass foreign key constraint
          visibilityLevel || "public",
        ]
      );

      const resource = result.rows[0];

      return NextResponse.json({
        success: true,
        data: { resource },
      });
    } catch (error) {
      // If database creation failed, try to delete the uploaded file
      await deleteFileFromStorage(fileUrl);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json({ error: "خطا در ایجاد منبع" }, { status: 500 });
  }
}

// PUT /api/admin/resources/[id] - Update any resource (admin can update any resource)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<object> } // eslint-disable-line @typescript-eslint/no-empty-object-type
) {
  try {
    // Check admin authentication
    const sessionCookie = req.cookies.get("admin_session");
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

    const { id: resourceId } = (await context.params) as { id: string };

    const client = await pool.connect();

    try {
      // Check if the resource exists
      const resourceResult = await client.query(
        "SELECT * FROM resources WHERE id = $1",
        [resourceId]
      );

      if (resourceResult.rows.length === 0) {
        return NextResponse.json({ error: "منبع یافت نشد" }, { status: 404 });
      }

      const body = await req.json();
      const {
        title,
        gradeLevel,
        subject,
        description,
        schoolId,
        visibilityLevel,
      } = body;

      const updateResult = await client.query(
        `UPDATE resources 
        SET title = $1, grade_level = $2, subject = $3, description = $4, school_id = $5, visibility_level = $6, updated_at = NOW()
        WHERE id = $7
        RETURNING *`,
        [
          title,
          gradeLevel,
          subject,
          description,
          schoolId,
          visibilityLevel,
          resourceId,
        ]
      );

      const updatedResource = updateResult.rows[0];

      return NextResponse.json({
        success: true,
        data: { resource: updatedResource },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی منبع" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/resources/[id] - Delete any resource (admin can delete any resource)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<object> } // eslint-disable-line @typescript-eslint/no-empty-object-type
) {
  try {
    // Check admin authentication
    const sessionCookie = req.cookies.get("admin_session");
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

    const { id: resourceId } = (await context.params) as { id: string };

    const client = await pool.connect();

    try {
      // Check if the resource exists
      const resourceResult = await client.query(
        "SELECT * FROM resources WHERE id = $1",
        [resourceId]
      );

      if (resourceResult.rows.length === 0) {
        return NextResponse.json({ error: "منبع یافت نشد" }, { status: 404 });
      }

      const resource = resourceResult.rows[0];

      // Delete file from storage
      await deleteFileFromStorage(resource.file_url);

      // Delete resource from database
      await client.query("DELETE FROM resources WHERE id = $1", [resourceId]);

      return NextResponse.json({
        success: true,
        message: "منبع با موفقیت حذف شد",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json({ error: "خطا در حذف منبع" }, { status: 500 });
  }
}
