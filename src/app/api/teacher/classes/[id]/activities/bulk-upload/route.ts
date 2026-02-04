import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { parse, Options } from "csv-parse/sync";
import { PassThrough } from "stream";
import { Readable } from "stream";
// @ts-ignore
import moment from "moment-jalaali";

interface ActivityRecord {
  "نام دانش‌آموز *": string;
  "کد ملی *": string;
  "نوع فعالیت *": string;
  "عنوان فعالیت *": string;
  "تاریخ فعالیت *": string;
  "نمره عددی": string;
  "ارزیابی کیفی": string;
  [key: string]: string;
}

interface BulkUploadResponse {
  success: boolean;
  message: string;
  created?: number;
  processed?: number;
  successMessages?: string;
  hasErrors?: boolean;
  error?: string;
  errorDetails?: string;
  details?: string;
}

// Activity types based on the requirements
const ACTIVITY_TYPES = [


  { id: "midterm_exam", name: "آزمون میان‌ترم" },
  { id: "monthly_exam", name: "آزمون ماهیانه" },
  { id: "weekly_exam", name: "آزمون هفتگی" },
  { id: "class_activity", name: "فعالیت کلاسی" },
  { id: "class_homework", name: "تکلیف کلاسی" },
  { id: "home_homework", name: "تکلیف منزل" },
];

const normalizeRecordKeys = (record: Record<string, string>) => {
  Object.keys(record).forEach((key) => {
    const trimmed = key.replace(/\s*\*$/, "");
    if (!(trimmed in record)) {
      record[trimmed] = record[key];
    }
    const withStar = `${trimmed} *`;
    if (!(withStar in record)) {
      record[withStar] = record[key];
    }
  });
};

// Function to translate database errors to user-friendly Persian messages
function translateDatabaseError(error: unknown, context: string): string {
  // Handle regular Error instances
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback for unknown error types
  return `خطا در ${context}: ${String(error)}`;
}

