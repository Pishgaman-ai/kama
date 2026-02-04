import { NextRequest, NextResponse } from "next/server";
import { verifyOTPAndSignIn } from "@/lib/auth";
import { initializeDatabase } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const { phone, otpCode } = await request.json();

    if (!phone || !otpCode) {
      return NextResponse.json(
        { error: "شماره موبایل و کد تایید الزامی است" },
        { status: 400 }
      );
    }

    const result = await verifyOTPAndSignIn(phone, otpCode);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Create session cookie
    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    // Set session cookie
    response.cookies.set("user_session", JSON.stringify(result.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Verify OTP API error:", error);
    return NextResponse.json(
      { error: "خطایی در سرور رخ داد" },
      { status: 500 }
    );
  }
}
