import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Add logo_url column to schools table if it doesn't exist
      await client.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='schools' AND column_name='logo_url') THEN
            ALTER TABLE schools ADD COLUMN logo_url TEXT;
          END IF;
        END $$;
      `);

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "ستون logo_url با موفقیت به جدول schools اضافه شد"
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Add logo column migration error:", error);
    return NextResponse.json(
      { error: "خطا در اضافه کردن ستون logo_url به جدول schools" },
      { status: 500 }
    );
  }
}