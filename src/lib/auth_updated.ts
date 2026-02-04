import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "./database";
import {
  generateOTP,
  sendOTP,
  normalizePhone,
  validateIranianPhone,
} from "./smsService";

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  national_id?: string;
  role: string;
  school_id?: string;
  created_at: Date;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Sign up a new user
export async function signUp(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  try {
    const client = await pool.connect();

    // Check if user already exists
    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      client.release();
      return { success: false, error: "حسابی با این ایمیل از قبل وجود دارد" };
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user (need to get a school first for the demo)
    // For now, we'll create users without school_id for testing
    const result = await client.query(
      "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at",
      [email, passwordHash, name || "کاربر", "teacher"]
    );

    client.release();

    const user = result.rows[0];
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        national_id: user.national_id,
        role: user.role,
        school_id: user.school_id,
        created_at: user.created_at,
      },
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return { success: false, error: "خطایی در ایجاد حساب کاربری رخ داد" };
  }
}

// Sign in user (supports email, national ID, and phone number)
export async function signIn(
  identifier: string, // email, national_id, or phone
  password: string
): Promise<AuthResult> {
  try {
    const client = await pool.connect();

    // Try to find user by email, national_id, or phone
    let result;
    if (identifier.includes("@")) {
      // If contains @, treat as email
      result = await client.query(
        "SELECT id, email, phone, password_hash, name, national_id, role, school_id, created_at FROM users WHERE email = $1",
        [identifier]
      );
    } else if (/^09\d{9}$/.test(identifier)) {
      // If matches Iranian phone format, treat as phone
      result = await client.query(
        "SELECT id, email, phone, password_hash, name, national_id, role, school_id, created_at FROM users WHERE phone = $1",
        [identifier]
      );
    } else {
      // Otherwise, treat as national_id
      result = await client.query(
        "SELECT id, email, phone, password_hash, name, national_id, role, school_id, created_at FROM users WHERE national_id = $1",
        [identifier]
      );
    }

    client.release();

    if (result.rows.length === 0) {
      return { success: false, error: "اطلاعات ورود اشتباه است" };
    }

    const user = result.rows[0];

    // Check if user has password set
    if (!user.password_hash) {
      return {
        success: false,
        error:
          "رمز عبور برای این حساب تنظیم نشده است. از ورود با کد تایید استفاده کنید",
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, error: "اطلاعات ورود اشتباه است" };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        national_id: user.national_id,
        role: user.role,
        school_id: user.school_id,
        created_at: user.created_at,
      },
    };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "خطایی در ورود رخ داد" };
  }
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT id, email, phone, name, national_id, role, school_id, created_at FROM users WHERE id = $1",
      [id]
    );
    client.release();

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
      created_at: user.created_at,
    };
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}

// Generate password reset token
export async function generatePasswordResetToken(
  email: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const client = await pool.connect();

    // Check if user exists
    const userResult = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      client.release();
      return { success: false, error: "کاربری با این ایمیل یافت نشد" };
    }

    const userId = userResult.rows[0].id;

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Invalidate any existing tokens for this user
    await client.query(
      "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE",
      [userId]
    );

    // Insert new token
    await client.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [userId, token, expiresAt]
    );

    client.release();

    return { success: true, token };
  } catch (error) {
    console.error("Generate reset token error:", error);
    return { success: false, error: "خطایی در تولید توکن رخ داد" };
  }
}

// Verify and use password reset token
export async function verifyPasswordResetToken(
  token: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const client = await pool.connect();

    const result = await client.query(
      `
      SELECT prt.user_id, prt.expires_at, prt.used, u.email
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = $1
    `,
      [token]
    );

    client.release();

    if (result.rows.length === 0) {
      return { success: false, error: "توکن نامعتبر است" };
    }

    const tokenData = result.rows[0];

    if (tokenData.used) {
      return { success: false, error: "این توکن قبلاً استفاده شده است" };
    }

    if (new Date() > new Date(tokenData.expires_at)) {
      return { success: false, error: "توکن منقضی شده است" };
    }

    return { success: true, userId: tokenData.user_id };
  } catch (error) {
    console.error("Verify reset token error:", error);
    return { success: false, error: "خطایی در تایید توکن رخ داد" };
  }
}

// Reset password with token
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<AuthResult> {
  try {
    const client = await pool.connect();

    // Verify token first
    const tokenVerification = await verifyPasswordResetToken(token);
    if (!tokenVerification.success) {
      client.release();
      return { success: false, error: tokenVerification.error };
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    const userResult = await client.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, role, created_at",
      [passwordHash, tokenVerification.userId]
    );

    // Mark token as used
    await client.query(
      "UPDATE password_reset_tokens SET used = TRUE WHERE token = $1",
      [token]
    );

    client.release();

    const user = userResult.rows[0];
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
      },
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, error: "خطایی در تغییر رمز عبور رخ داد" };
  }
}

// ============= OTP-Based Authentication =============

