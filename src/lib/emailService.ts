import nodemailer from "nodemailer";

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Create email transporter
function createTransporter() {
  // You can configure this for different email providers
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "", // App password for Gmail
    },
  };

  return nodemailer.createTransport(config);
}

// Email templates
export const emailTemplates = {
  passwordReset: (resetUrl: string) => ({
    subject: "بازیابی رمز عبور - کاما",
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>بازیابی رمز عبور</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            display: inline-block;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .content {
            text-align: center;
            margin-bottom: 30px;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .reset-button:hover {
            transform: translateY(-2px);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎓 کاما</div>
            <h1>بازیابی رمز عبور</h1>
          </div>
          
          <div class="content">
            <p>سلام،</p>
            <p>شما درخواست بازیابی رمز عبور برای حساب کاربری خود در کاما داده‌اید.</p>
            <p>برای تنظیم رمز عبور جدید، روی دکمه زیر کلیک کنید:</p>
            
            <a href="${resetUrl}" class="reset-button">
              تنظیم رمز عبور جدید
            </a>
            
            <div class="warning">
              <strong>⚠️ توجه:</strong>
              <ul style="text-align: right; margin: 10px 0;">
                <li>این لینک تنها برای 1 ساعت معتبر است</li>
                <li>اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید</li>
                <li>هرگز رمز عبور خود را با دیگران به اشتراک نگذارید</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              اگر دکمه کار نمی‌کند، این لینک را کپی کرده و در مرورگر خود باز کنید:<br>
              <code style="background: #f5f5f5; padding: 5px; border-radius: 3px; word-break: break-all;">
                ${resetUrl}
              </code>
            </p>
          </div>
          
          <div class="footer">
            <p>با تشکر،<br>تیم کاما</p>
            <p style="font-size: 12px; color: #999;">
              این ایمیل به صورت خودکار ارسال شده است. لطفاً پاسخ ندهید.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
بازیابی رمز عبور - کاما

سلام،

شما درخواست بازیابی رمز عبور برای حساب کاربری خود در کاما داده‌اید.

برای تنظیم رمز عبور جدید، این لینک را در مرورگر خود باز کنید:
${resetUrl}

توجه:
- این لینک تنها برای 1 ساعت معتبر است
- اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید

با تشکر،
تیم کاما
    `,
  }),
};

// Send password reset email
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if email configuration is available
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(
        "📧 Email not configured. Reset URL would be:",
        `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/reset-password?token=${resetToken}`
      );
      return {
        success: true, // Return success for development
      };
    }

    const transporter = createTransporter();
    const resetUrl = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;
    const template = emailTemplates.passwordReset(resetUrl);

    const mailOptions = {
      from: {
        name: "کاما",
        address: process.env.SMTP_USER || "noreply@eduhelper.com",
      },
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Password reset email sent successfully:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error);
    return {
      success: false,
      error: "خطایی در ارسال ایمیل رخ داد",
    };
  }
}

// Test email configuration
export async function testEmailConfig(): Promise<{
  success: boolean;
  error?: string;
  status: "configured" | "not_configured" | "invalid";
}> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("📧 Email not configured - using development mode");
      return {
        success: true,
        status: "not_configured",
        error: "Email not configured - development mode active",
      };
    }

    const transporter = createTransporter();

    // Set a timeout for the verification
    const verifyPromise = transporter.verify();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout")), 10000)
    );

    await Promise.race([verifyPromise, timeoutPromise]);

    console.log("✅ Email configuration is valid");
    return { success: true, status: "configured" };
  } catch (error) {
    console.error("❌ Email configuration test failed:", error);
    return {
      success: false,
      status: "invalid",
      error:
        error instanceof Error
          ? error.message
          : "Email configuration is invalid",
    };
  }
}
