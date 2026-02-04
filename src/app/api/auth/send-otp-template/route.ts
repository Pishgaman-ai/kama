import { NextRequest, NextResponse } from "next/server";
import { sendOTPToPhone } from "@/lib/auth";
import { initializeDatabase } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const { phone, template } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "شماره موبایل الزامی است" },
        { status: 400 }
      );
    }

    // Default to amoozyar-login template if not specified
    const templateName = template || "amoozyar-login";

    const result = await sendOTPToPhone(phone, templateName);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "کد تایید به شماره موبایل شما ارسال شد",
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error("Send OTP Template API error:", error);
    return NextResponse.json(
      { error: "خطایی در سرور رخ داد" },
      { status: 500 }
    );
  }
}
