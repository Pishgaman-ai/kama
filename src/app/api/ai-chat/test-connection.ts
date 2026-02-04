// Test script to verify AI service connection
// This is a simple test to verify that the AI service is working correctly

import { sendQueryToAI } from "@/lib/aiService";

async function testAIConnection() {
  console.log("Testing AI service connection...");

  // Test with a simple query - creating proper AIRequest object
  const testRequest = {
    activity_id: "test_activity_001",
    activity_title: "Test Connection",
    teacher_instruction: "سلام",
  };

  const result = await sendQueryToAI(
    testRequest,
    "00256854", // Sample national code from the documentation
    "principal"
  );

  console.log("Test result:", result);

  if (result.success) {
    console.log("✅ AI service is working correctly");
    console.log("Response:", result.response);
  } else {
    console.log("❌ AI service test failed");
    console.log("Error:", result.error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAIConnection().catch(console.error);
}

export default testAIConnection;
