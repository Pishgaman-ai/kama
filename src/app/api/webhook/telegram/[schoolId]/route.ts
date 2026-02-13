import { NextRequest, NextResponse } from "next/server";
import type { TelegramUpdate } from "@/types/telegram";
import {
  identifyUserByTelegramChat,
  getBotTokenForSchool,
  processUserMessageWithAI,
  sendAIResponseToTelegram,
  logUnknownTelegramInteraction,
} from "@/lib/telegramMessageHandler";
import { sendTypingAction } from "@/lib/telegramService";

interface RouteContext {
  params: Promise<{
    schoolId: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { schoolId } = await context.params;
    const update: TelegramUpdate = await request.json();

    if (!update.message?.text || !update.message?.chat?.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(update.message.chat.id);
    const messageText = update.message.text.trim();

    if (!messageText) {
      return NextResponse.json({ ok: true });
    }

    console.log(
      `[Telegram Webhook][School ${schoolId}] Received message from chat ${chatId}: "${messageText.substring(0, 50)}..."`
    );

    const user = await identifyUserByTelegramChat(chatId);

    if (!user || user.school_id !== schoolId) {
      await logUnknownTelegramInteraction(
        chatId,
        messageText,
        `User not found for school ${schoolId}`
      );
      return NextResponse.json({ ok: true });
    }

    const botToken = await getBotTokenForSchool(schoolId);
    if (!botToken) {
      await logUnknownTelegramInteraction(
        chatId,
        messageText,
        `No bot token found for school ${schoolId}`
      );
      return NextResponse.json({ ok: true });
    }

    await sendTypingAction(botToken, chatId);

    const modelSource =
      user.profile && typeof user.profile === "object" && "language_model" in user.profile
        ? (user.profile.language_model as string) === "local"
          ? "local"
          : "cloud"
        : "cloud";

    const aiStream = await processUserMessageWithAI(user, messageText, modelSource);
    await sendAIResponseToTelegram(botToken, chatId, aiStream);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram School Webhook] Error processing webhook:", error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { schoolId } = await context.params;
  return NextResponse.json({
    status: "active",
    service: "Telegram School Webhook",
    schoolId,
    timestamp: new Date().toISOString(),
  });
}

