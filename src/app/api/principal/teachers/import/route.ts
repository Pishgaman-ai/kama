import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { encryptPassword } from "@/lib/passwordEncryption";

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

      // Get the uploaded file
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { error: "فایل انتخاب نشده است" },
          { status: 400 }
        );
      }

      // Read the Excel file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return NextResponse.json(
          { error: "فایل اکسل خالی است" },
          { status: 400 }
        );
      }

      let addedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];
      const results: any[] = [];

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];

        // Extract data from Excel row
        const name = row["نام معلم"]?.toString().trim();
        const phone = row["شماره همراه"]?.toString().trim();
        const national_id = row["کد ملی"]?.toString().trim() || null;
        const email = row["ایمیل"]?.toString().trim() || null;

        // Validate required fields
        if (!name || !phone) {
          errors.push(
            `ردیف ${i + 2}: نام معلم و شماره همراه الزامی است`
          );
          skippedCount++;
          continue;
        }

        // Validate phone format (Iranian mobile numbers)
        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(phone)) {
          errors.push(
            `ردیف ${i + 2}: فرمت شماره همراه ${phone} صحیح نیست (باید 09xxxxxxxxx باشد)`
          );
          skippedCount++;
          continue;
        }

        // Validate national_id if provided (10 digits)
        if (national_id) {
          const nationalIdRegex = /^\d{10}$/;
          if (!nationalIdRegex.test(national_id)) {
            errors.push(
              `ردیف ${i + 2}: کد ملی ${national_id} باید 10 رقم باشد`
            );
            skippedCount++;
            continue;
          }
        }

        try {
          // Check if teacher exists (by phone number)
          const existingTeacher = await client.query(
            "SELECT id, name, email FROM users WHERE phone = $1 AND role = 'teacher'",
            [phone]
          );

          if (existingTeacher.rows.length > 0) {
            // Update existing teacher
            const teacherId = existingTeacher.rows[0].id;

            await client.query(
              `UPDATE users
               SET name = $1, email = $2, national_id = $3, updated_at = NOW()
               WHERE id = $4`,
              [name, email, national_id, teacherId]
            );

            updatedCount++;
            results.push({
              action: "updated",
              name,
              phone,
              national_id,
              email,
            });
          } else {
            // Add new teacher
            // Use phone number as default password
            const defaultPassword = phone;
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);
            const encryptedInitialPassword = encryptPassword(defaultPassword);

            await client.query(
              `INSERT INTO users
               (school_id, name, phone, email, national_id, password_hash, initial_password, role, is_active)
               VALUES ($1, $2, $3, $4, $5, $6, $7, 'teacher', true)
               RETURNING id`,
              [schoolId, name, phone, email, national_id, passwordHash, encryptedInitialPassword]
            );

            addedCount++;
            results.push({
              action: "added",
              name,
              phone,
              national_id,
              email,
              defaultPassword: phone,
            });
          }
        } catch (error: any) {
          console.error(`Error processing row ${i + 2}:`, error);

          // Handle specific database errors
          if (error.code === "23505") {
            // Unique constraint violation
            if (error.constraint === "users_email_key") {
              errors.push(
                `ردیف ${i + 2}: ایمیل ${email} قبلاً استفاده شده است`
              );
            } else if (error.constraint === "users_phone_key") {
              errors.push(
                `ردیف ${i + 2}: شماره همراه ${phone} قبلاً استفاده شده است`
              );
            } else {
              errors.push(`ردیف ${i + 2}: خطا در ثبت اطلاعات - ${error.message}`);
            }
          } else {
            errors.push(`ردیف ${i + 2}: ${error.message}`);
          }
          skippedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `عملیات import با موفقیت انجام شد`,
        summary: {
          total: data.length,
          added: addedCount,
          updated: updatedCount,
          skipped: skippedCount,
        },
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Import teachers API error:", error);
    return NextResponse.json(
      { error: "خطا در import فایل اکسل" },
      { status: 500 }
    );
  }
}
