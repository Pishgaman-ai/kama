import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

/**
 * GET /api/principal/activity-types/[id]
 * Get a single activity type by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "principal") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const client = await pool.connect();

    try {
      // Get user with school_id
      const userWithSchool = await client.query(
        "SELECT school_id FROM users WHERE id = $1",
        [userData.id]
      );

      if (userWithSchool.rows.length === 0) {
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const schoolId = userWithSchool.rows[0].school_id;

      // Get activity type
      const result = await client.query(
        "SELECT * FROM activity_types WHERE id = $1 AND school_id = $2",
        [id, schoolId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "نوع فعالیت یافت نشد" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error in GET /api/principal/activity-types/[id]:", error);
    return NextResponse.json(
      { error: "خطای سرور داخلی" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/principal/activity-types/[id]
 * Update an activity type
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "principal") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const client = await pool.connect();

    try {
      // Get user with school_id
      const userWithSchool = await client.query(
        "SELECT school_id FROM users WHERE id = $1",
        [userData.id]
      );

      if (userWithSchool.rows.length === 0) {
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const schoolId = userWithSchool.rows[0].school_id;

      // Get existing activity type to verify ownership
      const existingType = await client.query(
        "SELECT * FROM activity_types WHERE id = $1 AND school_id = $2",
        [id, schoolId]
      );

      if (existingType.rows.length === 0) {
        return NextResponse.json(
          { error: "نوع فعالیت یافت نشد" },
          { status: 404 }
        );
      }

      // Parse request body
      const body = await request.json();
      const {
        type_key,
        persian_name,
        requires_quantitative_score,
        requires_qualitative_evaluation,
        display_order,
        is_active,
      } = body;

      // If type_key is being changed, check for duplicates
      if (type_key && type_key !== existingType.rows[0].type_key) {
        const duplicateType = await client.query(
          "SELECT id FROM activity_types WHERE school_id = $1 AND type_key = $2 AND id != $3",
          [schoolId, type_key, id]
        );

        if (duplicateType.rows.length > 0) {
          return NextResponse.json(
            { error: "نوع فعالیت با این کلید در مدرسه شما از قبل وجود دارد" },
            { status: 409 }
          );
        }
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (type_key !== undefined) {
        updates.push(`type_key = $${paramIndex++}`);
        values.push(type_key);
      }
      if (persian_name !== undefined) {
        updates.push(`persian_name = $${paramIndex++}`);
        values.push(persian_name);
      }
      if (requires_quantitative_score !== undefined) {
        updates.push(`requires_quantitative_score = $${paramIndex++}`);
        values.push(requires_quantitative_score);
      }
      if (requires_qualitative_evaluation !== undefined) {
        updates.push(`requires_qualitative_evaluation = $${paramIndex++}`);
        values.push(requires_qualitative_evaluation);
      }
      if (display_order !== undefined) {
        updates.push(`display_order = $${paramIndex++}`);
        values.push(display_order);
      }
      if (is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(is_active);
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { error: "هیچ فیلدی برای بروزرسانی ارسال نشده است" },
          { status: 400 }
        );
      }

      // Add updated_at
      updates.push(`updated_at = NOW()`);

      // Add WHERE clause parameters
      values.push(id);
      values.push(schoolId);

      const query = `
        UPDATE activity_types
        SET ${updates.join(", ")}
        WHERE id = $${paramIndex++} AND school_id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);

      return NextResponse.json({
        success: true,
        data: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error in PUT /api/principal/activity-types/[id]:", error);
    return NextResponse.json(
      { error: "خطای سرور داخلی" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/principal/activity-types/[id]
 * Delete an activity type
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "principal") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const client = await pool.connect();

    try {
      // Get user with school_id
      const userWithSchool = await client.query(
        "SELECT school_id FROM users WHERE id = $1",
        [userData.id]
      );

      if (userWithSchool.rows.length === 0) {
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const schoolId = userWithSchool.rows[0].school_id;

      // Check if activity type exists and belongs to this school
      const existingType = await client.query(
        "SELECT * FROM activity_types WHERE id = $1 AND school_id = $2",
        [id, schoolId]
      );

      if (existingType.rows.length === 0) {
        return NextResponse.json(
          { error: "نوع فعالیت یافت نشد" },
          { status: 404 }
        );
      }

      // Check if this activity type is being used in any activities
      const activitiesUsingType = await client.query(
        "SELECT id FROM educational_activities WHERE activity_type = $1 LIMIT 1",
        [existingType.rows[0].type_key]
      );

      if (activitiesUsingType.rows.length > 0) {
        return NextResponse.json(
          {
            error:
              "نمی‌توان نوع فعالیتی را که در فعالیت‌ها استفاده شده حذف کرد. لطفاً آن را غیرفعال کنید.",
          },
          { status: 400 }
        );
      }

      // Delete activity type
      await client.query(
        "DELETE FROM activity_types WHERE id = $1 AND school_id = $2",
        [id, schoolId]
      );

      return NextResponse.json({
        success: true,
        message: "نوع فعالیت با موفقیت حذف شد",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error in DELETE /api/principal/activity-types/[id]:", error);
    return NextResponse.json(
      { error: "خطای سرور داخلی" },
      { status: 500 }
    );
  }
}
