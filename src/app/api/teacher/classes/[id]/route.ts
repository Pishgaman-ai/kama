import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

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

      if (subjectId && subjectId !== 'null' && subjectId !== 'undefined') {
        // If subjectId is provided, verify teacher has access to this specific class-subject combination
        const accessCheck = await client.query(
          `
          SELECT ta.id, u.name as teacher_name,
                 l.title as subject_name, l.id as subject_id,
                 ta.subject as assignment_subject,
                 c.name as class_name, c.subject as class_subject
          FROM teacher_assignments ta
          JOIN users u ON ta.teacher_id = u.id
          JOIN classes c ON ta.class_id = c.id
          LEFT JOIN lessons l ON ta.subject_id = l.id
          WHERE ta.class_id = $1 AND ta.teacher_id = $2
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

        const row = accessCheck.rows[0];
        subjectInfo = {
          ...row,
          subject_name: row.subject_name || row.assignment_subject || row.class_subject || `${row.class_name} (چند درسی)`,
          subject_id: row.subject_id
        };
      } else {
        // If no subjectId is provided (or it's null), get the first assignment for this class
        const accessCheck = await client.query(
          `
          SELECT ta.id, u.name as teacher_name,
                 l.title as subject_name, l.id as subject_id,
                 ta.subject as assignment_subject,
                 c.name as class_name, c.subject as class_subject
          FROM teacher_assignments ta
          JOIN users u ON ta.teacher_id = u.id
          JOIN classes c ON ta.class_id = c.id
          LEFT JOIN lessons l ON ta.subject_id = l.id
          WHERE ta.class_id = $1 AND ta.teacher_id = $2 AND ta.removed_at IS NULL
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

        const row = accessCheck.rows[0];
        subjectInfo = {
          ...row,
          subject_name: row.subject_name || row.assignment_subject || row.class_subject || `${row.class_name} (چند درسی)`,
          subject_id: row.subject_id
        };
      }

      // Get class details with optional school information
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
          s.name as school_name
        FROM classes c
        LEFT JOIN schools s ON c.school_id = s.id
        WHERE c.id = $1
        `,
        [classId]
      );

      if (classResult.rows.length === 0) {
        return NextResponse.json({ error: "کلاس یافت نشد" }, { status: 404 });
      }

      const classData = classResult.rows[0];

      // Get students in this class
      const studentsResult = await client.query(
        `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.national_id,
          u.is_active,
          cm.joined_at,
          u.created_at
        FROM class_memberships cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.class_id = $1 AND cm.role = 'student'
        ORDER BY u.name
        `,
        [classId]
      );

      const students = studentsResult.rows.map(
        (student: {
          id: string;
          name: string;
          email: string;
          national_id: string;
          is_active: boolean;
          joined_at: string;
          created_at: string;
        }) => ({
          ...student,
          joined_at: student.joined_at ? new Date(student.joined_at).toLocaleString("fa-IR") : null,
          created_at: student.created_at ? new Date(student.created_at).toLocaleString("fa-IR") : null,
        })
      );

      console.log("Successfully returning class data");

      return NextResponse.json({
        success: true,
        data: {
          class: {
            ...classData,
            created_at: classData.created_at ? new Date(classData.created_at).toLocaleString("fa-IR") : null,
          },
          subject: {
            id: subjectInfo.subject_id,
            name: subjectInfo.subject_name,
          },
          students,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Class details API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات کلاس" },
      { status: 500 }
    );
  }
}
