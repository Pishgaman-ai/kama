import { NextResponse } from "next/server";
import { testEmailConfig } from "@/lib/emailService";

export async function GET() {
  try {
    const result = await testEmailConfig();

    if (result.success && result.status === "configured") {
      return NextResponse.json({
        success: true,
        status: result.status,
        message: "✅ Email configuration is working correctly!",
      });
    } else if (result.success && result.status === "not_configured") {
      return NextResponse.json({
        success: true,
        status: result.status,
        message: "📧 Development Mode - Email not configured",
        info: "Password reset URLs will be shown in console. Configure SMTP to enable email sending.",
        instructions:
          "Add SMTP_USER and SMTP_PASS to your .env.local file to enable email sending",
      });
    } else {
      return NextResponse.json({
        success: false,
        status: result.status,
        message: "❌ Email configuration is invalid",
        error: result.error,
        instructions: "Please check your SMTP credentials in .env.local file",
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "❌ Email test failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
