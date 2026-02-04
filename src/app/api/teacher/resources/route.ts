import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { uploadFileToStorage, deleteFileFromStorage } from "@/lib/fileUpload";

// GET /api/teacher/resources - Get resources for teacher
export async function GET(req: NextRequest) {
  try {
    // Get user from session cookie
    const sessionCookie = req.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "دسترسی محدود به معلمان" },
        { status: 403 }
      );
    }

    const client = await pool.connect();

    try {
      const { searchParams } = new URL(req.url);
      const gradeLevel = searchParams.get("gradeLevel") || undefined;
      const subject = searchParams.get("subject") || undefined;
      const search = searchParams.get("search") || undefined;

      let query = `
        SELECT r.*, u.name as uploaded_by_name, s.name as school_name
        FROM resources r
        LEFT JOIN users u ON r.uploaded_by = u.id
        LEFT JOIN schools s ON r.school_id = s.id
        WHERE (r.visibility_level = 'public' OR (r.school_id = $1 AND r.visibility_level IN ('school', 'class')))
      `;

      const params: (string | undefined)[] = [user.school_id];
      let paramIndex = 2; // Starting from 2 since $1 is schoolId

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
    console.error("Error fetching teacher resources:", error);
    return NextResponse.json({ error: "خطا در دریافت منابع" }, { status: 500 });
  }
}

// POST /api/teacher/resources - Create a new resource
export async function POST(req: NextRequest) {
  try {
    // Get user from session cookie
    const sessionCookie = req.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "دسترسی محدود به معلمان" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const gradeLevel = formData.get("gradeLevel") as string;
    const subject = formData.get("subject") as string;
    const description = formData.get("description") as string;
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
      `schools/${user.school_id}/resources`
    );

    const client = await pool.connect();

    try {
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
          user.school_id,
          user.id,
          visibilityLevel || "school",
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

// PUT /api/teacher/resources/[id] - Update a resource
export async function PUT(
  req: NextRequest,
  context: { params: Promise<object> } // eslint-disable-line @typescript-eslint/no-empty-object-type
) {
  try {
    // Get user from session cookie
    const sessionCookie = req.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "دسترسی محدود به معلمان" },
        { status: 403 }
      );
    }

    const client = await pool.connect();

    try {
      const { id: resourceId } = (await context.params) as { id: string };

      // Check if the resource belongs to this teacher
      const resourceResult = await client.query(
        "SELECT * FROM resources WHERE id = $1",
        [resourceId]
      );

      if (resourceResult.rows.length === 0) {
        return NextResponse.json({ error: "منبع یافت نشد" }, { status: 404 });
      }

      const resource = resourceResult.rows[0];
      if (resource.uploaded_by !== user.id) {
        return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });
      }

      const body = await req.json();
      const { title, gradeLevel, subject, description, visibilityLevel } = body;

      const updateResult = await client.query(
        `UPDATE resources 
        SET title = $1, grade_level = $2, subject = $3, description = $4, visibility_level = $5, updated_at = NOW()
        WHERE id = $6
        RETURNING *`,
        [title, gradeLevel, subject, description, visibilityLevel, resourceId]
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

// DELETE /api/teacher/resources/[id] - Delete a resource
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<object> } // eslint-disable-line @typescript-eslint/no-empty-object-type
) {
  try {
    // Get user from session cookie
    const sessionCookie = req.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "دسترسی محدود به معلمان" },
        { status: 403 }
      );
    }

    const client = await pool.connect();

    try {
      const { id: resourceId } = (await context.params) as { id: string };

      // Check if the resource belongs to this teacher
      const resourceResult = await client.query(
        "SELECT * FROM resources WHERE id = $1",
        [resourceId]
      );

      if (resourceResult.rows.length === 0) {
        return NextResponse.json({ error: "منبع یافت نشد" }, { status: 404 });
      }

      const resource = resourceResult.rows[0];
      if (resource.uploaded_by !== user.id) {
        return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });
      }

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
