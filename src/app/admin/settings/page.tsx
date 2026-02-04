"use client";
import React, { useState } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { Settings as SettingsIcon, X } from "lucide-react";

export default function SettingsPage() {
  const { theme } = useTheme();
  const [showPopup, setShowPopup] = useState(true);

  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1
          className={`text-2xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          تنظیمات
        </h1>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          />

          <div
            className={`relative rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl ${
              theme === "dark"
                ? "bg-slate-800 border border-slate-700"
                : "bg-white border border-gray-200"
            }`}
          >
            <button
              onClick={() => setShowPopup(false)}
              className={`absolute top-4 left-4 p-1 rounded-lg ${
                theme === "dark"
                  ? "text-slate-400 hover:bg-slate-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              aria-label="بستن"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mb-4">
                <SettingsIcon className="w-8 h-8 text-white" />
              </div>

              <h2
                className={`text-xl font-bold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                در دست طراحی
              </h2>

              <p
                className={`text-sm mb-6 ${
                  theme === "dark" ? "text-slate-400" : "text-gray-600"
                }`}
              >
                این بخش در حال توسعه است و به زودی در دسترس قرار خواهد گرفت.
              </p>

              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`rounded-2xl p-8 text-center ${
          theme === "dark"
            ? "bg-slate-800/50 border border-slate-700/50"
            : "bg-white border border-gray-200"
        }`}
      >
        <SettingsIcon
          className={`w-12 h-12 mx-auto mb-4 ${
            theme === "dark" ? "text-slate-500" : "text-gray-400"
          }`}
        />
        <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>
          برای نمایش پنجره تنظیمات روی آیتم &quot;تنظیمات&quot; در منو کلیک کنید
        </p>
      </div>
    </div>
  );
}
