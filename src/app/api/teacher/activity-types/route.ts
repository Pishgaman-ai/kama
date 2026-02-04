import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

/**
 * GET /api/teacher/activity-types
 * Get all active activity types for the teacher's school
 */
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "teacher") {
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
          { error: "معلم به مدرسه‌ای اختصاص داده نشده است" },
          { status: 400 }
        );
      }

      // Try to get activity types from database
      let transformedTypes: Array<{
        id: string;
        name: string;
        requires_quantitative_score: boolean;
        requires_qualitative_evaluation: boolean;
      }> = [];

      try {
        const activityTypesResult = await client.query(
          `SELECT * FROM activity_types
           WHERE school_id = $1 AND is_active = true
           ORDER BY display_order ASC, created_at ASC`,
          [schoolId]
        );

        // Transform to match the format expected by the frontend
        transformedTypes = (activityTypesResult.rows || []).map((type) => ({
          id: type.type_key,
          name: type.persian_name,
          requires_quantitative_score: type.requires_quantitative_score,
          requires_qualitative_evaluation: type.requires_qualitative_evaluation,
        }));
      } catch (dbError: any) {
        // If table doesn't exist, use default types
        console.log('activity_types table not found, using defaults');
      }

      // Fallback to default types if none found in database
      if (transformedTypes.length === 0) {
        transformedTypes = [
          { id: "midterm_exam", name: "آزمون میان‌ترم", requires_quantitative_score: true, requires_qualitative_evaluation: false },
          { id: "monthly_exam", name: "آزمون ماهیانه", requires_quantitative_score: true, requires_qualitative_evaluation: false },
          { id: "weekly_exam", name: "آزمون هفتگی", requires_quantitative_score: true, requires_qualitative_evaluation: false },
          { id: "class_activity", name: "فعالیت کلاسی", requires_quantitative_score: true, requires_qualitative_evaluation: true },
          { id: "class_homework", name: "تکلیف کلاسی", requires_quantitative_score: true, requires_qualitative_evaluation: true },
          { id: "home_homework", name: "تکلیف منزل", requires_quantitative_score: true, requires_qualitative_evaluation: false },
        ];
      }

      return NextResponse.json({
        success: true,
        data: transformedTypes,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error in GET /api/teacher/activity-types:", error);
    return NextResponse.json(
      { error: "خطای سرور داخلی" },
      { status: 500 }
    );
  }
}
