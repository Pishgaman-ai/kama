import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

// API to get all available grade levels from lessons table
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

      // Get grade levels that have existing classes
      const existingClassesResult = await client.query(
        `
        SELECT DISTINCT grade_level
        FROM classes
        WHERE school_id = $1
      `,
        [schoolId]
      );

      // Create a set of grade levels that have classes
      const gradeLevelsWithClasses = new Set(
        existingClassesResult.rows.map((row) => row.grade_level)
      );

      // Get lesson counts from database for existing grade levels
      const gradeLevelsResult = await client.query(
        `
        SELECT
          grade_level,
          COUNT(*) as lesson_count
        FROM lessons
        WHERE school_id = $1
        GROUP BY grade_level
      `,
        [schoolId]
      );

      // Create a map of existing lesson counts
      const lessonCountMap: { [key: string]: number } = {};
      gradeLevelsResult.rows.forEach((row) => {
        lessonCountMap[row.grade_level] = parseInt(row.lesson_count) || 0;
      });

      // Define ALL possible grade levels from curriculum structure
      const elementaryGrades = ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم'];
      const middleSchoolGrades = ['هفتم', 'هشتم', 'نهم'];
      const highSchoolTracks = ['مشترک', 'ریاضی', 'تجربی', 'انسانی', 'معارف', 'فنی'];
      const highSchoolGrades = ['دهم', 'یازدهم', 'دوازدهم'];

      const trackLabels: { [key: string]: string } = {
        'مشترک': 'دروس مشترک',
        'ریاضی': 'ریاضی و فیزیک',
        'تجربی': 'علوم تجربی',
        'انسانی': 'علوم انسانی',
        'معارف': 'معارف اسلامی',
        'فنی': 'فنی و حرفه‌ای',
      };

      // Organize grade levels by educational level
      const gradeLevels = {
        elementary: [] as { value: string; label: string; lessonCount: number }[],
        middleSchool: [] as { value: string; label: string; lessonCount: number }[],
        highSchool: [] as { value: string; label: string; lessonCount: number }[],
      };

      // Add only elementary grades that have classes
      elementaryGrades.forEach((grade) => {
        if (gradeLevelsWithClasses.has(grade)) {
          gradeLevels.elementary.push({
            value: grade,
            label: `پایه ${grade}`,
            lessonCount: lessonCountMap[grade] || 0
          });
        }
      });

      // Add only middle school grades that have classes
      middleSchoolGrades.forEach((grade) => {
        if (gradeLevelsWithClasses.has(grade)) {
          gradeLevels.middleSchool.push({
            value: grade,
            label: `پایه ${grade}`,
            lessonCount: lessonCountMap[grade] || 0
          });
        }
      });

      // Add only high school grades with tracks that have classes
      highSchoolGrades.forEach((grade) => {
        highSchoolTracks.forEach((track) => {
          const gradeLevel = `${grade}-${track}`;
          if (gradeLevelsWithClasses.has(gradeLevel)) {
            gradeLevels.highSchool.push({
              value: gradeLevel,
              label: `${grade} - ${trackLabels[track]}`,
              lessonCount: lessonCountMap[gradeLevel] || 0
            });
          }
        });
      });

      // Calculate total unique grade levels (only those with classes)
      const totalGradeLevels = gradeLevels.elementary.length +
                               gradeLevels.middleSchool.length +
                               gradeLevels.highSchool.length;

      return NextResponse.json({
        success: true,
        gradeLevels,
        total: totalGradeLevels,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Grade levels API error:", error);
    return NextResponse.json(
      { error: "خطا در بارگذاری پایه‌های تحصیلی" },
      { status: 500 }
    );
  }
}
