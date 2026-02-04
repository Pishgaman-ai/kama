"use client";

import { useTheme } from "@/app/components/ThemeContext";
import { useRouter } from "next/navigation";
import { X, User, Phone, Mail, Edit } from "lucide-react";

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

export default function ViewStudentModal({
  isOpen,
  onClose,
  student,
  onEditStudent,
}: {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEditStudent: (student: Student) => void;
}) {
  const { theme } = useTheme();
  const router = useRouter();

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
              className={`w-16 h-16 rounded-full overflow-hidden border-2 ${
                theme === "dark" ? "border-slate-600" : "border-gray-300"
              }`}
            >
              {student.profile_picture_url ? (
                <img
                  src={student.profile_picture_url}
                  alt={`عکس پروفایل ${student.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center ${
                    theme === "dark" ? "bg-slate-700" : "bg-gray-100"
                  }`}
                >
                  <User
                    className={`w-8 h-8 ${
                      theme === "dark" ? "text-slate-300" : "text-gray-600"
                    }`}
                  />
                </div>
              )}
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

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              اطلاعات دانش‌آموز
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  نام و نام خانوادگی
                </label>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {student.name}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  کد ملی
                </label>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {student.national_id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  ایمیل
                </label>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {student.email || "-"}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  پایه تحصیلی
                </label>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {student.grade_level || "-"}
                </p>
              </div>
            </div>
          </div>

          {student.parents.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                اطلاعات والدین
              </h3>
              {student.parents.map((parent) => (
                <div
                  key={parent.id}
                  className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        نام و نام خانوادگی
                      </label>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {parent.name}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        شماره همراه
                      </label>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {parent.phone}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        ایمیل
                      </label>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {parent.email || "-"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        رابطه با دانش‌آموز
                      </label>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {parent.relationship}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
