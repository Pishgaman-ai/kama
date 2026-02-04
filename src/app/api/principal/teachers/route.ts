import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserById } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { encryptPassword } from "@/lib/passwordEncryption";

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

      // Get all teachers (both active and inactive) with their class and student counts
      const teachersResult = await client.query(
        `
        SELECT
          t.id,
          t.name,
          t.phone,
          t.email,
          t.national_id,
          t.is_active,
          t.created_at,
          COUNT(DISTINCT ta.class_id) as classes_count,
          COUNT(DISTINCT cm_students.user_id) as students_count
        FROM users t
        LEFT JOIN teacher_assignments ta ON t.id = ta.teacher_id AND ta.removed_at IS NULL
        LEFT JOIN class_memberships cm_students ON ta.class_id = cm_students.class_id AND cm_students.role = 'student'
        WHERE t.school_id = $1 AND t.role = 'teacher'
        GROUP BY t.id, t.name, t.phone, t.email, t.national_id, t.is_active, t.created_at
        ORDER BY t.is_active DESC, t.created_at DESC
      `,
        [schoolId]
      );

      // Get subject names for each teacher
      const subjectsResult = await client.query(
        `
        SELECT 
          ta.teacher_id,
          STRING_AGG(s.name, ', ') as subject_names
        FROM teacher_assignments ta
        JOIN subjects s ON ta.subject_id = s.id
        WHERE ta.teacher_id = ANY($1) AND ta.removed_at IS NULL
        GROUP BY ta.teacher_id
      `,
        [teachersResult.rows.map((t: { id: string }) => t.id)]
      );

      // Create a map of teacher_id to subject names
      const teacherSubjectsMap: { [key: string]: string } = {};
      subjectsResult.rows.forEach(
        (row: { teacher_id: string; subject_names: string }) => {
          teacherSubjectsMap[row.teacher_id] = row.subject_names;
        }
      );

      const teachers = teachersResult.rows.map(
        (teacher: {
          id: string;
          name: string;
          phone: string;
          email: string;
          national_id: string;
          is_active: boolean;
          created_at: string;
          classes_count: string;
          students_count: string;
        }) => ({
          ...teacher,
          classes_count: parseInt(teacher.classes_count) || 0,
          students_count: parseInt(teacher.students_count) || 0,
          subjects: teacherSubjectsMap[teacher.id]
            ? teacherSubjectsMap[teacher.id].split(", ")
            : [],
        })
      );

      return NextResponse.json({ teachers });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Teachers API error:", error);
    return NextResponse.json(
      {
        error:
          "مشکلی در دریافت لیست معلمان رخ داده است. لطفاً مجدداً تلاش کنید.",
      },
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
    const { name, phone, email, password, subjects, national_id } = body;

    // Validation
    if (!name || !phone) {
      return NextResponse.json(
        { error: "نام و شماره همراه اجباری است" },
        { status: 400 }
      );
    }

    // Validate phone number
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "شماره همراه نامعتبر است" },
        { status: 400 }
      );
    }

    // Validate national_id if provided (10 digits)
    if (national_id) {
      const nationalIdRegex = /^\d{10}$/;
      if (!nationalIdRegex.test(national_id)) {
        return NextResponse.json(
          { error: "کد ملی باید 10 رقم باشد" },
          { status: 400 }
        );
      }
    }

    // If email is provided, validate it and require password
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "ایمیل نامعتبر است" },
          { status: 400 }
        );
      }

      if (!password) {
        return NextResponse.json(
          { error: "در صورت وارد کردن ایمیل، رمز عبور اجباری است" },
          { status: 400 }
        );
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

      // Check if phone number already exists
      const existingPhone = await client.query(
        "SELECT id FROM users WHERE phone = $1",
        [phone]
      );

      if (existingPhone.rows.length > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "شماره همراه قبلاً ثبت شده است" },
          { status: 400 }
        );
      }

      // Check if email already exists (if provided)
      if (email) {
        const existingEmail = await client.query(
          "SELECT id FROM users WHERE email = $1",
          [email]
        );

        if (existingEmail.rows.length > 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "ایمیل قبلاً ثبت شده است" },
            { status: 400 }
          );
        }
      }

      // Check if national_id already exists (if provided)
      if (national_id) {
        const existingNationalId = await client.query(
          "SELECT id FROM users WHERE national_id = $1",
          [national_id]
        );

        if (existingNationalId.rows.length > 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "کد ملی قبلاً ثبت شده است" },
            { status: 400 }
          );
        }
      }

      // Hash password if provided, or use phone as default
      const actualPassword = password || phone;
      let passwordHash = null;
      let encryptedInitialPassword = null;

      if (actualPassword) {
        const saltRounds = 12;
        passwordHash = await bcrypt.hash(actualPassword, saltRounds);
        // Also encrypt the initial password for later retrieval
        encryptedInitialPassword = encryptPassword(actualPassword);
      }

      // Create the teacher
      const teacherResult = await client.query(
        `
        INSERT INTO users (school_id, name, phone, email, national_id, password_hash, initial_password, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'teacher', true)
        RETURNING id
      `,
        [
          schoolId,
          name,
          phone,
          email || null,
          national_id || null,
          passwordHash,
          encryptedInitialPassword,
        ]
      );

      const teacherId = teacherResult.rows[0].id;

      // Note: Subject associations will be handled when creating exams
      // For now, we just create the teacher account

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "معلم با موفقیت اضافه شد",
        teacher: {
          id: teacherId,
          name,
          phone,
          email: email || null,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create teacher API error:", error);
    return NextResponse.json(
      { error: "خطا در افزودن معلم. لطفاً مجدداً تلاش کنید." },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { id, name, phone, email, subjects, is_active, national_id } = body;

    // Validation
    if (!id || !name || !phone) {
      return NextResponse.json(
        { error: "شناسه، نام و شماره همراه اجباری است" },
        { status: 400 }
      );
    }

    // Validate phone number
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "شماره همراه نامعتبر است" },
        { status: 400 }
      );
    }

    // Validate national_id if provided (10 digits)
    if (national_id) {
      const nationalIdRegex = /^\d{10}$/;
      if (!nationalIdRegex.test(national_id)) {
        return NextResponse.json(
          { error: "کد ملی باید 10 رقم باشد" },
          { status: 400 }
        );
      }
    }

    // If email is provided, validate it
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "ایمیل نامعتبر است" },
          { status: 400 }
        );
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

      // Check if phone number already exists for another teacher
      const existingPhone = await client.query(
        "SELECT id FROM users WHERE phone = $1 AND id != $2",
        [phone, id]
      );

      if (existingPhone.rows.length > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "شماره همراه قبلاً ثبت شده است" },
          { status: 400 }
        );
      }

      // Check if email already exists for another teacher (if provided)
      if (email) {
        const existingEmail = await client.query(
          "SELECT id FROM users WHERE email = $1 AND id != $2",
          [email, id]
        );

        if (existingEmail.rows.length > 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "ایمیل قبلاً ثبت شده است" },
            { status: 400 }
          );
        }
      }

      // Check if national_id already exists for another teacher (if provided)
      if (national_id) {
        const existingNationalId = await client.query(
          "SELECT id FROM users WHERE national_id = $1 AND id != $2",
          [national_id, id]
        );

        if (existingNationalId.rows.length > 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "کد ملی قبلاً ثبت شده است" },
            { status: 400 }
          );
        }
      }

      // Update the teacher
      const updateQuery = `
        UPDATE users
        SET name = $1, phone = $2, email = $3, national_id = $4, is_active = $5
        WHERE id = $6 AND school_id = $7 AND role = 'teacher'
        RETURNING id
      `;

      const updateResult = await client.query(updateQuery, [
        name,
        phone,
        email || null,
        national_id || null,
        is_active,
        id,
        schoolId,
      ]);

      if (updateResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "معلم یافت نشد یا دسترسی ندارید" },
          { status: 404 }
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "اطلاعات معلم با موفقیت به‌روزرسانی شد",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update teacher API error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی اطلاعات معلم. لطفاً مجدداً تلاش کنید." },
      { status: 500 }
    );
  }
}

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

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("id");

    if (!teacherId) {
      return NextResponse.json(
        { error: "شناسه معلم الزامی است" },
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

      await client.query("BEGIN");

      // Check if teacher exists and belongs to this school
      const teacherCheck = await client.query(
        "SELECT id FROM users WHERE id = $1 AND school_id = $2 AND role = 'teacher'",
        [teacherId, schoolId]
      );

      if (teacherCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "معلم یافت نشد یا دسترسی ندارید" },
          { status: 404 }
        );
      }

      // Delete teacher assignments first (cascade)
      await client.query(
        "DELETE FROM teacher_assignments WHERE teacher_id = $1",
        [teacherId]
      );

      // Delete the teacher completely
      const deleteResult = await client.query(
        "DELETE FROM users WHERE id = $1 AND school_id = $2 AND role = 'teacher'",
        [teacherId, schoolId]
      );

      if (deleteResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "معلم یافت نشد یا دسترسی ندارید" },
          { status: 404 }
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "معلم با موفقیت حذف شد",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Delete teacher error:", error);
      return NextResponse.json({ error: "خطا در حذف معلم" }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Delete teacher API error:", error);
    return NextResponse.json({ error: "خطا در حذف معلم" }, { status: 500 });
  }
}

// Add a new endpoint for deactivating teachers
export async function PATCH(request: NextRequest) {
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
    const { id, is_active } = body;

    // Validation
    if (!id) {
      return NextResponse.json(
        { error: "شناسه معلم الزامی است" },
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

      await client.query("BEGIN");

      // Update teacher's active status
      const updateQuery = `
        UPDATE users 
        SET is_active = $1
        WHERE id = $2 AND school_id = $3 AND role = 'teacher'
        RETURNING id
      `;

      const updateResult = await client.query(updateQuery, [
        is_active,
        id,
        schoolId,
      ]);

      if (updateResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "معلم یافت نشد یا دسترسی ندارید" },
          { status: 404 }
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: is_active
          ? "معلم با موفقیت فعال شد"
          : "معلم با موفقیت غیرفعال شد",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Update teacher status error:", error);
      return NextResponse.json(
        { error: "خطا در به‌روزرسانی وضعیت معلم" },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update teacher status API error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی وضعیت معلم. لطفاً مجدداً تلاش کنید." },
      { status: 500 }
    );
  }
}
