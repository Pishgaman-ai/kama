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
    if (user.role !== "student") {
      return NextResponse.json(
        { error: "دسترسی محدود به دانش‌آموزان" },
        { status: 403 }
      );
    }

    const client = await pool.connect();

    try {
      // Get student's basic info
      const studentResult = await client.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.national_id,
          u.created_at,
          s.name as school_name
        FROM users u
        JOIN schools s ON u.school_id = s.id
        WHERE u.id = $1
      `, [user.id]);

      if (studentResult.rows.length === 0) {
        return NextResponse.json(
          { error: "کاربر یافت نشد" },
          { status: 404 }
        );
      }

      const student = studentResult.rows[0];

      // Get student's classes
      const classesResult = await client.query(`
        SELECT 
          c.id,
          c.name,
          c.grade_level,
          c.section,
          c.academic_year
        FROM class_memberships cm
        JOIN classes c ON cm.class_id = c.id
        WHERE cm.user_id = $1 AND cm.role = 'student'
      `, [user.id]);

      // Get student's exam stats
      const examStatsResult = await client.query(`
        SELECT 
          COUNT(DISTINCT e.id) as total_exams,
          COUNT(DISTINCT CASE WHEN e.status = 'active' AND e.starts_at <= NOW() AND e.ends_at >= NOW() THEN e.id END) as active_exams,
          COUNT(DISTINCT eg.exam_id) as completed_exams,
          AVG(eg.percentage) as average_grade
        FROM class_memberships cm
        JOIN classes c ON cm.class_id = c.id
        JOIN exams e ON c.id = e.class_id
        LEFT JOIN exam_grades eg ON e.id = eg.exam_id AND eg.student_id = $1
        WHERE cm.user_id = $1 AND cm.role = 'student'
      `, [user.id]);

      const examStats = examStatsResult.rows[0];

      // Get upcoming exams
      const upcomingExamsResult = await client.query(`
        SELECT 
          e.id,
          e.title,
          e.starts_at,
          e.ends_at,
          e.duration_minutes,
          c.name as class_name,
          s.name as subject_name
        FROM class_memberships cm
        JOIN classes c ON cm.class_id = c.id
        JOIN exams e ON c.id = e.class_id
        LEFT JOIN subjects s ON e.subject_id = s.id
        WHERE cm.user_id = $1 
          AND cm.role = 'student'
          AND e.status = 'published'
          AND e.starts_at > NOW()
        ORDER BY e.starts_at ASC
        LIMIT 5
      `, [user.id]);

      // Get recent completed exams with grades
      const recentExamsResult = await client.query(`
        SELECT 
          e.id,
          e.title,
          e.total_points,
          eg.total_score,
          eg.percentage,
          eg.grade_letter,
          eg.computed_at,
          c.name as class_name,
          s.name as subject_name
        FROM exam_grades eg
        JOIN exams e ON eg.exam_id = e.id
        JOIN classes c ON e.class_id = c.id
        LEFT JOIN subjects s ON e.subject_id = s.id
        WHERE eg.student_id = $1 AND eg.is_released = true
        ORDER BY eg.computed_at DESC
        LIMIT 10
      `, [user.id]);

      // Format data
      const upcomingExams = upcomingExamsResult.rows.map(exam => ({
        ...exam,
        starts_at: exam.starts_at ? new Date(exam.starts_at).toLocaleString('fa-IR') : null,
        ends_at: exam.ends_at ? new Date(exam.ends_at).toLocaleString('fa-IR') : null
      }));

      const recentExams = recentExamsResult.rows.map(exam => ({
        ...exam,
        computed_at: exam.computed_at ? new Date(exam.computed_at).toLocaleString('fa-IR') : null
      }));

      const classes = classesResult.rows;

      const stats = {
        totalExams: parseInt(examStats.total_exams) || 0,
        activeExams: parseInt(examStats.active_exams) || 0,
        completedExams: parseInt(examStats.completed_exams) || 0,
        averageGrade: examStats.average_grade ? parseFloat(parseFloat(examStats.average_grade).toFixed(1)) : null
      };

      return NextResponse.json({
        success: true,
        data: {
          student,
          classes,
          stats,
          upcomingExams,
          recentExams
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Student dashboard API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات داشبورد" },
      { status: 500 }
    );
  }
}