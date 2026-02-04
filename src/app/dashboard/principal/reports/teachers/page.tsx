"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/app/components/reports/DashboardLayout";
import { useTheme } from "@/app/components/ThemeContext";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Define TypeScript interfaces for our data
interface GradePerformance {
  gradeLevel: string;
  activityCount: number;
  averageScore: string;
  studentCount: number;
}

interface SubjectPerformance {
  subjectName: string;
  activityCount: number;
  averageScore: string;
  studentCount: number;
}

interface PerformanceTrend {
  month: string;
  averageScore: string;
  activityCount: number;
}

interface RecentActivity {
  title: string;
  date: string;
  type: string;
  subjectName: string;
  className: string;
  averageScore: string;
  participants: number;
}

interface TeacherData {
  id: string;
  name: string;
  activitiesCreated: number;
  studentsTaught: number;
  averageScore: string;
  gradePerformance: GradePerformance[];
  subjectPerformance: SubjectPerformance[];
  performanceTrend: PerformanceTrend[];
  recentActivities: RecentActivity[];
}

// Activity type mapping
const activityTypeMap: { [key: string]: string } = {
  midterm_exam: "آزمون میان‌ترم",
  monthly_exam: "آزمون ماهیانه",
  weekly_exam: "آزمون هفتگی",
  class_activity: "فعالیت کلاسی",
  class_homework: "تکلیف کلاسی",
  home_homework: "تکلیف منزل",
};

