import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { sendChatToOpenAIStream } from "@/lib/aiService";
import { getUserById } from "@/lib/auth";

// Role mapping
const ROLE_MAPPING: Record<string, string> = {
  principal: "principal",
  manager: "principal",
  teacher: "teacher",
  parent: "parent",
  student: "student",
  grading: "grading",
};

export async function POST(request: NextRequest) {
  try {
    // Get user from session cookie
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      console.log("No session cookie found");
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userSession = JSON.parse(sessionCookie.value);

    // Fetch the latest user data from the database
    const user = await getUserById(userSession.id);
    if (!user) {
      console.log("User not found in database");
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    console.log("User data:", user);

    // Extract user role and national ID
    const userRole = user.role;
    const nationalId = user.national_id;

    // Log the extracted values
    console.log("User role:", userRole);
    console.log("National ID:", nationalId);

    // Validate user has national ID
    if (!nationalId) {
      console.log("National ID not found in user data");
      return NextResponse.json(
        {
          error:
            "برای استفاده از دستیار هوشمند، لطفاً کد ملی خود را در پروفایل کاربری تنظیم کنید",
        },
        { status: 400 }
      );
    }

    // Get messages from the request body
    const { messages } = await request.json();
    console.log("Messages count:", messages?.length);

    if (!messages || messages.length === 0) {
      console.log("No messages found");
      return NextResponse.json(
        { error: "پیام یافت نشد" },
        { status: 400 }
      );
    }

    // Map the role to the AI role
    const aiRole = ROLE_MAPPING[userRole] || "student";

    // Prepare messages for OpenAI (filter out system messages from client)
    const chatMessages = messages
      .filter((msg: any) => msg.role !== "system")
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));

    console.log("Sending to OpenAI with role:", aiRole);

    const modelSource =
      user.profile?.language_model === "local" ? "local" : "cloud";

    // Send to OpenAI with streaming
    const stream = await sendChatToOpenAIStream(
      chatMessages,
      aiRole as any,
      modelSource
    );

    // Return streaming response
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("AI Chat API error:", error);
    logger.error("AI Chat API error:", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "خطا در پردازش درخواست هوش مصنوعی" },
      { status: 500 }
    );
  }
}
