"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "@/app/components/Alert";
import { useTheme } from "@/app/components/ThemeContext";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Password strength validation
  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return "رمز عبور باید حداقل ۸ کاراکتر باشد";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "رمز عبور باید حداقل یک حرف بزرگ داشته باشد";
    }
    if (!/[a-z]/.test(pwd)) {
      return "رمز عبور باید حداقل یک حرف کوچک داشته باشد";
    }
    if (!/[0-9]/.test(pwd)) {
      return "رمز عبور باید حداقل یک عدد داشته باشد";
    }
    return null;
  };

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: "", color: "" };
    if (pwd.length < 8)
      return { strength: 1, label: "ضعیف", color: "bg-red-500" };

    let strength = 1;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    if (pwd.length >= 12) strength++;

    if (strength <= 2)
      return { strength: 2, label: "ضعیف", color: "bg-red-500" };
    if (strength <= 4)
      return { strength: 3, label: "متوسط", color: "bg-yellow-500" };
    return { strength: 4, label: "قوی", color: "bg-green-500" };
  };

  const handlePasswordBlur = () => {
    if (password) {
      const error = validatePassword(password);
      setPasswordError(error);
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword && confirmPassword !== password) {
      setConfirmError("رمز عبور و تکرار آن مطابقت ندارند");
    } else {
      setConfirmError(null);
    }
  };

  const isFormValid = () => {
    return (
      password &&
      confirmPassword &&
      password === confirmPassword &&
      !validatePassword(password) &&
      !loading
    );
  };

  // Parse URL hash for error parameters (legacy Supabase code - no longer needed)
  // const parseHashParams = () => {
  //   if (typeof window !== "undefined") {
  //     const hash = window.location.hash.substring(1);
  //     const params = new URLSearchParams(hash);
  //     return {
  //       error: params.get("error"),
  //       error_code: params.get("error_code"),
  //       error_description: params.get("error_description"),
  //     };
  //   }
  //   return { error: null, error_code: null, error_description: null };
  // };

  // Verify user session on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Get token from URL parameters using Next.js hook
        const token = searchParams.get("token");

        if (!token) {
          setTokenValid(false);
          setError("توکن بازیابی یافت نشد");
          setValidating(false);
          return;
        }

        // Verify token with our API
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError(data.error || "توکن نامعتبر یا منقضی شده است");
        }
      } catch (error) {
        console.error("Token verification error:", error);
        setTokenValid(false);
        setError("خطایی در بررسی توکن رخ داد");
      } finally {
        setValidating(false);
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن مطابقت ندارند");
      setLoading(false);
      return;
    }

    try {
      // Get token from URL parameters using Next.js hook
      const token = searchParams.get("token");

      if (!token) {
        setError("توکن بازیابی یافت نشد");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "خطایی در تغییر رمز عبور رخ داد");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirect to signin after 3 seconds
      setTimeout(() => {
        router.push("/signin");
      }, 3000);
    } catch {
      setError("خطایی رخ داده است. لطفاً دوباره تلاش کنید.");
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

  if (validating) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center px-4 ${
          theme === "dark"
            ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
            : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <svg
            className={`animate-spin h-12 w-12 ${
              theme === "dark" ? "text-blue-500" : "text-blue-600"
            }`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            در حال بررسی لینک بازیابی...
          </p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center px-4 py-12 ${
          theme === "dark"
            ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
            : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
        }`}
      >
        <div className="w-full max-w-md">
          <div
            className={`relative rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden p-8 ${
              theme === "dark"
                ? "bg-slate-900/40 border border-slate-700/50"
                : "bg-white/60 border border-white/80"
            }`}
          >
            <div className="text-center space-y-4">
              <div
                className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
                  theme === "dark" ? "bg-red-500/20" : "bg-red-100"
                }`}
              >
                <svg
                  className={`w-10 h-10 ${
                    theme === "dark" ? "text-red-400" : "text-red-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2
                className={`text-xl font-bold ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                لینک نامعتبر یا منقضی شده
              </h2>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {error ||
                  "لینک بازیابی رمز عبور شما نامعتبر یا منقضی شده است. لطفاً درخواست جدیدی ارسال کنید."}
              </p>
              <div className="space-y-3 pt-4">
                <Link
                  href="/forgot-password"
                  className="block w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  درخواست لینک جدید
                </Link>
                <Link
                  href="/signin"
                  className={`block w-full py-3 rounded-xl font-medium text-center transition-colors ${
                    theme === "dark"
                      ? "text-slate-300 hover:text-white hover:bg-slate-800/50"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  بازگشت به صفحه ورود
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-12 ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
          : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
      }`}
    >
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className={`absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-30 animate-pulse ${
            theme === "dark" ? "bg-violet-600" : "bg-violet-400"
          }`}
          style={{ animationDuration: "4s" }}
        />
        <div
          className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-25 animate-pulse ${
            theme === "dark" ? "bg-blue-600" : "bg-blue-400"
          }`}
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full blur-[120px] opacity-20 ${
            theme === "dark" ? "bg-fuchsia-600" : "bg-indigo-400"
          }`}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/25 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
              کاما
            </span>
          </Link>
          <h1
            className={`text-3xl font-bold mb-2 ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}
          >
            تنظیم رمز عبور جدید
          </h1>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {success
              ? "رمز عبور با موفقیت تغییر کرد"
              : "لطفاً رمز عبور جدید خود را وارد کنید"}
          </p>
        </div>

        {/* Main Card */}
        <div
          className={`relative rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden ${
            theme === "dark"
              ? "bg-slate-900/40 border border-slate-700/50"
              : "bg-white/60 border border-white/80"
          }`}
        >
          <div
            className={`absolute inset-0 rounded-3xl opacity-60 ${
              theme === "dark"
                ? "bg-gradient-to-br from-violet-500/20 via-transparent to-blue-500/20"
                : "bg-gradient-to-br from-violet-300/30 via-transparent to-blue-300/30"
            }`}
          />
          <div className="relative p-8">
            {success ? (
              // Success State
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center ${
                      theme === "dark" ? "bg-green-500/20" : "bg-green-100"
                    }`}
                  >
                    <svg
                      className={`w-10 h-10 ${
                        theme === "dark" ? "text-green-400" : "text-green-600"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <h2
                    className={`text-xl font-bold ${
                      theme === "dark" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    رمز عبور تغییر کرد!
                  </h2>
                  <p
                    className={`text-sm leading-relaxed ${
                      theme === "dark" ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    رمز عبور شما با موفقیت تغییر کرد. اکنون می‌توانید با رمز
                    عبور جدید وارد شوید.
                  </p>
                  <p
                    className={`text-xs ${
                      theme === "dark" ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    در حال انتقال به صفحه ورود...
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <Link
                    href="/signin"
                    className="block w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-center"
                  >
                    ورود به حساب کاربری
                  </Link>
                </div>
              </div>
            ) : (
              // Form State
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* New Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className={`block mb-2 text-sm font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    رمز عبور جدید <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg
                        className={`w-5 h-5 ${
                          passwordError
                            ? "text-red-500"
                            : theme === "dark"
                            ? "text-slate-400"
                            : "text-slate-500"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={handlePasswordBlur}
                      className={`w-full pl-11 pr-11 py-3.5 rounded-xl border outline-none focus:ring-2 transition-all ${
                        passwordError
                          ? "border-red-500 focus:ring-red-500"
                          : "focus:ring-blue-500 focus:border-transparent"
                      } ${
                        theme === "dark"
                          ? "border-slate-700 bg-slate-950/50 text-white placeholder:text-slate-400"
                          : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"
                      }`}
                      placeholder="••••••••"
                      dir="ltr"
                      {...(passwordError
                        ? {
                            "aria-invalid": "true",
                            "aria-describedby": "password-error",
                          }
                        : {})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 left-0 pl-3 flex items-center transition-colors ${
                        theme === "dark"
                          ? "text-slate-400 hover:text-slate-300"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                      aria-label={
                        showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"
                      }
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              level <= passwordStrength.strength
                                ? passwordStrength.color
                                : theme === "dark"
                                ? "bg-slate-700"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p
                        className={`text-xs font-medium ${
                          passwordStrength.strength === 4
                            ? "text-green-500"
                            : passwordStrength.strength === 3
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      >
                        قدرت رمز عبور: {passwordStrength.label}
                      </p>
                    </div>
                  )}

                  {passwordError && (
                    <p
                      id="password-error"
                      className="text-xs mt-1.5 text-red-500 font-medium"
                    >
                      {passwordError}
                    </p>
                  )}

                  {/* Password Requirements */}
                  <div
                    className={`mt-3 p-3 rounded-lg space-y-1.5 text-xs ${
                      theme === "dark"
                        ? "bg-slate-800/50 border border-slate-700"
                        : "bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <p
                      className={`font-medium mb-2 ${
                        theme === "dark" ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      رمز عبور باید شامل موارد زیر باشد:
                    </p>
                    <div className="space-y-1">
                      {[
                        { test: password.length >= 8, text: "حداقل ۸ کاراکتر" },
                        { test: /[A-Z]/.test(password), text: "یک حرف بزرگ" },
                        { test: /[a-z]/.test(password), text: "یک حرف کوچک" },
                        { test: /[0-9]/.test(password), text: "یک عدد" },
                      ].map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <svg
                            className={`w-3.5 h-3.5 ${
                              req.test
                                ? "text-green-500"
                                : theme === "dark"
                                ? "text-slate-600"
                                : "text-slate-400"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span
                            className={
                              req.test
                                ? theme === "dark"
                                  ? "text-slate-300"
                                  : "text-slate-700"
                                : theme === "dark"
                                ? "text-slate-500"
                                : "text-slate-500"
                            }
                          >
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className={`block mb-2 text-sm font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    تکرار رمز عبور <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg
                        className={`w-5 h-5 ${
                          confirmError
                            ? "text-red-500"
                            : theme === "dark"
                            ? "text-slate-400"
                            : "text-slate-500"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={handleConfirmPasswordBlur}
                      className={`w-full pl-11 pr-11 py-3.5 rounded-xl border outline-none focus:ring-2 transition-all ${
                        confirmError
                          ? "border-red-500 focus:ring-red-500"
                          : "focus:ring-blue-500 focus:border-transparent"
                      } ${
                        theme === "dark"
                          ? "border-slate-700 bg-slate-950/50 text-white placeholder:text-slate-400"
                          : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"
                      }`}
                      placeholder="••••••••"
                      dir="ltr"
                      {...(confirmError
                        ? {
                            "aria-invalid": "true",
                            "aria-describedby": "confirm-error",
                          }
                        : {})}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className={`absolute inset-y-0 left-0 pl-3 flex items-center transition-colors ${
                        theme === "dark"
                          ? "text-slate-400 hover:text-slate-300"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                      aria-label={
                        showConfirmPassword
                          ? "مخفی کردن رمز عبور"
                          : "نمایش رمز عبور"
                      }
                    >
                      {showConfirmPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                    {confirmPassword &&
                      password &&
                      confirmPassword === password && (
                        <div className="absolute inset-y-0 left-11 flex items-center pointer-events-none">
                          <svg
                            className="w-5 h-5 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                  </div>
                  {confirmError && (
                    <p
                      id="confirm-error"
                      className="text-xs mt-1.5 text-red-500 font-medium"
                    >
                      {confirmError}
                    </p>
                  )}
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert
                    variant="error"
                    title="خطا در تغییر رمز عبور"
                    description={error}
                  />
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
                  aria-label="تنظیم رمز عبور جدید"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      در حال تنظیم...
                    </span>
                  ) : (
                    "تنظیم رمز عبور جدید"
                  )}
                </button>

                {/* Back to Sign In */}
                <Link
                  href="/signin"
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium transition-colors ${
                    theme === "dark"
                      ? "text-slate-300 hover:text-white hover:bg-slate-800/50"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  بازگشت به صفحه ورود
                </Link>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p
          className={`text-center text-xs mt-8 leading-relaxed ${
            theme === "dark" ? "text-slate-500" : "text-slate-500"
          }`}
        >
          آیا به کمک نیاز دارید؟{" "}
          <Link
            href="/support"
            className={`underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${
              theme === "dark" ? "hover:text-slate-400" : "hover:text-slate-700"
            }`}
          >
            تماس با پشتیبانی
          </Link>
        </p>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          در حال بارگذاری...
        </p>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
