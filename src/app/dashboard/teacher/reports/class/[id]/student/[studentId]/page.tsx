"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import {
  ArrowRight,
  User,
  Calendar,
  Edit3,
  Bot,
  Plus,
  Filter,
  Search,
  ChevronDown,
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
} from "lucide-react";
import GradeCharts from "@/app/components/GradeCharts";

interface Student {
  id: string;
  name: string;
  email: string;
  national_id: string;
  is_active: boolean;
  joined_at: string;
}

interface ClassData {
  id: string;
  name: string;
  grade_level: string;
  section?: string;
  academic_year: string;
}

interface TeacherReport {
  id: string;
  teacher_id: string;
  student_id: string;
  class_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface AIReport {
  id: string;
  student_id: string;
  class_id: string;
  content: string;
  created_at: string;
  analysis_points: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    progress: string;
  };
}

interface Grade {
  exam_id: string;
  exam_title: string;
  total_points: number;
  total_score: number;
  percentage: number;
  grade_letter: string;
  computed_at: string;
  class_name: string;
  subject_name: string;
  grade_level: string;
}

interface SubjectAverage {
  subject_name: string;
  average_percentage: number;
  exam_count: number;
}

interface PerformanceTrend {
  computed_at: string;
  percentage: number;
  exam_title: string;
}

interface StudentGradesData {
  grades: Grade[];
  subjectAverages: SubjectAverage[];
  performanceTrend: PerformanceTrend[];
}

