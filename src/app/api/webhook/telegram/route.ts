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

/**
 * POST /api/webhook/telegram
 * Receives messages from Telegram bot webhook
 *
 * Flow:
 * 1. Parse webhook payload from Telegram
 * 2. Identify user by telegram_chat_id from profile JSONB
 * 3. Get bot token from user's school principal profile
 * 4. Send typing indicator
 * 5. Process message with role-based AI
 * 6. Send response back to Telegram
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse webhook payload
    const update: TelegramUpdate = await request.json();

    // Ignore non-text messages and updates without a chat
    if (!update.message?.text || !update.message?.chat?.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(update.message.chat.id);
    const messageText = update.message.text.trim();

    // Ignore empty messages
    if (!messageText) {
      return NextResponse.json({ ok: true });
    }

    console.log(`[Telegram Webhook] Received message from chat ${chatId}: "${messageText.substring(0, 50)}..."`);

    // 2. Identify user by telegram_chat_id
    const user = await identifyUserByTelegramChat(chatId);

    if (!user) {
      await logUnknownTelegramInteraction(
        chatId,
        messageText,
        "User not found by telegram_chat_id"
      );
      console.warn(`[Telegram Webhook] Unknown user with chat ID: ${chatId}`);
      // Don't reply to unknown users
      return NextResponse.json({ ok: true });
    }

    if (!user.school_id) {
      await logUnknownTelegramInteraction(
        chatId,
        messageText,
        `User ${user.id} has no school_id`
      );
      return NextResponse.json({ ok: true });
    }

    console.log(`[Telegram Webhook] Identified user: ${user.name} (${user.role}) from school ${user.school_id}`);

    // 3. Get bot token for the user's school
    const botToken = await getBotTokenForSchool(user.school_id);

    if (!botToken) {
      await logUnknownTelegramInteraction(
        chatId,
        messageText,
        `No bot token found for school ${user.school_id}`
      );
      console.error(`[Telegram Webhook] No bot token for school: ${user.school_id}`);
      // Can't reply without token
      return NextResponse.json({ ok: true });
    }

    console.log(`[Telegram Webhook] Got bot token for school: ${user.school_id}`);

    // 4. Send typing indicator (shows "typing..." to user)
    await sendTypingAction(botToken, chatId);

    // 5. Get AI model preference from user profile
    const modelSource =
      user.profile && typeof user.profile === "object" && "language_model" in user.profile
        ? (user.profile.language_model as string) === "local"
          ? "local"
          : "cloud"
        : "cloud";

    console.log(`[Telegram Webhook] Processing with ${modelSource} model`);

    // 6. Process message with AI (uses existing infrastructure)
    const aiStream = await processUserMessageWithAI(user, messageText, modelSource);

    // 7. Send response to Telegram
    await sendAIResponseToTelegram(botToken, chatId, aiStream);

    console.log(`[Telegram Webhook] Successfully sent response to chat ${chatId}`);

    // 8. Always return 200 to Telegram (prevents retries on our end)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Error processing webhook:", error);

    // Still return 200 to Telegram to prevent it from retrying
    // (Internal errors should be logged and debugged, not cause Telegram to spam retries)
    return NextResponse.json({ ok: true });
  }
}

/**
 * GET /api/webhook/telegram
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "Telegram Webhook",
    timestamp: new Date().toISOString(),
  });
}
