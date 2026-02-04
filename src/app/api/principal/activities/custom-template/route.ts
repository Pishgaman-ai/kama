import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import ExcelJS from "exceljs";
import moment from "moment-jalaali";

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
    const {
      gradeLevels = [],
      classes = [],
      lessons = [],
      activityTypes = [],
      defaultScore = null,
      defaultDate = null,
    } = body;

    // Validation
    if (lessons.length === 0) {
      return NextResponse.json(
        { error: "حداقل یک درس باید انتخاب شود" },
        { status: 400 }
      );
    }

    if (activityTypes.length === 0) {
      return NextResponse.json(
        { error: "حداقل یک نوع فعالیت باید انتخاب شود" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Get user's school_id
      const userResult = await client.query(
        "SELECT school_id FROM users WHERE id = $1",
        [userData.id]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: "کاربر یافت نشد" },
          { status: 404 }
        );
      }

      const schoolId = userResult.rows[0].school_id;

      // Build query to get students
      let studentQuery = `
        SELECT DISTINCT
          u.id as student_id,
          u.name as student_name,
          u.national_id,
          c.id as class_id,
          c.name as class_name,
          c.grade_level,
          c.section
        FROM users u
        JOIN class_memberships cm ON u.id = cm.user_id
        JOIN classes c ON cm.class_id = c.id
        WHERE u.role = 'student'
          AND u.school_id = $1
          AND u.is_active = true
          AND cm.role = 'student'
      `;

      const queryParams: any[] = [schoolId];
      let paramIndex = 2;

      // Filter by grade levels if specified
      if (gradeLevels.length > 0) {
        studentQuery += ` AND c.grade_level = ANY($${paramIndex})`;
        queryParams.push(gradeLevels);
        paramIndex++;
      }

      // Filter by classes if specified
      if (classes.length > 0) {
        studentQuery += ` AND c.id = ANY($${paramIndex})`;
        queryParams.push(classes);
        paramIndex++;
      }

      studentQuery += ` ORDER BY c.grade_level, c.name, c.section, u.name`;

      const studentsResult = await client.query(studentQuery, queryParams);

      if (studentsResult.rows.length === 0) {
        // Provide more specific error message
        let errorMessage = "هیچ دانش‌آموزی یافت نشد. ";

        if (gradeLevels.length > 0 && classes.length === 0) {
          errorMessage += "لطفاً ابتدا برای پایه‌های انتخابی، کلاس ایجاد کرده و دانش‌آموزان را به آن اضافه کنید.";
        } else if (classes.length > 0) {
          errorMessage += "کلاس‌های انتخابی دانش‌آموزی ندارند. لطفاً ابتدا دانش‌آموزان را به کلاس‌ها اضافه کنید.";
        } else {
          errorMessage += "لطفاً ابتدا کلاس ایجاد کرده و دانش‌آموزان را اضافه کنید.";
        }

        return NextResponse.json(
          { error: errorMessage },
          { status: 404 }
        );
      }

      // Get lesson details
      const lessonsResult = await client.query(
        `SELECT id, title as name
         FROM lessons
         WHERE id = ANY($1)
         ORDER BY title`,
        [lessons]
      );

      // Get activity type names
      const activityTypesResult = await client.query(
        `SELECT type_key, persian_name
         FROM activity_types
         WHERE type_key = ANY($1)
         ORDER BY persian_name`,
        [activityTypes]
      );

      const activityTypeMap = new Map(
        activityTypesResult.rows.map((row) => [row.type_key, row.persian_name])
      );

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("فعالیت‌ها");

      // Convert defaultDate to Persian (Shamsi) format if provided
      let persianDate = "";
      if (defaultDate) {
        persianDate = moment(defaultDate, "YYYY-MM-DD").format("jYYYY/jMM/jDD");
      }

      // Define columns
      worksheet.columns = [
        { header: "نام دانش‌آموز", key: "student_name", width: 25 },
        { header: "کد ملی", key: "national_id", width: 15 },
        { header: "کلاس", key: "class_name", width: 20 },
        { header: "درس", key: "lesson_name", width: 25 },
        { header: "نوع فعالیت", key: "activity_type", width: 20 },
        { header: "عنوان فعالیت", key: "activity_title", width: 30 },
        { header: "تاریخ شمسی (مثال: 1403/10/15)", key: "activity_date", width: 25 },
        { header: "نمره", key: "score", width: 10 },
        { header: "ارزیابی کیفی", key: "qualitative", width: 30 },
      ];

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, size: 12 };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
      headerRow.height = 25;

      // Generate rows for each combination of student, lesson, and activity type
      const rows: any[] = [];
      for (const student of studentsResult.rows) {
        for (const lesson of lessonsResult.rows) {
          for (const activityType of activityTypes) {
            const classDisplayName = student.section
              ? `${student.class_name}-${student.section}`
              : student.class_name;

            rows.push({
              student_name: student.student_name,
              national_id: student.national_id || "",
              class_name: classDisplayName,
              lesson_name: lesson.name,
              activity_type: activityTypeMap.get(activityType) || activityType,
              activity_title: "",
              activity_date: persianDate || "",
              score: defaultScore !== null ? defaultScore : "",
              qualitative: "",
            });
          }
        }
      }

      // Add rows to worksheet
      rows.forEach((row) => {
        worksheet.addRow(row);
      });

      // Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Alternate row colors (except header)
        if (rowNumber > 1 && rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF8F9FA" },
            };
          });
        }
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Create response with file
      const response = new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
            "فرم_خام_فعالیت‌ها.xlsx"
          )}`,
        },
      });

      return response;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Custom template generation error:", error);
    return NextResponse.json(
      { error: "خطا در تولید فایل الگو" },
      { status: 500 }
    );
  }
}
