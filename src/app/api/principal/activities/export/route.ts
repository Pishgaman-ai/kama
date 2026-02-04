import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import * as XLSX from "xlsx";

// @ts-ignore
const moment = require("moment-jalaali");

// Helper function to convert Gregorian date to Persian
function gregorianToPersian(gregorianDate: string | Date): string {
  try {
    const m = moment(gregorianDate);
    if (!m.isValid()) {
      return "-";
    }
    return m.format("jYYYY/jMM/jDD");
  } catch (error) {
    return "-";
  }
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
      // Fetch all activities for the principal's school
      const result = await client.query(
        `SELECT
          ea.id,
          u.name as student_name,
          u.national_id as student_national_id,
          c.name as class_name,
          c.grade_level,
          c.section,
          l.title as subject_name,
          ea.activity_type,
          ea.activity_title,
          ea.activity_date,
          ea.quantitative_score,
          ea.qualitative_evaluation,
          t.name as teacher_name
        FROM educational_activities ea
        JOIN users u ON ea.student_id = u.id
        JOIN classes c ON ea.class_id = c.id
        LEFT JOIN lessons l ON ea.subject_id = l.id
        JOIN users t ON ea.teacher_id = t.id
        WHERE c.school_id = $1
        ORDER BY ea.activity_date DESC, c.name, u.name`,
        [userData.school_id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "هیچ فعالیتی برای خروجی یافت نشد" },
          { status: 404 }
        );
      }

      // Fetch activity types from database for this school
      const activityTypesResult = await client.query(
        `SELECT type_key, persian_name FROM activity_types WHERE school_id = $1 AND is_active = true`,
        [userData.school_id]
      );

      // Create mapping from type_key to persian_name
      const activityTypeMap: { [key: string]: string } = {};
      activityTypesResult.rows.forEach((row: any) => {
        activityTypeMap[row.type_key] = row.persian_name;
      });

      // Fallback to default mapping if no types found in database
      if (activityTypesResult.rows.length === 0) {
        activityTypeMap["midterm_exam"] = "آزمون میان‌ترم";
        activityTypeMap["monthly_exam"] = "آزمون ماهیانه";
        activityTypeMap["weekly_exam"] = "آزمون هفتگی";
        activityTypeMap["class_activity"] = "فعالیت کلاسی";
        activityTypeMap["class_homework"] = "تکلیف کلاسی";
        activityTypeMap["home_homework"] = "تکلیف منزل";
      }

      // Prepare data for Excel
      const excelData = result.rows.map((row, index) => ({
        "نام دانش‌آموز": row.student_name,
        "کد ملی": row.student_national_id || "",
        "کلاس": row.section
          ? `${row.class_name}-${row.section}`
          : row.class_name,
        "درس": row.subject_name || "",
        "نوع فعالیت": activityTypeMap[row.activity_type] || row.activity_type,
        "عنوان فعالیت": row.activity_title,
        "تاریخ شمسی (مثال: 1403/10/15)": gregorianToPersian(row.activity_date),
        "نمره": row.quantitative_score ?? "",
        "ارزیابی کیفی": row.qualitative_evaluation || "",
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 25 }, // نام دانش‌آموز
        { wch: 15 }, // کد ملی
        { wch: 20 }, // کلاس
        { wch: 25 }, // درس
        { wch: 20 }, // نوع فعالیت
        { wch: 30 }, // عنوان فعالیت
        { wch: 25 }, // تاریخ شمسی (مثال: 1403/10/15)
        { wch: 10 }, // نمره
        { wch: 30 }, // ارزیابی کیفی
      ];
      worksheet["!cols"] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "فعالیت‌ها");

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      // Generate filename with current date
      const now = new Date();
      const persianDate = now.toLocaleDateString("fa-IR").replace(/\//g, "-");
      const filename = `school_activities_${persianDate}.xlsx`;

      // Return the Excel file
      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
            filename
          )}`,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Export activities error:", error);
    return NextResponse.json(
      { error: "خطا در خروجی گرفتن فعالیت‌ها. لطفاً مجدداً تلاش کنید." },
      { status: 500 }
    );
  }
}
