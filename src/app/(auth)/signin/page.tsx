"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SigninPageContent() {
  const [loginMethod, setLoginMethod] = useState("phone");
  const [otpStep, setOtpStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [nationalId, setNationalId] = useState("");
  const [nationalIdPassword, setNationalIdPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          // User is already authenticated, redirect to appropriate dashboard
          const dashboardPath =
            data.user.role === "admin"
              ? "/admin"
              : data.user.role === "principal"
              ? "/dashboard/principal"
              : "/dashboard";
          router.push(dashboardPath);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    // Check for role parameter in URL and set appropriate login method
    const role = searchParams.get("role");
    if (role) {
      switch (role) {
        case "student":
          setLoginMethod("nationalId");
          break;
        case "teacher":
        case "principal":
        case "parent":
          setLoginMethod("phone");
          break;
        default:
          setLoginMethod("phone");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      return cleaned.slice(0, 11);
    }
    return cleaned.slice(0, 10);
  };

  const validatePhone = (phone: string) => /^09\d{9}$/.test(phone);
  const validateNationalId = (id: string) => /^\d{10}$/.test(id);
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!validatePhone(phone)) {
      setError("لطفاً یک شماره موبایل معتبر وارد کنید (مثال: 09123456789)");
      setLoading(false);
      return;
    }

    try {
      // Use the template-based OTP endpoint
      const response = await fetch("/api/auth/send-otp-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, template: "amoozyar-login" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "خطایی در ارسال کد تایید رخ داد");
        setLoading(false);
        return;
      }

      setSuccess("کد تایید به شماره موبایل شما ارسال شد");
      setOtpStep("verify");
      setCountdown(120);
    } catch (err) {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (otpCode.length !== 6) {
      setError("کد تایید باید 6 رقم باشد");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "کد تایید نادرست است");
        setLoading(false);
        return;
      }

      // Redirect based on user role
      if (data.user) {
        const dashboardPath =
          data.user.role === "admin"
            ? "/admin"
            : data.user.role === "principal"
            ? "/dashboard/principal"
            : "/dashboard";
        router.push(dashboardPath);
      }
    } catch (err) {
      setError("خطا در برقراری ارتباط با سرور");
      setLoading(false);
    }
  };

  const handleNationalIdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateNationalId(nationalId)) {
      setError("کد ملی باید 10 رقم باشد");
      setLoading(false);
      return;
    }

    if (!nationalIdPassword) {
      setError("لطفاً رمز عبور خود را وارد کنید");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signin-national-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalId, password: nationalIdPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "کد ملی یا رمز عبور اشتباه است");
        setLoading(false);
        return;
      }

      // Redirect based on user role
      if (data.user) {
        const dashboardPath =
          data.user.role === "admin"
            ? "/admin"
            : data.user.role === "principal"
            ? "/dashboard/principal"
            : "/dashboard";
        router.push(dashboardPath);
      }
    } catch (err) {
      setError("خطا در برقراری ارتباط با سرور");
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateEmail(email)) {
      setError("لطفاً یک ایمیل معتبر وارد کنید");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("لطفاً رمز عبور خود را وارد کنید");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "ایمیل یا رمز عبور اشتباه است");
        setLoading(false);
        return;
      }

      // Redirect based on user role
      if (data.user) {
        const dashboardPath =
          data.user.role === "admin"
            ? "/admin"
            : data.user.role === "principal"
            ? "/dashboard/principal"
            : "/dashboard";
        router.push(dashboardPath);
      }
    } catch (err) {
      setError("خطا در برقراری ارتباط با سرور");
      setLoading(false);
    }
  };

  const resetToPhoneInput = () => {
    setOtpStep("phone");
    setOtpCode("");
    setError(null);
    setSuccess(null);
  };

  const handleMethodChange = (method: string) => {
    setLoginMethod(method);
    setError(null);
    setSuccess(null);
    setOtpStep("phone");
    setPhone("");
    setOtpCode("");
    setNationalId("");
    setNationalIdPassword("");
    setEmail("");
    setPassword("");
  };

  const roleConfig = {
    phone: {
      bgColor: "bg-purple-600",
      emoji: "📱",
      label: "معلم/مدیر/والدین",
    },
    nationalId: {
      bgColor: "bg-green-600",
      emoji: "🎓",
      label: "دانش‌آموز",
    },
    email: {
      bgColor: "bg-orange-500",
      emoji: "✉️",
      label: "ایمیل",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Right Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center items-start space-y-8 p-12">
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3 bg-white rounded-2xl px-6 py-3 shadow-lg hover:opacity-90 transition-opacity"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-black text-gray-900">کاما</h1>
            </Link>

            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
              سامانه مدیریت
              <br />
              <span className="text-purple-600">آموزشی هوشمند</span>
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed max-w-md">
              با کاما، مدیریت مدرسه، تدریس و یادگیری را آسان‌تر و هوشمندانه‌تر
              تجربه کنید.
            </p>
          </div>

          <div className="space-y-4 w-full">
            <div className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">✨</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">تصحیح هوشمند</h3>
                <p className="text-sm text-gray-600">
                  تصحیح خودکار با هوش مصنوعی
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">
                  گزارش‌های تحلیلی
                </h3>
                <p className="text-sm text-gray-600">
                  نمودارهای عملکردی و تحلیل پیشرفت
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">سریع و آسان</h3>
                <p className="text-sm text-gray-600">
                  دسترسی آسان برای همه کاربران
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Left Side - Login Form */}
        <div className="w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-3 bg-white rounded-2xl px-6 py-3 shadow-lg mb-4 hover:opacity-90 transition-opacity"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-gray-900">کاما</h1>
            </Link>
            <p className="text-gray-600">سامانه مدیریت آموزشی هوشمند</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            {/* Role Selection Tabs */}
            <div className="grid grid-cols-3 gap-3 mb-8 bg-gray-50 p-2 rounded-2xl">
              {Object.entries(roleConfig).map(([method, config]) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => handleMethodChange(method)}
                  className={`relative py-4 px-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                    loginMethod === method
                      ? `${config.bgColor} text-white shadow-lg transform scale-105`
                      : "text-gray-600 hover:text-gray-900 hover:bg-white"
                  }`}
                >
                  <div className="text-2xl mb-2">{config.emoji}</div>
                  <div className="text-xs leading-tight">{config.label}</div>
                </button>
              ))}
            </div>

            {/* Phone Login */}
            {loginMethod === "phone" && (
              <form
                onSubmit={otpStep === "phone" ? handleSendOTP : handleVerifyOTP}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {otpStep === "phone"
                      ? "ورود با شماره موبایل"
                      : "تایید کد ارسال شده"}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {otpStep === "phone"
                      ? "کد تایید به شماره موبایل شما ارسال خواهد شد"
                      : `کد 6 رقمی به شماره ${phone} ارسال شده است`}
                  </p>
                </div>

                {otpStep === "phone" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      شماره موبایل
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          // Convert Persian/Arabic digits to English digits
                          const persianToEnglish = (str: string) => {
                            const persianDigits = [
                              "۰",
                              "۱",
                              "۲",
                              "۳",
                              "۴",
                              "۵",
                              "۶",
                              "۷",
                              "۸",
                              "۹",
                            ];
                            const englishDigits = [
                              "0",
                              "1",
                              "2",
                              "3",
                              "4",
                              "5",
                              "6",
                              "7",
                              "8",
                              "9",
                            ];

                            for (let i = 0; i < 10; i++) {
                              str = str.replace(
                                new RegExp(persianDigits[i], "g"),
                                englishDigits[i]
                              );
                            }
                            return str;
                          };

                          const inputValue = persianToEnglish(e.target.value);
                          setPhone(formatPhoneNumber(inputValue));
                        }}
                        placeholder="09123456789"
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 text-lg text-center font-mono text-gray-900"
                        dir="ltr"
                        inputMode="tel"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        📱
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      کد تایید 6 رقمی
                    </label>
                    <div className="flex gap-2 justify-center" dir="ltr">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength={1}
                          value={otpCode[index] || ""}
                          onChange={(e) => {
                            // Convert Persian/Arabic digits to English digits
                            const persianToEnglish = (str: string) => {
                              const persianDigits = [
                                "۰",
                                "۱",
                                "۲",
                                "۳",
                                "۴",
                                "۵",
                                "۶",
                                "۷",
                                "۸",
                                "۹",
                              ];
                              const englishDigits = [
                                "0",
                                "1",
                                "2",
                                "3",
                                "4",
                                "5",
                                "6",
                                "7",
                                "8",
                                "9",
                              ];

                              for (let i = 0; i < 10; i++) {
                                str = str.replace(
                                  new RegExp(persianDigits[i], "g"),
                                  englishDigits[i]
                                );
                              }
                              return str;
                            };

                            const inputValue = persianToEnglish(e.target.value);

                            // Only allow digits
                            if (inputValue && !/^\d$/.test(inputValue)) return;

                            const newOtp = otpCode
                              .padEnd(6, " ")
                              .split("")
                              .map((char, i) =>
                                i === index ? inputValue : char
                              )
                              .join("")
                              .trim();
                            setOtpCode(newOtp);

                            // Auto-focus next input
                            if (inputValue && index < 5) {
                              const nextInput = document.getElementById(
                                `otp-${index + 1}`
                              );
                              if (nextInput) nextInput.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            // Handle backspace
                            if (
                              e.key === "Backspace" &&
                              !otpCode[index] &&
                              index > 0
                            ) {
                              const prevInput = document.getElementById(
                                `otp-${index - 1}`
                              );
                              if (prevInput) prevInput.focus();
                            }
                          }}
                          id={`otp-${index}`}
                          className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-0 text-gray-900 bg-white"
                          title={`Digit ${index + 1} of verification code`}
                        />
                      ))}
                    </div>
                    <div className="text-center mt-4">
                      {countdown > 0 ? (
                        <p className="text-sm text-gray-600">
                          ارسال مجدد کد تا {countdown} ثانیه دیگر
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                        >
                          ارسال مجدد کد
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">✕</span> {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200 text-green-700 text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">✓</span> {success}
                  </div>
                )}

                <div className="flex gap-3">
                  {otpStep === "verify" && (
                    <button
                      type="button"
                      onClick={resetToPhoneInput}
                      className="flex-1 py-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      تغییر شماره
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={
                      (otpStep === "phone" &&
                        (!phone || !validatePhone(phone))) ||
                      (otpStep === "verify" && otpCode.length !== 6) ||
                      loading
                    }
                    className="flex-1 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        در حال پردازش...
                      </span>
                    ) : otpStep === "phone" ? (
                      "دریافت کد تایید"
                    ) : (
                      "ورود به حساب کاربری"
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => handleMethodChange("nationalId")}
                    className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    ورود با کد ملی (برای دانش‌آموزان)
                  </button>
                </div>
              </form>
            )}

            {/* National ID Login */}
            {loginMethod === "nationalId" && (
              <form onSubmit={handleNationalIdLogin} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    ورود با کد ملی
                  </h3>
                  <p className="text-gray-600 text-sm">
                    برای دانش‌آموزان ثبت‌نام شده در سامانه
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    کد ملی
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => {
                        // Convert Persian/Arabic digits to English digits
                        const persianToEnglish = (str: string) => {
                          const persianDigits = [
                            "۰",
                            "۱",
                            "۲",
                            "۳",
                            "۴",
                            "۵",
                            "۶",
                            "۷",
                            "۸",
                            "۹",
                          ];
                          const englishDigits = [
                            "0",
                            "1",
                            "2",
                            "3",
                            "4",
                            "5",
                            "6",
                            "7",
                            "8",
                            "9",
                          ];

                          for (let i = 0; i < 10; i++) {
                            str = str.replace(
                              new RegExp(persianDigits[i], "g"),
                              englishDigits[i]
                            );
                          }
                          return str;
                        };

                        const inputValue = persianToEnglish(e.target.value);
                        setNationalId(
                          inputValue.replace(/\D/g, "").slice(0, 10)
                        );
                      }}
                      placeholder="1234567890"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 text-lg text-center font-mono text-gray-900"
                      dir="ltr"
                      inputMode="numeric"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      🎓
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رمز عبور
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={nationalIdPassword}
                      onChange={(e) => setNationalIdPassword(e.target.value)}
                      placeholder="رمز عبور خود را وارد کنید"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 text-lg text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">✕</span> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!nationalId || !nationalIdPassword || loading}
                  className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      در حال ورود...
                    </span>
                  ) : (
                    "ورود به حساب کاربری"
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-green-600 hover:text-green-700 font-semibold"
                  >
                    فراموشی رمز عبور
                  </Link>
                </div>
              </form>
            )}

            {/* Email Login */}
            {loginMethod === "email" && (
              <form onSubmit={handleEmailLogin} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    ورود با ایمیل
                  </h3>
                  <p className="text-gray-600 text-sm">برای مدیران و معلمان</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ایمیل
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@school.edu.ir"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 text-lg text-gray-900"
                      dir="ltr"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      ✉️
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رمز عبور
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="رمز عبور خود را وارد کنید"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 text-lg text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">✕</span> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!email || !password || loading}
                  className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      در حال ورود...
                    </span>
                  ) : (
                    "ورود به حساب کاربری"
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-orange-600 hover:text-orange-700 font-semibold"
                  >
                    فراموشی رمز عبور
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Security Footer */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>امن و مطمئن</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">🔒</span>
                <span>رمزنگاری SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">⚡</span>
                <span>سریع و آسان</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SigninPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SigninPageContent />
    </Suspense>
  );
}
