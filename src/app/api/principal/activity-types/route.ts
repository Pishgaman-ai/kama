import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

/**
 * GET /api/principal/activity-types
 * Get all activity types for the principal's school
 */
export async function GET(request: NextRequest) {
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

      if (!schoolId) {
        return NextResponse.json(
          { error: "مدیر به مدرسه‌ای اختصاص داده نشده است" },
          { status: 400 }
        );
      }

      // Try to get activity types for this school
      let activityTypes = [];

      try {
        const activityTypesResult = await client.query(
          `SELECT * FROM activity_types
           WHERE school_id = $1
           ORDER BY display_order ASC, created_at ASC`,
          [schoolId]
        );
        activityTypes = activityTypesResult.rows || [];
      } catch (dbError: any) {
        // If table doesn't exist, return empty array
        console.log('activity_types table not found, returning empty array');
        activityTypes = [];
      }

      return NextResponse.json({
        success: true,
        data: activityTypes,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error in GET /api/principal/activity-types:", error);
    return NextResponse.json(
      { error: "خطای سرور داخلی" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/principal/activity-types
 * Create a new activity type
 */
export async function POST(request: NextRequest) {
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

      if (!schoolId) {
        return NextResponse.json(
          { error: "مدیر به مدرسه‌ای اختصاص داده نشده است" },
          { status: 400 }
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
      } = body;

      // Validation
      if (!type_key || !persian_name) {
        return NextResponse.json(
          { error: "فیلدهای type_key و persian_name الزامی هستند" },
          { status: 400 }
        );
      }

      // Check for duplicate type_key in this school
      const existingType = await client.query(
        "SELECT id FROM activity_types WHERE school_id = $1 AND type_key = $2",
        [schoolId, type_key]
      );

      if (existingType.rows.length > 0) {
        return NextResponse.json(
          { error: "نوع فعالیت با این کلید در مدرسه شما از قبل وجود دارد" },
          { status: 409 }
        );
      }

      // Create activity type
      const result = await client.query(
        `INSERT INTO activity_types (
          school_id,
          type_key,
          persian_name,
          requires_quantitative_score,
          requires_qualitative_evaluation,
          display_order,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          schoolId,
          type_key,
          persian_name,
          requires_quantitative_score !== undefined
            ? requires_quantitative_score
            : true,
          requires_qualitative_evaluation !== undefined
            ? requires_qualitative_evaluation
            : false,
          display_order || 0,
          true,
        ]
      );

      return NextResponse.json({
        success: true,
        data: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error in POST /api/principal/activity-types:", error);
    return NextResponse.json(
      { error: "خطای سرور داخلی" },
      { status: 500 }
    );
  }
}
