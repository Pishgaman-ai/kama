import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import logger from "@/lib/logger";
import { sendQueryToAIGrading } from "@/lib/aiService";
import { getUserById } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve the params promise
    const { id: activityId } = await params;

    // Get user from session cookie
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userSession = JSON.parse(sessionCookie.value);

    // Fetch the latest user data from the database to ensure we have the most up-to-date information
    const user = await getUserById(userSession.id);
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Extract user role and national ID
    const userRole = user.role;
    const nationalId = user.national_id;

    // Validate user has national ID
    if (!nationalId) {
      return NextResponse.json(
        {
          error:
            "برای استفاده از دستیار هوشمند، لطفاً کد ملی خود را در پروفایل کاربری تنظیم کنید",
        },
        { status: 400 }
      );
    }

    // Verify that the user is a teacher
    if (userRole !== "teacher") {
      return NextResponse.json(
        { error: "فقط معلمان می‌توانند از این سرویس استفاده کنند" },
        { status: 403 }
      );
    }

    // Get the prompt from the request body
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "متن برای ارسال به هوش مصنوعی الزامی است" },
        { status: 400 }
      );
    }

    // Get database client
    const client = await pool.connect();

    try {
      // Verify that the educational activity belongs to this teacher and get file URLs
      const activityResult = await client.query(
        `SELECT id, teacher_id, question_file_url, answer_file_url, activity_title 
         FROM educational_activities 
         WHERE id = $1 AND teacher_id = $2`,
        [activityId, user.id]
      );

      if (activityResult.rows.length === 0) {
        return NextResponse.json(
          { error: "فعالیت آموزشی یافت نشد یا دسترسی ندارید" },
          { status: 404 }
        );
      }

      const activity = activityResult.rows[0];

      // Check if files are uploaded
      if (!activity.question_file_url && !activity.answer_file_url) {
        return NextResponse.json(
          { error: "ابتدا فایل‌های سوالات یا پاسخ‌ها را بارگذاری کنید" },
          { status: 400 }
        );
      }

      // Prepare data for AI grading service
      const aiData = {
        activity_id: activity.id,
        activity_title: activity.activity_title,
        question_file_url: activity.question_file_url || undefined,
        answer_file_url: activity.answer_file_url || undefined,
        teacher_instruction: prompt,
      };

      // Send data to the dedicated AI grading service
      const result = await sendQueryToAIGrading(aiData, nationalId);

      if (!result.success) {
        // Provide user-friendly error messages based on the error type
        let errorMessage = "خطا در ارتباط با سرویس تصحیح هوشمند";

        if (result.error?.includes("404")) {
          errorMessage =
            "سرویس تصحیح هوشمند در دسترس نیست. لطفاً بعداً تلاش کنید.";
        } else if (result.error?.includes("500")) {
          errorMessage =
            "خطای داخلی در سرویس تصحیح هوشمند. لطفاً بعداً تلاش کنید.";
        } else if (result.error?.includes("network")) {
          errorMessage =
            "مشکل در اتصال به سرویس تصحیح هوشمند. لطفاً اتصال اینترنت خود را بررسی کنید.";
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
      }

      // Return the response
      return NextResponse.json({
        success: true,
        message: result.response,
      });
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    logger.error("Send to AI API error:", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "خطا در پردازش درخواست تصحیح هوشمند. لطفاً بعداً تلاش کنید." },
      { status: 500 }
    );
  }
}
