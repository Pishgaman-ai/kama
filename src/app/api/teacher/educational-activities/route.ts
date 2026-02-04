import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    // Get user from session cookie
    const sessionCookie = request.cookies.get("user_session");
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
      // Get educational activities for this teacher
      const activitiesResult = await client.query(
        `
        SELECT 
          id,
          class_id,
          subject_id,
          student_id,
          teacher_id,
          activity_type,
          activity_title,
          activity_date,
          quantitative_score,
          qualitative_evaluation,
          created_at,
          updated_at,
          question_file_url,
          answer_file_url,
          teacher_note,
          status,
          ai_results,
          ai_score
        FROM educational_activities 
        WHERE teacher_id = $1
        ORDER BY activity_date DESC, created_at DESC
        `,
        [user.id]
      );

      const activities = activitiesResult.rows;

      return NextResponse.json({
        success: true,
        activities,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Educational activities API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات فعالیت‌های آموزشی" },
      { status: 500 }
    );
  }
}
