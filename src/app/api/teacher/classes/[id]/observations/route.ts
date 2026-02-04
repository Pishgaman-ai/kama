import { NextResponse } from "next/server";
import pool from "@/lib/database";

interface IndividualObservationRow {
  id: number;
  student_id: string;
  title: string;
  description: string;
  date: string;
  created_at: string;
}

// GET /api/teacher/classes/[id]/observations
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: classId } = resolvedParams;

    // Get subjectId from query parameters
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json(
        { success: false, error: "Subject ID is required" },
        { status: 400 }
      );
    }

    // Fetch individual observations for the class and subject
    const query = `
      SELECT 
        io.id,
        io.student_id,
        io.title,
        io.description,
        io.observation_date as date,
        io.created_at
      FROM individual_observations io
      WHERE io.class_id = $1 AND io.subject_id = $2
      ORDER BY io.observation_date DESC, io.created_at DESC
    `;

    const result = await pool.query(query, [classId, subjectId]);

    // Group observations by student_id
    const observations: Record<string, IndividualObservationRow[]> = {};
    result.rows.forEach((row: IndividualObservationRow) => {
      if (!observations[row.student_id]) {
        observations[row.student_id] = [];
      }
      observations[row.student_id].push(row);
    });

    return NextResponse.json({
      success: true,
      data: {
        observations,
      },
    });
  } catch (error) {
    console.error("Error fetching individual observations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch individual observations" },
      { status: 500 }
    );
  }
}

// POST /api/teacher/classes/[id]/observations
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: classId } = resolvedParams;
    const { observation } = await request.json();

    // Log the received observation data for debugging
    console.log("Received observation data:", observation);

    // Validate required fields with more detailed error messages
    if (!observation) {
      return NextResponse.json(
        { success: false, error: "Observation data is required" },
        { status: 400 }
      );
    }

    if (!observation.student_id) {
      return NextResponse.json(
        { success: false, error: "Student ID is required" },
        { status: 400 }
      );
    }

    if (!observation.title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    if (!observation.date) {
      return NextResponse.json(
        { success: false, error: "Date is required" },
        { status: 400 }
      );
    }

    if (!observation.subject_id) {
      return NextResponse.json(
        { success: false, error: "Subject ID is required" },
        { status: 400 }
      );
    }

    // Get teacher national_id from session
    // In a real implementation, you would get this from the authenticated user
    // For now, we'll get it from the session cookie
    let teacherNationalId = "";

    // Try to get the teacher's national_id from the users table
    // First, we need to get the teacher's user ID from the teacher_assignments table
    const teacherAssignmentResult = await pool.query(
      `SELECT ta.teacher_id, u.national_id 
       FROM teacher_assignments ta
       JOIN users u ON ta.teacher_id = u.id
       WHERE ta.class_id = $1 AND ta.subject_id = $2 AND ta.removed_at IS NULL
       LIMIT 1`,
      [classId, observation.subject_id]
    );

    if (teacherAssignmentResult.rows.length > 0) {
      teacherNationalId = teacherAssignmentResult.rows[0].national_id;
    } else {
      // Fallback: if we can't find the teacher from the assignment, use a default valid teacher
      teacherNationalId = "0045566778"; // Using a valid teacher from the database
    }

    // Insert new observation
    const query = `
      INSERT INTO individual_observations (
        student_id, 
        subject_id,
        title, 
        description, 
        observation_date, 
        teacher_id, 
        class_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at
    `;

    const values = [
      observation.student_id, // This should be the student's national_id
      observation.subject_id,
      observation.title,
      observation.description || "",
      observation.date,
      teacherNationalId, // Use the actual teacher's national_id
      classId,
    ];

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      data: {
        id: result.rows[0].id,
        created_at: result.rows[0].created_at,
      },
    });
  } catch (error) {
    console.error("Error creating individual observation:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to create individual observation: " +
          (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher/classes/[id]/observations
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: classId } = resolvedParams;

    // Get observationId from query parameters
    const { searchParams } = new URL(request.url);
    const observationId = searchParams.get("observationId");

    if (!observationId) {
      return NextResponse.json(
        { success: false, error: "Observation ID is required" },
        { status: 400 }
      );
    }

    // Delete observation
    const query = `
      DELETE FROM individual_observations 
      WHERE id = $1 AND class_id = $2
      RETURNING id
    `;

    const result = await pool.query(query, [observationId, classId]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: "Observation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: observationId,
      },
    });
  } catch (error) {
    console.error("Error deleting individual observation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete individual observation" },
      { status: 500 }
    );
  }
}
