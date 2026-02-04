// SMS Service for sending OTP codes
// In Iran, popular SMS providers include: Kavenegar, Faraz SMS, Melipayamak, etc.
// This implementation uses a generic approach that can be adapted to any provider

// Generate a random 6-digit OTP code
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// SMS Templates
export const smsTemplates = {
  otpLogin: (otpCode: string) => ({
    message: `کد تایید کاما: ${otpCode}\nاین کد به مدت 5 دقیقه معتبر است.\nاگر درخواست ورود نداده‌اید، این پیام را نادیده بگیرید.`,
  }),
  // Add new template for amoozyar-login
  amoozyarLogin: (otpCode: string) => ({
    template: "amoozyar-login",
    tokens: {
      code: otpCode,
    },
  }),
};

// Send OTP via SMS
export async function sendOTP(
  phone: string,
  otpCode: string,
  templateName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if SMS is configured
    const smsProvider = process.env.SMS_PROVIDER; // 'kavenegar', 'farazsms', etc.
    const apiKey = process.env.SMS_API_KEY;

    if (!apiKey || !smsProvider) {
      console.log("📱 SMS not configured. OTP code for development:", otpCode);
      console.log(`   Phone: ${phone}`);
      console.log(`   Code: ${otpCode}`);

      // In development, we'll simulate success
      return { success: true };
    }

    // Use template if specified, otherwise use default message
    if (templateName === "amoozyar-login" && smsProvider === "kavenegar") {
      const template = smsTemplates.amoozyarLogin(otpCode);
      return await sendTemplateViaKavenegar(
        phone,
        template.template,
        template.tokens,
        apiKey
      );
    } else {
      const template = smsTemplates.otpLogin(otpCode);
      // Send SMS based on provider
      switch (smsProvider) {
        case "kavenegar":
          return await sendViaKavenegar(phone, template.message, apiKey);

        case "farazsms":
          return await sendViaFarazSMS(phone, template.message, apiKey);

        case "melipayamak":
          return await sendViaMelipayamak(phone, template.message, apiKey);

        default:
          console.log(
            "📱 Unknown SMS provider. Development mode - OTP:",
            otpCode
          );
          return { success: true };
      }
    }
  } catch (error) {
    console.error("❌ Failed to send SMS:", error);
    return {
      success: false,
      error: "خطایی در ارسال پیامک رخ داد",
    };
  }
}

// Kavenegar SMS Provider
async function sendViaKavenegar(
  phone: string,
  message: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        receptor: phone,
        message: message,
        sender: process.env.SMS_SENDER || "10008663",
      }),
    });

    const data = await response.json();

    if (data.return?.status === 200) {
      console.log("✅ SMS sent via Kavenegar successfully");
      return { success: true };
    } else {
      console.error("❌ Kavenegar error:", data);
      return { success: false, error: "خطا در ارسال پیامک" };
    }
  } catch (error) {
    console.error("❌ Kavenegar request failed:", error);
    return { success: false, error: "خطا در ارسال پیامک" };
  }
}

// Add new function for sending template-based messages via Kavenegar
async function sendTemplateViaKavenegar(
  phone: string,
  template: string,
  tokens: Record<string, string>,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`;

    // Prepare the request body with template and tokens
    const bodyParams: Record<string, string> = {
      receptor: phone,
      template: template,
    };

    // Add token parameters
    Object.keys(tokens).forEach((key, index) => {
      bodyParams[`token${index > 0 ? index + 1 : ""}`] = tokens[key];
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(bodyParams),
    });

    const data = await response.json();

    if (data.return?.status === 200) {
      console.log("✅ Template SMS sent via Kavenegar successfully");
      return { success: true };
    } else {
      console.error("❌ Kavenegar template error:", data);
      return { success: false, error: "خطا در ارسال پیامک" };
    }
  } catch (error) {
    console.error("❌ Kavenegar template request failed:", error);
    return { success: false, error: "خطا در ارسال پیامک" };
  }
}

// Faraz SMS Provider
async function sendViaFarazSMS(
  phone: string,
  message: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = "https://api2.ippanel.com/api/v1/sms/send/webservice/single";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        recipient: phone,
        sender: process.env.SMS_SENDER || "+983000505",
        message: message,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ SMS sent via FarazSMS successfully");
      return { success: true };
    } else {
      console.error("❌ FarazSMS error:", data);
      return { success: false, error: "خطا در ارسال پیامک" };
    }
  } catch (error) {
    console.error("❌ FarazSMS request failed:", error);
    return { success: false, error: "خطا در ارسال پیامک" };
  }
}

// Melipayamak Provider
async function sendViaMelipayamak(
  phone: string,
  message: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const username = process.env.SMS_USERNAME;
    const password = process.env.SMS_PASSWORD;

    if (!username || !password) {
      return { success: false, error: "SMS credentials not configured" };
    }

    const url = "https://rest.payamak-panel.com/api/SendSMS/SendSMS";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
        to: phone,
        from: process.env.SMS_SENDER || "50004001400140",
        text: message,
        isFlash: false,
      }),
    });

    const data = await response.json();

    if (data.Value > 0) {
      console.log("✅ SMS sent via Melipayamak successfully");
      return { success: true };
    } else {
      console.error("❌ Melipayamak error:", data);
      return { success: false, error: "خطا در ارسال پیامک" };
    }
  } catch (error) {
    console.error("❌ Melipayamak request failed:", error);
    return { success: false, error: "خطا در ارسال پیامک" };
  }
}

// Validate Iranian phone number format
export function validateIranianPhone(phone: string): boolean {
  // Iranian mobile numbers: 09XX XXX XXXX (11 digits)
  // Can be formatted as: 09123456789 or +989123456789
  const regex = /^(\+98|0)?9\d{9}$/;
  return regex.test(phone.replace(/\s+/g, ""));
}

// Normalize phone number to standard format (09XXXXXXXXX)
export function normalizePhone(phone: string): string {
  // Remove spaces and non-digits except +
  let normalized = phone.replace(/[\s-]/g, "");

  // Convert +98 to 0
  if (normalized.startsWith("+98")) {
    normalized = "0" + normalized.substring(3);
  } else if (normalized.startsWith("98") && normalized.length === 12) {
    normalized = "0" + normalized.substring(2);
  }

  return normalized;
}

// Test SMS configuration
export async function testSMSConfig(): Promise<{
  success: boolean;
  error?: string;
  status: "configured" | "not_configured" | "invalid";
}> {
  try {
    const smsProvider = process.env.SMS_PROVIDER;
    const apiKey = process.env.SMS_API_KEY;

    if (!apiKey || !smsProvider) {
      console.log("📱 SMS not configured - using development mode");
      return {
        success: true,
        status: "not_configured",
        error: "SMS not configured - development mode active",
      };
    }

    console.log(`✅ SMS configured with provider: ${smsProvider}`);
    return { success: true, status: "configured" };
  } catch (error) {
    console.error("❌ SMS configuration test failed:", error);
    return {
      success: false,
      status: "invalid",
      error:
        error instanceof Error ? error.message : "SMS configuration is invalid",
    };
  }
}
