import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function POST(
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

    // Await params before accessing properties
    const resolvedParams = await context.params;
    const classId = resolvedParams.id;

    if (!classId) {
      return NextResponse.json(
        { error: "شناسه کلاس الزامی است" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { studentIds } = body;

    // Validation
    if (!studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { error: "لیست دانش‌آموزان الزامی است" },
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
        "SELECT id, grade_level FROM classes WHERE id = $1 AND school_id = $2",
        [classId, schoolId]
      );

      if (existingClass.rows.length === 0) {
        return NextResponse.json(
          { error: "کلاس یافت نشد یا متعلق به این مدرسه نیست" },
          { status: 404 }
        );
      }

      const classGradeLevel = existingClass.rows[0].grade_level;

      await client.query("BEGIN");

      // If studentIds is empty, remove all students from the class
      if (studentIds.length === 0) {
        await client.query(
          `DELETE FROM class_memberships 
           WHERE class_id = $1 AND role = 'student'`,
          [classId]
        );
      } else {
        // Get currently assigned students
        const currentStudentsResult = await client.query(
          `SELECT user_id FROM class_memberships 
           WHERE class_id = $1 AND role = 'student'`,
          [classId]
        );

        const currentStudentIds = currentStudentsResult.rows.map(
          (row) => row.user_id
        );

        // Find students to add (in new list but not in current)
        const studentsToAdd = studentIds.filter(
          (id) => !currentStudentIds.includes(id)
        );

        // Find students to remove (in current but not in new list)
        const studentsToRemove = currentStudentIds.filter(
          (id) => !studentIds.includes(id)
        );

        // Add new students
        for (const studentId of studentsToAdd) {
          // Verify student exists and belongs to the same school
          const studentResult = await client.query(
            `SELECT id, name, school_id
             FROM users
             WHERE id = $1
             AND school_id = $2
             AND role = 'student'
             AND is_active = true`,
            [studentId, schoolId]
          );

          if (studentResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json(
              {
                error: `دانش‌آموز با شناسه ${studentId} یافت نشد یا متعلق به این مدرسه نیست`,
              },
              { status: 404 }
            );
          }

          // Add student to class (ON CONFLICT prevents duplicate assignments)
          await client.query(
            `INSERT INTO class_memberships (class_id, user_id, role)
             VALUES ($1, $2, 'student')
             ON CONFLICT (class_id, user_id) DO NOTHING`,
            [classId, studentId]
          );
        }

        // Remove students
        if (studentsToRemove.length > 0) {
          await client.query(
            `DELETE FROM class_memberships 
             WHERE class_id = $1 AND user_id = ANY($2) AND role = 'student'`,
            [classId, studentsToRemove]
          );
        }
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "تغییرات دانش‌آموزان کلاس با موفقیت ذخیره شد",
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Assign students to class API error:", error);
    return NextResponse.json(
      { error: "خطا در تخصیص دانش‌آموزان به کلاس" },
      { status: 500 }
    );
  }
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

    // Await params before accessing properties
    const resolvedParams = await context.params;
    const classId = resolvedParams.id;

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

      // Get students assigned to this class
      const studentsResult = await client.query(
        `SELECT 
          u.id,
          u.name,
          u.national_id,
          u.email,
          u.profile->>'grade_level' as grade_level
        FROM users u
        JOIN class_memberships cm ON u.id = cm.user_id
        WHERE cm.class_id = $1 AND cm.role = 'student' AND u.role = 'student'
        ORDER BY u.name`,
        [classId]
      );

      // For each student, get all classes they are assigned to
      const students = await Promise.all(
        studentsResult.rows.map(async (student) => {
          const classesResult = await client.query(
            `SELECT 
            c.id,
            c.name,
            c.grade_level,
            c.section
          FROM classes c
          JOIN class_memberships cm ON c.id = cm.class_id
          WHERE cm.user_id = $1 AND cm.role = 'student'`,
            [student.id]
          );

          return {
            ...student,
            classes: classesResult.rows,
          };
        })
      );

      return NextResponse.json({
        students,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get class students API error:", error);
    return NextResponse.json(
      { error: "خطا در بارگذاری دانش‌آموزان کلاس" },
      { status: 500 }
    );
  }
}
