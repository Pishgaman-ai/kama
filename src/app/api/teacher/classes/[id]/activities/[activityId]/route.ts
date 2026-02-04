import { NextResponse } from "next/server";
import pool from "@/lib/database";

// GET /api/teacher/classes/[id]/activities/[activityId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    const resolvedParams = await params;
    const classId = resolvedParams.id;
    const activityId = resolvedParams.activityId;

    const client = await pool.connect();

    try {
      // Fetch activity details along with student, class, and subject information
      const query = `
        SELECT 
          ea.*,
          u.name as student_name,
          c.name as class_name,
          s.name as subject_name
        FROM educational_activities ea
        JOIN users u ON ea.student_id = u.id
        JOIN classes c ON ea.class_id = c.id
        JOIN subjects s ON ea.subject_id = s.id
        WHERE ea.id = $1 AND ea.class_id = $2
      `;

      const result = await client.query(query, [activityId, classId]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "فعالیت یافت نشد" },
          { status: 404 }
        );
      }

      const activity = result.rows[0];

      // Ensure the date is in a consistent format
      if (activity.activity_date) {
        // Convert to YYYY-MM-DD format if it's a Date object or in a different format
        if (activity.activity_date instanceof Date) {
          activity.activity_date = activity.activity_date
            .toISOString()
            .split("T")[0];
        } else if (
          typeof activity.activity_date === "string" &&
          activity.activity_date.includes("T")
        ) {
          // If it's an ISO string, convert to YYYY-MM-DD
          activity.activity_date = activity.activity_date.split("T")[0];
        }
      }

      return NextResponse.json({
        success: true,
        data: activity,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching activity details:", error);
    return NextResponse.json(
      { success: false, error: "خطا در بارگیری اطلاعات فعالیت" },
      { status: 500 }
    );
  }
}
