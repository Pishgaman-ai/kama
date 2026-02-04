"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/app/components/reports/DashboardLayout";
import { useTheme } from "@/app/components/ThemeContext";
import {
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Define TypeScript interfaces for our data
interface BasicStats {
  totalClasses: number;
  totalTeachers: number;
  totalStudents: number;
  totalParents: number;
  totalExams: number;
}

interface SubjectPerformance {
  subject: string;
  averageScore: number;
}

interface PassFailRates {
  passed: number;
  failed: number;
  total: number;
  passRate: number;
}

interface GradeLevelPerformance {
  gradeLevel: string;
  averageScore: number;
}

interface ClassComparison {
  className: string;
  averageScore: number;
}

interface TeacherPerformance {
  teacherName: string;
  averageStudentScore: number;
}

interface ProcessingStats {
  averageProcessingTime: number;
  totalProcessed: number;
}

interface AccuracyStats {
  accuracyRate: number;
}

interface AiPerformance {
  processingStats: ProcessingStats;
  accuracyStats: AccuracyStats;
}

interface SchoolStats {
  basicStats: BasicStats;
  subjectPerformance: SubjectPerformance[];
  passFailRates: PassFailRates;
  gradeLevelPerformance: GradeLevelPerformance[];
}

interface ReportData {
  schoolStats: SchoolStats;
  classComparison: ClassComparison[];
  teacherPerformance: TeacherPerformance[];
  aiPerformance: AiPerformance;
}

// Interfaces for API response data (raw strings from API)
interface ApiSubjectPerformance {
  subject: string;
  averageScore: string;
}

interface ApiPassFailRates {
  passed: number;
  failed: number;
  total: number;
  passRate: string;
}

interface ApiGradeLevelPerformance {
  gradeLevel: string;
  averageScore: string;
}

interface ApiClassComparison {
  className: string;
  averageScore: string;
}

interface ApiTeacherPerformance {
  teacherName: string;
  averageStudentScore: string;
}

interface ApiSchoolStats {
  basicStats: BasicStats;
  subjectPerformance: ApiSubjectPerformance[];
  passFailRates: ApiPassFailRates;
  gradeLevelPerformance: ApiGradeLevelPerformance[];
}

interface ApiReportData {
  schoolStats: ApiSchoolStats;
  classComparison: ApiClassComparison[];
  teacherPerformance: ApiTeacherPerformance[];
  aiPerformance: AiPerformance;
}

const OverviewDashboard = () => {
  const { theme } = useTheme();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/principal/reports/overview");

      if (!response.ok) {
        throw new Error(`Failed to fetch report data: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        return;
      }

      // Transform the data to match our interface
      const transformedData: ReportData = {
        schoolStats: {
          basicStats: result.data.schoolStats.basicStats,
          subjectPerformance: result.data.schoolStats.subjectPerformance.map(
            (item: ApiSubjectPerformance) => ({
              subject: item.subject,
              averageScore: parseFloat(item.averageScore),
            })
          ),
          passFailRates: {
            ...result.data.schoolStats.passFailRates,
            passRate: parseFloat(
              result.data.schoolStats.passFailRates.passRate
            ),
          },
          gradeLevelPerformance:
            result.data.schoolStats.gradeLevelPerformance.map(
              (item: ApiGradeLevelPerformance) => ({
                gradeLevel: item.gradeLevel,
                averageScore: parseFloat(item.averageScore),
              })
            ),
        },
        classComparison: result.data.classComparison.map(
          (item: ApiClassComparison) => ({
            className: item.className,
            averageScore: parseFloat(item.averageScore),
          })
        ),
        teacherPerformance: result.data.teacherPerformance.map(
          (item: ApiTeacherPerformance) => ({
            teacherName: item.teacherName,
            averageStudentScore: parseFloat(item.averageStudentScore),
          })
        ),
        aiPerformance: result.data.aiPerformance,
      };

      setReportData(transformedData);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("خطا در دریافت اطلاعات گزارش");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchReportData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            تلاش مجدد
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!reportData) {
    return (
      <DashboardLayout>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-700">داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </DashboardLayout>
    );
  }

  // Stats cards data
  const statsData = [
    {
      title: "تعداد معلمان",
      value: reportData.schoolStats.basicStats.totalTeachers,
      icon: "👨‍🏫",
      color: "bg-blue-100 text-blue-800",
      darkColor: "bg-blue-500/20 text-blue-400",
    },
    {
      title: "تعداد کلاس‌ها",
      value: reportData.schoolStats.basicStats.totalClasses,
      icon: "📚",
      color: "bg-green-100 text-green-800",
      darkColor: "bg-green-500/20 text-green-400",
    },
    {
      title: "تعداد دانش‌آموزان",
      value: reportData.schoolStats.basicStats.totalStudents,
      icon: "👩‍🎓",
      color: "bg-yellow-100 text-yellow-800",
      darkColor: "bg-yellow-500/20 text-yellow-400",
    },
    {
      title: "تعداد امتحانات",
      value: reportData.schoolStats.basicStats.totalExams,
      icon: "📝",
      color: "bg-red-100 text-red-800",
      darkColor: "bg-red-500/20 text-red-400",
    },
    {
      title: "نرخ قبولی",
      value: `${reportData.schoolStats.passFailRates.passRate}%`,
      icon: "✅",
      color: "bg-purple-100 text-purple-800",
      darkColor: "bg-purple-500/20 text-purple-400",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className={`rounded-xl shadow p-6 ${
                theme === "dark"
                  ? "bg-slate-900/50 border border-slate-800/50"
                  : "bg-white border border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                    theme === "dark" ? stat.darkColor : stat.color
                  }`}
                >
                  {stat.icon}
                </div>
                <div className="text-right">
                  <p
                    className={`text-2xl font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {stat.value}
                  </p>
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    {stat.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Performance Chart */}
          <div
            className={`rounded-xl shadow p-6 ${
              theme === "dark"
                ? "bg-slate-900/50 border border-slate-800/50"
                : "bg-white border border-gray-200"
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              میانگین نمرات بر اساس درس
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.schoolStats.subjectPerformance}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="subject"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis domain={[0, 20]} />
                  <Tooltip
                    contentStyle={
                      theme === "dark"
                        ? { backgroundColor: "#1e293b", borderColor: "#334155" }
                        : {}
                    }
                    itemStyle={theme === "dark" ? { color: "white" } : {}}
                  />
                  <Legend />
                  <Bar
                    dataKey="averageScore"
                    name="میانگین نمره"
                    fill={theme === "dark" ? "#3b82f6" : "#2563eb"}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grade Level Performance Chart */}
          <div
            className={`rounded-xl shadow p-6 ${
              theme === "dark"
                ? "bg-slate-900/50 border border-slate-800/50"
                : "bg-white border border-gray-200"
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              میانگین نمرات بر اساس پایه
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={reportData.schoolStats.gradeLevelPerformance}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="gradeLevel"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis domain={[0, 20]} />
                  <Tooltip
                    contentStyle={
                      theme === "dark"
                        ? { backgroundColor: "#1e293b", borderColor: "#334155" }
                        : {}
                    }
                    itemStyle={theme === "dark" ? { color: "white" } : {}}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="averageScore"
                    name="میانگین نمره"
                    stroke={theme === "dark" ? "#10b981" : "#059669"}
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Class Comparison Chart */}
          <div
            className={`rounded-xl shadow p-6 ${
              theme === "dark"
                ? "bg-slate-900/50 border border-slate-800/50"
                : "bg-white border border-gray-200"
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              مقایسه میانگین نمرات بین کلاس‌ها
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.classComparison}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="className"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis domain={[0, 20]} />
                  <Tooltip
                    contentStyle={
                      theme === "dark"
                        ? { backgroundColor: "#1e293b", borderColor: "#334155" }
                        : {}
                    }
                    itemStyle={theme === "dark" ? { color: "white" } : {}}
                  />
                  <Legend />
                  <Bar
                    dataKey="averageScore"
                    name="میانگین نمره"
                    fill={theme === "dark" ? "#f59e0b" : "#d97706"}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Teacher Performance Chart */}
          <div
            className={`rounded-xl shadow p-6 ${
              theme === "dark"
                ? "bg-slate-900/50 border border-slate-800/50"
                : "bg-white border border-gray-200"
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              عملکرد معلمان
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.teacherPerformance}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="teacherName"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis domain={[0, 20]} />
                  <Tooltip
                    contentStyle={
                      theme === "dark"
                        ? { backgroundColor: "#1e293b", borderColor: "#334155" }
                        : {}
                    }
                    itemStyle={theme === "dark" ? { color: "white" } : {}}
                  />
                  <Legend />
                  <Bar
                    dataKey="averageStudentScore"
                    name="میانگین نمره دانش‌آموزان"
                    fill={theme === "dark" ? "#8b5cf6" : "#7c3aed"}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Performance Section */}
        <div
          className={`rounded-xl shadow p-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border border-slate-800/50"
              : "bg-white border border-gray-200"
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            عملکرد هوش مصنوعی
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`rounded-lg p-4 text-center ${
                theme === "dark"
                  ? "bg-indigo-500/10 border border-indigo-500/20"
                  : "bg-indigo-50 border border-indigo-200"
              }`}
            >
              <p
                className={`text-2xl font-bold ${
                  theme === "dark" ? "text-indigo-400" : "text-indigo-700"
                }`}
              >
                {reportData.aiPerformance.processingStats.averageProcessingTime}
                <span className="text-lg">ms</span>
              </p>
              <p
                className={`text-sm mt-1 ${
                  theme === "dark" ? "text-slate-400" : "text-gray-600"
                }`}
              >
                میانگین زمان پردازش
              </p>
            </div>
            <div
              className={`rounded-lg p-4 text-center ${
                theme === "dark"
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <p
                className={`text-2xl font-bold ${
                  theme === "dark" ? "text-green-400" : "text-green-700"
                }`}
              >
                {reportData.aiPerformance.accuracyStats.accuracyRate}%
              </p>
              <p
                className={`text-sm mt-1 ${
                  theme === "dark" ? "text-slate-400" : "text-gray-600"
                }`}
              >
                درصد دقت تصحیح خودکار
              </p>
            </div>
            <div
              className={`rounded-lg p-4 text-center ${
                theme === "dark"
                  ? "bg-blue-500/10 border border-blue-500/20"
                  : "bg-blue-50 border border-blue-200"
              }`}
            >
              <p
                className={`text-2xl font-bold ${
                  theme === "dark" ? "text-blue-400" : "text-blue-700"
                }`}
              >
                {reportData.aiPerformance.processingStats.totalProcessed}
              </p>
              <p
                className={`text-sm mt-1 ${
                  theme === "dark" ? "text-slate-400" : "text-gray-600"
                }`}
              >
                تعداد پردازش‌ها
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OverviewDashboard;
