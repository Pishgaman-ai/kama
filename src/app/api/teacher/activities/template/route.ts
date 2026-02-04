import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    if (!userData || userData.role !== "teacher") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const client = await pool.connect();

    try {
      // Get teacher's students with their classes
      const studentsResult = await client.query(
        `SELECT DISTINCT
          u.id as student_id,
          u.name as student_name,
          u.national_id,
          c.id as class_id,
          c.name as class_name,
          c.grade_level,
          c.section
        FROM class_memberships cm
        JOIN users u ON cm.user_id = u.id
        JOIN classes c ON cm.class_id = c.id
        JOIN teacher_assignments ta ON c.id = ta.class_id
        WHERE ta.teacher_id = $1
          AND cm.role = 'student'
          AND ta.removed_at IS NULL
          AND u.is_active = true
        ORDER BY c.name, u.name`,
        [userData.id]
      );

      // Get teacher's lessons
      const lessonsResult = await client.query(
        `SELECT DISTINCT
          l.id as lesson_id,
          l.title as lesson_name,
          ta.class_id
        FROM teacher_assignments ta
        JOIN lessons l ON ta.subject_id = l.id
        WHERE ta.teacher_id = $1 AND ta.removed_at IS NULL
        ORDER BY l.title`,
        [userData.id]
      );

      // Create template data with sample row and instructions
      const templateData = [
        {
          "ردیف": 1,
          "نام دانش‌آموز": "نمونه: علی احمدی",
          "کد ملی": "1234567890",
          "کلاس": "نمونه: ریاضی-الف",
          "پایه": "نمونه: دهم",
          "درس": "نمونه: ریاضی",
          "نوع فعالیت": "آزمون میان‌ترم",
          "عنوان فعالیت": "نمونه: آزمون فصل اول",
          "تاریخ": "1404/01/07",
          "نمره کمی (0-20)": 18,
          "ارزیابی کیفی": "نمونه: عملکرد بسیار خوب",
        },
      ];

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Add main template sheet
      const templateSheet = XLSX.utils.json_to_sheet(templateData);

      // Set column widths for template
      templateSheet["!cols"] = [
        { wch: 8 },  // ردیف
        { wch: 20 }, // نام دانش‌آموز
        { wch: 15 }, // کد ملی
        { wch: 20 }, // کلاس
        { wch: 15 }, // پایه
        { wch: 15 }, // درس
        { wch: 20 }, // نوع فعالیت
        { wch: 30 }, // عنوان فعالیت
        { wch: 20 }, // تاریخ
        { wch: 15 }, // نمره کمی
        { wch: 40 }, // ارزیابی کیفی
      ];

      XLSX.utils.book_append_sheet(workbook, templateSheet, "نمونه ورود فعالیت");

      // Add students list sheet
      const studentsData = studentsResult.rows.map((row, index) => ({
        "ردیف": index + 1,
        "نام دانش‌آموز": row.student_name,
        "کد ملی": row.national_id || "-",
        "کلاس": row.section ? `${row.class_name}-${row.section}` : row.class_name,
        "پایه": row.grade_level,
      }));

      if (studentsData.length > 0) {
        const studentsSheet = XLSX.utils.json_to_sheet(studentsData);
        studentsSheet["!cols"] = [
          { wch: 8 },
          { wch: 25 },
          { wch: 15 },
          { wch: 20 },
          { wch: 15 },
        ];
        XLSX.utils.book_append_sheet(workbook, studentsSheet, "لیست دانش‌آموزان");
      }

      // Add lessons list sheet
      const lessonsData = lessonsResult.rows.map((row, index) => ({
        "ردیف": index + 1,
        "نام درس": row.lesson_name,
      }));

      if (lessonsData.length > 0) {
        const lessonsSheet = XLSX.utils.json_to_sheet(lessonsData);
        lessonsSheet["!cols"] = [{ wch: 8 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(workbook, lessonsSheet, "لیست دروس");
      }

      // Add instructions sheet
      const instructionsData = [
        { "راهنمای استفاده": "نحوه استفاده از فایل نمونه برای ورود اطلاعات فعالیت‌ها:" },
        { "راهنمای استفاده": "" },
        { "راهنمای استفاده": "۱. در شیت 'نمونه ورود فعالیت'، ردیف اول یک نمونه است. می‌توانید آن را حذف کنید." },
        { "راهنمای استفاده": "۲. برای هر فعالیت، یک ردیف جدید اضافه کنید." },
        { "راهنمای استفاده": "۳. نام دانش‌آموزان و کلاس‌ها را دقیقاً مطابق شیت 'لیست دانش‌آموزان' وارد کنید." },
        { "راهنمای استفاده": "۴. نام درس را دقیقاً مطابق شیت 'لیست دروس' وارد کنید." },
        { "راهنمای استفاده": "۵. نوع فعالیت باید یکی از موارد زیر باشد:" },
        { "راهنمای استفاده": "   - آزمون میان‌ترم" },
        { "راهنمای استفاده": "   - آزمون پایان ترم" },
        { "راهنمای استفاده": "   - آزمون ماهیانه" },
        { "راهنمای استفاده": "   - آزمون هفتگی" },
        { "راهنمای استفاده": "   - فعالیت کلاسی" },
        { "راهنمای استفاده": "   - تکلیف کلاسی" },
        { "راهنمای استفاده": "   - تکلیف منزل" },
        { "راهنمای استفاده": "۶. تاریخ را به فرمت شمسی YYYY/MM/DD وارد کنید (مثل: 1404/01/07)" },
        { "راهنمای استفاده": "۷. نمره کمی باید عدد بین 0 تا 20 باشد (اختیاری)" },
        { "راهنمای استفاده": "۸. ارزیابی کیفی متنی است (اختیاری)" },
        { "راهنمای استفاده": "۹. پس از تکمیل، فایل را ذخیره کرده و از منوی برنامه آپلود کنید." },
      ];

      const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
      instructionsSheet["!cols"] = [{ wch: 100 }];
      XLSX.utils.book_append_sheet(workbook, instructionsSheet, "راهنما");

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      // Generate filename
      const now = new Date();
      const persianDate = now.toLocaleDateString("fa-IR").replace(/\//g, "-");
      const filename = `activities_template_${persianDate}.xlsx`;

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
    console.error("Template generation error:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد فایل نمونه. لطفاً مجدداً تلاش کنید." },
      { status: 500 }
    );
  }
}
