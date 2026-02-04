import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

// Define the subject interface
interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  grade_level: string;
  created_at: string;
  teacher_count: number;
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

    const resolvedParams = await context.params;
    const subjectId = resolvedParams.id;

    if (!subjectId) {
      return NextResponse.json(
        { error: "شناسه درس الزامی است" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, code, description, grade_level } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "نام درس الزامی است" },
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

      // Check if subject exists and belongs to this school
      const existingSubject = await client.query(
        "SELECT id FROM subjects WHERE id = $1 AND school_id = $2",
        [subjectId, schoolId]
      );

      if (existingSubject.rows.length === 0) {
        return NextResponse.json(
          { error: "درس یافت نشد یا متعلق به این مدرسه نیست" },
          { status: 404 }
        );
      }

      // Check if another subject with same name already exists (excluding current subject)
      const duplicateSubject = await client.query(
        "SELECT id FROM subjects WHERE school_id = $1 AND name = $2 AND id != $3",
        [schoolId, name, subjectId]
      );

      if (duplicateSubject.rows.length > 0) {
        return NextResponse.json(
          { error: "درس با این نام قبلاً ثبت شده است" },
          { status: 400 }
        );
      }

      // Check if code already exists (if provided, excluding current subject)
      if (code) {
        const duplicateCode = await client.query(
          "SELECT id FROM subjects WHERE school_id = $1 AND code = $2 AND id != $3",
          [schoolId, code, subjectId]
        );

        if (duplicateCode.rows.length > 0) {
          return NextResponse.json(
            { error: "کد درس قبلاً استفاده شده است" },
            { status: 400 }
          );
        }
      }

      // Update the subject
      const subjectResult = await client.query(
        `
        UPDATE subjects 
        SET name = $1, code = $2, description = $3, grade_level = $4
        WHERE id = $5 AND school_id = $6
        RETURNING id, name, code, grade_level
      `,
        [
          name,
          code || null,
          description || null,
          grade_level || null,
          subjectId,
          schoolId,
        ]
      );

      if (subjectResult.rowCount === 0) {
        return NextResponse.json(
          { error: "خطا در بروزرسانی درس" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "درس با موفقیت بروزرسانی شد",
        subject: subjectResult.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update subject API error:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی درس" },
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

    const resolvedParams = await context.params;
    const subjectId = resolvedParams.id;

    if (!subjectId) {
      return NextResponse.json(
        { error: "شناسه درس الزامی است" },
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

      // Check if subject exists and belongs to this school
      const existingSubject = await client.query(
        "SELECT id FROM subjects WHERE id = $1 AND school_id = $2",
        [subjectId, schoolId]
      );

      if (existingSubject.rows.length === 0) {
        return NextResponse.json(
          { error: "درس یافت نشد یا متعلق به این مدرسه نیست" },
          { status: 404 }
        );
      }

      // Check if subject is assigned to any teachers
      const assignedTeachers = await client.query(
        "SELECT COUNT(*) as count FROM teacher_assignments WHERE subject_id = $1 AND removed_at IS NULL",
        [subjectId]
      );

      if (parseInt(assignedTeachers.rows[0].count) > 0) {
        return NextResponse.json(
          {
            error:
              "این درس به معلمانی اختصاص داده شده است و نمی‌توان آن را حذف کرد",
          },
          { status: 400 }
        );
      }

      // Delete the subject
      const deleteResult = await client.query(
        "DELETE FROM subjects WHERE id = $1 AND school_id = $2",
        [subjectId, schoolId]
      );

      if (deleteResult.rowCount === 0) {
        return NextResponse.json({ error: "خطا در حذف درس" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "درس با موفقیت حذف شد",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Delete subject API error:", error);
    return NextResponse.json({ error: "خطا در حذف درس" }, { status: 500 });
  }
}