const TeachersReport = () => {
  const { theme } = useTheme();
  const [teachersData, setTeachersData] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeachersData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create EventSource for streaming progress updates
        const eventSource = new EventSource("/api/principal/reports/teachers");

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.complete) {
            if (data.error) {
              setError(data.error);
              setLoading(false);
            } else {
              setTeachersData(data.data);
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

    fetchTeachersData();
  }, []);

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
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            تلاش مجدد
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (teachersData.length === 0) {
    return (
      <DashboardLayout>
        <div
          className={`rounded-lg p-6 text-center border ${
            theme === "dark"
              ? "bg-yellow-900/20 border-yellow-800"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <p
            className={
              theme === "dark" ? "text-yellow-400" : "text-yellow-700"
            }
          >
            داده‌ای برای نمایش وجود ندارد
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <h1
          className={`text-2xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          گزارش تحلیل عملکرد معلمان
        </h1>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div
            className={`rounded-xl shadow p-6 ${
              theme === "dark"
                ? "bg-slate-900/50 border border-slate-800/50"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                  theme === "dark"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                👨‍🏫
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {teachersData.length}
                </p>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  تعداد کل معلمان
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl shadow p-6 ${
              theme === "dark"
                ? "bg-slate-900/50 border border-slate-800/50"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                  theme === "dark"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-green-100 text-green-800"
                }`}
              >
                📝
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {teachersData.reduce(
                    (sum, teacher) => sum + teacher.activitiesCreated,
                    0
                  )}
                </p>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  کل فعالیت‌های ثبت شده
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl shadow p-6 ${
              theme === "dark"
                ? "bg-slate-900/50 border border-slate-800/50"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                  theme === "dark"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                👩‍🎓
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {teachersData.reduce(
                    (sum, teacher) => sum + teacher.studentsTaught,
                    0
                  )}
                </p>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  کل دانش‌آموزان تحت تدریس
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl shadow p-6 ${
              theme === "dark"
                ? "bg-slate-900/50 border border-slate-800/50"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                  theme === "dark"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                📊
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {(
                    teachersData.reduce(
                      (sum, teacher) => sum + parseFloat(teacher.averageScore),
                      0
                    ) / teachersData.length
                  ).toFixed(2)}
                </p>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  میانگین کلی نمرات
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Performance Cards */}
        <div className="grid grid-cols-1 gap-6">
          {teachersData.map((teacher) => (
            <div
              key={teacher.id}
              className={`rounded-xl shadow p-6 ${
                theme === "dark"
                  ? "bg-slate-900/50 border border-slate-800/50"
                  : "bg-white border border-gray-200"
              }`}
            >
              {/* Teacher Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3
                    className={`text-xl font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {teacher.name}
                  </h3>
                  <div className="flex gap-3 mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        theme === "dark"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {teacher.activitiesCreated} فعالیت
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        theme === "dark"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {teacher.studentsTaught} دانش‌آموز
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        theme === "dark"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      میانگین: {teacher.averageScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Grade Level Performance */}
                {teacher.gradePerformance.length > 0 && (
                  <div>
                    <h4
                      className={`font-medium mb-3 ${
                        theme === "dark" ? "text-white" : "text-gray-700"
                      }`}
                    >
                      عملکرد بر اساس پایه تحصیلی
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={teacher.gradePerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="gradeLevel" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 20]} />
                          <Tooltip
                            contentStyle={
                              theme === "dark"
                                ? {
                                    backgroundColor: "#1e293b",
                                    borderColor: "#334155",
                                  }
                                : {}
                            }
                            itemStyle={
                              theme === "dark" ? { color: "white" } : {}
                            }
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
                )}

                {/* Subject Performance */}
                {teacher.subjectPerformance.length > 0 && (
                  <div>
                    <h4
                      className={`font-medium mb-3 ${
                        theme === "dark" ? "text-white" : "text-gray-700"
                      }`}
                    >
                      عملکرد بر اساس درس
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={teacher.subjectPerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="subjectName"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis domain={[0, 20]} />
                          <Tooltip
                            contentStyle={
                              theme === "dark"
                                ? {
                                    backgroundColor: "#1e293b",
                                    borderColor: "#334155",
                                  }
                                : {}
                            }
                            itemStyle={
                              theme === "dark" ? { color: "white" } : {}
                            }
                          />
                          <Legend />
                          <Bar
                            dataKey="averageScore"
                            name="میانگین نمره"
                            fill={theme === "dark" ? "#10b981" : "#059669"}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Trend */}
              {teacher.performanceTrend.length > 0 && (
                <div className="mb-6">
                  <h4
                    className={`font-medium mb-3 ${
                      theme === "dark" ? "text-white" : "text-gray-700"
                    }`}
                  >
                    روند عملکرد ماهانه
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={teacher.performanceTrend.reverse()}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          tickFormatter={(value) =>
                            new Date(value).toLocaleDateString("fa-IR", {
                              month: "short",
                              year: "numeric",
                            })
                          }
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis domain={[0, 20]} />
                        <Tooltip
                          contentStyle={
                            theme === "dark"
                              ? {
                                  backgroundColor: "#1e293b",
                                  borderColor: "#334155",
                                }
                              : {}
                          }
                          itemStyle={
                            theme === "dark" ? { color: "white" } : {}
                          }
                          labelFormatter={(value) =>
                            new Date(value).toLocaleDateString("fa-IR")
                          }
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="averageScore"
                          name="میانگین نمره"
                          stroke={theme === "dark" ? "#f59e0b" : "#d97706"}
                          strokeWidth={2}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Recent Activities */}
              {teacher.recentActivities.length > 0 && (
                <div>
                  <h4
                    className={`font-medium mb-3 ${
                      theme === "dark" ? "text-white" : "text-gray-700"
                    }`}
                  >
                    فعالیت‌های اخیر
                  </h4>
                  <div className="space-y-3">
                    {teacher.recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-md ${
                          theme === "dark"
                            ? "bg-slate-800/50"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p
                              className={`font-medium ${
                                theme === "dark"
                                  ? "text-white"
                                  : "text-gray-800"
                              }`}
                            >
                              {activity.title}
                            </p>
                            <p
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-slate-400"
                                  : "text-gray-600"
                              }`}
                            >
                              {activityTypeMap[activity.type] || activity.type} •{" "}
                              {activity.subjectName} • {activity.className}
                            </p>
                            <p
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-slate-400"
                                  : "text-gray-600"
                              }`}
                            >
                              {new Date(activity.date).toLocaleDateString(
                                "fa-IR"
                              )}
                            </p>
                          </div>
                          <div className="text-left">
                            <p
                              className={`font-medium text-lg ${
                                theme === "dark"
                                  ? "text-blue-400"
                                  : "text-blue-600"
                              }`}
                            >
                              {activity.averageScore}
                            </p>
                            <p
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-slate-400"
                                  : "text-gray-600"
                              }`}
                            >
                              {activity.participants} نفر
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeachersReport;
