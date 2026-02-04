import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserById } from "@/lib/auth";

type LanguageModelSource = "cloud" | "local";

export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "ב?ה?ב? ג?ב?ב?ב‎" },
        { status: 401 }
      );
    }

    const userData = JSON.parse(sessionCookie.value);

    const user = await getUserById(userData.id);
    if (!user) {
      return NextResponse.json(
        { error: "ד?ב?ב?ב?ב? ה?ב?ג?ב? ג?ב?ב?" },
        { status: 404 }
      );
    }

    if (user.role !== "principal") {
      return NextResponse.json(
        { error: "ב?ב?ב?ב?ב?ה? ב?ה?ב?ג?ב?ב?ב‎" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const languageModel = body?.languageModel as LanguageModelSource;

    if (languageModel !== "cloud" && languageModel !== "local") {
      return NextResponse.json(
        { error: "ب?انتخاب مدل زبانی معتبر نیست" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        UPDATE users
        SET profile = jsonb_set(
          COALESCE(profile, '{}'::jsonb),
          '{language_model}',
          to_jsonb($1::text),
          true
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING profile
      `,
      [languageModel, userData.id]
    );

    return NextResponse.json({
      success: true,
      profile: result.rows[0]?.profile || {},
    });
  } catch (error) {
    console.error("Update language model API error:", error);
    return NextResponse.json(
      { error: "ب?خطا در ذخیره تنظیمات مدل زبانی" },
      { status: 500 }
    );
  }
}
