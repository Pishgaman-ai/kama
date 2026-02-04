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
      // Get teacher's classes with student count and exam count
      const classesResult = await client.query(
        `
        SELECT 
          c.id,
          c.name,
          c.grade_level,
          COUNT(DISTINCT cm_student.user_id) as student_count,
          COUNT(DISTINCT e.id) as exam_count
        FROM classes c
        JOIN class_memberships cm_teacher ON c.id = cm_teacher.class_id AND cm_teacher.role = 'teacher'
        LEFT JOIN class_memberships cm_student ON c.id = cm_student.class_id AND cm_student.role = 'student'
        LEFT JOIN exams e ON c.id = e.class_id AND e.teacher_id = $1
        WHERE cm_teacher.user_id = $1
        GROUP BY c.id, c.name, c.grade_level
        ORDER BY c.grade_level, c.name
      `,
        [user.id]
      );

      // Calculate average grade for each class
      const classAverages = [];
      for (const cls of classesResult.rows) {
        const avgResult = await client.query(
          `
          SELECT 
            ROUND(AVG(eg.percentage), 2) as average_grade
          FROM exam_grades eg
          JOIN exams e ON eg.exam_id = e.id
          WHERE e.class_id = $1 AND e.teacher_id = $2 AND eg.is_released = true
        `,
          [cls.id, user.id]
        );

        classAverages.push({
          ...cls,
          average_grade: avgResult.rows[0]?.average_grade || 0,
        });
      }

      // Get recent teacher reports
      const recentReportsResult = await client.query(
        `
        SELECT 
          tr.id,
          tr.content,
          tr.created_at,
          u.name as student_name,
          c.name as class_name
        FROM teacher_reports tr
        JOIN users u ON tr.student_id = u.id
        JOIN classes c ON tr.class_id = c.id
        WHERE tr.teacher_id = $1
        ORDER BY tr.created_at DESC
        LIMIT 5
      `,
        [user.id]
      );

      // Get recent grades
      const recentGradesResult = await client.query(
        `
        SELECT 
          eg.percentage,
          eg.grade_letter,
          eg.computed_at,
          u.name as student_name,
          e.title as exam_title,
          c.name as class_name
        FROM exam_grades eg
        JOIN exams e ON eg.exam_id = e.id
        JOIN users u ON eg.student_id = u.id
        JOIN classes c ON e.class_id = c.id
        WHERE e.teacher_id = $1 AND eg.is_released = true
        ORDER BY eg.computed_at DESC
        LIMIT 5
      `,
        [user.id]
      );

      return NextResponse.json({
        success: true,
        data: {
          classes: classAverages,
          recentReports: recentReportsResult.rows,
          recentGrades: recentGradesResult.rows,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Reports dashboard API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت داده‌های داشبورد" },
      { status: 500 }
    );
  }
}
