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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const activityId = resolvedParams.id;

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
      // Verify activity belongs to this teacher
      const ownerCheck = await client.query(
        `
        SELECT id FROM educational_activities
        WHERE id = $1 AND teacher_id = $2
        `,
        [activityId, user.id]
      );

      if (ownerCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "فعالیت یافت نشد یا دسترسی ندارید" },
          { status: 404 }
        );
      }

      // Verify teacher has access to the new class and subject (if changed)
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

      // Validate student is in the class
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

      // Update activity
      const result = await client.query(
        `
        UPDATE educational_activities
        SET
          class_id = $1,
          subject_id = $2,
          student_id = $3,
          activity_type = $4,
          activity_title = $5,
          activity_date = $6,
          quantitative_score = $7,
          qualitative_evaluation = $8,
          updated_at = NOW()
        WHERE id = $9 AND teacher_id = $10
        RETURNING id
        `,
        [
          class_id,
          subject_id,
          student_id,
          activity_type,
          activity_title || "",
          activity_date,
          quantitative_score || null,
          qualitative_evaluation || null,
          activityId,
          user.id,
        ]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "خطا در ویرایش فعالیت" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "فعالیت با موفقیت ویرایش شد",
        data: { id: result.rows[0].id },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Activity PUT API error:", error);
    return NextResponse.json(
      { error: "خطا در ویرایش فعالیت" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const activityId = resolvedParams.id;

    const client = await pool.connect();

    try {
      // Delete activity if it belongs to this teacher
      const result = await client.query(
        `
        DELETE FROM educational_activities
        WHERE id = $1 AND teacher_id = $2
        RETURNING id
        `,
        [activityId, user.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "فعالیت یافت نشد یا دسترسی ندارید" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "فعالیت با موفقیت حذف شد",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Activity DELETE API error:", error);
    return NextResponse.json(
      { error: "خطا در حذف فعالیت" },
      { status: 500 }
    );
  }
}
