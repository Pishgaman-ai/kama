import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import { initializeDatabase } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    // Initialize database if needed
    await initializeDatabase();

    const { email, password, identifier } = await request.json();

    // Use identifier if provided, otherwise fall back to email for backward compatibility
    const loginIdentifier = identifier || email;

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: "ایمیل/کد ملی و رمز عبور الزامی است" },
        { status: 400 }
      );
    }

    const result = await signIn(loginIdentifier, password);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Create session cookie
    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    // Set session cookie (in production, use proper JWT or session management)
    response.cookies.set("user_session", JSON.stringify(result.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Sign in API error:", error);
    return NextResponse.json(
      { error: "خطایی در سرور رخ داد" },
      { status: 500 }
    );
  }
}
