import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserById } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { parse, Options } from "csv-parse/sync";
import { DatabaseError } from "pg";
import { PassThrough } from "stream";
import { Readable } from "stream";

interface StudentRecord {
  "نام دانش‌آموز *": string;
  "کد ملی *": string;
  ایمیل: string;
  "پایه تحصیلی *": string;
  "نام والد 1 *": string;
  "شماره همراه والد 1 *": string;
  "ایمیل والد 1": string;
  "رابطه والد 1": string;
  "نام والد 2": string;
  "شماره همراه والد 2": string;
  "ایمیل والد 2": string;
  "رابطه والد 2": string;
  [key: string]: string;
}

interface BulkUploadResponse {
  success: boolean;
  message: string;
  created?: number;
  updated?: number;
  processed?: number;
  successMessages?: string;
  hasErrors?: boolean;
  error?: string;
  errorDetails?: string;
  details?: string;
}

interface ProcessResult {
  success: boolean;
  message: string;
  created?: boolean;
  updated?: boolean;
}

// Function to translate database errors to user-friendly Persian messages
function translateDatabaseError(error: unknown, context: string): string {
  // Handle DatabaseError instances
  if (error instanceof DatabaseError) {
    if (error.code === "23505") {
      if (error.constraint === "users_email_key") {
        // Try to extract the email from the error message
        const emailMatch = error.message.match(/Key \(email\)=\(([^)]+)\)/);
        if (emailMatch && emailMatch[1]) {
          return `ایمیل "${emailMatch[1]}" قبلاً استفاده شده است. لطفاً ایمیل دیگری انتخاب کنید`;
        }
        return `ایمیل قبلاً استفاده شده است. لطفاً ایمیل دیگری انتخاب کنید`;
      } else if (error.constraint === "users_national_id_key") {
        // Try to extract the national ID from the error message
        const nationalIdMatch = error.message.match(
          /Key \(national_id\)=\(([^)]+)\)/
        );
        if (nationalIdMatch && nationalIdMatch[1]) {
          return `کد ملی "${nationalIdMatch[1]}" قبلاً در سیستم ثبت شده است. اگر این کد ملی متعلق به دانش‌آموز دیگری است، لطفاً با پشتیبانی تماس بگیرید`;
        }
        return `کد ملی قبلاً در سیستم ثبت شده است. اگر این کد ملی متعلق به دانش‌آموز دیگری است، لطفاً با پشتیبانی تماس بگیرید`;
      } else if (error.constraint === "users_phone_key") {
        // Try to extract the phone from the error message
        const phoneMatch = error.message.match(/Key \(phone\)=\(([^)]+)\)/);
        if (phoneMatch && phoneMatch[1]) {
          return `شماره همراه "${phoneMatch[1]}" قبلاً استفاده شده است. لطفاً شماره همراه دیگری وارد کنید`;
        }
        return `شماره همراه قبلاً استفاده شده است. لطفاً شماره همراه دیگری وارد کنید`;
      } else {
        return `اطلاعات تکراری یافت شد. لطفاً اطلاعات وارد شده را بررسی کنید`;
      }
    } else if (error.code === "25P02") {
      return `خطا در پردازش اطلاعات. لطفاً اطلاعات این سطر را بررسی کنید`;
    }

    return `خطا در ${context}: ${error.message}`;
  }

  // Handle regular Error instances
  if (error instanceof Error) {
    // Check if it's a database error message in string form
    if (
      error.message.includes("duplicate key value violates unique constraint")
    ) {
      if (error.message.includes("users_email_key")) {
        // Try to extract the email from the error message
        const emailMatch = error.message.match(/Key \(email\)=\(([^)]+)\)/);
        if (emailMatch && emailMatch[1]) {
          return `ایمیل "${emailMatch[1]}" قبلاً استفاده شده است. لطفاً ایمیل دیگری انتخاب کنید`;
        }
        // Try alternative pattern for email extraction
        const altEmailMatch = error.message.match(
          /duplicate key value violates unique constraint "users_email_key"[.\s\S]*?Key \(email\)=\(([^)]+)\)/i
        );
        if (altEmailMatch && altEmailMatch[1]) {
          return `ایمیل "${altEmailMatch[1]}" قبلاً استفاده شده است. لطفاً ایمیل دیگری انتخاب کنید`;
        }
        return `ایمیل قبلاً استفاده شده است. لطفاً ایمیل دیگری انتخاب کنید`;
      } else if (error.message.includes("users_national_id_key")) {
        // Try to extract the national ID from the error message
        const nationalIdMatch = error.message.match(
          /Key \(national_id\)=\(([^)]+)\)/
        );
        if (nationalIdMatch && nationalIdMatch[1]) {
          return `کد ملی "${nationalIdMatch[1]}" قبلاً در سیستم ثبت شده است. اگر این کد ملی متعلق به دانش‌آموز دیگری است، لطفاً با پشتیبانی تماس بگیرید`;
        }
        return `کد ملی قبلاً در سیستم ثبت شده است. اگر این کد ملی متعلق به دانش‌آموز دیگری است، لطفاً با پشتیبانی تماس بگیرید`;
      } else if (error.message.includes("users_phone_key")) {
        // Try to extract the phone from the error message
        const phoneMatch = error.message.match(/Key \(phone\)=\(([^)]+)\)/);
        if (phoneMatch && phoneMatch[1]) {
          return `شماره همراه "${phoneMatch[1]}" قبلاً استفاده شده است. لطفاً شماره همراه دیگری وارد کنید`;
        }
        return `شماره همراه قبلاً استفاده شده است. لطفاً شماره همراه دیگری وارد کنید`;
      } else {
        return `اطلاعات تکراری یافت شد. لطفاً اطلاعات وارد شده را بررسی کنید`;
      }
    } else if (error.message.includes("current transaction is aborted")) {
      return `خطا در پردازش اطلاعات. لطفاً اطلاعات این سطر را بررسی کنید`;
    }

    return error.message;
  }

  // Fallback for unknown error types
  return `خطا در ${context}: ${String(error)}`;
}

