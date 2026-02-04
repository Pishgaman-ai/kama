import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithToken, verifyPasswordResetToken } from "@/lib/auth";
import { initializeDatabase } from "@/lib/database";

// Verify token (GET request)
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "توکن الزامی است" }, { status: 400 });
    }

    const result = await verifyPasswordResetToken(token);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "توکن معتبر است",
    });
  } catch (error) {
    console.error("Verify token API error:", error);
    return NextResponse.json(
      { error: "خطایی در سرور رخ داد" },
      { status: 500 }
    );
  }
}

// Reset password (POST request)
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "توکن و رمز عبور الزامی است" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "رمز عبور باید حداقل ۶ کاراکتر باشد" },
        { status: 400 }
      );
    }

    const result = await resetPasswordWithToken(token, password);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Create session cookie for the user
    const response = NextResponse.json({
      success: true,
      message: "رمز عبور با موفقیت تغییر کرد",
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
    console.error("Reset password API error:", error);
    return NextResponse.json(
      { error: "خطایی در سرور رخ داد" },
      { status: 500 }
    );
  }
}
