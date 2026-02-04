import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserById } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { uploadFileToStorage } from "@/lib/fileUpload";

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

    // Get full user data to access school_id
    const user = await getUserById(userData.id);
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
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

      // Get students with their grade level
      const studentsResult = await client.query(
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
        WHERE s.school_id = $1 AND s.role = 'student'
        ORDER BY s.created_at DESC
      `,
        [schoolId]
      );

      const studentIds = studentsResult.rows.map((s) => s.id);

      // Get all parents for all students in one query (eliminates N+1 problem)
      const parentsResult = await client.query(
        `
        SELECT
          p.id,
          p.name,
          p.phone,
          p.email,
          psr.relationship,
          psr.student_id
        FROM users p
        JOIN parent_student_relations psr ON p.id = psr.parent_id
        WHERE psr.student_id = ANY($1) AND p.role = 'parent'
      `,
        [studentIds]
      );

      // Get all classes for all students in one query (eliminates N+1 problem)
      const classesResult = await client.query(
        `
        SELECT
          c.id,
          c.name,
          c.grade_level,
          c.section,
          cm.user_id as student_id
        FROM classes c
        JOIN class_memberships cm ON c.id = cm.class_id
        WHERE cm.user_id = ANY($1) AND cm.role = 'student'
      `,
        [studentIds]
      );

      // Group parents by student_id
      const parentsByStudent: { [key: string]: any[] } = {};
      parentsResult.rows.forEach((parent) => {
        if (!parentsByStudent[parent.student_id]) {
          parentsByStudent[parent.student_id] = [];
        }
        parentsByStudent[parent.student_id].push({
          id: parent.id,
          name: parent.name,
          phone: parent.phone,
          email: parent.email,
          relationship: parent.relationship,
        });
      });

      // Group classes by student_id
      const classesByStudent: { [key: string]: any[] } = {};
      classesResult.rows.forEach((cls) => {
        if (!classesByStudent[cls.student_id]) {
          classesByStudent[cls.student_id] = [];
        }
        classesByStudent[cls.student_id].push({
          id: cls.id,
          name: cls.name,
          grade_level: cls.grade_level,
          section: cls.section,
        });
      });

      // Combine students with their parents and classes
      const students = studentsResult.rows.map((studentRow) => ({
        ...studentRow,
        grade_level: studentRow.profile_grade_level || "",
        classes: classesByStudent[studentRow.id] || [],
        parents: parentsByStudent[studentRow.id] || [],
      }));

      return NextResponse.json({ students });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Students API error:", error);
    return NextResponse.json(
      { error: "خطا در بارگذاری دانش‌آموزان" },
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

    // Handle both JSON and FormData
    let body;
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

      // Helper function to convert empty strings to undefined
      const getValue = (key: string): string | undefined => {
        const value = formData.get(key);
        return value === "" || value === null || value === undefined
          ? undefined
          : String(value);
      };

      body = {
        name: getValue("name") || "",
        national_id: getValue("national_id") || "",
        email: getValue("email"),
        grade_level: getValue("grade_level") || "",
        parent1_name: getValue("parent1_name") || "",
        parent1_phone: getValue("parent1_phone") || "",
        parent1_email: getValue("parent1_email"),
        parent1_relationship: getValue("parent1_relationship") || "father",
        parent2_name: getValue("parent2_name"),
        parent2_phone: getValue("parent2_phone"),
        parent2_email: getValue("parent2_email"),
        parent2_relationship: getValue("parent2_relationship") || "mother",
      };
    } else {
      // Handle JSON (existing behavior)
      body = await request.json();
    }

    const {
      name,
      national_id,
      email,
      grade_level,
      parent1_name,
      parent1_phone,
      parent1_email,
      parent1_relationship,
      parent2_name,
      parent2_phone,
      parent2_email,
      parent2_relationship,
    } = body;

    // Validation
    if (
      !name ||
      !national_id ||
      !grade_level ||
      !parent1_name ||
      !parent1_phone
    ) {
      return NextResponse.json(
        { error: "فیلدهای اجباری را پر کنید" },
        { status: 400 }
      );
    }

    // Validate email formats if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (parent1_email && !emailRegex.test(parent1_email)) {
      return NextResponse.json(
        { error: "ایمیل والد اول نامعتبر است" },
        { status: 400 }
      );
    }

    if (parent2_email && !emailRegex.test(parent2_email)) {
      return NextResponse.json(
        { error: "ایمیل والد دوم نامعتبر است" },
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

      // Check if national_id already exists
      const existingUser = await client.query(
        "SELECT id FROM users WHERE national_id = $1",
        [national_id]
      );

      if (existingUser.rows.length > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "کد ملی قبلاً ثبت شده است" },
          { status: 400 }
        );
      }

      // Check if parent phone numbers already exist
      const existingParent1 = await client.query(
        "SELECT id FROM users WHERE phone = $1",
        [parent1_phone]
      );

      let existingParent2 = null;
      if (parent2_phone) {
        existingParent2 = await client.query(
          "SELECT id FROM users WHERE phone = $1",
          [parent2_phone]
        );
      }

      // Handle profile picture upload if provided
      let profilePictureUrl: string | null = null;
      if (profilePictureFile) {
        try {
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

      // Hash the national_id as the password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(national_id, saltRounds);

      // Create the student with grade level in profile and password set to national_id
      // Include profile_picture_url if available
      const studentResult = await client.query(
        `
        INSERT INTO users (school_id, name, national_id, email, role, is_active, profile, password_hash, profile_picture_url)
        VALUES ($1, $2, $3, $4, 'student', true, jsonb_set('{}', '{grade_level}', to_jsonb($5::text)), $6, $7)
        RETURNING id
      `,
        [
          schoolId,
          name,
          national_id,
          email || null,
          grade_level,
          passwordHash,
          profilePictureUrl,
        ]
      );

      const studentId = studentResult.rows[0].id;

      // Note: Student is not assigned to a class at this point
      // Class assignment will be done separately from the classes page

      // Create parent accounts and relationships
      const parentIds = [];

      // Parent 1
      let parent1Id;
      if (existingParent1.rows.length > 0) {
        parent1Id = existingParent1.rows[0].id;
        console.log("Using existing parent 1:", parent1Id);
        // Update existing parent's password to their phone number
        const parent1PasswordHash = await bcrypt.hash(
          parent1_phone,
          saltRounds
        );
        await client.query(
          "UPDATE users SET password_hash = $1 WHERE id = $2",
          [parent1PasswordHash, parent1Id]
        );
      } else {
        const parent1PasswordHash = await bcrypt.hash(
          parent1_phone,
          saltRounds
        );
        const parent1Result = await client.query(
          `
          INSERT INTO users (school_id, name, phone, email, role, is_active, password_hash)
          VALUES ($1, $2, $3, $4, 'parent', true, $5)
          RETURNING id
        `,
          [
            schoolId,
            parent1_name,
            parent1_phone,
            parent1_email || null,
            parent1PasswordHash,
          ]
        );
        parent1Id = parent1Result.rows[0].id;
        console.log("Created new parent 1:", parent1Id);
      }

      // Create parent-student relationship for parent 1
      const parentStudentRelation1 = await client.query(
        `
        INSERT INTO parent_student_relations (parent_id, student_id, relationship)
        VALUES ($1, $2, $3)
        ON CONFLICT (parent_id, student_id) DO NOTHING
        RETURNING id
      `,
        [parent1Id, studentId, parent1_relationship]
      );
      console.log(
        "Parent-student relation 1 created:",
        parentStudentRelation1.rowCount
      );

      parentIds.push(parent1Id);

      // Parent 2 (if provided)
      if (parent2_name && parent2_phone) {
        let parent2Id;
        if (existingParent2 && existingParent2.rows.length > 0) {
          parent2Id = existingParent2.rows[0].id;
          console.log("Using existing parent 2:", parent2Id);
          // Update existing parent's password to their phone number
          const parent2PasswordHash = await bcrypt.hash(
            parent2_phone,
            saltRounds
          );
          await client.query(
            "UPDATE users SET password_hash = $1 WHERE id = $2",
            [parent2PasswordHash, parent2Id]
          );
        } else {
          const parent2PasswordHash = await bcrypt.hash(
            parent2_phone,
            saltRounds
          );
          const parent2Result = await client.query(
            `
            INSERT INTO users (school_id, name, phone, email, role, is_active, password_hash)
            VALUES ($1, $2, $3, $4, 'parent', true, $5)
            RETURNING id
          `,
            [
              schoolId,
              parent2_name,
              parent2_phone,
              parent2_email || null,
              parent2PasswordHash,
            ]
          );
          parent2Id = parent2Result.rows[0].id;
          console.log("Created new parent 2:", parent2Id);
        }

        // Create parent-student relationship for parent 2
        const parentStudentRelation2 = await client.query(
          `
          INSERT INTO parent_student_relations (parent_id, student_id, relationship)
          VALUES ($1, $2, $3)
          ON CONFLICT (parent_id, student_id) DO NOTHING
          RETURNING id
        `,
          [parent2Id, studentId, parent2_relationship]
        );
        console.log(
          "Parent-student relation 2 created:",
          parentStudentRelation2.rowCount
        );

        parentIds.push(parent2Id);
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "دانش‌آموز و والدین با موفقیت اضافه شدند",
        student: {
          id: studentId,
          name,
          national_id,
          email,
          grade_level,
          profile_picture_url: profilePictureUrl,
        },
        parents: parentIds,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Create student transaction error:", error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create student API error:", error);
    return NextResponse.json(
      { error: "خطا در افزودن دانش‌آموز" },
      { status: 500 }
    );
  }
}
