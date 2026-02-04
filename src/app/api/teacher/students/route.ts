import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    // Get user from session cookie
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    console.log("GET students - User from session:", {
      id: user.id,
      role: user.role,
    });
    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "دسترسی محدود به معلمان" },
        { status: 403 }
      );
    }

    const client = await pool.connect();

    try {
      // Get all students from the same school as the teacher
      console.log("Fetching students for teacher:", user.id);
      const studentsResult = await client.query(
        `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.national_id,
          u.is_active,
          u.created_at,
          COUNT(DISTINCT cm.class_id) as class_count
        FROM users u
        LEFT JOIN class_memberships cm ON u.id = cm.user_id AND cm.role = 'student'
        WHERE u.role = 'student' 
          AND u.school_id = (SELECT school_id FROM users WHERE id = $1)
        GROUP BY u.id, u.name, u.email, u.national_id, u.is_active, u.created_at
        ORDER BY u.created_at DESC
      `,
        [user.id]
      );

      console.log("Students query result:", {
        rowCount: studentsResult.rowCount,
        rows: studentsResult.rows,
      });

      const students = studentsResult.rows.map((student) => ({
        ...student,
        class_count: parseInt(student.class_count),
        created_at: student.created_at ? new Date(student.created_at).toLocaleString("fa-IR") : null,
      }));

      return NextResponse.json({
        success: true,
        data: { students },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Students API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات دانش‌آموزان" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, national_id, email } = body;

    // Validate required fields
    if (!name || !national_id) {
      return NextResponse.json(
        { error: "نام و کد ملی الزامی است" },
        { status: 400 }
      );
    }

    // Validate Iranian national ID format (10 digits)
    if (!/^\d{10}$/.test(national_id)) {
      return NextResponse.json(
        { error: "کد ملی باید ۱۰ رقم باشد" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Get teacher's school_id
      const userResult = await client.query(
        "SELECT school_id FROM users WHERE id = $1",
        [user.id]
      );

      console.log("Teacher school_id query result:", userResult.rows);

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const school_id = userResult.rows[0].school_id;
      console.log("Using school_id for student creation:", school_id);

      // Check for duplicate name in the same school
      const duplicateNameCheck = await client.query(
        "SELECT id FROM users WHERE name = $1 AND school_id = $2 AND role = 'student'",
        [name.trim(), school_id]
      );

      if (duplicateNameCheck.rows.length > 0) {
        return NextResponse.json(
          { error: "دانش‌آموزی با این نام از قبل وجود دارد" },
          { status: 400 }
        );
      }

      // Check for duplicate national ID (global check)
      const duplicateNationalIdCheck = await client.query(
        "SELECT id FROM users WHERE national_id = $1",
        [national_id]
      );

      if (duplicateNationalIdCheck.rows.length > 0) {
        return NextResponse.json(
          { error: "دانش‌آموزی با این کد ملی از قبل وجود دارد" },
          { status: 400 }
        );
      }

      // Create new student
      const hashedPassword = await bcrypt.hash(national_id, 12); // Use national ID as password
      const studentEmail = email || `${national_id}@student.local`;

      const studentResult = await client.query(
        `
        INSERT INTO users (school_id, email, password_hash, name, national_id, role, profile)
        VALUES ($1, $2, $3, $4, $5, 'student', '{"created_by": "teacher"}'::jsonb)
        RETURNING id, name, email, national_id, is_active, created_at, school_id
      `,
        [school_id, studentEmail, hashedPassword, name.trim(), national_id]
      );

      const newStudent = studentResult.rows[0];
      console.log("Created student:", newStudent);

      return NextResponse.json({
        success: true,
        message: "دانش‌آموز با موفقیت ایجاد شد",
        data: {
          student: {
            ...newStudent,
            class_count: 0,
            created_at: newStudent.created_at ? new Date(newStudent.created_at).toLocaleString("fa-IR") : null,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    console.error("Create student API error:", error);

    // Check for unique constraint violations
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      if ("constraint" in error && typeof error.constraint === "string") {
        if (error.constraint.includes("email")) {
          return NextResponse.json(
            { error: "ایمیل تکراری است" },
            { status: 400 }
          );
        }
        if (error.constraint.includes("national_id")) {
          return NextResponse.json(
            { error: "کد ملی تکراری است" },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "خطا در ایجاد دانش‌آموز" },
      { status: 500 }
    );
  }
}
