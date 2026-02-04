import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "principal") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const client = await pool.connect();

    try {
      // Get user with school_id
      const userWithSchool = await client.query(
        "SELECT school_id FROM users WHERE id = $1",
        [userData.id]
      );

      if (userWithSchool.rows.length === 0) {
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const schoolId = userWithSchool.rows[0].school_id;

      // Get classes for the school with student count
      const classesResult = await client.query(
        `
        SELECT
          c.id,
          c.name,
          c.grade_level,
          c.section,
          c.academic_year,
          c.description,
          c.created_at,
          COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.role = 'student') as student_count
        FROM classes c
        LEFT JOIN class_memberships cm ON c.id = cm.class_id
        WHERE c.school_id = $1
        GROUP BY c.id
        ORDER BY c.grade_level, c.section, c.name
      `,
        [schoolId]
      );

      // Get all teacher assignments for all classes in one query (eliminates N+1 problem)
      const classIds = classesResult.rows.map((cls) => cls.id);
      const assignmentsResult = await client.query(
        `
        SELECT
          ta.class_id,
          ta.teacher_id,
          ta.subject_id,
          u.name as teacher_name,
          CASE
            WHEN l.grade_level IN ('هفتم', 'هشتم', 'نهم') THEN CONCAT(l.title, ' ', l.grade_level, ' متوسطه دوره ۱')
            WHEN l.grade_level IN ('دهم', 'یازدهم', 'دوازدهم') THEN CONCAT(l.title, ' ', l.grade_level, ' متوسطه دوره ۲')
            ELSE CONCAT(l.title, ' ', l.grade_level, ' دبستان')
          END as subject_name
        FROM teacher_assignments ta
        JOIN users u ON ta.teacher_id = u.id
        LEFT JOIN lessons l ON ta.subject_id = l.id
        WHERE ta.class_id = ANY($1) AND ta.removed_at IS NULL
      `,
        [classIds]
      );

      // Group assignments by class_id
      const assignmentsByClass: { [key: string]: any[] } = {};
      assignmentsResult.rows.forEach((assignment) => {
        if (!assignmentsByClass[assignment.class_id]) {
          assignmentsByClass[assignment.class_id] = [];
        }
        assignmentsByClass[assignment.class_id].push({
          teacher_id: assignment.teacher_id,
          subject_id: assignment.subject_id,
          teacher_name: assignment.teacher_name,
          subject_name: assignment.subject_name,
        });
      });

      // Combine classes with their assignments
      const classes = classesResult.rows.map((cls) => ({
        ...cls,
        student_count: parseInt(cls.student_count) || 0,
        teacher_assignments: assignmentsByClass[cls.id] || [],
      }));

      return NextResponse.json({ classes });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Classes API error:", error);
    return NextResponse.json(
      { error: "خطا در بارگذاری کلاس‌ها" },
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

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "principal") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      grade_level,
      section,
      academic_year,
      description,
      teacher_assignments,
    } = body;

    // Validation
    if (!name || !grade_level) {
      return NextResponse.json(
        { error: "نام کلاس و پایه تحصیلی الزامی است" },
        { status: 400 }
      );
    }

    // Validate teacher assignments - both teacher_id and subject_id are required
    if (teacher_assignments && teacher_assignments.length > 0) {
      for (const assignment of teacher_assignments) {
        if (!assignment.teacher_id || !assignment.subject_id) {
          return NextResponse.json(
            { error: "لطفاً تمام اطلاعات معلمان و دروس را کامل کنید" },
            { status: 400 }
          );
        }
      }
    }

    const client = await pool.connect();

    try {
      // Get user with school_id
      const userWithSchool = await client.query(
        "SELECT school_id FROM users WHERE id = $1",
        [userData.id]
      );

      if (userWithSchool.rows.length === 0) {
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const schoolId = userWithSchool.rows[0].school_id;

      await client.query("BEGIN");

      // Create the class
      const classResult = await client.query(
        `
        INSERT INTO classes (school_id, name, grade_level, section, academic_year, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
        [
          schoolId,
          name,
          grade_level,
          section || null,
          academic_year || new Date().getFullYear().toString(),
          description || null,
        ]
      );

      const classId = classResult.rows[0].id;

      // Create teacher assignments if provided
      if (teacher_assignments && teacher_assignments.length > 0) {
        for (const assignment of teacher_assignments) {
          // Verify that the lesson exists (subject_id actually refers to lesson_id)
          const lessonCheck = await client.query(
            `SELECT id FROM lessons WHERE id = $1 AND school_id = $2`,
            [assignment.subject_id, schoolId]
          );

          // Only insert if we have valid IDs and the lesson exists
          if (lessonCheck.rows.length > 0 && assignment.teacher_id) {
            await client.query(
              `
              INSERT INTO teacher_assignments (class_id, teacher_id, subject_id)
              VALUES ($1, $2, $3)
            `,
              [classId, assignment.teacher_id, assignment.subject_id]
            );

            // Also add teacher to class_memberships table for dashboard statistics
            await client.query(
              `
              INSERT INTO class_memberships (class_id, user_id, role)
              VALUES ($1, $2, 'teacher')
              ON CONFLICT (class_id, user_id) DO NOTHING
            `,
              [classId, assignment.teacher_id]
            );
          }
        }
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "کلاس با موفقیت ایجاد شد",
        class: {
          id: classId,
          name,
          grade_level,
          section,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create class API error:", error);
    return NextResponse.json({ error: "خطا در ایجاد کلاس" }, { status: 500 });
  }
}