// Generate and send OTP to phone number
export async function sendOTPToPhone(
  phone: string
): Promise<{ success: boolean; error?: string; expiresAt?: Date }> {
  try {
    // Validate phone number
    if (!validateIranianPhone(phone)) {
      return { success: false, error: "شماره موبایل نامعتبر است" };
    }

    const normalizedPhone = normalizePhone(phone);
    const client = await pool.connect();

    // Check if user exists with this phone (optional - you can create users on-the-fly)
    const userCheck = await client.query(
      "SELECT id, role FROM users WHERE phone = $1",
      [normalizedPhone]
    );

    if (userCheck.rows.length === 0) {
      client.release();
      return { success: false, error: "کاربری با این شماره موبایل یافت نشد" };
    }

    // Generate OTP code
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Invalidate any existing OTP for this phone
    await client.query(
      "UPDATE otp_tokens SET verified = TRUE WHERE phone = $1 AND verified = FALSE",
      [normalizedPhone]
    );

    // Store OTP in database
    await client.query(
      "INSERT INTO otp_tokens (phone, otp_code, expires_at) VALUES ($1, $2, $3)",
      [normalizedPhone, otpCode, expiresAt]
    );

    client.release();

    // Send OTP via SMS
    const smsResult = await sendOTP(normalizedPhone, otpCode);

    if (!smsResult.success) {
      return { success: false, error: smsResult.error };
    }

    return { success: true, expiresAt };
  } catch (error) {
    console.error("Send OTP error:", error);
    return { success: false, error: "خطایی در ارسال کد تایید رخ داد" };
  }
}

// Verify OTP and sign in user
export async function verifyOTPAndSignIn(
  phone: string,
  otpCode: string
): Promise<AuthResult> {
  try {
    const normalizedPhone = normalizePhone(phone);
    const client = await pool.connect();

    // Find the most recent valid OTP for this phone
    const otpResult = await client.query(
      `SELECT id, otp_code, expires_at, verified, attempts 
       FROM otp_tokens 
       WHERE phone = $1 AND verified = FALSE 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [normalizedPhone]
    );

    if (otpResult.rows.length === 0) {
      client.release();
      return {
        success: false,
        error: "کد تایید یافت نشد. لطفاً دوباره درخواست کنید",
      };
    }

    const otpRecord = otpResult.rows[0];

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      client.release();
      return { success: false, error: "کد تایید منقضی شده است" };
    }

    // Check attempts (max 3 attempts)
    if (otpRecord.attempts >= 3) {
      client.release();
      return {
        success: false,
        error: "تعداد تلاش‌های مجاز تمام شده است. لطفاً کد جدید درخواست کنید",
      };
    }

    // Verify OTP code
    if (otpRecord.otp_code !== otpCode) {
      // Increment attempts
      await client.query(
        "UPDATE otp_tokens SET attempts = attempts + 1 WHERE id = $1",
        [otpRecord.id]
      );
      client.release();
      return { success: false, error: "کد تایید نادرست است" };
    }

    // Mark OTP as verified
    await client.query("UPDATE otp_tokens SET verified = TRUE WHERE id = $1", [
      otpRecord.id,
    ]);

    // Get user by phone
    const userResult = await client.query(
      "SELECT id, email, phone, name, national_id, role, school_id, created_at FROM users WHERE phone = $1",
      [normalizedPhone]
    );

    if (userResult.rows.length === 0) {
      client.release();
      return { success: false, error: "کاربری یافت نشد" };
    }

    const user = userResult.rows[0];

    // Update last login
    await client.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    client.release();

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        national_id: user.national_id,
        role: user.role,
        school_id: user.school_id,
        created_at: user.created_at,
      },
    };
  } catch (error) {
    console.error("Verify OTP error:", error);
    return { success: false, error: "خطایی در تایید کد رخ داد" };
  }
}

// Sign in with National ID (for students)
export async function signInWithNationalID(
  nationalId: string,
  password: string
): Promise<AuthResult> {
  try {
    const client = await pool.connect();

    // Validate national ID format (10 digits)
    if (!/^\d{10}$/.test(nationalId)) {
      client.release();
      return { success: false, error: "کد ملی باید 10 رقم باشد" };
    }

    // Find user by national_id
    const result = await client.query(
      "SELECT id, email, phone, password_hash, name, national_id, role, school_id, created_at FROM users WHERE national_id = $1",
      [nationalId]
    );

    client.release();

    if (result.rows.length === 0) {
      return { success: false, error: "کد ملی یا رمز عبور اشتباه است" };
    }

    const user = result.rows[0];

    // Verify password
    if (!user.password_hash) {
      return { success: false, error: "رمز عبور برای این حساب تنظیم نشده است" };
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, error: "کد ملی یا رمز عبور اشتباه است" };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        national_id: user.national_id,
        role: user.role,
        school_id: user.school_id,
        created_at: user.created_at,
      },
    };
  } catch (error) {
    console.error("Sign in with national ID error:", error);
    return { success: false, error: "خطایی در ورود رخ داد" };
  }
}