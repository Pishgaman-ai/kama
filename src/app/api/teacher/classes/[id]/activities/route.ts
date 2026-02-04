import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

// Activity types based on the requirements
const ACTIVITY_TYPES = [
  "midterm_exam",
  "final_exam",
  "monthly_exam",
  "weekly_exam",
  "class_activity",
  "class_homework",
  "home_homework",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const classId = resolvedParams.id;

    // Get subjectId from query parameters
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    const client = await pool.connect();

    try {
      let subjectInfo;

      if (subjectId) {
        // If subjectId is provided, verify teacher has access to this specific class-subject combination
        const accessCheck = await client.query(
          `
          SELECT cm.id, cm.role, u.name as teacher_name, 
                 s.name as subject_name, s.id as subject_id
          FROM class_memberships cm
          JOIN users u ON cm.user_id = u.id
          JOIN teacher_assignments ta ON cm.class_id = ta.class_id AND cm.user_id = ta.teacher_id
          JOIN subjects s ON ta.subject_id = s.id
          WHERE cm.class_id = $1 AND cm.user_id = $2 AND cm.role = 'teacher' 
                AND ta.subject_id = $3 AND ta.removed_at IS NULL
          `,
          [classId, user.id, subjectId]
        );

        if (accessCheck.rows.length === 0) {
          return NextResponse.json(
            { error: "شما دسترسی به این کلاس یا درس ندارید" },
            { status: 403 }
          );
        }

        subjectInfo = accessCheck.rows[0];
      } else {
        // If no subjectId is provided, get the first subject the teacher is assigned to for this class
        const accessCheck = await client.query(
          `
          SELECT cm.id, cm.role, u.name as teacher_name, 
                 s.name as subject_name, s.id as subject_id
          FROM class_memberships cm
          JOIN users u ON cm.user_id = u.id
          JOIN teacher_assignments ta ON cm.class_id = ta.class_id AND cm.user_id = ta.teacher_id
          JOIN subjects s ON ta.subject_id = s.id
          WHERE cm.class_id = $1 AND cm.user_id = $2 AND cm.role = 'teacher' AND ta.removed_at IS NULL
          LIMIT 1
          `,
          [classId, user.id]
        );

        if (accessCheck.rows.length === 0) {
          return NextResponse.json(
            { error: "شما دسترسی به این کلاس ندارید" },
            { status: 403 }
          );
        }

        subjectInfo = accessCheck.rows[0];
      }

      // Get students in this class
      const studentsResult = await client.query(
        `
        SELECT 
          u.id,
          u.name,
          u.national_id
        FROM class_memberships cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.class_id = $1 AND cm.role = 'student'
        ORDER BY u.name
        `,
        [classId]
      );

      // Get educational activities for this class and subject
      const activitiesResult = await client.query(
        `
        SELECT 
          ea.id,
          ea.student_id,
          ea.activity_type,
          ea.activity_title,
          ea.activity_date,
          ea.quantitative_score,
          ea.qualitative_evaluation,
          ea.created_at,
          ea.updated_at,
          ea.ai_score
        FROM educational_activities ea
        WHERE ea.class_id = $1 AND ea.subject_id = $2 AND ea.teacher_id = $3
        ORDER BY ea.activity_date DESC, ea.created_at DESC
        `,
        [classId, subjectInfo.subject_id, user.id]
      );

      // Organize activities by student
      const activitiesByStudent: Record<
        string,
        Array<{
          id: string;
          student_id: string;
          activity_type: string;
          activity_title: string;
          activity_date: string | null;
          quantitative_score: number | null;
          qualitative_evaluation: string | null;
          created_at: string | null;
          updated_at: string | null;
        }>
      > = {};
      activitiesResult.rows.forEach((activity) => {
        if (!activitiesByStudent[activity.student_id]) {
          activitiesByStudent[activity.student_id] = [];
        }
        activitiesByStudent[activity.student_id].push({
          ...activity,
          activity_date: activity.activity_date
            ? new Date(activity.activity_date).toISOString().split("T")[0]
            : null,
          created_at: activity.created_at
            ? new Date(activity.created_at).toLocaleString("fa-IR")
            : null,
          updated_at: activity.updated_at
            ? new Date(activity.updated_at).toLocaleString("fa-IR")
            : null,
        });
      });

      return NextResponse.json({
        success: true,
        data: {
          students: studentsResult.rows,
          activities: activitiesByStudent,
          activityTypes: ACTIVITY_TYPES,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Educational activities API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت فعالیت‌های آموزشی" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const classId = resolvedParams.id;

    const client = await pool.connect();
    const body = await request.json();

    try {
      // Verify teacher has access to this class
      const accessCheck = await client.query(
        `
        SELECT cm.id, cm.role, u.name as teacher_name, 
               s.name as subject_name, s.id as subject_id
        FROM class_memberships cm
        JOIN users u ON cm.user_id = u.id
        JOIN teacher_assignments ta ON cm.class_id = ta.class_id AND cm.user_id = ta.teacher_id
        JOIN subjects s ON ta.subject_id = s.id
        WHERE cm.class_id = $1 AND cm.user_id = $2 AND cm.role = 'teacher' AND ta.removed_at IS NULL
        `,
        [classId, user.id]
      );

      if (accessCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "شما دسترسی به این کلاس ندارید" },
          { status: 403 }
        );
      }

      const subjectInfo = accessCheck.rows[0];

      // Validate activity data
      const { activity } = body;
      if (!activity) {
        return NextResponse.json(
          { error: "اطلاعات فعالیت الزامی است" },
          { status: 400 }
        );
      }

      // Validate required fields
      if (
        !activity.student_id ||
        !activity.activity_type ||
        !activity.activity_date
      ) {
        return NextResponse.json(
          { error: "فیلدهای الزامی را پر کنید" },
          { status: 400 }
        );
      }

      // Validate activity type
      if (!ACTIVITY_TYPES.includes(activity.activity_type)) {
        return NextResponse.json(
          { error: "نوع فعالیت نامعتبر است" },
          { status: 400 }
        );
      }

      // Validate student is in this class
      const studentCheck = await client.query(
        `
        SELECT 1 FROM class_memberships 
        WHERE class_id = $1 AND user_id = $2 AND role = 'student'
        `,
        [classId, activity.student_id]
      );

      if (studentCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "دانش‌آموز در این کلاس نیست" },
          { status: 400 }
        );
      }

      // Validate quantitative score and qualitative evaluation based on activity type
      const hasQuantitative = [
        "midterm_exam",
        "monthly_exam",
        "weekly_exam",
        "class_activity",
        "class_homework",
        "home_homework",
      ].includes(activity.activity_type);
      const hasQualitative = ["class_activity", "class_homework"].includes(
        activity.activity_type
      );

      if (
        hasQuantitative &&
        (activity.quantitative_score === undefined ||
          activity.quantitative_score === null)
      ) {
        return NextResponse.json(
          { error: "نمره عددی برای این نوع فعالیت الزامی است" },
          { status: 400 }
        );
      }

      if (
        !hasQuantitative &&
        activity.quantitative_score !== undefined &&
        activity.quantitative_score !== null
      ) {
        return NextResponse.json(
          { error: "این نوع فعالیت نمره عددی ندارد" },
          { status: 400 }
        );
      }

      if (!hasQualitative && activity.qualitative_evaluation) {
        return NextResponse.json(
          { error: "این نوع فعالیت ارزیابی کیفی ندارد" },
          { status: 400 }
        );
      }

      // Determine subject_id - either from request body or fetch teacher's subject
      let subjectId;
      if (activity.subject_id) {
        // Verify teacher has access to the specified subject
        const accessCheck = await client.query(
          `
          SELECT cm.id, cm.role, u.name as teacher_name, 
                 s.name as subject_name, s.id as subject_id
          FROM class_memberships cm
          JOIN users u ON cm.user_id = u.id
          JOIN teacher_assignments ta ON cm.class_id = ta.class_id AND cm.user_id = ta.teacher_id
          JOIN subjects s ON ta.subject_id = s.id
          WHERE cm.class_id = $1 AND cm.user_id = $2 AND cm.role = 'teacher' 
                AND ta.subject_id = $3 AND ta.removed_at IS NULL
          `,
          [classId, user.id, activity.subject_id]
        );

        if (accessCheck.rows.length === 0) {
          return NextResponse.json(
            { error: "شما دسترسی به این کلاس یا درس ندارید" },
            { status: 403 }
          );
        }

        subjectId = activity.subject_id;
      } else {
        // Get the first subject the teacher is assigned to for this class
        const accessCheck = await client.query(
          `
          SELECT cm.id, cm.role, u.name as teacher_name, 
                 s.name as subject_name, s.id as subject_id
          FROM class_memberships cm
          JOIN users u ON cm.user_id = u.id
          JOIN teacher_assignments ta ON cm.class_id = ta.class_id AND cm.user_id = ta.teacher_id
          JOIN subjects s ON ta.subject_id = s.id
          WHERE cm.class_id = $1 AND cm.user_id = $2 AND cm.role = 'teacher' AND ta.removed_at IS NULL
          LIMIT 1
          `,
          [classId, user.id]
        );

        if (accessCheck.rows.length === 0) {
          return NextResponse.json(
            { error: "شما دسترسی به این کلاس ندارید" },
            { status: 403 }
          );
        }

        subjectId = accessCheck.rows[0].subject_id;
      }

      // Insert or update activity
      let result;
      if (activity.id) {
        // Update existing activity
        result = await client.query(
          `
          UPDATE educational_activities 
          SET 
            activity_type = $1,
            activity_title = $2,
            activity_date = $3,
            quantitative_score = $4,
            qualitative_evaluation = $5,
            updated_at = NOW()
          WHERE id = $6 AND class_id = $7 AND subject_id = $8 AND teacher_id = $9
          RETURNING id
          `,
          [
            activity.activity_type,
            activity.activity_title || "",
            activity.activity_date,
            hasQuantitative ? activity.quantitative_score : null,
            hasQualitative ? activity.qualitative_evaluation : null,
            activity.id,
            classId,
            subjectId,
            user.id,
          ]
        );
      } else {
        // Insert new activity
        result = await client.query(
          `
          INSERT INTO educational_activities 
          (class_id, subject_id, student_id, teacher_id, activity_type, activity_title, activity_date, quantitative_score, qualitative_evaluation)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
          `,
          [
            classId,
            subjectId,
            activity.student_id,
            user.id,
            activity.activity_type,
            activity.activity_title || "",
            activity.activity_date,
            hasQuantitative ? activity.quantitative_score : null,
            hasQualitative ? activity.qualitative_evaluation : null,
          ]
        );
      }

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "خطا در ذخیره فعالیت" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "فعالیت با موفقیت ذخیره شد",
        data: { id: result.rows[0].id },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Educational activities POST API error:", error);
    return NextResponse.json(
      { error: "خطا در ذخیره فعالیت‌های آموزشی" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const classId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("activityId");

    if (!activityId) {
      return NextResponse.json(
        { error: "شناسه فعالیت الزامی است" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Delete activity if it belongs to this teacher
      const result = await client.query(
        `
        DELETE FROM educational_activities 
        WHERE id = $1 AND class_id = $2 AND teacher_id = $3
        `,
        [activityId, classId, user.id]
      );

      if (result.rowCount === 0) {
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
    console.error("Educational activities DELETE API error:", error);
    return NextResponse.json(
      { error: "خطا در حذف فعالیت آموزشی" },
      { status: 500 }
    );
  }
}
