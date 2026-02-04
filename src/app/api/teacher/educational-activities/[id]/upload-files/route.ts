import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { uploadFileToStorage, deleteFileFromStorage } from "@/lib/fileUpload";

export async function POST(
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
      // Verify that the educational activity belongs to this teacher and get current file URLs
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

      // Get form data
      const formData = await request.formData();
      const questionFile = formData.get("questionFile") as File | null;
      const answerFile = formData.get("answerFile") as File | null;

      // Validate files
      if (!questionFile && !answerFile) {
        return NextResponse.json(
          { error: "At least one file (question or answer) must be provided" },
          { status: 400 }
        );
      }

      // Upload files and get URLs
      let questionFileUrl: string | null = null;
      let answerFileUrl: string | null = null;

      // Delete old question file if a new one is being uploaded
      if (questionFile && activity.question_file_url) {
        await deleteFileFromStorage(activity.question_file_url);
      }

      // Delete old answer file if a new one is being uploaded
      if (answerFile && activity.answer_file_url) {
        await deleteFileFromStorage(activity.answer_file_url);
      }

      if (questionFile) {
        questionFileUrl = await uploadFileToStorage(
          questionFile,
          "educational-activities/questions"
        );
      }

      if (answerFile) {
        answerFileUrl = await uploadFileToStorage(
          answerFile,
          "educational-activities/answers"
        );
      }

      // Update the educational activity with file URLs
      const updateFields: string[] = [];
      const updateValues: unknown[] = [];
      let valueIndex = 1;

      if (questionFileUrl) {
        updateFields.push(`question_file_url = $${valueIndex}`);
        updateValues.push(questionFileUrl);
        valueIndex++;
      }

      if (answerFileUrl) {
        updateFields.push(`answer_file_url = $${valueIndex}`);
        updateValues.push(answerFileUrl);
        valueIndex++;
      }

      // Always update the status to "files_uploaded" when files are uploaded
      updateFields.push(`status = $${valueIndex}`);
      updateValues.push("files_uploaded");

      updateValues.push(activityId); // For the WHERE clause

      const updateQuery = `
        UPDATE educational_activities 
        SET ${updateFields.join(", ")}, updated_at = NOW()
        WHERE id = $${updateValues.length}
        RETURNING id, question_file_url, answer_file_url, status
      `;

      const result = await client.query(updateQuery, updateValues);

      return NextResponse.json({
        message: "Files uploaded successfully",
        activity: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
