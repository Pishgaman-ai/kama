import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
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

    const { studentId } = await params;
    if (!studentId) {
      return NextResponse.json(
        { error: "شناسه دانش‌آموز الزامی است" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Get behavioral reports for the student
      const behavioralReportsResult = await client.query(
        `
        SELECT 
          br.id,
          br.teacher_id,
          br.student_id,
          br.class_id,
          br.content,
          br.category,
          br.created_at,
          br.updated_at,
          c.name as class_name,
          t.name as teacher_name
        FROM behavioral_reports br
        JOIN classes c ON br.class_id = c.id
        JOIN users t ON br.teacher_id = t.id
        WHERE br.student_id = $1 
          AND br.teacher_id = $2
        ORDER BY br.created_at DESC
      `,
        [studentId, user.id]
      );

      // Get student and class information
      const studentResult = await client.query(
        `
        SELECT u.name, u.national_id
        FROM users u
        WHERE u.id = $1
      `,
        [studentId]
      );

      return NextResponse.json({
        success: true,
        data: {
          student: studentResult.rows[0],
          behavioralReports: behavioralReportsResult.rows,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Behavioral reports API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت گزارشات رفتاری" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
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

    const { studentId } = await params;
    if (!studentId) {
      return NextResponse.json(
        { error: "شناسه دانش‌آموز الزامی است" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { class_id, content, category } = body;

    if (!class_id || !content || !category) {
      return NextResponse.json(
        { error: "کلاس، محتوا و دسته‌بندی الزامی هستند" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Verify that the student is in the class and the teacher teaches this class
      const verification = await client.query(
        `
        SELECT 1
        FROM class_memberships cm_student
        JOIN class_memberships cm_teacher ON cm_student.class_id = cm_teacher.class_id
        WHERE cm_student.user_id = $1 
          AND cm_student.class_id = $2 
          AND cm_student.role = 'student'
          AND cm_teacher.user_id = $3
          AND cm_teacher.role = 'teacher'
      `,
        [studentId, class_id, user.id]
      );

      if (verification.rows.length === 0) {
        return NextResponse.json(
          {
            error:
              "دانش‌آموز در این کلاس وجود ندارد یا شما این کلاس را تدریس نمی‌کنید",
          },
          { status: 403 }
        );
      }

      // Insert the new behavioral report
      const result = await client.query(
        `
        INSERT INTO behavioral_reports (teacher_id, student_id, class_id, content, category)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
        [user.id, studentId, class_id, content, category]
      );

      const newReport = result.rows[0];

      return NextResponse.json({
        success: true,
        message: "گزارش رفتاری با موفقیت ثبت شد",
        data: { report: newReport },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create behavioral report API error:", error);
    return NextResponse.json(
      { error: "خطا در ثبت گزارش رفتاری" },
      { status: 500 }
    );
  }
}
