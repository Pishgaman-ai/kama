"use client";

import { useTheme } from "@/app/components/ThemeContext";
import { X, User, Phone, Mail } from "lucide-react";

interface Parent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

interface StudentClass {
  id: string;
  name: string;
  grade_level: string;
  section: string;
}

interface Student {
  id: string;
  name: string;
  national_id: string;
  email?: string;
  phone?: string;
  grade_level?: string;
  classes: StudentClass[];
  created_at: string;
  parents: Parent[];
  profile_picture_url?: string;
}

export default function ViewStudentDetailsModal({
  isOpen,
  onClose,
  student,
  onEditParent,
}: {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEditParent: (parent: Parent) => void;
}) {
  const { theme } = useTheme();

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 m-4">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              مشاهده اطلاعات دانش‌آموز
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="بستن"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                theme === "dark" ? "bg-slate-700" : "bg-gray-100"
              }`}
            >
              <User
                className={`w-8 h-8 ${
                  theme === "dark" ? "text-slate-300" : "text-gray-600"
                }`}
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {student.name}
              </h3>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                کد ملی: {student.national_id}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                ایمیل
              </label>
              <p
                className={`${
                  theme === "dark" ? "text-slate-300" : "text-gray-700"
                }`}
              >
                {student.email || "-"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                پایه تحصیلی
              </label>
              <p
                className={`${
                  theme === "dark" ? "text-slate-300" : "text-gray-700"
                }`}
              >
                {student.grade_level || "-"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                کلاس‌ها
              </label>
              <p
                className={`${
                  theme === "dark" ? "text-slate-300" : "text-gray-700"
                }`}
              >
                {student.classes && student.classes.length > 0
                  ? student.classes.map((cls) => cls.name).join(", ")
                  : "-"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                تاریخ ثبت‌نام
              </label>
              <p
                className={`${
                  theme === "dark" ? "text-slate-300" : "text-gray-700"
                }`}
              >
                {new Date(student.created_at).toLocaleDateString("fa-IR")}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              اطلاعات والدین
            </h4>
            {student.parents && student.parents.length > 0 ? (
              <div className="space-y-4">
                {student.parents.map((parent) => (
                  <div
                    key={parent.id}
                    className={`p-4 rounded-lg border ${
                      theme === "dark"
                        ? "border-slate-700 bg-slate-800/50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            theme === "dark" ? "bg-slate-700" : "bg-gray-100"
                          }`}
                        >
                          <User
                            className={`w-5 h-5 ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p
                            className={`font-medium ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {parent.name}
                          </p>
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-slate-400"
                                : "text-gray-600"
                            }`}
                          >
                            {parent.relationship === "father"
                              ? "پدر"
                              : parent.relationship === "mother"
                              ? "مادر"
                              : "سرپرست"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditParent(parent);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-slate-700 text-slate-400"
                              : "hover:bg-gray-100 text-gray-500"
                          }`}
                          title="ویرایش"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Phone
                        className={`w-4 h-4 ${
                          theme === "dark" ? "text-slate-400" : "text-gray-500"
                        }`}
                      />
                      <span
                        className={
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }
                      >
                        {parent.phone}
                      </span>
                    </div>
                    {parent.email && (
                      <div className="flex items-center gap-2 mt-2">
                        <Mail
                          className={`w-4 h-4 ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-500"
                          }`}
                        />
                        <span
                          className={
                            theme === "dark"
                              ? "text-slate-300"
                              : "text-gray-700"
                          }
                        >
                          {parent.email}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                هیچ والدی ثبت نشده است
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
