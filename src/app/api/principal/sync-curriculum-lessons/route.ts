import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

// API to sync standard curriculum lessons for a specific grade level
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

    const { grade_level } = await request.json();

    if (!grade_level) {
      return NextResponse.json(
        { error: "پایه تحصیلی مشخص نشده است" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Get user's school_id
      const userWithSchool = await client.query(
        "SELECT school_id FROM users WHERE id = $1",
        [userData.id]
      );

      if (userWithSchool.rows.length === 0) {
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const schoolId = userWithSchool.rows[0].school_id;

      // Fetch standard curriculum lessons from the other API
      const curriculumResponse = await fetch(
        `${request.nextUrl.origin}/api/principal/curriculum-lessons?grade_level=${grade_level}`
      );

      if (!curriculumResponse.ok) {
        throw new Error("Failed to fetch curriculum lessons");
      }

      const curriculumData = await curriculumResponse.json();
      const standardLessons: string[] = curriculumData.lessons || [];

      // Get existing lessons for this grade level
      const existingLessons = await client.query(
        "SELECT title FROM lessons WHERE school_id = $1 AND grade_level = $2",
        [schoolId, grade_level]
      );

      const existingTitles = new Set(
        existingLessons.rows.map((row) => row.title)
      );

      // Insert only new lessons that don't exist yet
      let addedCount = 0;
      for (const lessonTitle of standardLessons) {
        if (!existingTitles.has(lessonTitle)) {
          await client.query(
            `
            INSERT INTO lessons (school_id, title, grade_level, created_by, description)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (school_id, title, grade_level) DO NOTHING
          `,
            [
              schoolId,
              lessonTitle,
              grade_level,
              userData.id,
              "درس استاندارد برنامه درسی ملی",
            ]
          );
          addedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `${addedCount} درس استاندارد با موفقیت اضافه شد`,
        added: addedCount,
        total_standard: standardLessons.length,
        already_existed: standardLessons.length - addedCount,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Sync curriculum lessons API error:", error);
    return NextResponse.json(
      { error: "خطا در همگام‌سازی دروس استاندارد" },
      { status: 500 }
    );
  }
}
