import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Add teachers from teacher_assignments to class_memberships
      // This will fix existing data inconsistencies
      const result = await client.query(`
        INSERT INTO class_memberships (class_id, user_id, role)
        SELECT DISTINCT ta.class_id, ta.teacher_id, 'teacher'
        FROM teacher_assignments ta
        LEFT JOIN class_memberships cm ON ta.class_id = cm.class_id AND ta.teacher_id = cm.user_id
        WHERE cm.user_id IS NULL AND ta.removed_at IS NULL
        ON CONFLICT (class_id, user_id) DO NOTHING
      `);

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "پایگاه داده با موفقیت به‌روزرسانی شد",
        migrated_records: result.rowCount
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database migration API error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی پایگاه داده" },
      { status: 500 }
    );
  }
}