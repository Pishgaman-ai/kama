import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserById } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "parent") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const client = await pool.connect();

    try {
      // Get children information for this parent
      const childrenResult = await client.query(
        `
        SELECT 
          s.id,
          s.name,
          c.name as class_name,
          c.grade_level,
          c.section,
          COUNT(DISTINCT e.id) as total_exams,
          COALESCE(AVG(eg.percentage), 0) as avg_score
        FROM users s
        JOIN parent_student_relations psr ON s.id = psr.student_id
        LEFT JOIN class_memberships cm ON s.id = cm.user_id AND cm.role = 'student'
        LEFT JOIN classes c ON cm.class_id = c.id
        LEFT JOIN exam_grades eg ON s.id = eg.student_id
        LEFT JOIN exams e ON eg.exam_id = e.id
        WHERE psr.parent_id = $1 AND s.role = 'student'
        GROUP BY s.id, s.name, c.name, c.grade_level, c.section
        ORDER BY s.name
      `,
        [userData.id]
      );

      const children = childrenResult.rows.map((child) => ({
        ...child,
        total_exams: parseInt(child.total_exams),
        avg_score: parseFloat(child.avg_score) || 0,
        recent_activity:
          "آزمون اخیر: " + new Date().toLocaleDateString("fa-IR"),
      }));

      // Calculate dashboard stats
      const totalChildren = children.length;
      const totalExams = children.reduce(
        (sum, child) => sum + child.total_exams,
        0
      );
      const avgGrade =
        children.length > 0
          ? children.reduce((sum, child) => sum + child.avg_score, 0) /
            children.length
          : 0;

      // Get upcoming exams count for all children
      const upcomingExamsResult = await client.query(
        `
        SELECT COUNT(*) as upcoming_count
        FROM exams e
        JOIN classes c ON e.class_id = c.id
        JOIN class_memberships cm ON c.id = cm.class_id
        JOIN parent_student_relations psr ON cm.user_id = psr.student_id
        WHERE psr.parent_id = $1 
        AND e.status = 'published'
        AND e.starts_at > NOW()
      `,
        [userData.id]
      );

      const upcomingExams = parseInt(
        upcomingExamsResult.rows[0]?.upcoming_count || 0
      );

      return NextResponse.json({
        totalChildren,
        totalExams,
        avgGrade,
        upcomingExams,
        children,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Parent dashboard API error:", error);
    return NextResponse.json(
      { error: "خطا در بارگذاری اطلاعات داشبورد" },
      { status: 500 }
    );
  }
}
