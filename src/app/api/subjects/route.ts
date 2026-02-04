import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

// Define the subject interface
interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  grade_level: string;
  created_at: string;
}

// This API endpoint returns all subjects from the Ministry of Education
export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();

    try {
      // Special school_id for Ministry of Education subjects
      const moeSchoolId = "00000000-0000-0000-0000-000000000000";

      // Fetch all subjects from the Ministry of Education
      const subjectsResult = await client.query(
        `
        SELECT 
          id,
          name,
          code,
          description,
          grade_level,
          created_at
        FROM subjects
        WHERE school_id = $1
        ORDER BY grade_level, name
      `,
        [moeSchoolId]
      );

      const subjects = subjectsResult.rows.map((subject) => ({
        ...subject,
        name: `${subject.name} ${subject.grade_level} ${
          ["هفتم", "هشتم", "نهم"].includes(subject.grade_level)
            ? "متوسطه دوره ۱"
            : ["دهم", "یازدهم", "دوازدهم"].includes(subject.grade_level)
            ? "متوسطه دوره ۲"
            : "دبستان"
        }`,
      }));

      return NextResponse.json({ subjects });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Subjects API error:", error);
    return NextResponse.json(
      { error: "خطا در بارگذاری دروس" },
      { status: 500 }
    );
  }
}
