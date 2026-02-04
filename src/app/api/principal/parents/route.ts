import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

interface Parent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  children_count: number;
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
      // Get user with school_id
      const userWithSchool = await client.query(
        "SELECT school_id FROM users WHERE id = $1",
        [userData.id]
      );

      if (userWithSchool.rows.length === 0) {
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const schoolId = userWithSchool.rows[0].school_id;

      // Get all parents for the school with children count
      const parentsResult = await client.query(
        `
        SELECT 
          u.id,
          u.name,
          u.phone,
          u.email,
          psr.relationship,
          COUNT(psr.student_id) as children_count
        FROM users u
        JOIN parent_student_relations psr ON u.id = psr.parent_id
        JOIN users s ON psr.student_id = s.id
        WHERE u.role = 'parent' AND s.school_id = $1
        GROUP BY u.id, u.name, u.phone, u.email, psr.relationship
        ORDER BY u.name
        `,
        [schoolId]
      );

      const parents: Parent[] = parentsResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email || undefined,
        relationship: row.relationship,
        children_count: parseInt(row.children_count) || 0,
      }));

      return NextResponse.json({ parents });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Parents API error:", error);
    return NextResponse.json(
      { error: "خطا در بارگذاری اولیاء" },
      { status: 500 }
    );
  }
}
