import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

// Helper function to safely get error code
function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const err = error as { code?: string };
    return err.code;
  }
  return undefined;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "principal") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const { id: classId } = await context.params;

    if (!classId) {
      return NextResponse.json(
        { error: "شناسه کلاس الزامی است" },
        { status: 400 }
      );
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

      // Get the specific class with student count and teacher assignments
      const classResult = await client.query(
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
        WHERE c.id = $1 AND c.school_id = $2
        GROUP BY c.id
      `,
        [classId, schoolId]
      );

      if (classResult.rows.length === 0) {
        return NextResponse.json(
          { error: "کلاس یافت نشد یا متعلق به این مدرسه نیست" },
          { status: 404 }
        );
      }

      const cls = classResult.rows[0];

      // Get teacher assignments for the class with subject information
      const assignmentsResult = await client.query(
        `
        SELECT
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
        WHERE ta.class_id = $1 AND ta.removed_at IS NULL
      `,
        [classId]
      );

      const classData = {
        ...cls,
        student_count: parseInt(cls.student_count) || 0,
        teacher_assignments: assignmentsResult.rows,
      };

      return NextResponse.json({ class: classData });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get class API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات کلاس" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "principal") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const { id: classId } = await context.params;

    if (!classId) {
      return NextResponse.json(
        { error: "شناسه کلاس الزامی است" },
        { status: 400 }
      );
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

      // Check if class exists and belongs to this school
      const existingClass = await client.query(
        "SELECT id FROM classes WHERE id = $1 AND school_id = $2",
        [classId, schoolId]
      );

      if (existingClass.rows.length === 0) {
        return NextResponse.json(
          { error: "کلاس یافت نشد یا متعلق به این مدرسه نیست" },
          { status: 404 }
        );
      }

      await client.query("BEGIN");

      // Update the class
      await client.query(
        `
        UPDATE classes 
        SET name = $1, grade_level = $2, section = $3, academic_year = $4, description = $5
        WHERE id = $6 AND school_id = $7
      `,
        [
          name,
          grade_level,
          section || null,
          academic_year || new Date().getFullYear().toString(),
          description || null,
          classId,
          schoolId,
        ]
      );

      // Remove existing teacher assignments (soft delete)
      await client.query(
        "UPDATE teacher_assignments SET removed_at = NOW() WHERE class_id = $1",
        [classId]
      );

      // Create new teacher assignments if provided
      if (teacher_assignments && teacher_assignments.length > 0) {
        for (const assignment of teacher_assignments) {
          console.log('[API] Processing assignment:', {
            teacher_id: assignment.teacher_id,
            subject_id: assignment.subject_id,
            class_id: classId,
            school_id: schoolId
          });

          // Verify that the lesson exists (subject_id actually refers to lesson_id)
          const lessonCheck = await client.query(
            `SELECT id, title FROM lessons WHERE id = $1 AND school_id = $2`,
            [assignment.subject_id, schoolId]
          );

          console.log('[API] Lesson check result:', lessonCheck.rows.length, 'rows');

          // Only insert if we have valid IDs and the lesson exists
          if (lessonCheck.rows.length > 0 && assignment.teacher_id) {
            console.log('[API] Inserting assignment for lesson:', lessonCheck.rows[0].title);

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
          } else {
            console.error('[API] Failed to insert assignment:', {
              reason: lessonCheck.rows.length === 0 ? 'Lesson not found' : 'No teacher_id',
              subject_id: assignment.subject_id,
              teacher_id: assignment.teacher_id
            });
          }
        }
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "کلاس با موفقیت بروزرسانی شد",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update class API error:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی کلاس" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "principal") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const { id: classId } = await context.params;

    if (!classId) {
      return NextResponse.json(
        { error: "شناسه کلاس الزامی است" },
        { status: 400 }
      );
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

      // Check if class exists and belongs to this school
      const existingClass = await client.query(
        "SELECT id FROM classes WHERE id = $1 AND school_id = $2",
        [classId, schoolId]
      );

      if (existingClass.rows.length === 0) {
        return NextResponse.json(
          { error: "کلاس یافت نشد یا متعلق به این مدرسه نیست" },
          { status: 404 }
        );
      }

      // Check if class has any students
      const studentCount = await client.query(
        "SELECT COUNT(*) as count FROM class_memberships WHERE class_id = $1 AND role = 'student'",
        [classId]
      );

      if (parseInt(studentCount.rows[0].count) > 0) {
        return NextResponse.json(
          { error: "این کلاس دارای دانش‌آموزانی است و نمی‌توان آن را حذف کرد" },
          { status: 400 }
        );
      }

      await client.query("BEGIN");

      // Soft delete teacher assignments
      await client.query(
        "UPDATE teacher_assignments SET removed_at = NOW() WHERE class_id = $1",
        [classId]
      );

      // Delete the class
      await client.query(
        "DELETE FROM classes WHERE id = $1 AND school_id = $2",
        [classId, schoolId]
      );

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "کلاس با موفقیت حذف شد",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Delete class API error:", error);
    return NextResponse.json({ error: "خطا در حذف کلاس" }, { status: 500 });
  }
}
