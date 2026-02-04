"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/app/components/ThemeContext";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Define TypeScript interfaces for our data
interface StudentData {
  id: string;
  name: string;
  nationalId: string;
  className: string;
  gradeLevel: string;
  metrics: {
    overallAverage: string;
    totalExams: number;
    progressPercentage: string;
  };
}

const StudentsReport = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");

  // Get unique grades for filters
  const uniqueGrades = Array.from(
    new Set(studentsData.map((student) => student.gradeLevel))
  );

  // Filter students based on search and grade filter
  const filteredStudents = studentsData.filter((student) => {
    const matchesSearch =
      student.name.includes(searchTerm) ||
      student.nationalId.includes(searchTerm);
    const matchesGrade =
      gradeFilter === "all" || student.gradeLevel === gradeFilter;

    return matchesSearch && matchesGrade;
  });

  useEffect(() => {
    const fetchStudentsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create EventSource for streaming progress updates
        const eventSource = new EventSource("/api/principal/reports/students");

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.complete) {
            if (data.error) {
              setError(data.error);
              setLoading(false);
            } else {
              setStudentsData(data.data);
              setLoading(false);
            }
            eventSource.close();
          }
        };

        eventSource.onerror = (err) => {
          console.error("EventSource failed:", err);
          setError("خطا در ارتباط با سرور");
          setLoading(false);
          eventSource.close();
        };

        // Cleanup function
        return () => {
          eventSource.close();
        };
      } catch (err) {
        setError("خطا در ارتباط با سرور");
        setLoading(false);
        console.error(err);
      }
    };

    fetchStudentsData();
  }, []);

  if (loading) {
    return (
      <div className="p-3 sm:p-6" dir="rtl">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
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
        </div>

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
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-6" dir="rtl">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
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
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (studentsData.length === 0) {
    return (
      <div className="p-3 sm:p-6" dir="rtl">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
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
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-700">داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </div>
    );
  }

  // Group students by grade level (not by class)
  const groupedStudents: Record<string, StudentData[]> = {};

  filteredStudents.forEach((student) => {
    if (!groupedStudents[student.gradeLevel]) {
      groupedStudents[student.gradeLevel] = [];
    }
    groupedStudents[student.gradeLevel].push(student);
  });

  // Sort grades numerically if possible, otherwise alphabetically
  const sortedGrades = Object.keys(groupedStudents).sort((a, b) => {
    const aNum = parseInt(a.replace(/[^\d]/g, ""));
    const bNum = parseInt(b.replace(/[^\d]/g, ""));

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }

    return a.localeCompare(b, "fa");
  });

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
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

        <div>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            گزارش دانش‌آموزان
          </h1>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            لیست گزارشات دانش‌آموزان مدرسه
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div
        className={`rounded-xl border mb-6 ${
          theme === "dark"
            ? "bg-slate-900/50 border-slate-800/50"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="student-search"
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-slate-300" : "text-gray-700"
                }`}
              >
                جستجو
              </label>
              <input
                id="student-search"
                type="text"
                placeholder="نام یا کد ملی دانش‌آموز"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full rounded-lg border outline-none transition-colors ${
                  theme === "dark"
                    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
                } py-2 px-3 shadow-sm focus:ring-1 focus:ring-blue-500`}
              />
            </div>
            <div>
              <label
                htmlFor="grade-filter"
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-slate-300" : "text-gray-700"
                }`}
              >
                پایه
              </label>
              <select
                id="grade-filter"
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className={`w-full rounded-lg border outline-none transition-colors ${
                  theme === "dark"
                    ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                } py-2 px-3 shadow-sm focus:ring-1 focus:ring-blue-500`}
              >
                <option value="all">همه پایه‌ها</option>
                {uniqueGrades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div
          className={`rounded-xl border p-5 ${
            theme === "dark"
              ? "bg-blue-500/10 border-blue-500/20"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-blue-400" : "text-blue-600"
                }`}
              >
                تعداد کل دانش‌آموزان
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {studentsData.length}
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                theme === "dark" ? "bg-blue-500/20" : "bg-blue-100"
              }`}
            >
              <span className="text-xl">👩‍🎓</span>
            </div>
          </div>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            theme === "dark"
              ? "bg-green-500/10 border-green-500/20"
              : "bg-green-50 border-green-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-green-400" : "text-green-600"
                }`}
              >
                میانگین کل نمرات
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {(
                  studentsData.reduce(
                    (sum, student) =>
                      sum + parseFloat(student.metrics.overallAverage),
                    0
                  ) / studentsData.length
                ).toFixed(2)}
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                theme === "dark" ? "bg-green-500/20" : "bg-green-100"
              }`}
            >
              <span className="text-xl">📈</span>
            </div>
          </div>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            theme === "dark"
              ? "bg-yellow-500/10 border-yellow-500/20"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-yellow-400" : "text-yellow-600"
                }`}
              >
                کل آزمون‌ها
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {studentsData.reduce(
                  (sum, student) => sum + student.metrics.totalExams,
                  0
                )}
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                theme === "dark" ? "bg-yellow-500/20" : "bg-yellow-100"
              }`}
            >
              <span className="text-xl">📝</span>
            </div>
          </div>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            theme === "dark"
              ? "bg-purple-500/10 border-purple-500/20"
              : "bg-purple-50 border-purple-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-purple-400" : "text-purple-600"
                }`}
              >
                میانگین پیشرفت
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {(
                  studentsData.reduce(
                    (sum, student) =>
                      sum + parseFloat(student.metrics.progressPercentage),
                    0
                  ) / studentsData.length
                ).toFixed(2)}
                %
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                theme === "dark" ? "bg-purple-500/20" : "bg-purple-100"
              }`}
            >
              <span className="text-xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Students List Grouped by Grade */}
      <div className="space-y-6">
        {sortedGrades.map((grade) => {
          const studentsInGrade = groupedStudents[grade];

          return (
            <div
              key={grade}
              className={`rounded-xl border ${
                theme === "dark"
                  ? "bg-slate-900/50 border-slate-800/50"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`p-4 border-b flex items-center justify-between ${
                  theme === "dark" ? "border-slate-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <h2
                    className={`text-lg font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    پایه {grade} ({studentsInGrade.length} دانش‌آموز)
                  </h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className={`border-b ${
                        theme === "dark"
                          ? "border-slate-700"
                          : "border-gray-200"
                      }`}
                    >
                      <th
                        className={`text-right p-4 font-medium ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        نام و نام خانوادگی
                      </th>
                      <th
                        className={`text-right p-4 font-medium ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        کد ملی
                      </th>
                      <th
                        className={`text-right p-4 font-medium ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        میانگین نمرات
                      </th>
                      <th
                        className={`text-right p-4 font-medium ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        تعداد آزمون‌ها
                      </th>
                      <th
                        className={`text-right p-4 font-medium ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        پیشرفت
                      </th>
                      <th
                        className={`text-right p-4 font-medium ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        جزئیات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsInGrade.map((student) => (
                      <tr
                        key={student.id}
                        className={`border-b ${
                          theme === "dark"
                            ? "border-slate-700 hover:bg-slate-800/50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                theme === "dark"
                                  ? "bg-slate-700"
                                  : "bg-gray-100"
                              }`}
                            >
                              <span className="font-medium">
                                {student.name.charAt(0)}
                              </span>
                            </div>
                            <span
                              className={`font-medium ${
                                theme === "dark"
                                  ? "text-white"
                                  : "text-gray-900"
                              }`}
                            >
                              {student.name}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`p-4 ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-600"
                          }`}
                        >
                          {student.nationalId}
                        </td>
                        <td
                          className={`p-4 ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-600"
                          }`}
                        >
                          {student.metrics.overallAverage}
                        </td>
                        <td
                          className={`p-4 ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-600"
                          }`}
                        >
                          {student.metrics.totalExams}
                        </td>
                        <td
                          className={`p-4 ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-600"
                          }`}
                        >
                          {student.metrics.progressPercentage}%
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/dashboard/principal/reports/students/${student.id}`}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              theme === "dark"
                                ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            }`}
                          >
                            مشاهده
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentsReport;