export default function StudentReportPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const [student, setStudent] = useState<Student | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [teacherReports, setTeacherReports] = useState<TeacherReport[]>([]);
  const [aiReports, setAIReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"teacher" | "ai">("teacher");
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [newReportContent, setNewReportContent] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const { theme } = useTheme();
  const router = useRouter();
  const [classId, setClassId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [studentGrades, setStudentGrades] = useState<StudentGradesData | null>(
    null
  );
  const [gradesLoading, setGradesLoading] = useState(false);

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
      fetchStudentData();
      fetchReports();
    }
  }, [classId, studentId]);

  const fetchStudentData = async () => {
    try {
      // Fetch student details
      const studentResponse = await fetch(`/api/teacher/students/${studentId}`);
      if (studentResponse.ok) {
        const studentResult = await studentResponse.json();
        if (studentResult.success) {
          setStudent(studentResult.data.student);
        }
      }

      // Fetch class details
      const classResponse = await fetch(`/api/teacher/classes/${classId}`);
      if (classResponse.ok) {
        const classResult = await classResponse.json();
        if (classResult.success) {
          setClassData(classResult.data.class);
        }
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  };

  const fetchReports = async () => {
    try {
      // Fetch teacher reports
      const teacherReportsResponse = await fetch(
        `/api/teacher/reports/student/${studentId}/class/${classId}/teacher`
      );
      if (teacherReportsResponse.ok) {
        const teacherResult = await teacherReportsResponse.json();
        if (teacherResult.success) {
          setTeacherReports(teacherResult.data.reports);
        }
      }

      // Fetch AI reports
      const aiReportsResponse = await fetch(
        `/api/teacher/reports/student/${studentId}/class/${classId}/ai`
      );
      if (aiReportsResponse.ok) {
        const aiResult = await aiReportsResponse.json();
        if (aiResult.success) {
          setAIReports(aiResult.data.reports);
        }
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("خطا در بارگیری گزارش‌ها");
    } finally {
      setLoading(false);
    }
  };

  const handleAddReport = async () => {
    if (!newReportContent.trim()) {
      setReportError("لطفاً متن گزارش را وارد کنید");
      return;
    }

    setReportLoading(true);
    setReportError(null);

    try {
      const response = await fetch("/api/teacher/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: studentId,
          class_id: classId,
          content: newReportContent,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Refresh reports
        await fetchReports();
        // Reset form and close modal
        setNewReportContent("");
        setShowAddReportModal(false);
      } else {
        setReportError(result.message || "خطا در ثبت گزارش");
      }
    } catch (error) {
      console.error("Error adding report:", error);
      setReportError("خطا در ارتباط با سرور");
    } finally {
      setReportLoading(false);
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
            خطا در بارگیری گزارش‌ها
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
              گزارش دانش‌آموز
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

        <div className="flex gap-2">
          <button
            onClick={() =>
              router.push(
                `/dashboard/teacher/reports/class/${classId}/student/${studentId}/behavioral`
              )
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                : "bg-amber-50 text-amber-600 hover:bg-amber-100"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">رفتاری</span>
          </button>

          <button
            onClick={() => setShowAddReportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            افزودن گزارش
          </button>
        </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
                  <Calendar
                    className={`w-4 h-4 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    پایه: {classData?.grade_level}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs ${
                      student.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                    }`}
                  >
                    {student.is_active ? "فعال" : "غیرفعال"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        className={`flex border-b mb-6 ${
          theme === "dark" ? "border-slate-800" : "border-gray-200"
        }`}
      >
        <button
          onClick={() => setActiveTab("teacher")}
          className={`px-4 py-3 font-medium text-sm relative ${
            activeTab === "teacher"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
          }`}
        >
          گزارش‌های معلم
          {activeTab === "teacher" && (
            <div
              className={`absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400`}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`px-4 py-3 font-medium text-sm relative ${
            activeTab === "ai"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
          }`}
        >
          گزارش‌های هوش مصنوعی
          {activeTab === "ai" && (
            <div
              className={`absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400`}
            />
          )}
        </button>
      </div>

      {/* Reports Content */}
      {activeTab === "teacher" ? (
        <div>
          {teacherReports.length === 0 ? (
            <div
              className={`text-center py-16 rounded-2xl border-2 border-dashed ${
                theme === "dark" ? "border-slate-700" : "border-gray-300"
              }`}
            >
              <Edit3
                className={`w-16 h-16 mx-auto mb-4 ${
                  theme === "dark" ? "text-slate-600" : "text-gray-400"
                }`}
              />
              <h3
                className={`text-xl font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                هنوز گزارشی ثبت نشده
              </h3>
              <p
                className={`text-sm mb-6 ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                اولین گزارش خود را درباره این دانش‌آموز ثبت کنید
              </p>
              <button
                onClick={() => setShowAddReportModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                افزودن اولین گزارش
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {teacherReports.map((report) => (
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
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          theme === "dark"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3
                          className={`font-medium ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}
                        >
                          گزارش معلم
                        </h3>
                        <p
                          className={`text-xs ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-500"
                          }`}
                        >
                          {new Date(report.created_at).toLocaleDateString(
                            "fa-IR"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p
                    className={`text-sm whitespace-pre-line ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    {report.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "ai" ? (
        <div>
          {aiReports.length === 0 ? (
            <div
              className={`text-center py-16 rounded-2xl border-2 border-dashed ${
                theme === "dark" ? "border-slate-700" : "border-gray-300"
              }`}
            >
              <Bot
                className={`w-16 h-16 mx-auto mb-4 ${
                  theme === "dark" ? "text-slate-600" : "text-gray-400"
                }`}
              />
              <h3
                className={`text-xl font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                هنوز گزارش هوش مصنوعی‌ای تولید نشده
              </h3>
              <p
                className={`text-sm mb-6 ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                گزارش‌های تحلیلی توسط هوش مصنوعی در این بخش نمایش داده خواهند شد
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {aiReports.map((report) => (
                <div
                  key={report.id}
                  className={`rounded-xl border p-4 ${
                    theme === "dark"
                      ? "bg-slate-900/50 border-slate-800/50"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          theme === "dark"
                            ? "bg-violet-500/10 text-violet-400"
                            : "bg-violet-50 text-violet-600"
                        }`}
                      >
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h3
                          className={`font-medium ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}
                        >
                          گزارش هوش مصنوعی
                        </h3>
                        <p
                          className={`text-xs ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-500"
                          }`}
                        >
                          {new Date(report.created_at).toLocaleDateString(
                            "fa-IR"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4
                        className={`font-medium mb-2 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        نقاط قوت
                      </h4>
                      <ul
                        className={`space-y-1 ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        {report.analysis_points.strengths.map(
                          (strength, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span
                                className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  theme === "dark"
                                    ? "bg-green-400"
                                    : "bg-green-500"
                                }`}
                              />
                              {strength}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4
                        className={`font-medium mb-2 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        نقاط ضعف
                      </h4>
                      <ul
                        className={`space-y-1 ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        {report.analysis_points.weaknesses.map(
                          (weakness, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span
                                className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  theme === "dark" ? "bg-red-400" : "bg-red-500"
                                }`}
                              />
                              {weakness}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4
                        className={`font-medium mb-2 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        پیشنهادات
                      </h4>
                      <ul
                        className={`space-y-1 ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        {report.analysis_points.recommendations.map(
                          (recommendation, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span
                                className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  theme === "dark"
                                    ? "bg-blue-400"
                                    : "bg-blue-500"
                                }`}
                              />
                              {recommendation}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4
                        className={`font-medium mb-2 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        پیشرفت
                      </h4>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        {report.analysis_points.progress}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="text-center py-16">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-slate-600" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              بخش نمرات حذف شده است
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              این بخش به درخواست مدرسه حذف شده است
            </p>
          </div>
        </div>
      )}

      {/* Add Report Modal */}
      {showAddReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddReportModal(false)}
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
                افزودن گزارش جدید
              </h2>
              <button
                onClick={() => {
                  setShowAddReportModal(false);
                  setNewReportContent("");
                  setReportError(null);
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

            {reportError && (
              <div
                className={`p-3 rounded-lg mb-4 ${
                  theme === "dark"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {reportError}
              </div>
            )}

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
                placeholder="توضیحات خود را درباره عملکرد دانش‌آموز بنویسید..."
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
                  setShowAddReportModal(false);
                  setNewReportContent("");
                  setReportError(null);
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
                disabled={reportLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {reportLoading ? "در حال ثبت..." : "ثبت گزارش"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
