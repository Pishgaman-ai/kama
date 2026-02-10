// Bale API Service
// Core functions for communicating with Bale Bot API

import { BaleSendMessageResponse } from "@/types/bale";

const BALE_API_BASE = "https://tapi.bale.ai/bot";

/**
 * Send a text message to a Bale chat
 * @param token Bale bot API token
 * @param chatId Bale chat ID
 * @param text Message text
 * @param parseMode Optional parse mode (HTML, Markdown, MarkdownV2)
 * @returns Response from Bale API
 */
export async function sendMessage(
  token: string,
  chatId: string | number,
  text: string,
  parseMode?: "HTML" | "Markdown" | "MarkdownV2"
): Promise<BaleSendMessageResponse> {
  try {
    const url = `${BALE_API_BASE}${token}/sendMessage`;

    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text: text,
    };

    if (parseMode) {
      payload.parse_mode = parseMode;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as BaleSendMessageResponse;

    if (!response.ok) {
      console.error(`Bale API error (${response.status}):`, data);
    }

    return data;
  } catch (error) {
    console.error("Failed to send message to Bale:", error);
    return {
      ok: false,
      error_code: 500,
      description: "Internal server error",
    };
  }
}

/**
 * Send typing action (shows "typing..." indicator in Bale)
 * @param token Bale bot API token
 * @param chatId Bale chat ID
 * @returns Response from Bale API
 */
export async function sendTypingAction(
  token: string,
  chatId: string | number
): Promise<BaleSendMessageResponse> {
  try {
    const url = `${BALE_API_BASE}${token}/sendChatAction`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        action: "typing",
      }),
    });

    const data = (await response.json()) as BaleSendMessageResponse;

    if (!response.ok) {
      console.warn(`Failed to send typing action:`, data);
    }

    return data;
  } catch (error) {
    console.error("Failed to send typing action:", error);
    return {
      ok: false,
      error_code: 500,
      description: "Internal server error",
    };
  }
}

/**
 * Split a long message into multiple chunks
 * Bale max message length is 4096 characters
 * @param text Full message text
 * @param maxLength Maximum length per message (default: 4000 to be safe)
 * @returns Array of message chunks
 */
export function splitLongMessage(text: string, maxLength: number = 4000): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const messages: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let chunk = text.substring(currentIndex, currentIndex + maxLength);

    // Try to break at a natural boundary (newline or space)
    if (currentIndex + maxLength < text.length) {
      const lastNewline = chunk.lastIndexOf("\n");
      const lastSpace = chunk.lastIndexOf(" ");
      const breakPoint = Math.max(lastNewline, lastSpace);

      if (breakPoint > 0 && breakPoint > maxLength * 0.8) {
        chunk = chunk.substring(0, breakPoint);
      }
    }

    messages.push(chunk.trim());
    currentIndex += chunk.length;
  }

  return messages.filter((msg) => msg.length > 0);
}

/**
 * Sanitize text for Markdown formatting
 * Escapes special characters that could break Markdown parsing
 * @param text Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeMarkdown(text: string): string {
  return text
    .replace(/\\/g, "\\\\") // Backslash
    .replace(/\*/g, "\\*") // Asterisk
    .replace(/\[/g, "\\[") // Left bracket
    .replace(/\]/g, "\\]") // Right bracket
    .replace(/\(/g, "\\(") // Left paren
    .replace(/\)/g, "\\)") // Right paren
    .replace(/\~/g, "\\~") // Tilde
    .replace(/`/g, "\\`") // Backtick
    .replace(/>/g, "\\>") // Greater than
    .replace(/#/g, "\\#") // Hash
    .replace(/\+/g, "\\+") // Plus
    .replace(/-/g, "\\-") // Minus
    .replace(/=/g, "\\=") // Equals
    .replace(/\|/g, "\\|") // Pipe
    .replace(/\{/g, "\\{") // Left brace
    .replace(/\}/g, "\\}"); // Right brace
}

/**
 * Delay execution for a given milliseconds
 * Useful for rate limiting
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
