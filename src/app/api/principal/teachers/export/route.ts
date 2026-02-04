import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import * as XLSX from "xlsx";
import { decryptPassword } from "@/lib/passwordEncryption";

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
      // Get user with school_id
      const userWithSchool = await client.query(
        "SELECT school_id FROM users WHERE id = $1",
        [userData.id]
      );

      if (userWithSchool.rows.length === 0) {
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const schoolId = userWithSchool.rows[0].school_id;

      // Get all teachers with their initial password (encrypted)
      const teachersResult = await client.query(
        `
        SELECT
          t.id,
          t.name,
          t.phone,
          t.email,
          t.national_id,
          t.initial_password,
          t.is_active,
          t.created_at
        FROM users t
        WHERE t.school_id = $1 AND t.role = 'teacher'
        ORDER BY t.is_active DESC, t.created_at DESC
      `,
        [schoolId]
      );

      // Get subjects for each teacher
      const teacherIds = teachersResult.rows.map((t: { id: string }) => t.id);
      const subjectsResult = await client.query(
        `
        SELECT
          ta.teacher_id,
          STRING_AGG(s.name, ', ') as subject_names
        FROM teacher_assignments ta
        JOIN subjects s ON ta.subject_id = s.id
        WHERE ta.teacher_id = ANY($1) AND ta.removed_at IS NULL
        GROUP BY ta.teacher_id
      `,
        [teacherIds]
      );

      // Create a map of teacher_id to subject names
      const teacherSubjectsMap: { [key: string]: string } = {};
      subjectsResult.rows.forEach(
        (row: { teacher_id: string; subject_names: string }) => {
          teacherSubjectsMap[row.teacher_id] = row.subject_names;
        }
      );

      // Get class counts for each teacher
      const classCountsResult = await client.query(
        `
        SELECT
          ta.teacher_id,
          COUNT(DISTINCT ta.class_id) as classes_count
        FROM teacher_assignments ta
        WHERE ta.teacher_id = ANY($1) AND ta.removed_at IS NULL
        GROUP BY ta.teacher_id
      `,
        [teacherIds]
      );

      const teacherClassCountsMap: { [key: string]: number } = {};
      classCountsResult.rows.forEach(
        (row: { teacher_id: string; classes_count: string }) => {
          teacherClassCountsMap[row.teacher_id] = parseInt(row.classes_count);
        }
      );

      // Prepare data for Excel
      const excelData = teachersResult.rows.map(
        (teacher: {
          id: string;
          name: string;
          phone: string;
          email: string;
          national_id: string;
          initial_password: string | null;
          is_active: boolean;
          created_at: string;
        }) => {
          // Decrypt the initial password if it exists
          let password = "-";
          if (teacher.initial_password) {
            try {
              password = decryptPassword(teacher.initial_password);
            } catch (error) {
              console.error(
                `Failed to decrypt password for teacher ${teacher.id}:`,
                error
              );
              password = "خطا در بازیابی رمز عبور";
            }
          }

          return {
            "نام معلم": teacher.name,
            "شماره همراه": teacher.phone,
            "کد ملی": teacher.national_id || "-",
            ایمیل: teacher.email || "-",
            "رمز عبور": password,
            "دروس تدریس": teacherSubjectsMap[teacher.id] || "-",
            "تعداد کلاس‌ها": teacherClassCountsMap[teacher.id] || 0,
            وضعیت: teacher.is_active ? "فعال" : "غیرفعال",
            "تاریخ ثبت‌نام": new Date(teacher.created_at).toLocaleDateString(
              "fa-IR"
            ),
          };
        }
      );

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 20 }, // نام معلم
        { wch: 15 }, // شماره همراه
        { wch: 15 }, // کد ملی
        { wch: 25 }, // ایمیل
        { wch: 15 }, // رمز عبور
        { wch: 30 }, // دروس تدریس
        { wch: 15 }, // تعداد کلاس‌ها
        { wch: 12 }, // وضعیت
        { wch: 15 }, // تاریخ ثبت‌نام
      ];
      worksheet["!cols"] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "معلمان");

      // Generate buffer
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      // Get school name for filename
      const schoolResult = await client.query(
        "SELECT name FROM schools WHERE id = $1",
        [schoolId]
      );
      const schoolName = schoolResult.rows[0]?.name || "مدرسه";

      // Create filename with current date
      const currentDate = new Date()
        .toLocaleDateString("fa-IR")
        .replace(/\//g, "-");
      const filename = `لیست_معلمان_${schoolName}_${currentDate}.xlsx`;

      // Return Excel file
      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(
            filename
          )}"`,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Export teachers API error:", error);
    return NextResponse.json(
      { error: "خطا در خروجی گرفتن از لیست معلمان" },
      { status: 500 }
    );
  }
}
