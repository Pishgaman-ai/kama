import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve the params promise
    const { id: activityId } = await params;

    // Get user from session cookie
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get database client
    const client = await pool.connect();

    try {
      // Verify that the educational activity belongs to this teacher
      const activityResult = await client.query(
        `SELECT id, teacher_id FROM educational_activities WHERE id = $1 AND teacher_id = $2`,
        [activityId, user.id]
      );

      if (activityResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Educational activity not found or access denied" },
          { status: 404 }
        );
      }

      // Fetch AI question results for this activity
      const aiResults = await client.query(
        `SELECT * FROM ai_question_results 
         WHERE educational_activity_id = $1 
         ORDER BY question_number ASC`,
        [activityId]
      );

      return NextResponse.json({
        success: true,
        data: aiResults.rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching AI results:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI results" },
      { status: 500 }
    );
  }
}
