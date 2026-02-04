import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

// GET /api/admin/resources/subjects - Get all subjects and grade levels for admin
// Optionally filter subjects by grade_level using query parameter
export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const sessionCookie = req.cookies.get("admin_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const admin = JSON.parse(sessionCookie.value);
    if (admin.role !== "school_admin") {
      return NextResponse.json(
        { error: "دسترسی محدود به ادمین" },
        { status: 403 }
      );
    }

    const client = await pool.connect();

    try {
      // Get grade level and school ID filters from query parameters
      const { searchParams } = new URL(req.url);
      const gradeLevel = searchParams.get("gradeLevel") || undefined;
      const schoolId = searchParams.get("schoolId") || undefined;

      // Get all subjects (both MoE and school-specific if schoolId is provided) with their grade levels
      let subjectsQuery = `
        SELECT id, name, grade_level, school_id
        FROM subjects
        WHERE school_id = '00000000-0000-0000-0000-000000000000'
        ORDER BY grade_level, name
      `;

      const subjectsParams: string[] = [];

      // If schoolId is provided, include school-specific subjects
      if (schoolId) {
        subjectsQuery = `
          SELECT id, name, grade_level, school_id
          FROM subjects
          WHERE (school_id = '00000000-0000-0000-0000-000000000000' OR school_id = $1)
          ORDER BY grade_level, name
        `;
        subjectsParams.push(schoolId);
      }

      // If grade level filter is provided, add it to the query
      if (gradeLevel) {
        if (schoolId) {
          // Query already includes schoolId parameter, so gradeLevel becomes $2
          subjectsQuery = `
            SELECT id, name, grade_level, school_id
            FROM subjects
            WHERE (school_id = '00000000-0000-0000-0000-000000000000' OR school_id = $1)
            AND grade_level = $2
            ORDER BY name
          `;
          subjectsParams.push(gradeLevel);
        } else {
          // No schoolId parameter, so gradeLevel is $1
          subjectsQuery = `
            SELECT id, name, grade_level, school_id
            FROM subjects
            WHERE school_id = '00000000-0000-0000-0000-000000000000'
            AND grade_level = $1
            ORDER BY name
          `;
          subjectsParams.push(gradeLevel);
        }
      }

      const subjectsResult = await client.query(subjectsQuery, subjectsParams);

      // Get all distinct grade levels from subjects (both MoE and school-specific if schoolId is provided)
      let gradesQuery = `
        SELECT DISTINCT grade_level
        FROM subjects
        WHERE school_id = '00000000-0000-0000-0000-000000000000'
        AND grade_level IS NOT NULL
        ORDER BY grade_level
      `;

      const gradesParams: string[] = [];

      // If schoolId is provided, include school-specific grade levels
      if (schoolId) {
        gradesQuery = `
          SELECT DISTINCT grade_level
          FROM subjects
          WHERE (school_id = '00000000-0000-0000-0000-000000000000' OR school_id = $1)
          AND grade_level IS NOT NULL
          ORDER BY grade_level
        `;
        gradesParams.push(schoolId);
      }

      const gradesResult = await client.query(gradesQuery, gradesParams);

      const subjects = subjectsResult.rows;
      const gradeLevels = gradesResult.rows.map((row) => row.grade_level);

      return NextResponse.json({
        success: true,
        data: { subjects, gradeLevels },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Admin Resources Subjects API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات" },
      { status: 500 }
    );
  }
}
