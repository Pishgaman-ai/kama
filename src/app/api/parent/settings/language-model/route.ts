import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserById } from "@/lib/auth";

type LanguageModelSource = "cloud" | "local";

export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);

    const user = await getUserById(userData.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "parent") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const languageModel = body?.languageModel as LanguageModelSource;

    if (languageModel !== "cloud" && languageModel !== "local") {
      return NextResponse.json(
        { error: "Invalid language model" },
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
      { error: "Failed to update language model" },
      { status: 500 }
    );
  }
}
