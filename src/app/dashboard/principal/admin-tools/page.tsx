"use client";

import { useState } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { Database, Key, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function AdminToolsPage() {
  const { theme } = useTheme();
  const [isRunningMigration, setIsRunningMigration] = useState(false);
  const [isUpdatingPasswords, setIsUpdatingPasswords] = useState(false);
  const [isRunningFKMigration, setIsRunningFKMigration] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);
  const [updateResult, setUpdateResult] = useState<any>(null);
  const [fkMigrationResult, setFkMigrationResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    setIsRunningMigration(true);
    setError(null);
    setMigrationResult(null);

    try {
      const response = await fetch("/api/admin/run-password-migration", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setMigrationResult(data.message);
      } else {
        setError(data.error || "خطا در اجرای migration");
      }
    } catch (error) {
      console.error("Error running migration:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsRunningMigration(false);
    }
  };

  const updateTeachersPasswords = async () => {
    setIsUpdatingPasswords(true);
    setError(null);
    setUpdateResult(null);

    try {
      const response = await fetch("/api/admin/update-teachers-passwords", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setUpdateResult(data);
      } else {
        setError(data.error || "خطا در به‌روزرسانی رمز عبورها");
      }
    } catch (error) {
      console.error("Error updating passwords:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsUpdatingPasswords(false);
    }
  };

  const runFKMigration = async () => {
    setIsRunningFKMigration(true);
    setError(null);
    setFkMigrationResult(null);

    try {
      const response = await fetch("/api/admin/run-fk-migration", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setFkMigrationResult(data.message);
      } else {
        setError(data.details || data.error || "خطا در اجرای migration");
      }
    } catch (error) {
      console.error("Error running FK migration:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsRunningFKMigration(false);
    }
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1
          className={`text-2xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          ابزارهای مدیریتی
        </h1>
        <p
          className={`mt-1 text-sm ${
            theme === "dark" ? "text-slate-400" : "text-gray-600"
          }`}
        >
          راه‌اندازی و پیکربندی سیستم
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className={`p-4 rounded-xl mb-6 ${
            theme === "dark"
              ? "bg-red-500/10 border border-red-500/20"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className={`w-5 h-5 mt-0.5 ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            />
            <p
              className={`text-sm ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            >
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Migration Section */}
      <div
        className={`rounded-xl border p-6 mb-6 ${
          theme === "dark"
            ? "bg-slate-900/50 border-slate-800/50"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-lg ${
              theme === "dark" ? "bg-blue-500/10" : "bg-blue-50"
            }`}
          >
            <Database
              className={`w-6 h-6 ${
                theme === "dark" ? "text-blue-400" : "text-blue-600"
              }`}
            />
          </div>
          <div className="flex-1">
            <h2
              className={`text-lg font-semibold mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              مرحله 1: اجرای Migration دیتابیس
            </h2>
            <p
              className={`text-sm mb-4 ${
                theme === "dark" ? "text-slate-400" : "text-gray-600"
              }`}
            >
              اضافه کردن ستون <code className="px-2 py-0.5 rounded bg-slate-800 text-blue-400">initial_password</code> به
              جدول users برای ذخیره رمز عبور اولیه معلمان
            </p>
            <button
              onClick={runMigration}
              disabled={isRunningMigration}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isRunningMigration
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:shadow-lg"
              }`}
            >
              {isRunningMigration ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال اجرا...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  اجرای Migration
                </>
              )}
            </button>

            {migrationResult && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  theme === "dark"
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-green-50 border border-green-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  <CheckCircle
                    className={`w-5 h-5 mt-0.5 ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}
                  />
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {migrationResult}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Passwords Section */}
      <div
        className={`rounded-xl border p-6 ${
          theme === "dark"
            ? "bg-slate-900/50 border-slate-800/50"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-lg ${
              theme === "dark" ? "bg-green-500/10" : "bg-green-50"
            }`}
          >
            <Key
              className={`w-6 h-6 ${
                theme === "dark" ? "text-green-400" : "text-green-600"
              }`}
            />
          </div>
          <div className="flex-1">
            <h2
              className={`text-lg font-semibold mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              مرحله 2: به‌روزرسانی رمز عبور معلمان موجود
            </h2>
            <p
              className={`text-sm mb-4 ${
                theme === "dark" ? "text-slate-400" : "text-gray-600"
              }`}
            >
              برای معلمانی که قبلاً ثبت شده‌اند، شماره همراهشان را به عنوان رمز
              عبور اولیه تعیین می‌کند
            </p>
            <button
              onClick={updateTeachersPasswords}
              disabled={isUpdatingPasswords}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isUpdatingPasswords
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg"
              }`}
            >
              {isUpdatingPasswords ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال به‌روزرسانی...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  به‌روزرسانی رمز عبورها
                </>
              )}
            </button>

            {updateResult && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  theme === "dark"
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-green-50 border border-green-200"
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle
                    className={`w-5 h-5 mt-0.5 ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {updateResult.message}
                  </p>
                </div>
                {updateResult.teachers && updateResult.teachers.length > 0 && (
                  <div className="mt-3 pr-7">
                    <p
                      className={`text-xs font-medium mb-2 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      معلمان به‌روزرسانی شده ({updateResult.updated} نفر):
                    </p>
                    <div className="space-y-1">
                      {updateResult.teachers.slice(0, 5).map((teacher: any, index: number) => (
                        <div
                          key={index}
                          className={`text-xs ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-600"
                          }`}
                        >
                          • {teacher.name} - رمز پیش‌فرض:{" "}
                          <code className="px-1 rounded bg-slate-800 text-green-400">
                            {teacher.defaultPassword}
                          </code>
                        </div>
                      ))}
                      {updateResult.teachers.length > 5 && (
                        <p
                          className={`text-xs ${
                            theme === "dark"
                              ? "text-slate-500"
                              : "text-gray-500"
                          }`}
                        >
                          و {updateResult.teachers.length - 5} معلم دیگر...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FK Migration Section */}
      <div
        className={`rounded-xl border p-6 mt-6 ${
          theme === "dark"
            ? "bg-slate-900/50 border-slate-800/50"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-lg ${
              theme === "dark" ? "bg-purple-500/10" : "bg-purple-50"
            }`}
          >
            <Database
              className={`w-6 h-6 ${
                theme === "dark" ? "text-purple-400" : "text-purple-600"
              }`}
            />
          </div>
          <div className="flex-1">
            <h2
              className={`text-lg font-semibold mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              مرحله 3: به‌روزرسانی Foreign Key
            </h2>
            <p
              className={`text-sm mb-4 ${
                theme === "dark" ? "text-slate-400" : "text-gray-600"
              }`}
            >
              تغییر foreign key جدول teacher_assignments از subjects به lessons
            </p>
            <button
              onClick={runFKMigration}
              disabled={isRunningFKMigration}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isRunningFKMigration
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg"
              }`}
            >
              {isRunningFKMigration ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال اجرا...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  اجرای FK Migration
                </>
              )}
            </button>

            {fkMigrationResult && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  theme === "dark"
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-green-50 border border-green-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  <CheckCircle
                    className={`w-5 h-5 mt-0.5 ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}
                  />
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {fkMigrationResult}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div
        className={`mt-6 p-4 rounded-lg border ${
          theme === "dark"
            ? "bg-blue-500/10 border-blue-500/20"
            : "bg-blue-50 border-blue-200"
        }`}
      >
        <p
          className={`text-sm ${
            theme === "dark" ? "text-blue-400" : "text-blue-700"
          }`}
        >
          <strong>نکته:</strong> این ابزارها فقط یکبار برای راه‌اندازی اولیه سیستم
          لازم هستند. بعد از اجرای موفق هر سه مرحله، می‌توانید از قابلیت "خروجی
          اکسل" در صفحه معلمان استفاده کنید.
        </p>
      </div>
    </div>
  );
}
