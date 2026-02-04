import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const params = await paramsPromise;

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

    const client = await pool.connect();

    try {
      const result = await client.query(
        `
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
        WHERE l.id = $1 AND l.school_id = $2
        `,
        [params.id, user.school_id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "درس یافت نشد" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        lesson: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Lesson GET API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت درس" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const params = await paramsPromise;

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
        UPDATE lessons
        SET title = $1, description = $2, grade_level = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND school_id = $5
        RETURNING id, title, description, grade_level, created_by, created_at, updated_at
        `,
        [title, description || null, grade_level, params.id, user.school_id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "درس یافت نشد" }, { status: 404 });
      }

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
    console.error("Lesson PUT API error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی درس" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const params = await paramsPromise;

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

    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        DELETE FROM lessons
        WHERE id = $1 AND school_id = $2
        RETURNING id
        `,
        [params.id, user.school_id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "درس یافت نشد" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "درس با موفقیت حذف شد",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Lesson DELETE API error:", error);
    return NextResponse.json(
      { error: "خطا در حذف درس" },
      { status: 500 }
    );
  }
}
