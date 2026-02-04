// Simple test script for AI service
// Run with: npx ts-node test-ai-service.ts

import {
  sendQueryToPrincipalAI,
  sendQueryToTeacherAI,
  sendQueryToParentAI,
  sendQueryToStudentAI,
} from "../../src/lib/aiService";

async function testAIService() {
  console.log("Testing AI service...");

  // Create sample AI request data
  const sampleRequest = {
    activity_id: "test_activity_001",
    activity_title: "Test Activity",
    teacher_instruction: "سلام",
    teacher_national_id: "00256854",
  };

  try {
    // Test principal AI
    console.log("\n1. Testing Principal AI:");
    const principalResult = await sendQueryToPrincipalAI(
      sampleRequest,
      "00256854"
    );
    console.log("Principal AI Result:", principalResult);

    // Test teacher AI
    console.log("\n2. Testing Teacher AI:");
    const teacherResult = await sendQueryToTeacherAI(sampleRequest, "00256854");
    console.log("Teacher AI Result:", teacherResult);

    // Test parent AI
    console.log("\n3. Testing Parent AI:");
    const parentResult = await sendQueryToParentAI(sampleRequest, "00256854");
    console.log("Parent AI Result:", parentResult);

    // Test student AI
    console.log("\n4. Testing Student AI:");
    const studentResult = await sendQueryToStudentAI(sampleRequest, "00256854");
    console.log("Student AI Result:", studentResult);
  } catch (error) {
    console.error("Error testing AI service:", error);
  }
}

// Run the test
testAIService();
