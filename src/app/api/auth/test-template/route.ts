import { NextRequest, NextResponse } from "next/server";
import { sendOTP } from "@/lib/smsService";
import { initializeDatabase } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "شماره موبایل الزامی است" },
        { status: 400 }
      );
    }

    // Generate a test OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Send OTP using the amoozyar-login template
    const result = await sendOTP(phone, otpCode, "amoozyar-login");

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "کد تایید به شماره موبایل شما ارسال شد",
      otpCode: otpCode, // Only for testing purposes
    });
  } catch (error) {
    console.error("Test Template API error:", error);
    return NextResponse.json(
      { error: "خطایی در سرور رخ داد" },
      { status: 500 }
    );
  }
}
