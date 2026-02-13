import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserById } from "@/lib/auth";

type Platform = "telegram" | "bale";

function normalizeBaseUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

function buildSchoolWebhookUrl(
  platform: Platform,
  schoolId: string,
  schoolWebsiteUrl?: string | null,
  fallbackBaseUrl?: string | null,
  requestOrigin?: string | null
) {
  const baseUrl =
    normalizeBaseUrl(schoolWebsiteUrl) ||
    normalizeBaseUrl(fallbackBaseUrl) ||
    normalizeBaseUrl(requestOrigin) ||
    "http://localhost:3000";

  return `${baseUrl}/api/webhook/${platform}/${schoolId}`;
}

async function getPrincipalContext(userId: string) {
  const result = await pool.query(
    `
    SELECT u.id, u.role, u.school_id, u.profile, s.website_url
    FROM users u
    LEFT JOIN schools s ON s.id = u.school_id
    WHERE u.id = $1
      AND u.is_active = true
    LIMIT 1
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as {
    id: string;
    role: string;
    school_id: string;
    profile: Record<string, unknown> | null;
    website_url?: string | null;
  };
}

function getPlatformToken(
  platform: Platform,
  profile: Record<string, unknown> | null | undefined
): string | null {
  if (!profile || typeof profile !== "object") {
    return null;
  }

  if (platform === "telegram") {
    const value = profile.telegram_api_key;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  const value = profile.bale_api_key;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getPlatformApiBase(platform: Platform, token: string) {
  if (platform === "telegram") {
    return `https://api.telegram.org/bot${token}`;
  }
  return `https://tapi.bale.ai/bot${token}`;
}

async function fetchWebhookInfo(platform: Platform, token: string) {
  const apiBase = getPlatformApiBase(platform, token);
  const response = await fetch(`${apiBase}/getWebhookInfo`, {
    method: "GET",
    cache: "no-store",
  });
  const json = await response.json();
  return {
    ok: Boolean(json?.ok),
    url: typeof json?.result?.url === "string" ? json.result.url : "",
    pending_update_count:
      typeof json?.result?.pending_update_count === "number"
        ? json.result.pending_update_count
        : 0,
    last_error_message:
      typeof json?.result?.last_error_message === "string"
        ? json.result.last_error_message
        : null,
  };
}

async function updatePrincipalWebhookState(
  principalId: string,
  platform: Platform,
  enabled: boolean,
  webhookUrl: string | null
) {
  const enabledKey =
    platform === "telegram" ? "telegram_webhook_enabled" : "bale_webhook_enabled";
  const urlKey = platform === "telegram" ? "telegram_webhook_url" : "bale_webhook_url";
  const enabledJson = enabled ? "true" : "false";
  const urlJson = webhookUrl ? `"${webhookUrl.replace(/"/g, '\\"')}"` : "null";

  await pool.query(
    `
    UPDATE users
    SET profile = jsonb_set(
      jsonb_set(COALESCE(profile, '{}'::jsonb), $1::text[], $2::jsonb, true),
      $3::text[],
      $4::jsonb,
      true
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    `,
    [[enabledKey], enabledJson, [urlKey], urlJson, principalId]
  );
}

async function persistPlatformToken(
  principalId: string,
  schoolId: string,
  platform: Platform,
  token: string
) {
  const tokenKey = platform === "telegram" ? "telegram_api_key" : "bale_api_key";

  await pool.query(
    `
    UPDATE users
    SET profile = jsonb_set(COALESCE(profile, '{}'::jsonb), $1::text[], $2::jsonb, true),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    `,
    [[tokenKey], `"${token.replace(/"/g, '\\"')}"`, principalId]
  );

  await pool.query(
    `
    UPDATE users
    SET profile = jsonb_set(COALESCE(profile, '{}'::jsonb), $1::text[], $2::jsonb, true),
        updated_at = CURRENT_TIMESTAMP
    WHERE school_id = $3
      AND role::text = ANY($4::text[])
    `,
    [[tokenKey], `"${token.replace(/"/g, '\\"')}"`, schoolId, ["teacher", "student", "parent"]]
  );
}

async function persistSchoolBaseDomain(schoolId: string, baseDomain: string) {
  await pool.query(
    `
    UPDATE schools
    SET website_url = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    `,
    [baseDomain, schoolId]
  );
}