// Function to convert Persian date to Gregorian
function convertPersianToGregorian(persianDate: string): string | null {
  try {
    // Only accept Persian dates in the format YYYY-MM-DD (Jalali calendar)
    // Reject Gregorian dates to ensure consistency
    const parts = persianDate.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);

      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        // Validate Persian year range (reasonable range for educational data)
        if (year < 1300 || year > 1500) {
          return null; // Invalid Persian year range
        }

        // Validate month and day
        if (month < 1 || month > 12) {
          return null; // Invalid month
        }

        if (day < 1 || day > 31) {
          return null; // Invalid day
        }

        // Convert Persian date to Gregorian for storage
        const gregorianDate = moment(
          `${year}/${month}/${day}`,
          "jYYYY/jM/jD"
        ).format("YYYY-MM-DD");

        // Validate the converted Gregorian date year as well
        const convertedDate = new Date(gregorianDate);
        const convertedYear = convertedDate.getFullYear();
        if (convertedYear < 1300 || convertedYear > 2100) {
          return null; // Invalid converted year
        }

        return gregorianDate;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Function to process a single activity record with complete isolation
async function processActivityRecord(
  record: ActivityRecord,
  rowNumber: number,
  classId: string,
  subjectId: string,
  teacherId: string
): Promise<{ success: boolean; message: string; created?: boolean }> {
  let client;
  try {
    // Get a fresh database connection for this record
    client = await pool.connect();

    // Begin a transaction for this record
    await client.query("BEGIN");

    normalizeRecordKeys(record);

    // Extract student data
    const studentData = {
      name: record["نام دانش‌آموز *"] || "",
      national_id: record["کد ملی *"] || "",
    };

    // Extract activity data
    const activityData = {
      activity_type: record["نوع فعالیت *"] || "",
      activity_title: record["عنوان فعالیت *"] || "",
      activity_date: record["تاریخ فعالیت *"] || "",
      quantitative_score: record["نمره عددی"] || null,
      qualitative_evaluation: record["ارزیابی کیفی"] || null,
    };

    // Validate required fields
    if (!studentData.name.trim()) {
      throw new Error("نام دانش‌آموز الزامی است");
    }

    if (!studentData.national_id.trim()) {
      throw new Error("کد ملی دانش‌آموز الزامی است");
    }

    if (!activityData.activity_type.trim()) {
      throw new Error("نوع فعالیت الزامی است");
    }

    if (!activityData.activity_date.trim()) {
      throw new Error("تاریخ فعالیت الزامی است");
    }

    // Validate national ID (should be 10 digits)
    if (!/^\d{10}$/.test(studentData.national_id)) {
      throw new Error(
        `کد ملی باید ۱۰ رقم باشد (مقدار وارد شده: ${studentData.national_id})`
      );
    }

    // Validate student is in this class
    const studentResult = await client.query(
      `
      SELECT u.id, u.name
      FROM class_memberships cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.class_id = $1 AND u.national_id = $2 AND cm.role = 'student'
      `,
      [classId, studentData.national_id]
    );

    if (studentResult.rows.length === 0) {
      throw new Error(
        `دانش‌آموز با کد ملی "${studentData.national_id}" در این کلاس یافت نشد. دانش‌آموز باید ابتدا به کلاس اضافه شود.`
      );
    }

    const studentId = studentResult.rows[0].id;
    const actualStudentName = studentResult.rows[0].name;

    // Validate activity type
    const activityType = ACTIVITY_TYPES.find(
      (type) => type.name === activityData.activity_type
    );
    if (!activityType) {
      const validTypes = ACTIVITY_TYPES.map((t) => t.name).join(", ");
      throw new Error(
        `نوع فعالیت "${activityData.activity_type}" نامعتبر است. انواع معتبر: ${validTypes}`
      );
    }

    // Validate quantitative score and qualitative evaluation based on activity type
    const hasQuantitative = [
      "midterm_exam",
      "monthly_exam",
      "weekly_exam",
      "class_activity",
      "class_homework",
      "home_homework",
    ].includes(activityType.id);
    const hasQualitative = ["class_activity", "class_homework"].includes(
      activityType.id
    );

    // Validate quantitative score if required
    if (hasQuantitative) {
      if (!activityData.quantitative_score) {
        throw new Error(
          `نمره عددی برای نوع فعالیت "${activityData.activity_type}" الزامی است`
        );
      }

      const score = parseFloat(activityData.quantitative_score);
      if (isNaN(score) || score < 0 || score > 100) {
        throw new Error(
          `نمره عددی باید عددی بین ۰ تا ۱۰۰ باشد (مقدار وارد شده: ${activityData.quantitative_score})`
        );
      }
    }

    // Validate qualitative evaluation if required
    if (hasQualitative) {
      if (
        !activityData.qualitative_evaluation ||
        !activityData.qualitative_evaluation.trim()
      ) {
        throw new Error(
          `ارزیابی کیفی برای نوع فعالیت "${activityData.activity_type}" الزامی است`
        );
      }
    }

    // Convert Persian date to Gregorian for storage
    const gregorianDate = convertPersianToGregorian(activityData.activity_date);
    if (!gregorianDate) {
      throw new Error(
        `فرمت تاریخ "${activityData.activity_date}" نامعتبر است. تاریخ باید به فرمت شمسی YYYY-MM-DD وارد شود (مثال: 1403-07-25) و در محدوده سال‌های 1300 تا 1500 باشد.`
      );
    }

    // Insert new activity
    const result = await client.query(
      `
      INSERT INTO educational_activities 
      (class_id, subject_id, student_id, teacher_id, activity_type, activity_title, activity_date, quantitative_score, qualitative_evaluation)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
      `,
      [
        classId,
        subjectId,
        studentId,
        teacherId,
        activityType.id,
        activityData.activity_title || "",
        gregorianDate,
        hasQuantitative && activityData.quantitative_score
          ? parseFloat(activityData.quantitative_score)
          : null,
        hasQualitative && activityData.qualitative_evaluation
          ? activityData.qualitative_evaluation
          : null,
      ]
    );

    if (result.rows.length === 0) {
      throw new Error("خطا در ذخیره فعالیت");
    }

    // Commit the transaction for this record
    await client.query("COMMIT");

    // Return success message with actual student name from database
    return {
      success: true,
      message: `سطر ${rowNumber}: فعالیت "${activityData.activity_title}" برای دانش‌آموز "${actualStudentName}" ایجاد شد`,
      created: true,
    };
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "teacher") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const resolvedParams = await params;
    const classId = resolvedParams.id;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const subjectId = formData.get("subjectId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "فایلی انتخاب نشده است" },
        { status: 400 }
      );
    }

    if (!subjectId) {
      return NextResponse.json(
        { error: "شناسه درس مشخص نشده است" },
        { status: 400 }
      );
    }

    // Verify teacher has access to this class and subject
    const client = await pool.connect();
    try {
      const accessCheck = await client.query(
        `
        SELECT cm.id, cm.role, u.name as teacher_name, 
               s.name as subject_name, s.id as subject_id
        FROM class_memberships cm
        JOIN users u ON cm.user_id = u.id
        JOIN teacher_assignments ta ON cm.class_id = ta.class_id AND cm.user_id = ta.teacher_id
        JOIN subjects s ON ta.subject_id = s.id
        WHERE cm.class_id = $1 AND cm.user_id = $2 AND cm.role = 'teacher' 
              AND ta.subject_id = $3 AND ta.removed_at IS NULL
        `,
        [classId, userData.id, subjectId]
      );

      if (accessCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "شما دسترسی به این کلاس یا درس ندارید" },
          { status: 403 }
        );
      }
    } finally {
      client.release();
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse CSV content with relaxed parsing options
    let records: ActivityRecord[] = [];
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
      // Convert parsed records to ActivityRecord array
      records = parsedRecords.map((record) => {
        // Handle both object and array formats
        if (
          typeof record === "object" &&
          record !== null &&
          !Array.isArray(record)
        ) {
          // Object format (with column names as keys)
          const objRecord = record as Record<string, string>;
          const getValue = (key: string) =>
            objRecord[key] || objRecord[key.replace(/\s*\*$/, "")] || "";
          return {
            "نام دانش‌آموز *": getValue("نام دانش‌آموز *"),
            "کد ملی *": getValue("کد ملی *"),
            "نوع فعالیت *": getValue("نوع فعالیت *"),
            "عنوان فعالیت *": getValue("عنوان فعالیت *"),
            "تاریخ فعالیت *": getValue("تاریخ فعالیت *"),
            "نمره عددی": getValue("نمره عددی"),
            "ارزیابی کیفی": getValue("ارزیابی کیفی"),
          };
        } else if (Array.isArray(record)) {
          // Array format (values only)
          return {
            "نام دانش‌آموز *": record[0] || "",
            "کد ملی *": record[1] || "",
            "نوع فعالیت *": record[2] || "",
            "عنوان فعالیت *": record[3] || "",
            "تاریخ فعالیت *": record[4] || "",
            "نمره عددی": record[5] || "",
            "ارزیابی کیفی": record[6] || "",
          };
        } else {
          // Fallback for unexpected format
          return {
            "نام دانش‌آموز *": "",
            "کد ملی *": "",
            "نوع فعالیت *": "",
            "عنوان فعالیت *": "",
            "تاریخ فعالیت *": "",
            "نمره عددی": "",
            "ارزیابی کیفی": "",
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
    let processedCount = 0;
    const errors: string[] = [];
    const successMessages: string[] = [];

    // Validate all records first
    const validRecords: { record: ActivityRecord; rowNumber: number }[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +1 for header row, +1 for 0-based index

      normalizeRecordKeys(record);

      // Skip header row or empty rows
      if (
        !record["نام دانش‌آموز *"] ||
        record["نام دانش‌آموز *"] === "مثال: محمد محمدی"
      ) {
        continue;
      }

      // Check for column count consistency
      const expectedColumns = 7;
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
      };

      // Extract activity data
      const activityData = {
        activity_type: record["نوع فعالیت *"] || "",
        activity_title: record["عنوان فعالیت *"] || "",
        activity_date: record["تاریخ فعالیت *"] || "",
        quantitative_score: record["نمره عددی"] || "",
        qualitative_evaluation: record["ارزیابی کیفی"] || "",
      };

      // Validation
      let hasError = false;

      if (!studentData.name.trim()) {
        errors.push(`سطر ${rowNumber}: نام دانش‌آموز الزامی است`);
        hasError = true;
      }

      if (!studentData.national_id.trim()) {
        errors.push(`سطر ${rowNumber}: کد ملی دانش‌آموز الزامی است`);
        hasError = true;
      } else if (!/^\d{10}$/.test(studentData.national_id)) {
        errors.push(
          `سطر ${rowNumber}: کد ملی باید ۱۰ رقم باشد (مقدار وارد شده: ${studentData.national_id})`
        );
        hasError = true;
      }

      if (!activityData.activity_type.trim()) {
        errors.push(`سطر ${rowNumber}: نوع فعالیت الزامی است`);
        hasError = true;
      }

      if (!activityData.activity_date.trim()) {
        errors.push(`سطر ${rowNumber}: تاریخ فعالیت الزامی است`);
        hasError = true;
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(activityData.activity_date)) {
        errors.push(
          `سطر ${rowNumber}: فرمت تاریخ "${activityData.activity_date}" نامعتبر است. فرمت صحیح: YYYY-MM-DD (مثال: 2024-10-15)`
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
            const result = await processActivityRecord(
              record,
              rowNumber,
              classId,
              subjectId,
              userData.id
            );
            if (result.success) {
              successMessages.push(result.message);
              if (result.created) createdCount++;
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
          message: `عملیات با موفقیت انجام شد. ${createdCount} فعالیت جدید ایجاد شد.`,
          created: createdCount,
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
