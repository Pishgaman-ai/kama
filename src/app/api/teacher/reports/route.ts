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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("student_id");
    const classId = searchParams.get("class_id");
    const type = searchParams.get("type"); // 'teacher' or 'ai'

    if (!studentId || !classId || !type) {
      return NextResponse.json(
        { error: "پارامترهای اجباری وجود ندارد" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      let reports;

      if (type === "teacher") {
        // Get teacher reports
        const result = await client.query(
          `
          SELECT *
          FROM teacher_reports
          WHERE teacher_id = $1 AND student_id = $2 AND class_id = $3
          ORDER BY created_at DESC
        `,
          [user.id, studentId, classId]
        );
        reports = result.rows;
      } else if (type === "ai") {
        // Get AI reports
        const result = await client.query(
          `
          SELECT *
          FROM ai_reports
          WHERE student_id = $1 AND class_id = $2
          ORDER BY created_at DESC
        `,
          [studentId, classId]
        );
        reports = result.rows;
      } else {
        return NextResponse.json(
          { error: "نوع گزارش نامعتبر" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { reports },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت گزارش‌ها" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { student_id, class_id, content } = body;

    if (!student_id || !class_id || !content) {
      return NextResponse.json(
        { error: "همه فیلدها الزامی هستند" },
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
        [student_id, class_id, user.id]
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

      // Insert the new teacher report
      const result = await client.query(
        `
        INSERT INTO teacher_reports (teacher_id, student_id, class_id, content)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
        [user.id, student_id, class_id, content]
      );

      const newReport = result.rows[0];

      return NextResponse.json({
        success: true,
        message: "گزارش با موفقیت ثبت شد",
        data: { report: newReport },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create report API error:", error);
    return NextResponse.json({ error: "خطا در ثبت گزارش" }, { status: 500 });
  }
}
