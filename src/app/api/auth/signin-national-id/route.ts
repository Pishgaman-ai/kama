import { NextRequest, NextResponse } from "next/server";
import { signInWithNationalID } from "@/lib/auth";
import { initializeDatabase } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    // Initialize database if needed
    await initializeDatabase();

    const { nationalId, password } = await request.json();

    if (!nationalId || !password) {
      return NextResponse.json(
        { error: "کد ملی و رمز عبور الزامی است" },
        { status: 400 }
      );
    }

    const result = await signInWithNationalID(nationalId, password);

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
    console.error("Sign in with national ID API error:", error);
    return NextResponse.json(
      { error: "خطایی در سرور رخ داد" },
      { status: 500 }
    );
  }
}
