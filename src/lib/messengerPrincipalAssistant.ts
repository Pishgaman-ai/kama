import type { User } from "./auth";

function normalizeInternalBaseUrl(rawUrl: string | undefined): string {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) {
    return "http://localhost:3000";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }

  return `https://${trimmed.replace(/\/+$/, "")}`;
}

function getCandidateBaseUrls(): string[] {
  const port = process.env.PORT || "3000";
  const candidates = [
    process.env.INTERNAL_APP_URL,
    `http://127.0.0.1:${port}`,
    `http://localhost:${port}`,
    process.env.NEXT_PUBLIC_APP_URL,
  ]
    .map((item) => normalizeInternalBaseUrl(item))
    .filter(Boolean) as string[];

  return Array.from(new Set(candidates));
}

function createErrorStream(message: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(message));
      controller.close();
    },
  });
}

export async function getPrincipalAssistantStream(
  user: User,
  messageText: string
): Promise<ReadableStream<Uint8Array>> {
  try {
    const baseUrls = getCandidateBaseUrls();
    const sharedHeaders = {
      "Content-Type": "application/json",
      "x-messenger-user-id": user.id,
      "x-messenger-auth": process.env.PASSWORD_ENCRYPTION_KEY || "",
      "x-dev-user-id": user.id,
    };
    let lastMeaningfulError =
      "خطا در پردازش پیام مدیر. لطفاً دوباره تلاش کنید.";

    for (const baseUrl of baseUrls) {
      const url = `${baseUrl}/api/principal/ai-assistant`;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: sharedHeaders,
          body: JSON.stringify({
            messages: [{ role: "user", content: messageText }],
          }),
        });

        if (response.ok && response.body) {
          return response.body;
        }

        const errorText = await response.text().catch(() => "");
        let parsedError = "";
        try {
          const parsed = JSON.parse(errorText);
          if (typeof parsed?.error === "string" && parsed.error.trim()) {
            parsedError = parsed.error.trim();
          }
        } catch {
          // ignore parse errors and keep fallback.
        }

        if (parsedError) {
          lastMeaningfulError = parsedError;
        }

        console.error("Principal assistant proxy non-OK response:", {
          url,
          status: response.status,
          errorText: errorText.substring(0, 300),
        });

        if (response.status >= 400 && response.status < 500) {
          return createErrorStream(lastMeaningfulError);
        }
      } catch (fetchError) {
        console.error("Principal assistant proxy fetch failed:", {
          url,
          error: fetchError,
        });
      }
    }

    return createErrorStream(lastMeaningfulError);
  } catch (error) {
    console.error("Failed to call principal assistant API:", error);
    return createErrorStream("خطا در پردازش پیام مدیر. لطفاً دوباره تلاش کنید.");
  }
}
