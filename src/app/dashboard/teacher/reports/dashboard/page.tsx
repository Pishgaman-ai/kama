"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import Link from "next/link";
import {
  BookOpen,
  Users,
  BarChart3,
  FileText,
  TrendingUp,
  Calendar,
  Search,
  ArrowRight,
  Edit3,
} from "lucide-react";

interface ClassSummary {
  id: string;
  name: string;
  grade_level: string;
  student_count: number;
  exam_count: number;
  average_grade: number;
}

interface RecentReport {
  id: string;
  student_name: string;
  class_name: string;
  content: string;
  created_at: string;
}

interface RecentGrade {
  student_name: string;
  exam_title: string;
  class_name: string;
  percentage: number;
  grade_letter: string;
  computed_at: string;
}

interface DashboardData {
  classes: ClassSummary[];
  recentReports: RecentReport[];
  recentGrades: RecentGrade[];
}

export default function ReportsDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/teacher/reports/dashboard");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDashboardData(result.data);
          setError(null);
        } else {
          setError("خطا در بارگیری داده‌های داشبورد");
        }
      } else {
        setError("خطا در بارگیری داده‌های داشبورد");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
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
            خطا در بارگیری داشبورد
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

  if (!dashboardData) {
    return null;
  }

  // Helper function to get grade color
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-500";
    if (percentage >= 80) return "text-blue-500";
    if (percentage >= 70) return "text-yellow-500";
    if (percentage >= 60) return "text-orange-500";
    return "text-red-500";
  };

  // Helper function to get letter grade color
  const getLetterGradeColor = (letter: string) => {
    switch (letter) {
      case "A":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
      case "B":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
      case "C":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200";
      case "D":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200";
      case "F":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            داشبورد گزارشات
          </h1>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            نمای کلی از گزارشات و نمرات دانش‌آموزان
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === "dark" ? "text-slate-400" : "text-gray-400"
            }`}
          />
          <input
            type="text"
            placeholder="جستجو در کلاس‌ها، دانش‌آموزان یا آزمون‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-4 pr-11 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
              theme === "dark"
                ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
            }`}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          className={`rounded-2xl border p-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                theme === "dark"
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                کل دانش‌آموزان
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {dashboardData.classes.reduce(
                  (sum, cls) => sum + cls.student_count,
                  0
                )}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                theme === "dark"
                  ? "bg-violet-500/10 text-violet-400"
                  : "bg-violet-50 text-violet-600"
              }`}
            >
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                کل کلاس‌ها
              </p>
              <p className="text-2xl font-bold text-violet-600">
                {dashboardData.classes.length}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                theme === "dark"
                  ? "bg-green-500/10 text-green-400"
                  : "bg-green-50 text-green-600"
              }`}
            >
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                کل آزمون‌ها
              </p>
              <p className="text-2xl font-bold text-green-600">
                {dashboardData.classes.reduce(
                  (sum, cls) => sum + cls.exam_count,
                  0
                )}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                theme === "dark"
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                میانگین کل
              </p>
              <p className="text-2xl font-bold text-amber-600">
                {dashboardData.classes.length > 0
                  ? (
                      dashboardData.classes.reduce(
                        (sum, cls) => sum + cls.average_grade,
                        0
                      ) / dashboardData.classes.length
                    ).toFixed(1)
                  : "0.0"}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Class Summaries */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-lg font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            کلاس‌های من
          </h2>
          <Link
            href="/dashboard/teacher/reports"
            className={`text-sm ${
              theme === "dark" ? "text-blue-400" : "text-blue-600"
            } hover:underline`}
          >
            مشاهده همه
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardData.classes.map((classSummary) => (
            <Link
              key={classSummary.id}
              href={`/dashboard/teacher/reports/class/${classSummary.id}`}
              className={`group rounded-2xl border p-6 transition-all hover:shadow-xl hover:scale-[1.02] ${
                theme === "dark"
                  ? "bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3
                    className={`font-bold mb-1 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {classSummary.name}
                  </h3>
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    پایه {classSummary.grade_level}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    دانش‌آموزان
                  </span>
                  <span
                    className={`font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {classSummary.student_count}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    آزمون‌ها
                  </span>
                  <span
                    className={`font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {classSummary.exam_count}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    میانگین نمره
                  </span>
                  <span
                    className={`font-medium ${getGradeColor(
                      classSummary.average_grade
                    )}`}
                  >
                    {classSummary.average_grade.toFixed(1)}%
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reports */}
        <div
          className={`rounded-2xl border ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Edit3
                className={`w-5 h-5 ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              />
              <h2
                className={`font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                گزارشات اخیر
              </h2>
            </div>
          </div>
          <div className="p-4">
            {dashboardData.recentReports.length === 0 ? (
              <div
                className={`text-center py-8 rounded-xl ${
                  theme === "dark" ? "bg-slate-800/50" : "bg-gray-50"
                }`}
              >
                <Edit3
                  className={`w-12 h-12 mx-auto mb-3 ${
                    theme === "dark" ? "text-slate-600" : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  هنوز گزارشی ثبت نشده
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.recentReports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 rounded-xl ${
                      theme === "dark"
                        ? "bg-slate-800/50 hover:bg-slate-800"
                        : "bg-gray-50 hover:bg-gray-100"
                    } transition-colors`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3
                        className={`font-medium ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {report.student_name}
                      </h3>
                      <span
                        className={`text-xs ${
                          theme === "dark" ? "text-slate-400" : "text-gray-500"
                        }`}
                      >
                        {new Date(report.created_at).toLocaleDateString(
                          "fa-IR"
                        )}
                      </span>
                    </div>
                    <p
                      className={`text-sm mb-2 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      {report.content.length > 100
                        ? `${report.content.substring(0, 100)}...`
                        : report.content}
                    </p>
                    <p
                      className={`text-xs ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      {report.class_name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Grades */}
        <div
          className={`rounded-2xl border ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3
                className={`w-5 h-5 ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              />
              <h2
                className={`font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                نمرات اخیر
              </h2>
            </div>
          </div>
          <div className="p-4">
            {dashboardData.recentGrades.length === 0 ? (
              <div
                className={`text-center py-8 rounded-xl ${
                  theme === "dark" ? "bg-slate-800/50" : "bg-gray-50"
                }`}
              >
                <BarChart3
                  className={`w-12 h-12 mx-auto mb-3 ${
                    theme === "dark" ? "text-slate-600" : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  هنوز نمره‌ای ثبت نشده
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.recentGrades.map((grade, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      theme === "dark"
                        ? "bg-slate-800/50 hover:bg-slate-800"
                        : "bg-gray-50 hover:bg-gray-100"
                    } transition-colors`}
                  >
                    <div>
                      <h3
                        className={`font-medium ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {grade.student_name}
                      </h3>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-slate-400" : "text-gray-500"
                        }`}
                      >
                        {grade.exam_title}
                      </p>
                      <p
                        className={`text-xs ${
                          theme === "dark" ? "text-slate-500" : "text-gray-400"
                        }`}
                      >
                        {grade.class_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getLetterGradeColor(
                          grade.grade_letter
                        )}`}
                      >
                        {grade.grade_letter}
                      </span>
                      <p
                        className={`text-sm font-medium mt-1 ${getGradeColor(
                          grade.percentage
                        )}`}
                      >
                        {grade.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