async function persistPrincipalPlatformIds(
  principalId: string,
  platform: Platform,
  chatId: string | null,
  botId: string | null
) {
  const chatKey = platform === "telegram" ? "telegram_chat_id" : "bale_chat_id";
  const botKey = platform === "telegram" ? "telegram_bot_id" : "bale_bot_id";

  await pool.query(
    `
    UPDATE users
    SET profile = COALESCE(profile, '{}'::jsonb) || jsonb_build_object(
      $1::text, $2::text,
      $3::text, $4::text
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    `,
    [chatKey, chatId, botKey, botId, principalId]
  );
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);
    const user = await getUserById(userData.id);
    if (!user || user.role !== "principal") {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const principal = await getPrincipalContext(user.id);
    if (!principal || !principal.school_id) {
      return NextResponse.json({ error: "مدرسه یافت نشد" }, { status: 404 });
    }

    const fallbackBase = process.env.NEXT_PUBLIC_APP_URL || null;
    const origin = request.nextUrl?.origin || null;
    const telegramWebhookUrl = buildSchoolWebhookUrl(
      "telegram",
      principal.school_id,
      principal.website_url,
      fallbackBase,
      origin
    );
    const baleWebhookUrl = buildSchoolWebhookUrl(
      "bale",
      principal.school_id,
      principal.website_url,
      fallbackBase,
      origin
    );

    const profile = principal.profile || {};
    const telegramToken = getPlatformToken("telegram", profile);
    const baleToken = getPlatformToken("bale", profile);

    const telegramInfo = telegramToken
      ? await fetchWebhookInfo("telegram", telegramToken)
      : null;
    const baleInfo = baleToken ? await fetchWebhookInfo("bale", baleToken) : null;

    return NextResponse.json({
      success: true,
      data: {
        schoolId: principal.school_id,
        baseDomain:
          normalizeBaseUrl(principal.website_url) ||
          normalizeBaseUrl(fallbackBase) ||
          normalizeBaseUrl(origin),
        telegram: {
          desired_url: telegramWebhookUrl,
          token_exists: Boolean(telegramToken),
          enabled: telegramInfo ? telegramInfo.ok && telegramInfo.url === telegramWebhookUrl : false,
          current_url: telegramInfo?.url || "",
          pending_update_count: telegramInfo?.pending_update_count || 0,
          last_error_message: telegramInfo?.last_error_message || null,
        },
        bale: {
          desired_url: baleWebhookUrl,
          token_exists: Boolean(baleToken),
          enabled: baleInfo ? baleInfo.ok && baleInfo.url === baleWebhookUrl : false,
          current_url: baleInfo?.url || "",
          pending_update_count: baleInfo?.pending_update_count || 0,
          last_error_message: baleInfo?.last_error_message || null,
        },
      },
    });
  } catch (error) {
    console.error("Get bot webhook settings error:", error);
    return NextResponse.json({ error: "خطا در دریافت وضعیت بات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);
    const user = await getUserById(userData.id);
    if (!user || user.role !== "principal") {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const body = await request.json();
    const platform = body?.platform as Platform;
    const enabled = Boolean(body?.enabled);
    if (platform !== "telegram" && platform !== "bale") {
      return NextResponse.json({ error: "پلتفرم نامعتبر است" }, { status: 400 });
    }

    const principal = await getPrincipalContext(user.id);
    if (!principal || !principal.school_id) {
      return NextResponse.json({ error: "مدرسه یافت نشد" }, { status: 404 });
    }

    const incomingToken =
      typeof body?.token === "string" && body.token.trim() ? body.token.trim() : null;
    const incomingChatId =
      typeof body?.chatId === "string" && body.chatId.trim() ? body.chatId.trim() : null;
    const incomingBotId =
      typeof body?.botId === "string" && body.botId.trim() ? body.botId.trim() : null;
    const incomingBaseDomainRaw =
      typeof body?.baseDomain === "string" ? body.baseDomain : null;
    const incomingBaseDomain = normalizeBaseUrl(incomingBaseDomainRaw);

    if (enabled && !incomingBaseDomain && !normalizeBaseUrl(principal.website_url)) {
      return NextResponse.json(
        { error: "دامنه اصلی سایت را وارد کنید" },
        { status: 400 }
      );
    }

    if (incomingBaseDomain) {
      await persistSchoolBaseDomain(principal.school_id, incomingBaseDomain);
      principal.website_url = incomingBaseDomain;
    }

    if (incomingChatId || incomingBotId) {
      await persistPrincipalPlatformIds(user.id, platform, incomingChatId, incomingBotId);
    }

    if (incomingToken) {
      await persistPlatformToken(user.id, principal.school_id, platform, incomingToken);
    }

    const token = incomingToken || getPlatformToken(platform, principal.profile || {});
    if (!token) {
      return NextResponse.json(
        { error: `توکن ${platform === "telegram" ? "تلگرام" : "بله"} وارد نشده است` },
        { status: 400 }
      );
    }

    const fallbackBase = process.env.NEXT_PUBLIC_APP_URL || null;
    const origin = request.nextUrl?.origin || null;
    const desiredWebhookUrl = buildSchoolWebhookUrl(
      platform,
      principal.school_id,
      principal.website_url,
      fallbackBase,
      origin
    );

    const apiBase = getPlatformApiBase(platform, token);

    if (enabled) {
      const setWebhookResponse = await fetch(`${apiBase}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: desiredWebhookUrl }),
      });
      const setWebhookResult = await setWebhookResponse.json();

      if (!setWebhookResult?.ok) {
        return NextResponse.json(
          { error: setWebhookResult?.description || "خطا در فعال‌سازی وب‌هوک" },
          { status: 400 }
        );
      }
    } else {
      const deleteWebhookResponse = await fetch(`${apiBase}/deleteWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drop_pending_updates: false }),
      });
      const deleteWebhookResult = await deleteWebhookResponse.json();

      if (!deleteWebhookResult?.ok) {
        return NextResponse.json(
          { error: deleteWebhookResult?.description || "خطا در غیرفعال‌سازی وب‌هوک" },
          { status: 400 }
        );
      }
    }

    const webhookInfo = await fetchWebhookInfo(platform, token);
    const finalEnabled = enabled
      ? webhookInfo.ok && webhookInfo.url === desiredWebhookUrl
      : webhookInfo.ok && !webhookInfo.url;
    const savedWebhookUrl = finalEnabled && enabled ? desiredWebhookUrl : null;

    await updatePrincipalWebhookState(user.id, platform, finalEnabled && enabled, savedWebhookUrl);

    return NextResponse.json({
      success: true,
      data: {
        platform,
        enabled: finalEnabled && enabled,
        desired_url: desiredWebhookUrl,
        current_url: webhookInfo.url,
        pending_update_count: webhookInfo.pending_update_count,
        last_error_message: webhookInfo.last_error_message,
      },
    });
  } catch (error) {
    console.error("Toggle bot webhook error:", error);
    return NextResponse.json(
      { error: "خطا در تغییر وضعیت بات" },
      { status: 500 }
    );
  }
}