// Function to process a single student record with complete isolation
async function processStudentRecord(
  record: StudentRecord,
  rowNumber: number,
  schoolId: string
): Promise<ProcessResult> {
  let client;
  try {
    // Get a fresh database connection for this record
    client = await pool.connect();

    // Begin a transaction for this record
    await client.query("BEGIN");

    // Extract student data
    const studentData = {
      name: record["نام دانش‌آموز *"] || "",
      national_id: record["کد ملی *"] || "",
      email: record["ایمیل"] || null,
      grade_level: record["پایه تحصیلی *"] || "",
    };

    // Extract parent data
    const parent1Data = {
      name: record["نام والد 1 *"] || "",
      phone: record["شماره همراه والد 1 *"] || "",
      email: record["ایمیل والد 1"] || null,
      relationship: record["رابطه والد 1"] || "پدر",
    };

    const parent2Data = {
      name: record["نام والد 2"] || "",
      phone: record["شماره همراه والد 2"] || "",
      email: record["ایمیل والد 2"] || null,
      relationship: record["رابطه والد 2"] || "مادر",
    };

    let studentId: string;
    let created = false;
    let updated = false;

    // Check if student already exists by national_id
    const existingStudent = await client.query(
      "SELECT id FROM users WHERE national_id = $1 AND school_id = $2 AND role = 'student'",
      [studentData.national_id, schoolId]
    );

    if (existingStudent.rows.length > 0) {
      // Update existing student
      studentId = existingStudent.rows[0].id;

      await client.query(
        `UPDATE users 
         SET name = $1, email = $2, profile = jsonb_set(profile, '{grade_level}', to_jsonb($3::text))
         WHERE id = $4`,
        [
          studentData.name,
          studentData.email,
          studentData.grade_level,
          studentId,
        ]
      );

      updated = true;
    } else {
      // Check if student with same email already exists (to prevent duplicate email error)
      if (studentData.email) {
        const existingEmailStudent = await client.query(
          "SELECT id FROM users WHERE email = $1 AND school_id = $2 AND role = 'student'",
          [studentData.email, schoolId]
        );

        if (existingEmailStudent.rows.length > 0) {
          throw new Error(
            `ایمیل "${studentData.email}" قبلاً استفاده شده است. لطفاً ایمیل دیگری انتخاب کنید`
          );
        }
      }

      // Create new student
      // Hash the national_id as the password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(
        studentData.national_id,
        saltRounds
      );

      const newStudent = await client.query(
        `INSERT INTO users (school_id, name, national_id, email, role, is_active, profile, password_hash)
         VALUES ($1, $2, $3, $4, 'student', true, jsonb_set('{}', '{grade_level}', to_jsonb($5::text)), $6)
         RETURNING id`,
        [
          schoolId,
          studentData.name,
          studentData.national_id,
          studentData.email,
          studentData.grade_level,
          passwordHash,
        ]
      );

      studentId = newStudent.rows[0].id;
      created = true;
    }

    // Handle parent 1 with better error handling
    let parent1Id: string;
    try {
      // Hash the phone number as the default password
      const saltRounds = 12;
      const parent1PasswordHash = await bcrypt.hash(
        parent1Data.phone,
        saltRounds
      );

      // Try to insert parent, if it fails due to duplicate, update existing
      const newParent = await client.query(
        `INSERT INTO users (school_id, name, phone, email, role, is_active, password_hash)
         VALUES ($1, $2, $3, $4, 'parent', true, $5)
         ON CONFLICT (phone) DO UPDATE SET 
         name = EXCLUDED.name, 
         email = EXCLUDED.email
         RETURNING id`,
        [
          schoolId,
          parent1Data.name,
          parent1Data.phone,
          parent1Data.email,
          parent1PasswordHash,
        ]
      );
      parent1Id = newParent.rows[0].id;
    } catch (parentError) {
      // Handle duplicate email error for parent
      if (
        parentError instanceof DatabaseError &&
        parentError.code === "23505" &&
        parentError.constraint === "users_email_key"
      ) {
        // Find existing parent by email and update phone
        if (parent1Data.email) {
          const existingParentByEmail = await client.query(
            "SELECT id FROM users WHERE email = $1 AND school_id = $2 AND role = 'parent'",
            [parent1Data.email, schoolId]
          );

          if (existingParentByEmail.rows.length > 0) {
            parent1Id = existingParentByEmail.rows[0].id;
            await client.query(
              "UPDATE users SET name = $1, phone = $2 WHERE id = $3",
              [parent1Data.name, parent1Data.phone, parent1Id]
            );
          } else {
            throw new Error(
              `ایمیل والد 1 "${parent1Data.email}" قبلاً استفاده شده است. لطفاً ایمیل دیگری انتخاب کنید`
            );
          }
        } else {
          throw new Error(
            `شماره همراه والد 1 "${parent1Data.phone}" قبلاً استفاده شده است. لطفاً شماره همراه دیگری وارد کنید`
          );
        }
      } else if (parentError instanceof Error) {
        // Translate other database errors
        throw new Error(
          translateDatabaseError(parentError, "ثبت اطلاعات والد 1")
        );
      } else {
        // If the above fails for any reason, try to find existing parent by phone
        const existingParent = await client.query(
          "SELECT id FROM users WHERE phone = $1 AND school_id = $2 AND role = 'parent'",
          [parent1Data.phone, schoolId]
        );

        if (existingParent.rows.length > 0) {
          parent1Id = existingParent.rows[0].id;
          await client.query(
            "UPDATE users SET name = $1, email = $2 WHERE id = $3",
            [parent1Data.name, parent1Data.email, parent1Id]
          );
        } else {
          throw parentError; // Re-throw if we can't handle it
        }
      }
    }

    // Create or update parent-student relationship for parent 1
    await client.query(
      `INSERT INTO parent_student_relations (parent_id, student_id, relationship)
       VALUES ($1, $2, $3)
       ON CONFLICT (parent_id, student_id) 
       DO UPDATE SET relationship = $3`,
      [parent1Id, studentId, parent1Data.relationship]
    );

    // Handle parent 2 (if provided) with better error handling
    if (parent2Data.name && parent2Data.phone) {
      let parent2Id: string;
      try {
        // Hash the phone number as the default password
        const saltRounds = 12;
        const parent2PasswordHash = await bcrypt.hash(
          parent2Data.phone,
          saltRounds
        );

        // Try to insert parent, if it fails due to duplicate, update existing
        const newParent = await client.query(
          `INSERT INTO users (school_id, name, phone, email, role, is_active, password_hash)
           VALUES ($1, $2, $3, $4, 'parent', true, $5)
           ON CONFLICT (phone) DO UPDATE SET 
           name = EXCLUDED.name, 
           email = EXCLUDED.email
           RETURNING id`,
          [
            schoolId,
            parent2Data.name,
            parent2Data.phone,
            parent2Data.email,
            parent2PasswordHash,
          ]
        );
        parent2Id = newParent.rows[0].id;
      } catch (parentError) {
        // Handle duplicate email error for parent
        if (
          parentError instanceof DatabaseError &&
          parentError.code === "23505" &&
          parentError.constraint === "users_email_key"
        ) {
          // Find existing parent by email and update phone
          if (parent2Data.email) {
            const existingParentByEmail = await client.query(
              "SELECT id FROM users WHERE email = $1 AND school_id = $2 AND role = 'parent'",
              [parent2Data.email, schoolId]
            );

            if (existingParentByEmail.rows.length > 0) {
              parent2Id = existingParentByEmail.rows[0].id;
              await client.query(
                "UPDATE users SET name = $1, phone = $2 WHERE id = $3",
                [parent2Data.name, parent2Data.phone, parent2Id]
              );
            } else {
              throw new Error(
                `ایمیل والد 2 "${parent2Data.email}" قبلاً استفاده شده است. لطفاً ایمیل دیگری انتخاب کنید`
              );
            }
          } else {
            throw new Error(
              `شماره همراه والد 2 "${parent2Data.phone}" قبلاً استفاده شده است. لطفاً شماره همراه دیگری وارد کنید`
            );
          }
        } else if (parentError instanceof Error) {
          // Translate other database errors
          throw new Error(
            translateDatabaseError(parentError, "ثبت اطلاعات والد 2")
          );
        } else {
          // If the above fails for any reason, try to find existing parent by phone
          const existingParent = await client.query(
            "SELECT id FROM users WHERE phone = $1 AND school_id = $2 AND role = 'parent'",
            [parent2Data.phone, schoolId]
          );

          if (existingParent.rows.length > 0) {
            parent2Id = existingParent.rows[0].id;
            await client.query(
              "UPDATE users SET name = $1, email = $2 WHERE id = $3",
              [parent2Data.name, parent2Data.email, parent2Id]
            );
          } else {
            throw parentError; // Re-throw if we can't handle it
          }
        }
      }

      // Create or update parent-student relationship for parent 2
      await client.query(
        `INSERT INTO parent_student_relations (parent_id, student_id, relationship)
         VALUES ($1, $2, $3)
         ON CONFLICT (parent_id, student_id) 
         DO UPDATE SET relationship = $3`,
        [parent2Id, studentId, parent2Data.relationship]
      );
    }

    // Commit the transaction for this record
    await client.query("COMMIT");

    // Return success message
    if (created) {
      return {
        success: true,
        message: `سطر ${rowNumber}: دانش‌آموز ${studentData.name} ایجاد شد`,
        created: true,
      };
    } else if (updated) {
      return {
        success: true,
        message: `سطر ${rowNumber}: دانش‌آموز ${studentData.name} به‌روزرسانی شد`,
        updated: true,
      };
    } else {
      // This shouldn't happen, but just in case
      return {
        success: true,
        message: `سطر ${rowNumber}: دانش‌آموز ${studentData.name} پردازش شد`,
      };
    }
  } catch (error) {
    // Rollback the transaction for this record if it was started
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        // Ignore rollback errors
      }
    }
    throw error;
  } finally {
    // Always release the client back to the pool
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        // Ignore release errors
      }
    }
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

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "فایلی انتخاب نشده است" },
        { status: 400 }
      );
    }

    // Get user with school_id
    const user = await getUserById(userData.id);
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Check if school_id exists
    if (!user.school_id) {
      return NextResponse.json(
        { error: "شناسه مدرسه یافت نشد" },
        { status: 400 }
      );
    }

    const schoolId = user.school_id;

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse CSV content with relaxed parsing options
    let records: StudentRecord[] = [];
    try {
      const parseOptions: Options = {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true, // Handle UTF-8 BOM
        relax_column_count: true, // Allow inconsistent column counts
        skip_records_with_empty_values: false,
      };

      const parsedRecords: unknown[] = parse(buffer, parseOptions);
      // Convert parsed records to StudentRecord array
      records = parsedRecords.map((record) => {
        // Handle both object and array formats
        if (
          typeof record === "object" &&
          record !== null &&
          !Array.isArray(record)
        ) {
          // Object format (with column names as keys)
          const objRecord = record as Record<string, string>;
          return {
            "نام دانش‌آموز *": objRecord["نام دانش‌آموز *"] || "",
            "کد ملی *": objRecord["کد ملی *"] || "",
            ایمیل: objRecord["ایمیل"] || "",
            "پایه تحصیلی *": objRecord["پایه تحصیلی *"] || "",
            "نام والد 1 *": objRecord["نام والد 1 *"] || "",
            "شماره همراه والد 1 *": objRecord["شماره همراه والد 1 *"] || "",
            "ایمیل والد 1": objRecord["ایمیل والد 1"] || "",
            "رابطه والد 1": objRecord["رابطه والد 1"] || "",
            "نام والد 2": objRecord["نام والد 2"] || "",
            "شماره همراه والد 2": objRecord["شماره همراه والد 2"] || "",
            "ایمیل والد 2": objRecord["ایمیل والد 2"] || "",
            "رابطه والد 2": objRecord["رابطه والد 2"] || "",
          };
        } else if (Array.isArray(record)) {
          // Array format (values only)
          return {
            "نام دانش‌آموز *": record[0] || "",
            "کد ملی *": record[1] || "",
            ایمیل: record[2] || "",
            "پایه تحصیلی *": record[3] || "",
            "نام والد 1 *": record[4] || "",
            "شماره همراه والد 1 *": record[5] || "",
            "ایمیل والد 1": record[6] || "",
            "رابطه والد 1": record[7] || "",
            "نام والد 2": record[8] || "",
            "شماره همراه والد 2": record[9] || "",
            "ایمیل والد 2": record[10] || "",
            "رابطه والد 2": record[11] || "",
          };
        } else {
          // Fallback for unexpected format
          return {
            "نام دانش‌آموز *": "",
            "کد ملی *": "",
            ایمیل: "",
            "پایه تحصیلی *": "",
            "نام والد 1 *": "",
            "شماره همراه والد 1 *": "",
            "ایمیل والد 1": "",
            "رابطه والد 1": "",
            "نام والد 2": "",
            "شماره همراه والد 2": "",
            "ایمیل والد 2": "",
            "رابطه والد 2": "",
          };
        }
      });
    } catch (parseError) {
      console.error("CSV Parse Error:", parseError);
      return NextResponse.json(
        {
          error: "خطا در خواندن فایل CSV",
          details:
            parseError instanceof Error
              ? parseError.message
              : "فرمت فایل نامعتبر است",
        },
        { status: 400 }
      );
    }

    let createdCount = 0;
    let updatedCount = 0;
    let processedCount = 0;
    const errors: string[] = [];
    const successMessages: string[] = [];

    // Validate all records first
    const validRecords: { record: StudentRecord; rowNumber: number }[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +1 for header row, +1 for 0-based index

      // Skip header row or empty rows
      if (
        !record["نام دانش‌آموز *"] ||
        record["نام دانش‌آموز *"] === "مثال: محمد محمدی"
      ) {
        continue;
      }

      // Check for column count consistency
      const expectedColumns = 12;
      const actualColumns = Object.keys(record).length;
      if (actualColumns !== expectedColumns) {
        errors.push(
          `سطر ${rowNumber}: تعداد ستون‌ها نادرست است. انتظار می‌رفت ${expectedColumns} ستون باشد اما ${actualColumns} ستون یافت شد`
        );
        continue;
      }

      // Extract student data
      const studentData = {
        name: record["نام دانش‌آموز *"] || "",
        national_id: record["کد ملی *"] || "",
        email: record["ایمیل"] || null,
        grade_level: record["پایه تحصیلی *"] || "",
      };

      // Extract parent data
      const parent1Data = {
        name: record["نام والد 1 *"] || "",
        phone: record["شماره همراه والد 1 *"] || "",
        email: record["ایمیل والد 1"] || null,
        relationship: record["رابطه والد 1"] || "پدر",
      };

      const parent2Data = {
        name: record["نام والد 2"] || "",
        phone: record["شماره همراه والد 2"] || "",
        email: record["ایمیل والد 2"] || null,
        relationship: record["رابطه والد 2"] || "مادر",
      };

      // Validation
      let hasError = false;

      if (!studentData.name) {
        errors.push(`سطر ${rowNumber}: نام دانش‌آموز * الزامی است`);
        hasError = true;
      }

      if (!studentData.national_id) {
        errors.push(`سطر ${rowNumber}: کد ملی * الزامی است`);
        hasError = true;
      }

      if (!studentData.grade_level) {
        errors.push(`سطر ${rowNumber}: پایه تحصیلی * الزامی است`);
        hasError = true;
      }

      if (!parent1Data.name) {
        errors.push(`سطر ${rowNumber}: نام والد 1 * الزامی است`);
        hasError = true;
      }

      if (!parent1Data.phone) {
        errors.push(`سطر ${rowNumber}: شماره همراه والد 1 * الزامی است`);
        hasError = true;
      }

      // Validate national ID (should be 10 digits)
      if (
        studentData.national_id &&
        !/^\d{10}$/.test(studentData.national_id)
      ) {
        errors.push(
          `سطر ${rowNumber}: کد ملی * باید ۱۰ رقم باشد (مقدار وارد شده: ${studentData.national_id})`
        );
        hasError = true;
      }

      // Validate phone numbers
      if (parent1Data.phone && !/^09\d{9}$/.test(parent1Data.phone)) {
        errors.push(
          `سطر ${rowNumber}: شماره همراه والد 1 * نامعتبر است. باید با 09 شروع شود و ۱۱ رقم باشد (مقدار وارد شده: ${parent1Data.phone})`
        );
        hasError = true;
      }

      if (parent2Data.name && !parent2Data.phone) {
        errors.push(
          `سطر ${rowNumber}: اگر نام والد 2 وارد شده، شماره همراه والد 2 نیز الزامی است`
        );
        hasError = true;
      }

      if (parent2Data.phone && !parent2Data.name) {
        errors.push(
          `سطر ${rowNumber}: اگر شماره همراه والد 2 وارد شده، نام والد 2 نیز الزامی است`
        );
        hasError = true;
      }

      if (parent2Data.phone && !/^09\d{9}$/.test(parent2Data.phone)) {
        errors.push(
          `سطر ${rowNumber}: شماره همراه والد 2 نامعتبر است. باید با 09 شروع شود و ۱۱ رقم باشد (مقدار وارد شده: ${parent2Data.phone})`
        );
        hasError = true;
      }

      // If no errors, add to valid records
      if (!hasError) {
        validRecords.push({ record, rowNumber });
      }
    }

    // Create a PassThrough stream for sending progress updates
    const stream = new PassThrough();
    const encoder = new TextEncoder();

    // Function to send progress updates
    const sendProgress = (
      progress: number,
      processed: number,
      total: number,
      message: string
    ) => {
      stream.write(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "progress",
            progress: progress,
            processed: processed,
            total: total,
            message: message,
          })}\n\n`
        )
      );
    };

    // Function to send final result
    const sendResult = (result: BulkUploadResponse) => {
      stream.write(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "result",
            data: result,
          })}\n\n`
        )
      );
      stream.end();
    };

    // Send initial progress update
    sendProgress(0, 0, validRecords.length, "شروع پردازش...");

    // Process records asynchronously
    setImmediate(async () => {
      try {
        // Process valid records individually with separate database connections
        const totalRecords = validRecords.length;
        for (let i = 0; i < totalRecords; i++) {
          const { record, rowNumber } = validRecords[i];
          try {
            const result = await processStudentRecord(
              record,
              rowNumber,
              schoolId
            );
            if (result.success) {
              successMessages.push(result.message);
              if (result.created) createdCount++;
              if (result.updated) updatedCount++;
              processedCount++;
            }
          } catch (recordError) {
            console.error(
              `Error processing record at row ${rowNumber}:`,
              recordError
            );
            const errorMessage = translateDatabaseError(
              recordError,
              "پردازش اطلاعات"
            );
            errors.push(
              `سطر ${rowNumber}: خطا در پردازش رکورد - ${errorMessage}`
            );
          }

          // Send progress update
          const progress = Math.round(((i + 1) / totalRecords) * 100);
          sendProgress(
            progress,
            i + 1,
            totalRecords,
            `پردازش رکورد ${i + 1} از ${totalRecords}`
          );
        }

        // Send final result
        const response: BulkUploadResponse = {
          success: true,
          message: `عملیات با موفقیت انجام شد. ${createdCount} دانش‌آموز جدید ایجاد شد و ${updatedCount} دانش‌آموز به‌روزرسانی شد.`,
          created: createdCount,
          updated: updatedCount,
          processed: processedCount,
        };

        // Add success messages if any
        if (successMessages.length > 0) {
          response.successMessages = successMessages.join("\n");
        }

        // Add errors if any
        if (errors.length > 0) {
          response.hasErrors = true;
          response.error = "برخی رکوردها دارای خطا بودند";
          response.errorDetails = errors.join("\n");
        }

        // Send final result
        sendResult(response);
      } catch (error) {
        console.error("Processing error:", error);
        stream.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: "خطا در پردازش فایل",
            })}\n\n`
          )
        );
        stream.end();
      }
    });

    // Return the stream as response
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Bulk upload API error:", error);
    return NextResponse.json(
      {
        error: "خطا در ارتباط با سرور",
        details:
          error instanceof Error
            ? error.message
            : "خطای نامشخص در ارتباط با سرور",
      },
      { status: 500 }
    );
  }
}
