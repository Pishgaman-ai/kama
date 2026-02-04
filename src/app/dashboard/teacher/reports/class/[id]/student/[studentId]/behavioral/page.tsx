"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import {
  ArrowRight,
  Plus,
  User,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
} from "lucide-react";

interface BehavioralReport {
  id: string;
  teacher_id: string;
  student_id: string;
  class_id: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
  class_name: string;
  teacher_name: string;
}

interface Student {
  name: string;
  national_id: string;
}

interface ClassData {
  id: string;
  name: string;
  grade_level: string;
}

export default function StudentBehavioralReportsPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const [behavioralReports, setBehavioralReports] = useState<
    BehavioralReport[]
  >([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReportContent, setNewReportContent] = useState("");
  const [newReportCategory, setNewReportCategory] = useState("positive");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { theme } = useTheme();
  const router = useRouter();
  const [classId, setClassId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setClassId(resolvedParams.id);
      setStudentId(resolvedParams.studentId);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (classId && studentId) {
      fetchBehavioralReports();
    }
  }, [classId, studentId]);

  const fetchBehavioralReports = async () => {
    try {
      const response = await fetch(
        `/api/teacher/reports/student/${studentId}/behavioral`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBehavioralReports(result.data.behavioralReports);
          setStudent(result.data.student);
          setError(null);
        } else {
          setError("خطا در بارگیری گزارشات رفتاری");
        }
      } else {
        setError("خطا در بارگیری گزارشات رفتاری");
      }
    } catch (error) {
      console.error("Error fetching behavioral reports:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleAddReport = async () => {
    if (!newReportContent.trim()) {
      setSaveError("لطفاً متن گزارش را وارد کنید");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(
        `/api/teacher/reports/student/${studentId}/behavioral`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            class_id: classId,
            content: newReportContent,
            category: newReportCategory,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        // Refresh reports
        await fetchBehavioralReports();
        // Reset form and close modal
        setNewReportContent("");
        setNewReportCategory("positive");
        setShowAddModal(false);
      } else {
        setSaveError(result.message || "خطا در ثبت گزارش رفتاری");
      }
    } catch (error) {
      console.error("Error adding behavioral report:", error);
      setSaveError("خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
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

  if (error) {
    return (
      <div className="p-3 sm:p-6" dir="rtl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            aria-label="بازگشت"
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            }`}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            خطا در بارگیری گزارشات رفتاری
          </h1>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            theme === "dark"
              ? "bg-red-500/10 border-red-500/20"
              : "bg-red-50 border-red-200"
          }`}
        >
          <p
            className={`text-sm ${
              theme === "dark" ? "text-red-400" : "text-red-600"
            }`}
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  // Helper function to get category icon and color
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case "positive":
        return {
          icon: ThumbsUp,
          color: "text-green-500",
          bgColor: "bg-green-100 dark:bg-green-900/30",
          label: "مثبت",
        };
      case "negative":
        return {
          icon: ThumbsDown,
          color: "text-red-500",
          bgColor: "bg-red-100 dark:bg-red-900/30",
          label: "منفی",
        };
      case "attention":
        return {
          icon: AlertTriangle,
          color: "text-yellow-500",
          bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
          label: "نیاز به توجه",
        };
      default:
        return {
          icon: AlertTriangle,
          color: "text-gray-500",
          bgColor: "bg-gray-100 dark:bg-gray-700",
          label: "نامشخص",
        };
    }
  };

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            aria-label="بازگشت"
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            }`}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1
              className={`text-xl sm:text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              گزارشات رفتاری دانش‌آموز
            </h1>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              {student?.name} - {classData?.name}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          افزودن گزارش
        </button>
      </div>

      {/* Student Info Card */}
      {student && (
        <div
          className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 mb-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center`}
            >
              <span className="text-white font-bold text-xl">
                {student.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h2
                className={`text-xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {student.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <User
                  className={`w-4 h-4 ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                />
                <span
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  کد ملی: {student.national_id}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Behavioral Reports */}
      {behavioralReports.length === 0 ? (
        <div
          className={`text-center py-16 rounded-2xl border-2 border-dashed ${
            theme === "dark" ? "border-slate-700" : "border-gray-300"
          }`}
        >
          <AlertTriangle
            className={`w-16 h-16 mx-auto mb-4 ${
              theme === "dark" ? "text-slate-600" : "text-gray-400"
            }`}
          />
          <h3
            className={`text-xl font-semibold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            هنوز گزارش رفتاری‌ای ثبت نشده
          </h3>
          <p
            className={`text-sm mb-6 ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            اولین گزارش رفتاری خود را درباره این دانش‌آموز ثبت کنید
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            افزودن اولین گزارش
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {behavioralReports.map((report) => {
            const categoryInfo = getCategoryInfo(report.category);
            const IconComponent = categoryInfo.icon;

            return (
              <div
                key={report.id}
                className={`rounded-xl border p-4 ${
                  theme === "dark"
                    ? "bg-slate-900/50 border-slate-800/50"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${categoryInfo.bgColor}`}
                    >
                      <IconComponent
                        className={`w-4 h-4 ${categoryInfo.color}`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`font-medium ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        گزارش {categoryInfo.label}
                      </h3>
                      <p
                        className={`text-xs ${
                          theme === "dark" ? "text-slate-400" : "text-gray-500"
                        }`}
                      >
                        {new Date(report.created_at).toLocaleDateString(
                          "fa-IR"
                        )}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs ${categoryInfo.bgColor} ${categoryInfo.color}`}
                  >
                    {categoryInfo.label}
                  </span>
                </div>
                <p
                  className={`text-sm whitespace-pre-line ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  {report.content}
                </p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <User
                      className={`w-4 h-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      {report.teacher_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar
                      className={`w-4 h-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      {report.class_name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Report Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div
            className={`relative w-full max-w-2xl rounded-2xl p-6 ${
              theme === "dark"
                ? "bg-slate-900 border border-slate-800"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                افزودن گزارش رفتاری جدید
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewReportContent("");
                  setSaveError(null);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
                aria-label="بستن"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {saveError && (
              <div
                className={`p-3 rounded-lg mb-4 ${
                  theme === "dark"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {saveError}
              </div>
            )}

            <div className="mb-6">
              <label
                className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-slate-300" : "text-gray-700"
                }`}
              >
                دسته‌بندی
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setNewReportCategory("positive")}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${
                    newReportCategory === "positive"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : theme === "dark"
                      ? "border-slate-700 hover:border-slate-600"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <ThumbsUp
                    className={`w-6 h-6 mb-2 ${
                      newReportCategory === "positive"
                        ? "text-green-500"
                        : theme === "dark"
                        ? "text-slate-400"
                        : "text-gray-500"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      newReportCategory === "positive"
                        ? "text-green-600 dark:text-green-400"
                        : theme === "dark"
                        ? "text-slate-300"
                        : "text-gray-700"
                    }`}
                  >
                    مثبت
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewReportCategory("negative")}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${
                    newReportCategory === "negative"
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : theme === "dark"
                      ? "border-slate-700 hover:border-slate-600"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <ThumbsDown
                    className={`w-6 h-6 mb-2 ${
                      newReportCategory === "negative"
                        ? "text-red-500"
                        : theme === "dark"
                        ? "text-slate-400"
                        : "text-gray-500"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      newReportCategory === "negative"
                        ? "text-red-600 dark:text-red-400"
                        : theme === "dark"
                        ? "text-slate-300"
                        : "text-gray-700"
                    }`}
                  >
                    منفی
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewReportCategory("attention")}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${
                    newReportCategory === "attention"
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                      : theme === "dark"
                      ? "border-slate-700 hover:border-slate-600"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <AlertTriangle
                    className={`w-6 h-6 mb-2 ${
                      newReportCategory === "attention"
                        ? "text-yellow-500"
                        : theme === "dark"
                        ? "text-slate-400"
                        : "text-gray-500"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      newReportCategory === "attention"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : theme === "dark"
                        ? "text-slate-300"
                        : "text-gray-700"
                    }`}
                  >
                    نیاز به توجه
                  </span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label
                className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-slate-300" : "text-gray-700"
                }`}
              >
                متن گزارش
              </label>
              <textarea
                value={newReportContent}
                onChange={(e) => setNewReportContent(e.target.value)}
                rows={6}
                placeholder="توضیحات خود را درباره رفتار دانش‌آموز بنویسید..."
                className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all resize-none ${
                  theme === "dark"
                    ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50"
                    : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20"
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewReportContent("");
                  setSaveError(null);
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                انصراف
              </button>
              <button
                onClick={handleAddReport}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "در حال ثبت..." : "ثبت گزارش"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
