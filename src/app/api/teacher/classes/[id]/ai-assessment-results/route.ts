import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

// POST endpoint for AI service to submit assessment results
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const classId = resolvedParams.id;

    const body = await request.json();
    const { studentId, subjectId, teacherId, assessmentDate, type, results } =
      body;

    // Validate required fields
    if (
      !studentId ||
      !subjectId ||
      !teacherId ||
      !assessmentDate ||
      !type ||
      !results
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    let client;
    try {
      client = await pool.connect();

      let query = "";
      let values: (string | number | null)[] = [];

      switch (type) {
        case "life_skills":
          query = `
            INSERT INTO life_skills_assessments (
              student_id, class_id, subject_id, teacher_id, assessment_date,
              self_awareness_score, empathy_score, friendship_and_healthy_relationships_score,
              effective_communication_score, creative_thinking_score, problem_solving_score,
              decision_making_score, critical_thinking_score, emotion_management_score,
              self_confidence_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
          `;
          values = [
            studentId,
            classId,
            subjectId,
            teacherId,
            assessmentDate,
            results.selfAwarenessScore,
            results.empathyScore,
            results.friendshipAndHealthyRelationshipsScore,
            results.effectiveCommunicationScore,
            results.creativeThinkingScore,
            results.problemSolvingScore,
            results.decisionMakingScore,
            results.criticalThinkingScore,
            results.emotionManagementScore,
            results.selfConfidenceScore,
          ];
          break;

        case "active_life":
          query = `
            INSERT INTO active_life_assessments (
              student_id, class_id, subject_id, teacher_id, assessment_date,
              belief_religious_ethical_score, social_political_score, biological_physical_score,
              aesthetic_artistic_score, economic_professional_score, scientific_technological_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
          `;
          values = [
            studentId,
            classId,
            subjectId,
            teacherId,
            assessmentDate,
            results.beliefReligiousEthicalScore,
            results.socialPoliticalScore,
            results.biologicalPhysicalScore,
            results.aestheticArtisticScore,
            results.economicProfessionalScore,
            results.scientificTechnologicalScore,
          ];
          break;

        case "growth_development":
          query = `
            INSERT INTO growth_development_assessments (
              student_id, class_id, subject_id, teacher_id, assessment_date,
              linguistic_verbal_score, logical_mathematical_score, visual_spatial_score,
              musical_score, existential_score, bodily_kinesthetic_score,
              interpersonal_score, intrapersonal_score, naturalistic_score, moral_spiritual_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
          `;
          values = [
            studentId,
            classId,
            subjectId,
            teacherId,
            assessmentDate,
            results.linguisticVerbalScore,
            results.logicalMathematicalScore,
            results.visualSpatialScore,
            results.musicalScore,
            results.existentialScore,
            results.bodilyKinestheticScore,
            results.interpersonalScore,
            results.intrapersonalScore,
            results.naturalisticScore,
            results.moralSpiritualScore,
          ];
          break;

        default:
          return NextResponse.json(
            { success: false, error: "Invalid assessment type" },
            { status: 400 }
          );
      }

      const result = await client.query(query, values);

      return NextResponse.json({
        success: true,
        data: result.rows[0],
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  } catch (error) {
    console.error("Error saving assessment results:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving assessment results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const classId = resolvedParams.id;

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const subjectId = searchParams.get("subjectId");

    if (!studentId || !subjectId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    let client;
    try {
      client = await pool.connect();

      // Fetch life skills assessments
      const lifeSkillsQuery = `
        SELECT * FROM life_skills_assessments 
        WHERE student_id = $1 AND class_id = $2 AND subject_id = $3
        ORDER BY assessment_date DESC
      `;
      const lifeSkillsResult = await client.query(lifeSkillsQuery, [
        studentId,
        classId,
        subjectId,
      ]);

      // Fetch active life assessments
      const activeLifeQuery = `
        SELECT * FROM active_life_assessments 
        WHERE student_id = $1 AND class_id = $2 AND subject_id = $3
        ORDER BY assessment_date DESC
      `;
      const activeLifeResult = await client.query(activeLifeQuery, [
        studentId,
        classId,
        subjectId,
      ]);

      // Fetch growth development assessments
      const growthDevQuery = `
        SELECT * FROM growth_development_assessments 
        WHERE student_id = $1 AND class_id = $2 AND subject_id = $3
        ORDER BY assessment_date DESC
      `;
      const growthDevResult = await client.query(growthDevQuery, [
        studentId,
        classId,
        subjectId,
      ]);

      return NextResponse.json({
        success: true,
        data: {
          lifeSkills: lifeSkillsResult.rows,
          activeLife: activeLifeResult.rows,
          growthDevelopment: growthDevResult.rows,
        },
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  } catch (error) {
    console.error("Error fetching assessment results:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
