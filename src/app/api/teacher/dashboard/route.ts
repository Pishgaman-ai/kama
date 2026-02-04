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
      // Get teacher's classes count
      const classesResult = await client.query(`
        SELECT COUNT(*) as count
        FROM class_memberships cm
        JOIN classes c ON cm.class_id = c.id
        WHERE cm.user_id = $1 AND cm.role = 'teacher'
      `, [user.id]);

      // Get teacher's students count
      const studentsResult = await client.query(`
        SELECT COUNT(DISTINCT cm_student.user_id) as count
        FROM class_memberships cm_teacher
        JOIN class_memberships cm_student ON cm_teacher.class_id = cm_student.class_id
        WHERE cm_teacher.user_id = $1 
          AND cm_teacher.role = 'teacher' 
          AND cm_student.role = 'student'
      `, [user.id]);

      // Get teacher's active exams count
      const activeExamsResult = await client.query(`
        SELECT COUNT(*) as count
        FROM exams e
        WHERE e.teacher_id = $1 AND e.status IN ('published', 'active')
      `, [user.id]);

      // Get average grades for teacher's classes
      const avgGradesResult = await client.query(`
        SELECT AVG(eg.percentage) as avg_grade
        FROM exam_grades eg
        JOIN exams e ON eg.exam_id = e.id
        WHERE e.teacher_id = $1 AND eg.percentage IS NOT NULL
      `, [user.id]);

      // Get recent activities
      const recentActivitiesResult = await client.query(`
        SELECT 
          'exam' as type,
          e.title as title,
          'آزمون جدید ایجاد شد' as description,
          e.created_at as time,
          'created' as status
        FROM exams e
        WHERE e.teacher_id = $1
        ORDER BY e.created_at DESC
        LIMIT 5
      `, [user.id]);

      // Get teacher's classes with student count
      const teacherClassesResult = await client.query(`
        SELECT 
          c.id,
          c.name,
          c.grade_level,
          c.section,
          COUNT(cm_student.user_id) as student_count
        FROM class_memberships cm_teacher
        JOIN classes c ON cm_teacher.class_id = c.id
        LEFT JOIN class_memberships cm_student ON c.id = cm_student.class_id AND cm_student.role = 'student'
        WHERE cm_teacher.user_id = $1 AND cm_teacher.role = 'teacher'
        GROUP BY c.id, c.name, c.grade_level, c.section
      `, [user.id]);

      // Get recent exams
      const recentExamsResult = await client.query(`
        SELECT 
          e.id,
          e.title,
          e.status,
          e.starts_at,
          e.ends_at,
          e.total_points,
          c.name as class_name,
          s.name as subject_name
        FROM exams e
        JOIN classes c ON e.class_id = c.id
        LEFT JOIN subjects s ON e.subject_id = s.id
        WHERE e.teacher_id = $1
        ORDER BY e.created_at DESC
        LIMIT 10
      `, [user.id]);

      const stats = {
        activeExams: parseInt(activeExamsResult.rows[0].count),
        totalStudents: parseInt(studentsResult.rows[0].count),
        totalClasses: parseInt(classesResult.rows[0].count),
        averageGrade: avgGradesResult.rows[0].avg_grade 
          ? parseFloat(parseFloat(avgGradesResult.rows[0].avg_grade).toFixed(1))
          : 0
      };

      const dashboardData = {
        stats,
        recentActivities: recentActivitiesResult.rows.map(activity => ({
          ...activity,
          time: activity.time ? new Date(activity.time).toLocaleString('fa-IR') : null
        })),
        classes: teacherClassesResult.rows,
        recentExams: recentExamsResult.rows.map(exam => ({
          ...exam,
          starts_at: exam.starts_at ? new Date(exam.starts_at).toLocaleString('fa-IR') : null,
          ends_at: exam.ends_at ? new Date(exam.ends_at).toLocaleString('fa-IR') : null
        }))
      };

      return NextResponse.json({
        success: true,
        data: dashboardData
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Teacher dashboard API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت داده‌های داشبورد" },
      { status: 500 }
    );
  }
}