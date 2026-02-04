import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const client = await pool.connect();

    try {
      console.log("🔄 Starting foreign key migration...");

      // Step 1: Drop the old foreign key constraint
      await client.query(`
        ALTER TABLE teacher_assignments
        DROP CONSTRAINT IF EXISTS teacher_assignments_subject_id_fkey;
      `);

      console.log("✅ Dropped old foreign key constraint");

      // Step 2: Delete teacher_assignments that reference non-existent lessons
      const deleteResult = await client.query(`
        DELETE FROM teacher_assignments
        WHERE subject_id NOT IN (SELECT id FROM lessons);
      `);

      console.log(`✅ Cleaned up ${deleteResult.rowCount} invalid teacher assignments`);

      // Step 3: Add new foreign key constraint pointing to lessons table
      await client.query(`
        ALTER TABLE teacher_assignments
        ADD CONSTRAINT teacher_assignments_subject_id_fkey
        FOREIGN KEY (subject_id) REFERENCES lessons(id) ON DELETE CASCADE;
      `);

      console.log("✅ Added new foreign key constraint to lessons table");

      return NextResponse.json({
        success: true,
        message: "Foreign key migration completed successfully",
        details: {
          old_constraint: "subjects table",
          new_constraint: "lessons table",
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Migration failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
