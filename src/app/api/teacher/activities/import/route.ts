import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import * as XLSX from "xlsx";

// @ts-ignore
const moment = require("moment-jalaali");

// Helper function to convert Persian date to Gregorian
function persianToGregorian(persianDate: string): string | null {
  try {
    // Remove any extra spaces and normalize separators
    const normalized = persianDate.trim().replace(/\//g, "/");

    // Parse Persian date (format: YYYY/MM/DD or YYYY-MM-DD)
    const m = moment(normalized, "jYYYY/jMM/jDD");

    if (!m.isValid()) {
      return null;
    }

    // Convert to Gregorian and format as YYYY-MM-DD
    return m.format("YYYY-MM-DD");
  } catch (error) {
    return null;
  }
}

// Activity type mapping will be loaded dynamically from database
// Fallback mapping in case database is not available
const DEFAULT_ACTIVITY_TYPE_MAP: { [key: string]: string } = {
  "آزمون میان‌ترم": "midterm_exam",
  "آزمون پایان ترم": "final_exam",
  "آزمون ماهیانه": "monthly_exam",
  "آزمون هفتگی": "weekly_exam",
  "فعالیت کلاسی": "class_activity",
  "تکلیف کلاسی": "class_homework",
  "تکلیف منزل": "home_homework",
};

interface ImportRow {
  "ردیف": number;
  "نام دانش‌آموز": string;
  "کد ملی": string;
  "کلاس": string;
  "پایه": string;
  "درس": string;
  "نوع فعالیت": string;
  "عنوان فعالیت": string;
  "تاریخ": string;
  "نمره کمی (0-20)": number | string;
  "ارزیابی کیفی": string;
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "teacher") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "فایلی انتخاب نشده است" },
        { status: 400 }
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: ImportRow[] = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "فایل خالی است یا فرمت آن صحیح نیست" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    const results: any[] = [];
    const errors: string[] = [];

    try {
      await client.query("BEGIN");

      // Get teacher's students map
      const studentsResult = await client.query(
        `SELECT DISTINCT
          u.id,
          u.name,
          u.national_id,
          c.id as class_id,
          c.name as class_name,
          c.section
        FROM class_memberships cm
        JOIN users u ON cm.user_id = u.id
        JOIN classes c ON cm.class_id = c.id
        JOIN teacher_assignments ta ON c.id = ta.class_id
        WHERE ta.teacher_id = $1
          AND cm.role = 'student'
          AND ta.removed_at IS NULL
          AND u.is_active = true`,
        [userData.id]
      );

      // Get teacher's lessons map
      const lessonsResult = await client.query(
        `SELECT DISTINCT
          l.id,
          l.title as name,
          ta.class_id
        FROM teacher_assignments ta
        JOIN lessons l ON ta.subject_id = l.id
        WHERE ta.teacher_id = $1 AND ta.removed_at IS NULL`,
        [userData.id]
      );

      // Get teacher's school to fetch activity types
      const teacherSchoolResult = await client.query(
        `SELECT school_id FROM users WHERE id = $1`,
        [userData.id]
      );

      // Fetch activity types for this school
      let ACTIVITY_TYPE_MAP: { [key: string]: string } = {};
      if (teacherSchoolResult.rows.length > 0 && teacherSchoolResult.rows[0].school_id) {
        const activityTypesResult = await client.query(
          `SELECT type_key, persian_name FROM activity_types WHERE school_id = $1 AND is_active = true`,
          [teacherSchoolResult.rows[0].school_id]
        );

        // Create reverse mapping: persian_name -> type_key
        activityTypesResult.rows.forEach((row: any) => {
          ACTIVITY_TYPE_MAP[row.persian_name] = row.type_key;
        });
      }

      // Use default mapping if no types found in database
      if (Object.keys(ACTIVITY_TYPE_MAP).length === 0) {
        ACTIVITY_TYPE_MAP = { ...DEFAULT_ACTIVITY_TYPE_MAP };
      }

      // Create lookup maps
      const studentsMap = new Map<string, any>();
      studentsResult.rows.forEach((student) => {
        const className = student.section
          ? `${student.class_name}-${student.section}`
          : student.class_name;
        const key = `${student.name}|${className}`;
        studentsMap.set(key, student);
      });

      const lessonsMap = new Map<string, any>();
      lessonsResult.rows.forEach((lesson) => {
        const key = `${lesson.name}|${lesson.class_id}`;
        lessonsMap.set(key, lesson);
      });

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2; // Excel row number (accounting for header)

        try {
          // Skip sample row
          if (
            row["نام دانش‌آموز"]?.includes("نمونه") ||
            row["عنوان فعالیت"]?.includes("نمونه")
          ) {
            continue;
          }

          // Validate required fields
          if (
            !row["نام دانش‌آموز"] ||
            !row["کلاس"] ||
            !row["درس"] ||
            !row["نوع فعالیت"] ||
            !row["تاریخ"]
          ) {
            errors.push(
              `ردیف ${rowNum}: فیلدهای الزامی کامل نیست`
            );
            continue;
          }

          // Find student
          const studentKey = `${row["نام دانش‌آموز"]}|${row["کلاس"]}`;
          const student = studentsMap.get(studentKey);

          if (!student) {
            errors.push(
              `ردیف ${rowNum}: دانش‌آموز '${row["نام دانش‌آموز"]}' در کلاس '${row["کلاس"]}' یافت نشد`
            );
            continue;
          }

          // Find lesson
          const lessonKey = `${row["درس"]}|${student.class_id}`;
          const lesson = lessonsMap.get(lessonKey);

          if (!lesson) {
            errors.push(
              `ردیف ${rowNum}: درس '${row["درس"]}' برای کلاس '${row["کلاس"]}' یافت نشد`
            );
            continue;
          }

          // Map activity type
          const activityType = ACTIVITY_TYPE_MAP[row["نوع فعالیت"]];
          if (!activityType) {
            errors.push(
              `ردیف ${rowNum}: نوع فعالیت '${row["نوع فعالیت"]}' نامعتبر است`
            );
            continue;
          }

          // Validate and convert Persian date to Gregorian
          const persianDateStr = row["تاریخ"]?.toString();
          if (!persianDateStr) {
            errors.push(
              `ردیف ${rowNum}: تاریخ وارد نشده است`
            );
            continue;
          }

          // Convert Persian date to Gregorian
          const dateStr = persianToGregorian(persianDateStr);
          if (!dateStr) {
            errors.push(
              `ردیف ${rowNum}: فرمت تاریخ صحیح نیست (باید YYYY/MM/DD شمسی باشد، مانند: 1404/01/07)`
            );
            continue;
          }

          // Validate quantitative score
          let quantitativeScore: number | null = null;
          const scoreValue = row["نمره کمی (0-20)"];
          if (scoreValue !== null && scoreValue !== undefined && scoreValue !== "") {
            const score = Number(scoreValue);
            if (isNaN(score) || score < 0 || score > 20) {
              errors.push(
                `ردیف ${rowNum}: نمره کمی باید عددی بین 0 تا 20 باشد`
              );
              continue;
            }
            quantitativeScore = score;
          }

          // Get qualitative evaluation (handle empty string)
          const qualitativeEval = row["ارزیابی کیفی"];
          const qualitativeEvaluation = qualitativeEval && qualitativeEval.trim() !== "" ? qualitativeEval : null;

          // Check if activity already exists (same student, date, and activity type)
          const existingActivity = await client.query(
            `SELECT id FROM educational_activities
             WHERE student_id = $1
               AND activity_date = $2
               AND activity_type = $3
               AND teacher_id = $4
             LIMIT 1`,
            [student.id, dateStr, activityType, userData.id]
          );

          let activityId: string;
          let isUpdate = false;

          if (existingActivity.rows.length > 0) {
            // Update existing activity
            activityId = existingActivity.rows[0].id;
            await client.query(
              `UPDATE educational_activities
               SET activity_title = $1,
                   quantitative_score = $2,
                   qualitative_evaluation = $3,
                   class_id = $4,
                   subject_id = $5,
                   updated_at = NOW()
               WHERE id = $6`,
              [
                (row["عنوان فعالیت"] || ""),
                quantitativeScore,
                qualitativeEvaluation,
                student.class_id,
                lesson.id,
                activityId,
              ]
            );
            isUpdate = true;
          } else {
            // Insert new activity
            const insertResult = await client.query(
              `INSERT INTO educational_activities
              (class_id, subject_id, student_id, teacher_id, activity_type, activity_title, activity_date, quantitative_score, qualitative_evaluation)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING id`,
              [
                student.class_id,
                lesson.id,
                student.id,
                userData.id,
                activityType,
                (row["عنوان فعالیت"] || ""),
                dateStr,
                quantitativeScore,
                qualitativeEvaluation,
              ]
            );
            activityId = insertResult.rows[0].id;
          }

          results.push({
            row: rowNum,
            student: row["نام دانش‌آموز"],
            activity: row["عنوان فعالیت"],
            status: isUpdate ? "updated" : "added",
          });
        } catch (error: any) {
          errors.push(
            `ردیف ${rowNum}: خطا در ثبت - ${error.message}`
          );
        }
      }

      await client.query("COMMIT");

      // Calculate separate counts for added and updated
      const addedCount = results.filter(r => r.status === "added").length;
      const updatedCount = results.filter(r => r.status === "updated").length;

      return NextResponse.json({
        success: true,
        message: `${addedCount} فعالیت جدید اضافه و ${updatedCount} فعالیت به‌روزرسانی شد`,
        summary: {
          total: data.length,
          added: addedCount,
          updated: updatedCount,
          success: results.length,
          failed: errors.length,
        },
        results,
        errors,
      });
    } catch (error: any) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Import activities error:", error);
    return NextResponse.json(
      { error: "خطا در ورود اطلاعات. لطفاً مجدداً تلاش کنید." },
      { status: 500 }
    );
  }
}