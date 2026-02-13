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

/**
 * POST /api/webhook/bale
 * Receives messages from Bale bot webhook
 *
 * Flow:
 * 1. Parse webhook payload from Bale
 * 2. Identify user by bale_chat_id from profile JSONB
 * 3. Get bot token from user's school principal profile
 * 4. Send typing indicator
 * 5. Process message with role-based AI
 * 6. Send response back to Bale
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse webhook payload
    const update: BaleUpdate = await request.json();

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

    console.log(`[Bale Webhook] Received message from chat ${chatId}: "${messageText.substring(0, 50)}..."`);

    // 2. Identify user by bale_chat_id
    const user = await identifyUserByBaleChat(chatId);

    if (!user) {
      await logUnknownBaleInteraction(
        chatId,
        messageText,
        "User not found by bale_chat_id"
      );
      console.warn(`[Bale Webhook] Unknown user with chat ID: ${chatId}`);
      // Don't reply to unknown users
      return NextResponse.json({ ok: true });
    }

    if (!user.school_id) {
      await logUnknownBaleInteraction(
        chatId,
        messageText,
        `User ${user.id} has no school_id`
      );
      return NextResponse.json({ ok: true });
    }

    console.log(`[Bale Webhook] Identified user: ${user.name} (${user.role}) from school ${user.school_id}`);

    // 3. Get bot token for the user's school
    const botToken = await getBotTokenForSchool(user.school_id);

    if (!botToken) {
      await logUnknownBaleInteraction(
        chatId,
        messageText,
        `No bot token found for school ${user.school_id}`
      );
      console.error(`[Bale Webhook] No bot token for school: ${user.school_id}`);
      // Can't reply without token
      return NextResponse.json({ ok: true });
    }

    console.log(`[Bale Webhook] Got bot token for school: ${user.school_id}`);

    // 4. Send typing indicator (shows "typing..." to user)
    await sendTypingAction(botToken, chatId);

    // 5. Get AI model preference from user profile
    const modelSource =
      user.profile && typeof user.profile === "object" && "language_model" in user.profile
        ? (user.profile.language_model as string) === "local"
          ? "local"
          : "cloud"
        : "cloud";

    console.log(`[Bale Webhook] Processing with ${modelSource} model`);

    // 6. Process message with AI (uses existing infrastructure)
    const aiStream = await processUserMessageWithAI(user, messageText, modelSource);

    // 7. Send response to Bale
    await sendAIResponseToBale(botToken, chatId, aiStream);

    console.log(`[Bale Webhook] Successfully sent response to chat ${chatId}`);

    // 8. Always return 200 to Bale (prevents retries on our end)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Bale Webhook] Error processing webhook:", error);

    // Still return 200 to Bale to prevent it from retrying
    // (Internal errors should be logged and debugged, not cause Bale to spam retries)
    return NextResponse.json({ ok: true });
  }
}

/**
 * GET /api/webhook/bale
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "Bale Webhook",
    timestamp: new Date().toISOString(),
  });
}
