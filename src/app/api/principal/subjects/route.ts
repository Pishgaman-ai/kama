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

      // Get lessons for the school with teacher count, organized by grade level
      const subjectsResult = await client.query(
        `
        SELECT
          l.id,
          l.title as name,
          '' as code,
          l.description,
          l.grade_level,
          l.created_at,
          COUNT(DISTINCT ta.teacher_id) as teacher_count
        FROM lessons l
        LEFT JOIN teacher_assignments ta ON l.id = ta.subject_id AND ta.removed_at IS NULL
        WHERE l.school_id = $1
        GROUP BY l.id, l.title, l.description, l.grade_level, l.created_at
        ORDER BY l.grade_level, l.title
      `,
        [schoolId]
      );

      const subjects = subjectsResult.rows.map((subject) => ({
        ...subject,
        teacher_count: parseInt(subject.teacher_count) || 0,
      }));

      // Group subjects by grade level
      const subjectsByGrade: { [key: string]: Subject[] } = {};
      subjects.forEach((subject) => {
        const grade = subject.grade_level || "بدون پایه";
        if (!subjectsByGrade[grade]) {
          subjectsByGrade[grade] = [];
        }
        subjectsByGrade[grade].push(subject);
      });

      return NextResponse.json({ subjects: subjectsByGrade });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Subjects API error:", error);
    return NextResponse.json(
      { error: "خطا در بارگذاری دروس" },
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
    const { name, code, description, grade_level } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "نام درس الزامی است" },
        { status: 400 }
      );
    }

    if (!grade_level) {
      return NextResponse.json(
        { error: "پایه تحصیلی الزامی است" },
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

      // Check if lesson with same name already exists
      const existingSubject = await client.query(
        "SELECT id FROM lessons WHERE school_id = $1 AND title = $2 AND grade_level = $3",
        [schoolId, name, grade_level]
      );

      if (existingSubject.rows.length > 0) {
        return NextResponse.json(
          { error: "درس با این نام برای این پایه قبلاً ثبت شده است" },
          { status: 400 }
        );
      }

      // Create the lesson
      const subjectResult = await client.query(
        `
        INSERT INTO lessons (school_id, title, description, grade_level, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title as name, '' as code, grade_level
      `,
        [schoolId, name, description || null, grade_level || null, userData.id]
      );

      return NextResponse.json({
        success: true,
        message: "درس با موفقیت ایجاد شد",
        subject: subjectResult.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create subject API error:", error);
    return NextResponse.json({ error: "خطا در ایجاد درس" }, { status: 500 });
  }
}

// Add PUT endpoint for updating subjects
export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "principal") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const url = new URL(request.url);
    const subjectId = url.pathname.split("/").pop();

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

      // Check if lesson exists and belongs to this school
      const existingSubject = await client.query(
        "SELECT id FROM lessons WHERE id = $1 AND school_id = $2",
        [subjectId, schoolId]
      );

      if (existingSubject.rows.length === 0) {
        return NextResponse.json(
          { error: "درس یافت نشد یا متعلق به این مدرسه نیست" },
          { status: 404 }
        );
      }

      // Check if another lesson with same name already exists (excluding current lesson)
      const duplicateSubject = await client.query(
        "SELECT id FROM lessons WHERE school_id = $1 AND title = $2 AND grade_level = $3 AND id != $4",
        [schoolId, name, grade_level, subjectId]
      );

      if (duplicateSubject.rows.length > 0) {
        return NextResponse.json(
          { error: "درس با این نام برای این پایه قبلاً ثبت شده است" },
          { status: 400 }
        );
      }

      // Update the lesson
      const subjectResult = await client.query(
        `
        UPDATE lessons
        SET title = $1, description = $2, grade_level = $3
        WHERE id = $4 AND school_id = $5
        RETURNING id, title as name, '' as code, grade_level
      `,
        [
          name,
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

// Add DELETE endpoint for deleting subjects
export async function DELETE(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "principal") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const url = new URL(request.url);
    const subjectId = url.pathname.split("/").pop();

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

      // Check if lesson exists and belongs to this school
      const existingSubject = await client.query(
        "SELECT id, title as name FROM lessons WHERE id = $1 AND school_id = $2",
        [subjectId, schoolId]
      );

      if (existingSubject.rows.length === 0) {
        return NextResponse.json(
          { error: "درس یافت نشد یا متعلق به این مدرسه نیست" },
          { status: 404 }
        );
      }

      // Check if lesson is being used in any active teacher assignments
      const assignmentCheck = await client.query(
        "SELECT COUNT(*) as count FROM teacher_assignments WHERE subject_id = $1 AND removed_at IS NULL",
        [subjectId]
      );

      const activeAssignments = parseInt(assignmentCheck.rows[0].count);

      if (activeAssignments > 0) {
        return NextResponse.json(
          { error: "این درس در حال استفاده است و قابل حذف نیست" },
          { status: 400 }
        );
      }

      // Delete the lesson
      const deleteResult = await client.query(
        "DELETE FROM lessons WHERE id = $1 AND school_id = $2",
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
