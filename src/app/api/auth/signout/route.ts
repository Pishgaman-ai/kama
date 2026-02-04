import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "با موفقیت خارج شدید",
    });

    // Clear session cookie
    response.cookies.set("user_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error("Sign out API error:", error);
    return NextResponse.json(
      { error: "خطایی در خروج رخ داد" },
      { status: 500 }
    );
  }
}
