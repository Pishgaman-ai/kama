import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

const ACTIVITY_TYPES = [
  "midterm_exam",
  "final_exam",
  "monthly_exam",
  "weekly_exam",
  "class_activity",
  "class_homework",
  "home_homework",
];

export async function GET(request: NextRequest) {
  try {
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
      // Get all activities for classes and subjects that this teacher teaches
      const result = await client.query(
        `
        SELECT DISTINCT ON (ea.id)
          ea.id,
          ea.student_id,
          ea.class_id,
          ea.subject_id,
          ea.activity_type,
          ea.activity_title,
          ea.activity_date,
          ea.quantitative_score,
          ea.qualitative_evaluation,
          ea.created_at,
          u.name as student_name,
          c.name as class_name,
          c.grade_level,
          CASE
            WHEN l.title IS NOT NULL THEN l.title
            WHEN ta.subject IS NOT NULL THEN ta.subject
            WHEN c.subject IS NOT NULL THEN c.subject
            ELSE NULL
          END as subject_name
        FROM educational_activities ea
        JOIN users u ON ea.student_id = u.id
        JOIN classes c ON ea.class_id = c.id
        LEFT JOIN lessons l ON ea.subject_id = l.id
        LEFT JOIN teacher_assignments ta ON ea.class_id = ta.class_id
          AND ea.teacher_id = ta.teacher_id
          AND ta.removed_at IS NULL
        WHERE ea.teacher_id = $1
        ORDER BY ea.id, ea.activity_date DESC, ea.created_at DESC
        `,
        [user.id]
      );

      // Debug: Log the raw data from database
      console.log('Activities raw data sample:', result.rows.length > 0 ? {
        id: result.rows[0].id,
        subject_id: result.rows[0].subject_id,
        subject_name: result.rows[0].subject_name,
        class_name: result.rows[0].class_name,
      } : 'No activities');

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

      console.log('Activities after mapping sample:', activities.length > 0 ? {
        id: activities[0].id,
        subject_id: activities[0].subject_id,
        subject_name: activities[0].subject_name,
        class_name: activities[0].class_name,
      } : 'No activities');

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

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const {
      class_id,
      student_id,
      subject_id,
      activity_type,
      activity_title,
      activity_date,
      quantitative_score,
      qualitative_evaluation,
    } = body;

    // Validate required fields
    if (
      !class_id ||
      !student_id ||
      !subject_id ||
      !activity_type ||
      !activity_date
    ) {
      return NextResponse.json(
        { error: "فیلدهای الزامی را پر کنید" },
        { status: 400 }
      );
    }

    // Validate activity type
    if (!ACTIVITY_TYPES.includes(activity_type)) {
      return NextResponse.json(
        { error: "نوع فعالیت نامعتبر است" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Verify teacher has access to this class and subject
      const accessCheck = await client.query(
        `
        SELECT
          ta.subject_id
        FROM class_memberships cm
        JOIN teacher_assignments ta ON cm.class_id = ta.class_id AND cm.user_id = ta.teacher_id
        WHERE cm.class_id = $1 AND cm.user_id = $2 AND ta.subject_id = $3 AND cm.role = 'teacher' AND ta.removed_at IS NULL
        LIMIT 1
        `,
        [class_id, user.id, subject_id]
      );

      if (accessCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "شما دسترسی به این کلاس یا درس ندارید" },
          { status: 403 }
        );
      }

      // Validate student is in this class
      const studentCheck = await client.query(
        `
        SELECT 1 FROM class_memberships
        WHERE class_id = $1 AND user_id = $2 AND role = 'student'
        `,
        [class_id, student_id]
      );

      if (studentCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "دانش‌آموز در این کلاس نیست" },
          { status: 400 }
        );
      }

      // Insert activity
      const result = await client.query(
        `
        INSERT INTO educational_activities
        (class_id, subject_id, student_id, teacher_id, activity_type, activity_title, activity_date, quantitative_score, qualitative_evaluation)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
        `,
        [
          class_id,
          subject_id,
          student_id,
          user.id,
          activity_type,
          activity_title || "",
          activity_date,
          quantitative_score || null,
          qualitative_evaluation || null,
        ]
      );

      return NextResponse.json({
        success: true,
        message: "فعالیت با موفقیت ثبت شد",
        data: { id: result.rows[0].id },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Activities POST API error:", error);
    return NextResponse.json(
      { error: "خطا در ثبت فعالیت" },
      { status: 500 }
    );
  }
}
