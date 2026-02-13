import { NextRequest, NextResponse } from "next/server";
import type { BaleUpdate } from "@/types/bale";
import {
  identifyUserByBaleChat,
  getBotTokenForSchool,
  processUserMessageWithAI,
  sendAIResponseToBale,
  logUnknownBaleInteraction,
} from "@/lib/baleMessageHandler";
import { sendTypingAction } from "@/lib/baleService";

interface RouteContext {
  params: Promise<{
    schoolId: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { schoolId } = await context.params;
    const update: BaleUpdate = await request.json();

    if (!update.message?.text || !update.message?.chat?.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(update.message.chat.id);
    const messageText = update.message.text.trim();

    if (!messageText) {
      return NextResponse.json({ ok: true });
    }

    console.log(
      `[Bale Webhook][School ${schoolId}] Received message from chat ${chatId}: "${messageText.substring(0, 50)}..."`
    );

    const user = await identifyUserByBaleChat(chatId);

    if (!user || user.school_id !== schoolId) {
      await logUnknownBaleInteraction(
        chatId,
        messageText,
        `User not found for school ${schoolId}`
      );
      return NextResponse.json({ ok: true });
    }

    const botToken = await getBotTokenForSchool(schoolId);
    if (!botToken) {
      await logUnknownBaleInteraction(
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
    await sendAIResponseToBale(botToken, chatId, aiStream);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Bale School Webhook] Error processing webhook:", error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { schoolId } = await context.params;
  return NextResponse.json({
    status: "active",
    service: "Bale School Webhook",
    schoolId,
    timestamp: new Date().toISOString(),
  });
}

