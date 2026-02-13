import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "دسترسی محدود به معلمان" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;
    const text = formData.get("text") as string;

    if (!image) {
      return NextResponse.json(
        { error: "تصویر الزامی است" },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Determine mime type
    let mimeType = image.type;
    if (!mimeType) {
      // Default to jpeg if not specified
      mimeType = "image/jpeg";
    }

    // Prepare the prompt
    const systemPrompt = `شما یک معلم و مصحح هوشمند هستید. تصویر ورق پاسخ یک دانش‌آموز را دریافت کرده‌اید.
لطفاً موارد زیر را بررسی و گزارش دهید:

1. **تحلیل محتوا**: محتوای ورق را بخوانید و تحلیل کنید
2. **نقاط قوت**: نقاط قوت پاسخ دانش‌آموز را ذکر کنید
3. **نقاط ضعف**: نقاط ضعف و اشتباهات را مشخص کنید
4. **پیشنهادات**: پیشنهادات اصلاحی و آموزشی ارائه دهید
5. **نمره پیشنهادی**: در صورت امکان نمره‌ای از 20 پیشنهاد دهید

پاسخ شما باید به زبان فارسی، کامل، دقیق و سازنده باشد.`;

    const userPrompt = text
      ? `${systemPrompt}\n\nتوضیحات معلم: ${text}`
      : systemPrompt;

    // Prepare message with image for OpenRouter
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userPrompt,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ];

    // Retry mechanism with exponential backoff
    const makeRequest = async (retryCount = 0): Promise<Response> => {
      const maxRetries = 3;
      const timeout = 120000; // 120 seconds timeout

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "Kama Education Platform",
            "Content-Type": "application/json",
            "Connection": "keep-alive",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-preview",
            messages: messages,
            stream: true,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error: unknown) {
        clearTimeout(timeoutId);

        // Check if it's a network error and retry
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`Retry attempt ${retryCount + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return makeRequest(retryCount + 1);
        }

        throw error;
      }
    };

    // API call with retry mechanism
    const response = await makeRequest();

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API error details:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        apiKey: process.env.OPENROUTER_API_KEY ? `${process.env.OPENROUTER_API_KEY.substring(0, 10)}...` : 'NOT_SET'
      });

      // بررسی خطاهای رایج
      if (response.status === 401) {
        throw new Error("API Key نامعتبر است. لطفاً API Key خود را در OpenRouter بررسی کنید.");
      } else if (response.status === 402) {
        throw new Error("موجودی حساب OpenRouter کافی نیست. لطفاً اعتبار خود را شارژ کنید.");
      } else if (response.status === 429) {
        throw new Error("تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کنید.");
      }

      throw new Error(`خطای OpenRouter: ${errorData.error?.message || JSON.stringify(errorData)}`);
    }

    // Create a TransformStream to handle streaming response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete lines
            const lines = buffer.split('\n');
            // Keep the last incomplete line in buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '') continue;

              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;

                  if (content) {
                    // Send each chunk to the client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) {
                  // Skip incomplete JSON chunks silently
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("AI Image Correction API error:", error);
    const errorMessage = error instanceof Error ? error.message : "خطای نامشخص";
    return NextResponse.json(
      {
        error: "خطا در تحلیل تصویر",
        details: errorMessage,
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
