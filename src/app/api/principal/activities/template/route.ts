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

    if (!userData || userData.role !== "principal") {
      return NextResponse.json({ error: "دسترسی محدود" }, { status: 403 });
    }

    const client = await pool.connect();

    try {
      // Get all students in the principal's school
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
        WHERE c.school_id = $1
          AND cm.role = 'student'
          AND u.is_active = true
        ORDER BY c.name, u.name`,
        [userData.school_id]
      );

      // Get all lessons in the principal's school
      const lessonsResult = await client.query(
        `SELECT DISTINCT
          l.id as lesson_id,
          l.title as lesson_name
        FROM lessons l
        JOIN teacher_assignments ta ON l.id = ta.subject_id
        JOIN classes c ON ta.class_id = c.id
        WHERE c.school_id = $1 AND ta.removed_at IS NULL
        ORDER BY l.title`,
        [userData.school_id]
      );

      // Get all teachers in the principal's school
      const teachersResult = await client.query(
        `SELECT DISTINCT
          u.id as teacher_id,
          u.name as teacher_name
        FROM users u
        JOIN class_memberships cm ON u.id = cm.user_id
        JOIN classes c ON cm.class_id = c.id
        WHERE c.school_id = $1
          AND cm.role = 'teacher'
          AND u.is_active = true
        ORDER BY u.name`,
        [userData.school_id]
      );

      // Create template data with sample row and instructions
      const templateData = [
        {
          "نام دانش‌آموز": "نمونه: علی احمدی",
          "کد ملی": "1234567890",
          "کلاس": "نمونه: ریاضی-الف",
          "درس": "نمونه: ریاضی",
          "نوع فعالیت": "آزمون میان‌ترم",
          "عنوان فعالیت": "نمونه: آزمون فصل اول",
          "تاریخ شمسی (مثال: 1403/10/15)": "1404/01/07",
          "نمره": 18,
          "ارزیابی کیفی": "نمونه: عملکرد بسیار خوب",
        },
      ];

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Add main template sheet
      const templateSheet = XLSX.utils.json_to_sheet(templateData);

      // Set column widths for template
      templateSheet["!cols"] = [
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

      XLSX.utils.book_append_sheet(workbook, templateSheet, "نمونه ورود فعالیت");

      // Add students list sheet
      const studentsData = studentsResult.rows.map((row, index) => ({
        "ردیف": index + 1,
        "نام دانش‌آموز": row.student_name,
        "کد ملی": row.national_id || "",
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

      // Add teachers list sheet
      const teachersData = teachersResult.rows.map((row, index) => ({
        "ردیف": index + 1,
        "نام معلم": row.teacher_name,
      }));

      if (teachersData.length > 0) {
        const teachersSheet = XLSX.utils.json_to_sheet(teachersData);
        teachersSheet["!cols"] = [{ wch: 8 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(workbook, teachersSheet, "لیست معلمان");
      }

      // Add instructions sheet
      const instructionsData = [
        { "راهنمای استفاده": "نحوه استفاده از فایل نمونه برای ورود اطلاعات فعالیت‌ها:" },
        { "راهنمای استفاده": "" },
        { "راهنمای استفاده": "۱. در شیت 'نمونه ورود فعالیت'، ردیف اول یک نمونه است. می‌توانید آن را حذف کنید." },
        { "راهنمای استفاده": "۲. برای هر فعالیت، یک ردیف جدید اضافه کنید." },
        { "راهنمای استفاده": "۳. نام دانش‌آموزان و کلاس‌ها را دقیقاً مطابق شیت 'لیست دانش‌آموزان' وارد کنید." },
        { "راهنمای استفاده": "۴. نام درس را دقیقاً مطابق شیت 'لیست دروس' وارد کنید." },
        { "راهنمای استفاده": "۵. نام معلم را دقیقاً مطابق شیت 'لیست معلمان' وارد کنید." },
        { "راهنمای استفاده": "۶. نوع فعالیت باید یکی از موارد زیر باشد:" },
        { "راهنمای استفاده": "   - آزمون میان‌ترم" },
        { "راهنمای استفاده": "   - آزمون ماهیانه" },
        { "راهنمای استفاده": "   - آزمون هفتگی" },
        { "راهنمای استفاده": "   - فعالیت کلاسی" },
        { "راهنمای استفاده": "   - تکلیف کلاسی" },
        { "راهنمای استفاده": "   - تکلیف منزل" },
        { "راهنمای استفاده": "۷. تاریخ را به فرمت شمسی YYYY/MM/DD وارد کنید (مثل: 1404/01/07)" },
        { "راهنمای استفاده": "۸. نمره کمی باید عدد بین 0 تا 20 باشد (اختیاری)" },
        { "راهنمای استفاده": "۹. ارزیابی کیفی متنی است (اختیاری)" },
        { "راهنمای استفاده": "۱۰. پس از تکمیل، فایل را ذخیره کرده و از منوی برنامه آپلود کنید." },
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
      const filename = `school_activities_template_${persianDate}.xlsx`;

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
