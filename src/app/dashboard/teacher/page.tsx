"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import Link from "next/link";
import {
  Home,
  User,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  Users,
  FileText,
  TrendingUp,
  Clock,
  ChevronRight,
  X,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Filter,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  created_at: Date;
}

interface DashboardStats {
  activeExams: number;
  totalStudents: number;
  totalClasses: number;
  averageGrade: number;
}

interface RecentActivity {
  type: string;
  title: string;
  description: string;
  time: string;
  status: string;
}

interface TeacherClass {
  id: string;
  name: string;
  grade_level?: string;
  section?: string;
  student_count: number;
}

interface RecentExam {
  id: string;
  title: string;
  status: string;
  starts_at?: string;
  ends_at?: string;
  total_points: number;
  class_name: string;
  subject_name?: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  classes: TeacherClass[];
  recentExams: RecentExam[];
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          router.push("/signin");
          return;
        }

        const data = await response.json();
        setUser(data.user);

        // Fetch dashboard data
        await fetchDashboardData();
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/teacher/dashboard");
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
    }
  };

  const initializeDatabase = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch("/api/init-database", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // After successful initialization, fetch dashboard data
          await fetchDashboardData();
        } else {
          setError("خطا در ایجاد پایگاه داده");
        }
      } else {
        setError("خطا در ارتباط با سرور");
      }
    } catch (error) {
      console.error("Error initializing database:", error);
      setError("خطا در راه‌اندازی پایگاه داده");
    } finally {
      setIsInitializing(false);
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

  // Don't render dashboard if user is not authenticated
  if (!user) {
    return null;
  }

  // Show error message if there's an error loading dashboard data
  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="mb-4 text-red-500">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.856-.833-2.828 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2
            className={`text-xl font-semibold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            خطا در بارگیری داشبورد
          </h2>
          <p
            className={`text-sm mb-4 ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {error}
          </p>
          <p
            className={`text-sm mb-4 ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            لطفاً اتصال اینترنت خود را بررسی کنید و دوباره امتحان کنید
          </p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  // Use real data from API or fallback to empty arrays
  const stats = dashboardData
    ? [
        {
          title: "آزمون‌های فعال",
          value: dashboardData.stats.activeExams.toString(),
          change: "+2",
          changePercent: "+16.7%",
          trend: "up" as const,
          icon: BookOpen,
          color: "blue",
          bgGradient: "from-blue-500/10 to-blue-600/10",
          iconBg: theme === "dark" ? "bg-blue-500/10" : "bg-blue-50",
          iconColor: theme === "dark" ? "text-blue-500" : "text-blue-600",
        },
        {
          title: "دانش‌آموزان",
          value: dashboardData.stats.totalStudents.toString(),
          change: "+8",
          changePercent: "+5.4%",
          trend: "up" as const,
          icon: Users,
          color: "green",
          bgGradient: "from-emerald-500/10 to-emerald-600/10",
          iconBg: theme === "dark" ? "bg-emerald-500/10" : "bg-emerald-50",
          iconColor: theme === "dark" ? "text-emerald-500" : "text-emerald-600",
        },
        {
          title: "میانگین نمرات",
          value:
            dashboardData.stats.averageGrade > 0
              ? dashboardData.stats.averageGrade.toString()
              : "--",
          change: "+0.5",
          changePercent: "+3.1%",
          trend: "up" as const,
          icon: TrendingUp,
          color: "purple",
          bgGradient: "from-violet-500/10 to-violet-600/10",
          iconBg: theme === "dark" ? "bg-violet-500/10" : "bg-violet-50",
          iconColor: theme === "dark" ? "text-violet-500" : "text-violet-600",
        },
        {
          title: "کلاس‌های فعال",
          value: dashboardData.stats.totalClasses.toString(),
          unit: "کلاس",
          change: "+1",
          changePercent: "+10%",
          trend: "up" as const,
          icon: Clock,
          color: "orange",
          bgGradient: "from-amber-500/10 to-amber-600/10",
          iconBg: theme === "dark" ? "bg-amber-500/10" : "bg-amber-50",
          iconColor: theme === "dark" ? "text-amber-500" : "text-amber-600",
        },
      ]
    : [];

  const recentActivities = dashboardData?.recentActivities || [];

  const quickActions = [
    {
      title: "ایجاد آزمون جدید",
      description: "آزمون جدید با سوالات هوشمند بسازید",
      icon: Plus,
      gradient: "from-blue-500 to-blue-600",
      href: "/dashboard/teacher/exams/create",
    },
    {
      title: "مدیریت کلاس‌ها",
      description: "کلاس‌ها و دانش‌آموزان را مدیریت کنید",
      icon: Users,
      gradient: "from-emerald-500 to-emerald-600",
      href: "/dashboard/teacher/classes",
    },
    {
      title: "مشاهده گزارش‌ها",
      description: "آمار و تحلیل پیشرفت را ببینید",
      icon: BarChart3,
      gradient: "from-violet-500 to-violet-600",
      href: "/dashboard/teacher/reports",
    },
  ];

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-xl sm:rounded-2xl border p-4 sm:p-6 transition-all hover:shadow-lg hover:scale-[1.02] ${
              theme === "dark"
                ? "bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div
                  className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${stat.iconBg}`}
                >
                  <stat.icon
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.iconColor}`}
                  />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span
                    className={`${
                      stat.trend === "up" ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {stat.changePercent}
                  </span>
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1 sm:gap-2 mb-1">
                  <h3
                    className={`text-xl sm:text-2xl font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {stat.value}
                  </h3>
                  {stat.unit && (
                    <span
                      className={`text-sm ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      {stat.unit}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs sm:text-sm font-medium ${
                    theme === "dark" ? "text-slate-300" : "text-gray-600"
                  }`}
                >
                  {stat.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-4 sm:p-6 transition-all hover:shadow-xl hover:scale-[1.02] ${
              theme === "dark"
                ? "bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}
            />
            <div className="relative">
              <div
                className={`inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 bg-gradient-to-r ${action.gradient}`}
              >
                <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3
                className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {action.title}
              </h3>
              <p
                className={`text-xs sm:text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-600"
                }`}
              >
                {action.description}
              </p>
              <div className="flex items-center gap-2 mt-4 text-sm font-medium">
                <span
                  className={`${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  شروع کنید
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activities & Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activities */}
        <div
          className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2
              className={`text-lg sm:text-xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              فعالیت‌های اخیر
            </h2>
            <button
              className={`text-xs sm:text-sm font-medium ${
                theme === "dark"
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-blue-600 hover:text-blue-700"
              } transition-colors`}
            >
              مشاهده همه
            </button>
          </div>

          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === "completed"
                        ? "bg-green-500"
                        : activity.status === "pending"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {activity.title}
                    </p>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {activity.description}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        theme === "dark" ? "text-slate-500" : "text-gray-500"
                      }`}
                    >
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                هنوز فعالیتی ثبت نشده
              </p>
            </div>
          )}
        </div>

        {/* Recent Classes */}
        <div
          className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2
              className={`text-lg sm:text-xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              کلاس‌های من
            </h2>
            <Link
              href="/dashboard/teacher/classes"
              className={`text-xs sm:text-sm font-medium ${
                theme === "dark"
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-blue-600 hover:text-blue-700"
              } transition-colors`}
            >
              مشاهده همه
            </Link>
          </div>

          {dashboardData?.classes && dashboardData.classes.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.classes.slice(0, 4).map((cls) => (
                <Link
                  key={cls.id}
                  href={`/dashboard/teacher/classes/${cls.id}`}
                  className={`block p-4 rounded-xl border transition-all hover:shadow-md ${
                    theme === "dark"
                      ? "bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className={`font-medium ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {cls.name}
                      </h3>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-slate-400" : "text-gray-600"
                        }`}
                      >
                        پایه {cls.grade_level}{" "}
                        {cls.section && `- ${cls.section}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          theme === "dark" ? "text-blue-400" : "text-blue-600"
                        }`}
                      >
                        {cls.student_count} دانش‌آموز
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p
                className={`text-sm mb-4 ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                هنوز کلاسی ندارید
              </p>
              <Link
                href="/dashboard/teacher/classes"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                ایجاد کلاس اول
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
