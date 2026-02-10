// Bale Message Handler
// Business logic for processing Bale messages and interfacing with AI

import pool from "./database";
import { sendMessage, sendTypingAction, splitLongMessage, delay } from "./baleService";
import { sendChatToOpenAIStream } from "./aiService";
import type { User } from "./auth";

/**
 * Identify user by their Bale chat ID
 * @param baleChatId The Bale chat ID (from message sender)
 * @returns User object if found, null otherwise
 */
export async function identifyUserByBaleChat(baleChatId: string): Promise<User | null> {
  try {
    const result = await pool.query(
      `SELECT id, email, phone, name, national_id, role, school_id,
              profile_picture_url, profile, is_active, created_at
       FROM users
       WHERE profile->>'bale_chat_id' = $1
         AND is_active = true
       LIMIT 1`,
      [baleChatId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      national_id: user.national_id,
      role: user.role,
      school_id: user.school_id,
      profile_picture_url: user.profile_picture_url,
      profile: user.profile,
      created_at: user.created_at,
    };
  } catch (error) {
    console.error("Failed to identify user by Bale chat ID:", error);
    return null;
  }
}

/**
 * Get bot token for a school (from principal's profile)
 * @param schoolId The school ID
 * @returns Bot token if found, null otherwise
 */
export async function getBotTokenForSchool(schoolId: string): Promise<string | null> {
  try {
    const result = await pool.query(
      `SELECT profile->>'bale_api_key' as bot_token
       FROM users
       WHERE school_id = $1
         AND role = 'principal'
         AND is_active = true
       LIMIT 1`,
      [schoolId]
    );

    if (result.rows.length === 0 || !result.rows[0].bot_token) {
      return null;
    }

    return result.rows[0].bot_token;
  } catch (error) {
    console.error("Failed to get bot token for school:", error);
    return null;
  }
}

/**
 * Process user message with AI
 * @param user The user object
 * @param messageText The message text from user
 * @param modelSource Whether to use "cloud" or "local" AI
 * @returns ReadableStream with AI response
 */
export async function processUserMessageWithAI(
  user: User,
  messageText: string,
  modelSource: "cloud" | "local" = "cloud"
): Promise<ReadableStream<Uint8Array>> {
  try {
    const messages = [{ role: "user" as const, content: messageText }];

    // Use the existing AI streaming function
    const stream = await sendChatToOpenAIStream(
      messages,
      (user.role as "principal" | "teacher" | "parent" | "student" | "grading") || "student",
      modelSource
    );

    return stream;
  } catch (error) {
    console.error("Failed to process message with AI:", error);

    // Return error message as stream
    const errorMessage = "خطا در پردازش پیام. لطفاً بعداً تلاش کنید.";
    const encoder = new TextEncoder();

    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(errorMessage));
        controller.close();
      },
    });
  }
}

/**
 * Send AI response to Bale (handles streaming and chunking)
 * @param botToken The Bale bot API token
 * @param chatId The Bale chat ID to send response to
 * @param aiStream The ReadableStream from AI
 */
export async function sendAIResponseToBale(
  botToken: string,
  chatId: string | number,
  aiStream: ReadableStream<Uint8Array>
): Promise<void> {
  try {
    // Read full stream
    const reader = aiStream.getReader();
    let fullResponse = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += new TextDecoder().decode(value);
      }
    } finally {
      reader.releaseLock();
    }

    if (!fullResponse.trim()) {
      fullResponse = "متأسفانه دستیار نتوانست پاسخی تولید کند. لطفاً دوباره تلاش کنید.";
    }

    // Split if too long (Bale max: 4096 chars)
    const messages = splitLongMessage(fullResponse, 4000);

    // Send each message chunk with a small delay to avoid rate limiting
    for (const msg of messages) {
      const response = await sendMessage(botToken, chatId, msg, "Markdown");

      if (!response.ok) {
        console.error(
          `Failed to send message chunk to Bale (chat ${chatId}):`,
          response.description
        );
      }

      // Small delay between messages to avoid rate limiting
      if (messages.length > 1) {
        await delay(100);
      }
    }
  } catch (error) {
    console.error("Failed to send AI response to Bale:", error);

    // Try to send error message
    try {
      await sendMessage(
        botToken,
        chatId,
        "خطا در ارسال پیام. لطفاً بعداً تلاش کنید.",
        "Markdown"
      );
    } catch (fallbackError) {
      console.error("Failed to send fallback error message:", fallbackError);
    }
  }
}

/**
 * Log unknown Bale interaction for debugging
 * @param chatId The Bale chat ID
 * @param messageText The message text
 * @param error Optional error message
 */
export async function logUnknownBaleInteraction(
  chatId: string | number,
  messageText: string,
  error?: string
): Promise<void> {
  try {
    console.warn("Unknown Bale interaction:", {
      timestamp: new Date().toISOString(),
      chatId,
      messageText: messageText.substring(0, 100),
      error,
    });

    // Could optionally store in database for review
    // For now, just log to console/logger
  } catch (err) {
    console.error("Failed to log unknown Bale interaction:", err);
  }
}
