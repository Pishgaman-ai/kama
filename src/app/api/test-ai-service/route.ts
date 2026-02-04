import { NextRequest, NextResponse } from "next/server";
import { sendQueryToAI } from "@/lib/aiService";

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "سلام";
    const nationalCode = searchParams.get("nationalCode") || "00256854";
    const role = searchParams.get("role") || "principal";

    console.log(
      `Testing AI service with query: ${query}, nationalCode: ${nationalCode}, role: ${role}`
    );

    // Create proper AIRequest object
    const aiRequest = {
      activity_id: "test_activity_001",
      activity_title: "Test AI Service",
      teacher_instruction: query,
    };

    // Send query to AI service
    const result = await sendQueryToAI(aiRequest, nationalCode, role);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    console.error("Test AI service error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
