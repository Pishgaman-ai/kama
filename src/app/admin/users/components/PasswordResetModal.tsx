"use client";
import React, { useState } from "react";
import { X, Key, Save } from "lucide-react";
import { useTheme } from "@/app/components/ThemeContext";

interface PasswordResetModalProps {
  user: { id: string; name: string };
  onClose: () => void;
  onReset: (userId: string, newPassword: string) => void;
}

export default function PasswordResetModal({
  user,
  onClose,
  onReset,
}: PasswordResetModalProps) {
  const { theme } = useTheme();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate passwords
      if (!newPassword || newPassword.length < 6) {
        setError("رمز عبور باید حداقل ۶ کاراکتر باشد");
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("رمزهای عبور با هم مطابقت ندارند");
        setLoading(false);
        return;
      }

      // Call the onReset callback
      onReset(user.id, newPassword);
      setSuccess("رمز عبور با موفقیت تغییر کرد");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("خطا در تغییر رمز عبور");
      console.error("Error resetting password:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${
          theme === "dark"
            ? "bg-slate-900/95 border-slate-800"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
            theme === "dark"
              ? "bg-slate-900/90 border-slate-800"
              : "bg-white border-gray-200"
          }`}
        >
          <h2
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            تغییر رمز عبور
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800 text-slate-400"
                : "hover:bg-gray-100 text-gray-500"
            }`}
            aria-label="بستن"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {error && (
              <div
                className={`rounded-xl p-4 border ${
                  theme === "dark"
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-red-50 border-red-200 text-red-600"
                }`}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className={`rounded-xl p-4 border ${
                  theme === "dark"
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : "bg-green-50 border-green-200 text-green-600"
                }`}
              >
                {success}
              </div>
            )}

            <div className="text-center">
              <p
                className={`mb-4 ${
                  theme === "dark" ? "text-slate-300" : "text-gray-700"
                }`}
              >
                تغییر رمز عبور برای کاربر: <strong>{user.name}</strong>
              </p>
            </div>

            <div className="space-y-4">
              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  رمز عبور جدید
                </label>
                <div className="relative">
                  <Key
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-400"
                    }`}
                  />
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full pr-10 pl-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="رمز عبور جدید"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  تکرار رمز عبور
                </label>
                <div className="relative">
                  <Key
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-400"
                    }`}
                  />
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pr-10 pl-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="تکرار رمز عبور"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className={`sticky bottom-0 z-10 flex items-center justify-end gap-3 p-6 border-t ${
              theme === "dark"
                ? "bg-slate-900/90 border-slate-800"
                : "bg-white border-gray-200"
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                theme === "dark"
                  ? "bg-slate-800 hover:bg-slate-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                loading
                  ? "opacity-70 cursor-not-allowed"
                  : theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <Save className="w-5 h-5" />
              <span>تغییر رمز عبور</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
