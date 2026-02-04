import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { deleteFileFromStorage } from "@/lib/fileUpload";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Resolve the params promise
  const { id: activityId } = await params;

  try {
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
        `SELECT id, teacher_id, question_file_url, answer_file_url FROM educational_activities WHERE id = $1 AND teacher_id = $2`,
        [activityId, user.id]
      );

      if (activityResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Educational activity not found or access denied" },
          { status: 404 }
        );
      }

      const activity = activityResult.rows[0];

      // Get the file type to delete from query parameters
      const { searchParams } = new URL(request.url);
      const fileType = searchParams.get("fileType"); // "question" or "answer"

      if (!fileType || (fileType !== "question" && fileType !== "answer")) {
        return NextResponse.json(
          { error: "Invalid file type. Must be 'question' or 'answer'" },
          { status: 400 }
        );
      }

      // Determine which file URL to delete
      let fileUrlToDelete: string | null = null;
      if (fileType === "question") {
        fileUrlToDelete = activity.question_file_url;
      } else if (fileType === "answer") {
        fileUrlToDelete = activity.answer_file_url;
      }

      if (!fileUrlToDelete) {
        return NextResponse.json(
          { error: `No ${fileType} file found for this activity` },
          { status: 404 }
        );
      }

      // Delete the file from storage
      const deleted = await deleteFileFromStorage(fileUrlToDelete);

      if (!deleted) {
        return NextResponse.json(
          { error: "Failed to delete file from storage" },
          { status: 500 }
        );
      }

      // Update the educational activity to remove the file URL
      const updateField =
        fileType === "question" ? "question_file_url" : "answer_file_url";
      const updateQuery = `
        UPDATE educational_activities 
        SET ${updateField} = NULL, updated_at = NOW()
        WHERE id = $1
        RETURNING id, question_file_url, answer_file_url
      `;

      const result = await client.query(updateQuery, [activityId]);

      return NextResponse.json({
        message: "File deleted successfully",
        activity: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
