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

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "شناسه کلاس الزامی است" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Verify teacher has access to this class
      const classCheck = await client.query(
        `
        SELECT cm.id
        FROM class_memberships cm
        WHERE cm.class_id = $1 AND cm.user_id = $2 AND cm.role = 'teacher'
      `,
        [id, user.id]
      );

      if (classCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "شما دسترسی به این کلاس ندارید" },
          { status: 403 }
        );
      }

      // Get all grades for this class
      const gradesResult = await client.query(
        `
        SELECT 
          cg.id,
          cg.student_id,
          cg.subject_name,
          cg.grade_value,
          cg.max_score,
          cg.percentage,
          cg.grade_letter,
          cg.term,
          cg.description,
          cg.created_at,
          cg.updated_at,
          u.name as student_name,
          u.national_id
        FROM class_grades cg
        JOIN users u ON cg.student_id = u.id
        WHERE cg.class_id = $1
        ORDER BY u.name, cg.subject_name, cg.term
      `,
        [id]
      );

      // Convert numeric values to proper types
      const processedGrades = gradesResult.rows.map((row) => ({
        ...row,
        grade_value: row.grade_value ? parseFloat(row.grade_value) : null,
        max_score: row.max_score ? parseFloat(row.max_score) : null,
        percentage: row.percentage ? parseFloat(row.percentage) : null,
      }));

      // Get class details
      const classResult = await client.query(
        `
        SELECT 
          c.name as class_name,
          c.grade_level
        FROM classes c
        WHERE c.id = $1
      `,
        [id]
      );

      const classInfo = classResult.rows[0];

      // Get students in this class
      const studentsResult = await client.query(
        `
        SELECT 
          u.id as student_id,
          u.name as student_name,
          u.national_id
        FROM users u
        JOIN class_memberships cm ON u.id = cm.user_id
        WHERE cm.class_id = $1 AND cm.role = 'student'
        ORDER BY u.name
      `,
        [id]
      );

      // Get unique subjects for this class
      const subjectsResult = await client.query(
        `
        SELECT DISTINCT subject_name
        FROM class_grades
        WHERE class_id = $1
        ORDER BY subject_name
      `,
        [id]
      );

      // Get unique terms for this class
      const termsResult = await client.query(
        `
        SELECT DISTINCT term
        FROM class_grades
        WHERE class_id = $1 AND term IS NOT NULL
        ORDER BY term
      `,
        [id]
      );

      return NextResponse.json({
        success: true,
        data: {
          class: classInfo,
          grades: processedGrades,
          students: studentsResult.rows,
          subjects: subjectsResult.rows.map((row) => row.subject_name),
          terms: termsResult.rows.map((row) => row.term),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Class grades API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت نمرات کلاس" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "شناسه کلاس الزامی است" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { grades } = body; // Array of grade objects

    if (!grades || !Array.isArray(grades)) {
      return NextResponse.json(
        { error: "اطلاعات نمرات الزامی است" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Verify teacher has access to this class
      const classCheck = await client.query(
        `
        SELECT cm.id
        FROM class_memberships cm
        WHERE cm.class_id = $1 AND cm.user_id = $2 AND cm.role = 'teacher'
      `,
        [id, user.id]
      );

      if (classCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "شما دسترسی به این کلاس ندارید" },
          { status: 403 }
        );
      }

      // Process each grade
      for (const grade of grades) {
        const {
          student_id,
          subject_name,
          grade_value,
          max_score = 100,
          term,
          description,
        } = grade;

        if (!student_id || !subject_name || grade_value === undefined) {
          continue; // Skip invalid grades
        }

        // Calculate percentage and letter grade
        const percentage = Math.min(
          100,
          Math.max(0, (parseFloat(grade_value) / parseFloat(max_score)) * 100)
        );
        let letterGrade = "F";

        if (percentage >= 90) letterGrade = "A";
        else if (percentage >= 80) letterGrade = "B";
        else if (percentage >= 70) letterGrade = "C";
        else if (percentage >= 60) letterGrade = "D";

        // Check if grade already exists
        const existingGrade = await client.query(
          `
          SELECT id FROM class_grades
          WHERE class_id = $1 AND student_id = $2 AND subject_name = $3 AND term = $4
        `,
          [id, student_id, subject_name, term || null]
        );

        if (existingGrade.rows.length > 0) {
          // Update existing grade
          await client.query(
            `
            UPDATE class_grades
            SET grade_value = $1, max_score = $2, percentage = $3, grade_letter = $4, 
                description = $5, updated_at = NOW()
            WHERE class_id = $6 AND student_id = $7 AND subject_name = $8 AND term = $9
          `,
            [
              grade_value,
              max_score,
              percentage,
              letterGrade,
              description,
              id,
              student_id,
              subject_name,
              term || null,
            ]
          );
        } else {
          // Insert new grade
          await client.query(
            `
            INSERT INTO class_grades 
            (class_id, student_id, teacher_id, subject_name, grade_value, max_score, 
             percentage, grade_letter, term, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `,
            [
              id,
              student_id,
              user.id,
              subject_name,
              grade_value,
              max_score,
              percentage,
              letterGrade,
              term || null,
              description,
            ]
          );
        }
      }

      // After saving, fetch the updated grades to return proper numeric types
      const updatedGradesResult = await client.query(
        `
        SELECT 
          cg.id,
          cg.student_id,
          cg.subject_name,
          cg.grade_value,
          cg.max_score,
          cg.percentage,
          cg.grade_letter,
          cg.term,
          cg.description,
          cg.created_at,
          cg.updated_at,
          u.name as student_name,
          u.national_id
        FROM class_grades cg
        JOIN users u ON cg.student_id = u.id
        WHERE cg.class_id = $1
        ORDER BY u.name, cg.subject_name, cg.term
      `,
        [id]
      );

      // Convert numeric values to proper types
      const processedGrades = updatedGradesResult.rows.map((row) => ({
        ...row,
        grade_value: row.grade_value ? parseFloat(row.grade_value) : null,
        max_score: row.max_score ? parseFloat(row.max_score) : null,
        percentage: row.percentage ? parseFloat(row.percentage) : null,
      }));

      return NextResponse.json({
        success: true,
        message: "نمرات با موفقیت ثبت شد",
        data: {
          grades: processedGrades,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Save class grades API error:", error);
    return NextResponse.json(
      { error: "خطا در ثبت نمرات کلاس" },
      { status: 500 }
    );
  }
}
