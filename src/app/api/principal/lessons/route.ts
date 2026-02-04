import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    if (user.role !== "principal") {
      return NextResponse.json(
        { error: "دسترسی محدود به مدیران" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const gradeLevel = searchParams.get("grade_level");

    const client = await pool.connect();

    try {
      let query = `
        SELECT
          l.id,
          l.title,
          l.description,
          l.grade_level,
          l.created_by,
          l.created_at,
          l.updated_at,
          u.name as created_by_name
        FROM lessons l
        LEFT JOIN users u ON l.created_by = u.id
        WHERE l.school_id = $1
      `;
      const params: (string | null)[] = [user.school_id];

      if (gradeLevel) {
        query += ` AND l.grade_level = $2`;
        params.push(gradeLevel);
      }

      query += ` ORDER BY l.grade_level, l.title`;

      const result = await client.query(query, params);

      return NextResponse.json({
        success: true,
        lessons: result.rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Lessons GET API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت درس‌ها" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    if (user.role !== "principal") {
      return NextResponse.json(
        { error: "دسترسی محدود به مدیران" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, grade_level } = body;

    if (!title || !grade_level) {
      return NextResponse.json(
        { error: "عنوان و سطح کلاس الزامی است" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        INSERT INTO lessons (school_id, title, description, grade_level, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, description, grade_level, created_by, created_at, updated_at
        `,
        [user.school_id, title, description || null, grade_level, user.id]
      );

      return NextResponse.json({
        success: true,
        lesson: result.rows[0],
      });
    } catch (dbError: any) {
      if (dbError.code === "23505") {
        return NextResponse.json(
          { error: "این درس برای این سطح کلاس قبلاً وجود دارد" },
          { status: 409 }
        );
      }
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Lessons POST API error:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد درس" },
      { status: 500 }
    );
  }
}
