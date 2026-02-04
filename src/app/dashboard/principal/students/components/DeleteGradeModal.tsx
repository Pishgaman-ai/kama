"use client";

import { useState } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { AlertTriangle, X } from "lucide-react";

interface DeleteGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradeLevel: string;
  studentCount: number;
  parentCount: number;
  onConfirm: (gradeLevel: string) => void;
}

export default function DeleteGradeModal({
  isOpen,
  onClose,
  gradeLevel,
  studentCount,
  parentCount,
  onConfirm,
}: DeleteGradeModalProps) {
  const { theme } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (confirmationText !== `حذف پایه ${gradeLevel}`) return;

    setIsDeleting(true);
    try {
      await onConfirm(gradeLevel);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-2xl max-w-md w-full ${
          theme === "dark" ? "bg-slate-900" : "bg-white"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-lg font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              تأیید حذف پایه تحصیلی
            </h3>
            <button
              onClick={onClose}
              aria-label="بستن"
              className={`p-1 rounded-lg ${
                theme === "dark"
                  ? "hover:bg-slate-800 text-slate-400"
                  : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className={`p-4 rounded-lg mb-4 ${
              theme === "dark" ? "bg-red-500/10" : "bg-red-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  theme === "dark" ? "text-red-400" : "text-red-500"
                }`}
              />
              <div>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-red-400" : "text-red-700"
                  }`}
                >
                  این عملیات غیرقابل بازگشت است و تمام اطلاعات مربوط به این پایه
                  حذف خواهد شد:
                </p>
                <ul
                  className={`mt-2 text-sm space-y-1 ${
                    theme === "dark" ? "text-red-400" : "text-red-700"
                  }`}
                >
                  <li>• {studentCount} دانش‌آموز</li>
                  <li>• اطلاعات والدین ({parentCount} نفر)</li>
                  <li>• نمرات و آزمون‌ها</li>
                  <li>• حضور و غیاب</li>
                  <li>• گزارش‌های معلم</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label
              className={`block text-sm font-medium mb-2 ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              برای تأیید، عبارت زیر را تایپ کنید:
            </label>
            <p
              className={`text-sm p-3 rounded-lg mb-2 ${
                theme === "dark"
                  ? "bg-slate-800 text-slate-300"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              حذف پایه {gradeLevel}
            </p>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              dir="rtl"
              className={`w-full rounded-lg border px-3 py-2 text-sm ${
                theme === "dark"
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
              placeholder={`حذف پایه ${gradeLevel}`}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              aria-label="انصراف"
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm ${
                theme === "dark"
                  ? "bg-slate-800 text-white hover:bg-slate-700"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              انصراف
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                isDeleting || confirmationText !== `حذف پایه ${gradeLevel}`
              }
              aria-label="تأیید حذف پایه"
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 ${
                confirmationText === `حذف پایه ${gradeLevel}`
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : theme === "dark"
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  در حال حذف...
                </>
              ) : (
                "حذف پایه"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
