"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import { ChevronLeft } from "lucide-react";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen ${
        theme === "dark" ? "bg-slate-950" : "bg-gray-50"
      }`}
    >
      {/* Header with back button */}
      <header
        className={`sticky top-0 z-10 shadow-sm ${
          theme === "dark" ? "bg-slate-900" : "bg-white"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push("/dashboard/principal/reports")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800 text-slate-300"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>بازگشت به صفحه انتخاب گزارشات</span>
          </button>

          <h2
            className={`text-xl font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            گزارشات و تحلیل عملکرد
          </h2>

          <div className="flex items-center space-x-4">
            <button
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors`}
              onClick={() => {
                // Export functionality would go here
                alert("قابلیت خروجی گرفتن به زودی اضافه خواهد شد");
              }}
            >
              خروجی گرفتن
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">{children}</main>
    </div>
  );
};

export default DashboardLayout;
