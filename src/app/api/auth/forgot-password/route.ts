import { NextRequest, NextResponse } from "next/server";
import { generatePasswordResetToken } from "@/lib/auth";
import { initializeDatabase } from "@/lib/database";
import { sendPasswordResetEmail } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    // Initialize database if needed
    await initializeDatabase();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "ایمیل الزامی است" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "فرمت ایمیل نامعتبر است" },
        { status: 400 }
      );
    }

    const result = await generatePasswordResetToken(email);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(email, result.token!);

    if (!emailResult.success) {
      console.error("Failed to send email:", emailResult.error);
      // Still return success to user for security (don't reveal if email exists)
    }

    console.log(`Password reset token for ${email}: ${result.token}`);
    console.log(
      `Reset URL: ${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/reset-password?token=${result.token}`
    );

    return NextResponse.json({
      success: true,
      message:
        "اگر این ایمیل در سیستم موجود باشد، لینک بازیابی برای شما ارسال خواهد شد",
      // Remove this in production - only for testing
      ...(process.env.NODE_ENV === "development" && {
        resetUrl: `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/reset-password?token=${result.token}`,
      }),
    });
  } catch (error) {
    console.error("Forgot password API error:", error);
    return NextResponse.json(
      { error: "خطایی در سرور رخ داد" },
      { status: 500 }
    );
  }
}
