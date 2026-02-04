import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    if (user.role !== "principal") {
      return NextResponse.json(
        { error: "دسترسی محدود به مدیران" },
        { status: 403 }
      );
    }

    const client = await pool.connect();

    try {
      // Get all activities for the principal's school
      const result = await client.query(
        `
        SELECT
          ea.id,
          ea.student_id,
          ea.class_id,
          ea.subject_id,
          ea.teacher_id,
          ea.activity_type,
          ea.activity_title,
          ea.activity_date,
          ea.quantitative_score,
          ea.qualitative_evaluation,
          ea.created_at,
          u.name as student_name,
          c.name as class_name,
          c.grade_level,
          c.section,
          l.title as subject_name,
          t.name as teacher_name
        FROM educational_activities ea
        JOIN users u ON ea.student_id = u.id
        JOIN classes c ON ea.class_id = c.id
        LEFT JOIN lessons l ON ea.subject_id = l.id
        JOIN users t ON ea.teacher_id = t.id
        WHERE c.school_id = $1
        ORDER BY ea.activity_date DESC, ea.created_at DESC
        `,
        [user.school_id]
      );

      const activities = result.rows.map((activity) => ({
        ...activity,
        activity_date: activity.activity_date
          ? (() => {
              const date = new Date(activity.activity_date);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })()
          : null,
        created_at: activity.created_at
          ? new Date(activity.created_at).toISOString()
          : null,
      }));

      return NextResponse.json({
        success: true,
        activities,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Activities GET API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت فعالیت‌ها" },
      { status: 500 }
    );
  }
}
