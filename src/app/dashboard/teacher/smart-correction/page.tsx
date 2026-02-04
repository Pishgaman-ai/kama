"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import SmartCorrectionChat from "@/app/components/SmartCorrectionChat";
import { FileCheck, Sparkles } from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  created_at: Date;
}

export default function SmartCorrectionPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisHistory, setAnalysisHistory] = useState<
    Array<{ timestamp: Date; analysis: string }>
  >([]);

  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.push("/signin");
          return;
        }
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleAnalysisComplete = (analysis: string) => {
    setAnalysisHistory((prev) => [
      { timestamp: new Date(), analysis },
      ...prev,
    ]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            در حال بارگذاری...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2
            className={`text-2xl font-bold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            تصحیح هوشمند
          </h2>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            تصحیح خودکار ورق‌های آزمون با کمک هوش مصنوعی
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
            theme === "dark"
              ? "bg-purple-500/20 text-purple-400"
              : "bg-purple-100 text-purple-600"
          }`}
        >
          <FileCheck className="w-5 h-5" />
          <span className="font-medium">هوش مصنوعی</span>
        </div>
      </div>

      {/* AI Chat Panel */}
      <div className="mb-6">
        <SmartCorrectionChat onAnalysisComplete={handleAnalysisComplete} />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className={`p-4 rounded-xl ${
            theme === "dark" ? "bg-slate-800/50" : "bg-white"
          } shadow`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <h3
              className={`font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              تحلیل هوشمند
            </h3>
          </div>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            تحلیل دقیق و جامع پاسخ‌های دانش‌آموزان با هوش مصنوعی
          </p>
        </div>

        <div
          className={`p-4 rounded-xl ${
            theme === "dark" ? "bg-slate-800/50" : "bg-white"
          } shadow`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-green-100 text-green-600"
              }`}
            >
              <FileCheck className="w-4 h-4" />
            </div>
            <h3
              className={`font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              تصحیح سریع
            </h3>
          </div>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            صرفه‌جویی در زمان با تصحیح خودکار و ارائه بازخورد سازنده
          </p>
        </div>

        <div
          className={`p-4 rounded-xl ${
            theme === "dark" ? "bg-slate-800/50" : "bg-white"
          } shadow`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-purple-100 text-purple-600"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3
              className={`font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              گزارش جامع
            </h3>
          </div>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            نقاط قوت، ضعف و پیشنهادات آموزشی برای هر دانش‌آموز
          </p>
        </div>
      </div>

      {/* Analysis History */}
      {analysisHistory.length > 0 && (
        <div
          className={`rounded-2xl p-6 ${
            theme === "dark" ? "bg-slate-800/50" : "bg-white"
          } shadow-lg`}
        >
          <h3
            className={`text-lg font-bold mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            تاریخچه تحلیل‌ها
          </h3>
          <div className="space-y-4">
            {analysisHistory.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  theme === "dark"
                    ? "bg-slate-700/30 border-slate-600"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <p
                  className={`text-xs mb-2 ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  {item.timestamp.toLocaleString("fa-IR")}
                </p>
                <p
                  className={`text-sm whitespace-pre-wrap ${
                    theme === "dark" ? "text-slate-200" : "text-gray-800"
                  }`}
                >
                  {item.analysis}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div
        className={`mt-6 p-4 rounded-xl ${
          theme === "dark"
            ? "bg-blue-500/10 border border-blue-500/30"
            : "bg-blue-50 border border-blue-200"
        }`}
      >
        <h4
          className={`font-bold mb-2 ${
            theme === "dark" ? "text-blue-400" : "text-blue-600"
          }`}
        >
          راهنمای استفاده:
        </h4>
        <ul
          className={`text-sm space-y-1 ${
            theme === "dark" ? "text-blue-300" : "text-blue-700"
          }`}
        >
          <li>• تصویر ورق پاسخ دانش‌آموز را بارگذاری کنید</li>
          <li>• در صورت نیاز، توضیحات اضافی (سوالات، معیار نمره‌دهی) را وارد کنید</li>
          <li>• می‌توانید به جای تایپ، از ضبط صوت استفاده کنید</li>
          <li>• روی دکمه &quot;تحلیل&quot; کلیک کنید و منتظر نتایج بمانید</li>
        </ul>
      </div>
    </div>
  );
}
