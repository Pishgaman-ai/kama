import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserById } from "@/lib/auth";

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

    const resolvedParams = await context.params;
    const studentId = resolvedParams.id;

    if (!studentId) {
      return NextResponse.json(
        { error: "شناسه دانش‌آموز الزامی است" },
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

      // Get student with their parents information and grade level
      const studentResult = await client.query(
        `
        SELECT 
          s.id,
          s.name,
          s.national_id,
          s.email,
          s.phone,
          s.profile_picture_url,
          s.created_at,
          s.profile->>'grade_level' as profile_grade_level
        FROM users s
        WHERE s.id = $1 AND s.school_id = $2 AND s.role = 'student'
      `,
        [studentId, schoolId]
      );

      if (studentResult.rows.length === 0) {
        return NextResponse.json(
          { error: "دانش‌آموز یافت نشد" },
          { status: 404 }
        );
      }

      const studentRow = studentResult.rows[0];

      // Get parents for the student
      const parentsResult = await client.query(
        `
        SELECT 
          p.id,
          p.name,
          p.phone,
          p.email,
          psr.relationship
        FROM users p
        JOIN parent_student_relations psr ON p.id = psr.parent_id
        WHERE psr.student_id = $1 AND p.role = 'parent'
      `,
        [studentRow.id]
      );

      // Get all classes the student is assigned to
      const classesResult = await client.query(
        `
        SELECT 
          c.id,
          c.name,
          c.grade_level,
          c.section
        FROM classes c
        JOIN class_memberships cm ON c.id = cm.class_id
        WHERE cm.user_id = $1 AND cm.role = 'student'
      `,
        [studentRow.id]
      );

      const student = {
        ...studentRow,
        // Use profile_grade_level as the grade level
        grade_level: studentRow.profile_grade_level || "",
        classes: classesResult.rows,
        parents: parentsResult.rows,
      };

      return NextResponse.json({ student });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Student API error:", error);
    return NextResponse.json(
      { error: "خطا در بارگذاری اطلاعات دانش‌آموز" },
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

    const resolvedParams = await context.params;
    const studentId = resolvedParams.id;

    if (!studentId) {
      return NextResponse.json(
        { error: "شناسه دانش‌آموز الزامی است" },
        { status: 400 }
      );
    }

    // Handle both JSON and FormData
    let body;
    let studentData;
    let parentsData;
    let profilePictureFile = null;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData
      const formData = await request.formData();

      // Extract profile picture file if present
      const profilePicture = formData.get("profile_picture");
      if (profilePicture instanceof File) {
        profilePictureFile = profilePicture;
      }

      // Parse student data
      const studentDataString = formData.get("student") as string;
      if (studentDataString) {
        studentData = JSON.parse(studentDataString);
      }

      // Parse parents data
      const parentsDataString = formData.get("parents") as string;
      if (parentsDataString) {
        parentsData = JSON.parse(parentsDataString);
      }
    } else {
      // Handle JSON (existing behavior)
      body = await request.json();
      studentData = body.student;
      parentsData = body.parents;
    }

    const { name, national_id, email, grade_level } = studentData;

    // Validation
    if (!name || !national_id || !grade_level) {
      return NextResponse.json(
        { error: "فیلدهای اجباری را پر کنید" },
        { status: 400 }
      );
    }

    // Validate national ID (should be 10 digits)
    if (!/^\d{10}$/.test(national_id)) {
      return NextResponse.json(
        { error: "کد ملی باید ۱۰ رقم باشد" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return NextResponse.json({ error: "ایمیل نامعتبر است" }, { status: 400 });
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

      // Check if student exists and belongs to this school
      const existingStudent = await client.query(
        "SELECT id, profile FROM users WHERE id = $1 AND school_id = $2 AND role = 'student'",
        [studentId, schoolId]
      );

      if (existingStudent.rows.length === 0) {
        return NextResponse.json(
          { error: "دانش‌آموز یافت نشد یا متعلق به این مدرسه نیست" },
          { status: 404 }
        );
      }

      // Check if national_id already exists for another student
      const existingUser = await client.query(
        "SELECT id FROM users WHERE national_id = $1 AND id != $2",
        [national_id, studentId]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: "کد ملی قبلاً برای دانش‌آموز دیگری ثبت شده است" },
          { status: 400 }
        );
      }

      await client.query("BEGIN");

      // Get the existing user data to check for existing profile picture
      const existingUserResult = await client.query(
        "SELECT profile_picture_url FROM users WHERE id = $1 AND school_id = $2 AND role = 'student'",
        [studentId, schoolId]
      );

      if (existingUserResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "دانش‌آموز یافت نشد" },
          { status: 404 }
        );
      }

      const existingProfilePictureUrl =
        existingUserResult.rows[0].profile_picture_url;

      // Handle profile picture upload if provided
      let profilePictureUrl: string | null = null;
      if (profilePictureFile) {
        try {
          // Import the file upload function
          const { uploadFileToStorage } = await import("@/lib/fileUpload");
          profilePictureUrl = await uploadFileToStorage(
            profilePictureFile,
            "users/profile_pictures"
          );
        } catch (uploadError) {
          await client.query("ROLLBACK");
          console.error("Profile picture upload error:", uploadError);
          return NextResponse.json(
            { error: "خطا در آپلود عکس پروفایل" },
            { status: 500 }
          );
        }
      }

      // Update the student
      if (profilePictureUrl) {
        // If a new profile picture was uploaded, update it
        await client.query(
          `
          UPDATE users 
          SET name = $1, national_id = $2, email = $3, profile = jsonb_set(profile, '{grade_level}', to_jsonb($4::text)), profile_picture_url = $5
          WHERE id = $6 AND school_id = $7 AND role = 'student'
          `,
          [
            name,
            national_id,
            email || null,
            grade_level,
            profilePictureUrl,
            studentId,
            schoolId,
          ]
        );
      } else {
        // If no new profile picture, keep the existing one
        await client.query(
          `
          UPDATE users 
          SET name = $1, national_id = $2, email = $3, profile = jsonb_set(profile, '{grade_level}', to_jsonb($4::text))
          WHERE id = $5 AND school_id = $6 AND role = 'student'
          `,
          [name, national_id, email || null, grade_level, studentId, schoolId]
        );
      }

      // If a new profile picture was uploaded and there was an existing one, delete the old one
      if (profilePictureUrl && existingProfilePictureUrl) {
        try {
          // Import the delete function
          const { deleteFileFromStorage } = await import("@/lib/fileUpload");
          await deleteFileFromStorage(existingProfilePictureUrl);
        } catch (deleteError) {
          console.error("Error deleting old profile picture:", deleteError);
          // We don't return an error here because the update was successful
        }
      }

      // Update parent information if provided
      if (parentsData && Array.isArray(parentsData)) {
        // First, get existing parent relationships
        const existingParents = await client.query(
          "SELECT parent_id FROM parent_student_relations WHERE student_id = $1",
          [studentId]
        );

        const existingParentIds = existingParents.rows.map(
          (row) => row.parent_id
        );
        const updatedParentIds: string[] = [];

        // Update or create parents
        for (const parent of parentsData) {
          const { id, name, phone, email, relationship } = parent;

          // Validate parent data
          if (!name || !phone) {
            await client.query("ROLLBACK");
            return NextResponse.json(
              { error: "اطلاعات والد ناقص است" },
              { status: 400 }
            );
          }

          // Validate phone format
          if (!/^09\d{9}$/.test(phone)) {
            await client.query("ROLLBACK");
            return NextResponse.json(
              { error: "شماره همراه والد نامعتبر است" },
              { status: 400 }
            );
          }

          // Validate email format if provided
          if (email && !emailRegex.test(email)) {
            await client.query("ROLLBACK");
            return NextResponse.json(
              { error: "ایمیل والد نامعتبر است" },
              { status: 400 }
            );
          }

          let parentId: string;
          if (id) {
            // Update existing parent
            await client.query(
              "UPDATE users SET name = $1, phone = $2, email = $3 WHERE id = $4 AND school_id = $5 AND role = 'parent'",
              [name, phone, email || null, id, schoolId]
            );
            // Update parent's password to their phone number
            const bcrypt = await import("bcryptjs");
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(phone, saltRounds);
            await client.query(
              "UPDATE users SET password_hash = $1 WHERE id = $2",
              [passwordHash, id]
            );
            parentId = id;
          } else {
            // Create new parent with password set to phone number
            const bcrypt = await import("bcryptjs");
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(phone, saltRounds);
            const newParent = await client.query(
              "INSERT INTO users (school_id, name, phone, email, role, is_active, password_hash) VALUES ($1, $2, $3, $4, 'parent', true, $5) RETURNING id",
              [schoolId, name, phone, email || null, passwordHash]
            );
            parentId = newParent.rows[0].id;
          }

          updatedParentIds.push(parentId);

          // Update or create parent-student relationship
          await client.query(
            `
            INSERT INTO parent_student_relations (parent_id, student_id, relationship)
            VALUES ($1, $2, $3)
            ON CONFLICT (parent_id, student_id) 
            DO UPDATE SET relationship = $3
            `,
            [parentId, studentId, relationship || "father"]
          );
        }

        // Remove any parent relationships that are no longer present
        const parentsToRemove = existingParentIds.filter(
          (id) => !updatedParentIds.includes(id)
        );
        if (parentsToRemove.length > 0) {
          await client.query(
            "DELETE FROM parent_student_relations WHERE student_id = $1 AND parent_id = ANY($2)",
            [studentId, parentsToRemove]
          );
        }
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "اطلاعات دانش‌آموز و والدین با موفقیت به‌روزرسانی شد",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Update student API error:", error);
      return NextResponse.json(
        { error: "خطا در به‌روزرسانی اطلاعات دانش‌آموز" },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update student API error:", error);
    return NextResponse.json(
      { error: "خطا در ارتباط با سرور" },
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
    const studentId = resolvedParams.id;

    if (!studentId) {
      return NextResponse.json(
        { error: "شناسه دانش‌آموز الزامی است" },
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

      // Check if student exists and belongs to this school
      const existingStudent = await client.query(
        "SELECT id FROM users WHERE id = $1 AND school_id = $2 AND role = 'student'",
        [studentId, schoolId]
      );

      if (existingStudent.rows.length === 0) {
        return NextResponse.json(
          { error: "دانش‌آموز یافت نشد یا متعلق به این مدرسه نیست" },
          { status: 404 }
        );
      }

      await client.query("BEGIN");

      // Delete parent-student relationships
      await client.query(
        "DELETE FROM parent_student_relations WHERE student_id = $1",
        [studentId]
      );

      // Remove student from classes
      await client.query(
        "DELETE FROM class_memberships WHERE user_id = $1 AND role = 'student'",
        [studentId]
      );

      // Delete the student
      await client.query(
        "DELETE FROM users WHERE id = $1 AND school_id = $2 AND role = 'student'",
        [studentId, schoolId]
      );

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "دانش‌آموز با موفقیت حذف شد",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Delete student API error:", error);
      return NextResponse.json(
        { error: "خطا در حذف دانش‌آموز" },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Delete student API error:", error);
    return NextResponse.json(
      { error: "خطا در ارتباط با سرور" },
      { status: 500 }
    );
  }
}
