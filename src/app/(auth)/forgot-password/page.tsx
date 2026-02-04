"use client";
import React, { useState } from "react";
import Link from "next/link";
import Alert from "@/app/components/Alert";
import { useTheme } from "@/app/components/ThemeContext";

export default function ForgotPasswordPage() {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Email validation
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError("لطفاً یک ایمیل معتبر وارد کنید");
    } else {
      setEmailError(null);
    }
  };

  const isFormValid = () => {
    return email && validateEmail(email) && !loading;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!validateEmail(email)) {
      setError("لطفاً یک ایمیل معتبر وارد کنید");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "خطایی رخ داده است. لطفاً دوباره تلاش کنید.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // For development: show the reset URL in console
      if (data.resetUrl) {
        console.log("Reset URL:", data.resetUrl);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setError("خطایی رخ داده است. لطفاً دوباره تلاش کنید.");
      setLoading(false);
    }
  };

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
            بازیابی رمز عبور
          </h1>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {success
              ? "ایمیل بازیابی ارسال شد"
              : "لینک بازیابی را برای شما ارسال می‌کنیم"}
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
                    ایمیل ارسال شد!
                  </h2>
                  <p
                    className={`text-sm leading-relaxed ${
                      theme === "dark" ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    لینک بازیابی رمز عبور به آدرس{" "}
                    <span className="font-semibold text-blue-500">{email}</span>{" "}
                    ارسال شد. لطفاً ایمیل خود را بررسی کنید.
                  </p>
                  <p
                    className={`text-xs ${
                      theme === "dark" ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    اگر ایمیلی دریافت نکردید، پوشه اسپم را بررسی کنید.
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setEmail("");
                    }}
                    className={`w-full py-3 rounded-xl font-medium transition-colors ${
                      theme === "dark"
                        ? "bg-slate-800 hover:bg-slate-700 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                    }`}
                  >
                    ارسال مجدد ایمیل
                  </button>

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
            ) : (
              // Form State
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Info Box */}
                <div
                  className={`p-4 rounded-xl flex gap-3 ${
                    theme === "dark"
                      ? "bg-blue-500/10 border border-blue-500/20"
                      : "bg-blue-50 border border-blue-100"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      theme === "dark" ? "text-blue-400" : "text-blue-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p
                    className={`text-sm leading-relaxed ${
                      theme === "dark" ? "text-blue-300" : "text-blue-700"
                    }`}
                  >
                    ایمیل خود را وارد کنید تا لینک بازیابی رمز عبور برای شما
                    ارسال شود.
                  </p>
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className={`block mb-2 text-sm font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    ایمیل <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg
                        className={`w-5 h-5 ${
                          emailError
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
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={handleEmailBlur}
                      className={`w-full pl-4 pr-11 py-3.5 rounded-xl border outline-none focus:ring-2 transition-all ${
                        emailError
                          ? "border-red-500 focus:ring-red-500"
                          : "focus:ring-blue-500 focus:border-transparent"
                      } ${
                        theme === "dark"
                          ? "border-slate-700 bg-slate-950/50 text-white placeholder:text-slate-400"
                          : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"
                      }`}
                      placeholder="you@example.com"
                      dir="ltr"
                      {...(emailError
                        ? {
                            "aria-invalid": "true",
                            "aria-describedby": "email-error",
                          }
                        : {})}
                    />
                    {email && validateEmail(email) && !emailError && (
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                  {emailError && (
                    <p
                      id="email-error"
                      className="text-xs mt-1.5 text-red-500 font-medium"
                    >
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert
                    variant="error"
                    title="خطا در ارسال ایمیل"
                    description={error}
                  />
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
                  aria-label="ارسال لینک بازیابی"
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
                      در حال ارسال...
                    </span>
                  ) : (
                    "ارسال لینک بازیابی"
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
