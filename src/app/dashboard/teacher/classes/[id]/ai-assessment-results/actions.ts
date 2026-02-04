"use server";

import pool from "@/lib/database";

// Define interfaces for the assessment data
interface LifeSkillsAssessment {
  id: string;
  assessment_date: string;
  self_awareness_score: number;
  empathy_score: number;
  friendship_and_healthy_relationships_score: number;
  effective_communication_score: number;
  creative_thinking_score: number;
  problem_solving_score: number;
  decision_making_score: number;
  critical_thinking_score: number;
  emotion_management_score: number;
  self_confidence_score: number;
  created_at: string;
  updated_at: string;
}

interface ActiveLifeAssessment {
  id: string;
  assessment_date: string;
  belief_religious_ethical_score: number;
  social_political_score: number;
  biological_physical_score: number;
  aesthetic_artistic_score: number;
  economic_professional_score: number;
  scientific_technological_score: number;
  created_at: string;
  updated_at: string;
}

interface GrowthDevelopmentAssessment {
  id: string;
  assessment_date: string;
  linguistic_verbal_score: number;
  logical_mathematical_score: number;
  visual_spatial_score: number;
  musical_score: number;
  existential_score: number;
  bodily_kinesthetic_score: number;
  interpersonal_score: number;
  intrapersonal_score: number;
  naturalistic_score: number;
  moral_spiritual_score: number;
  created_at: string;
  updated_at: string;
}

interface AssessmentData {
  lifeSkills: LifeSkillsAssessment[];
  activeLife: ActiveLifeAssessment[];
  growthDevelopment: GrowthDevelopmentAssessment[];
}

export async function getAIAssessmentResults(
  classId: string,
  studentId: string
): Promise<{ success: boolean; data?: AssessmentData; error?: string }> {
  let client;
  try {
    client = await pool.connect();

    // Get the subject_id for this class
    const subjectQuery = `
      SELECT subject_id 
      FROM teacher_assignments 
      WHERE class_id = $1 
      LIMIT 1
    `;
    const subjectResult = await client.query(subjectQuery, [classId]);
    const subjectId = subjectResult.rows[0]?.subject_id;

    if (!subjectId) {
      return {
        success: false,
        error: "Subject not found for this class",
      };
    }

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

    const assessmentData: AssessmentData = {
      lifeSkills: lifeSkillsResult.rows,
      activeLife: activeLifeResult.rows,
      growthDevelopment: growthDevResult.rows,
    };

    return {
      success: true,
      data: assessmentData,
    };
  } catch (error) {
    console.error("Error fetching assessment results:", error);
    return {
      success: false,
      error: "Failed to fetch assessment results",
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}