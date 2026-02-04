"use client";

import { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  Award,
  Calendar,
  TrendingUp,
  Clock,
  Bell,
  Star,
  User,
  GraduationCap,
  ArrowUpRight,
} from "lucide-react";
import { useTheme } from "@/app/components/ThemeContext";
import Link from "next/link";

interface Child {
  id: string;
  name: string;
  class_name?: string;
  grade_level?: string;
  section?: string;
  total_exams: number;
  avg_score: number;
  recent_activity: string;
}

interface DashboardStats {
  totalChildren: number;
  totalExams: number;
  avgGrade: number;
  upcomingExams: number;
  children: Child[];
}

export default function ParentDashboard() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/parent/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError("خطا در بارگذاری اطلاعات داشبورد");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
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
      <div className="flex items-center justify-center py-16">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2
            className={`text-xl font-semibold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            خطا در بارگذاری
          </h2>
          <p
            className={`mb-4 ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            {error}
          </p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  // Stats cards data
  const statCards = stats
    ? [
        {
          title: "تعداد فرزندان",
          value: stats.totalChildren.toString(),
          change: "+12%",
          changePercent: "+12%",
          trend: "up" as const,
          icon: Users,
          color: "blue",
          bgGradient: "from-blue-500/10 to-blue-600/10",
          iconBg: theme === "dark" ? "bg-blue-500/10" : "bg-blue-50",
          iconColor: theme === "dark" ? "text-blue-500" : "text-blue-600",
        },
        {
          title: "کل آزمون‌ها",
          value: stats.totalExams.toString(),
          change: "+8%",
          changePercent: "+8%",
          trend: "up" as const,
          icon: BookOpen,
          color: "green",
          bgGradient: "from-emerald-500/10 to-emerald-600/10",
          iconBg: theme === "dark" ? "bg-emerald-500/10" : "bg-emerald-50",
          iconColor: theme === "dark" ? "text-emerald-500" : "text-emerald-600",
        },
        {
          title: "میانگین نمرات",
          value: stats.avgGrade?.toFixed(1) || "0.0",
          change: "+5%",
          changePercent: "+5%",
          trend: "up" as const,
          icon: Award,
          color: "purple",
          bgGradient: "from-violet-500/10 to-violet-600/10",
          iconBg: theme === "dark" ? "bg-violet-500/10" : "bg-violet-50",
          iconColor: theme === "dark" ? "text-violet-500" : "text-violet-600",
        },
        {
          title: "آزمون‌های آینده",
          value: stats.upcomingExams.toString(),
          change: "+15%",
          changePercent: "+15%",
          trend: "up" as const,
          icon: Calendar,
          color: "orange",
          bgGradient: "from-amber-500/10 to-amber-600/10",
          iconBg: theme === "dark" ? "bg-amber-500/10" : "bg-amber-50",
          iconColor: theme === "dark" ? "text-amber-500" : "text-amber-600",
        },
      ]
    : [];

  // Quick actions
  const quickActions = [
    {
      title: "مشاهده نمرات",
      description: "بررسی عملکرد و پیشرفت فرزندان",
      icon: Award,
      gradient: "from-blue-500 to-blue-600",
      href: "/dashboard/parent/grades",
    },
    {
      title: "برنامه کلاسی",
      description: "مشاهده برنامه درسی و آزمون‌ها",
      icon: Calendar,
      gradient: "from-violet-500 to-violet-600",
      href: "/dashboard/parent/schedule",
    },
    {
      title: "گزارش پیشرفت",
      description: "نمودار و آمار پیشرفت تحصیلی",
      icon: TrendingUp,
      gradient: "from-green-500 to-green-600",
      href: "/dashboard/parent/reports",
    },
  ];

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {statCards.map((stat, index) => (
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
                  <span className="text-emerald-500">{stat.changePercent}</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <div>
                <h3
                  className={`text-xl sm:text-2xl font-bold mb-1 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {stat.value}
                </h3>
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
              <h4
                className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {action.title}
              </h4>
              <p
                className={`text-xs sm:text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-600"
                }`}
              >
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Children Overview */}
      <div
        className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 mb-6 sm:mb-8 ${
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
            اطلاعات فرزندان
          </h2>
          <Link
            href="/dashboard/parent/children"
            className={`text-xs sm:text-sm font-medium transition-colors ${
              theme === "dark"
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-700"
            }`}
          >
            مشاهده همه →
          </Link>
        </div>

        {stats?.children && stats.children.length > 0 ? (
          <div className="space-y-4">
            {stats.children.map((child) => (
              <div
                key={child.id}
                className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
                  theme === "dark"
                    ? "bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50"
                    : "bg-gray-50 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {child.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm mt-1">
                      {child.class_name && (
                        <span
                          className={`${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-600"
                          }`}
                        >
                          کلاس: {child.class_name}
                        </span>
                      )}
                      {child.grade_level && child.section && (
                        <span
                          className={`${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-600"
                          }`}
                        >
                          پایه: {child.grade_level} - {child.section}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p
                      className={`text-xl font-bold ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {child.total_exams}
                    </p>
                    <p
                      className={`text-xs ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      آزمون
                    </p>
                  </div>

                  <div className="text-center">
                    <p
                      className={`text-xl font-bold ${
                        child.avg_score >= 17
                          ? "text-yellow-500"
                          : child.avg_score >= 14
                          ? "text-green-500"
                          : child.avg_score >= 10
                          ? "text-blue-500"
                          : "text-red-500"
                      }`}
                    >
                      {child.avg_score?.toFixed(1) || "0.0"}
                    </p>
                    <p
                      className={`text-xs ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      میانگین
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star
                        className={`h-4 w-4 ${
                          child.avg_score >= 17
                            ? "text-yellow-500"
                            : "text-slate-400"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          child.avg_score >= 17
                            ? "text-yellow-500"
                            : child.avg_score >= 14
                            ? "text-green-500"
                            : child.avg_score >= 10
                            ? "text-blue-500"
                            : "text-red-500"
                        }`}
                      >
                        {child.avg_score >= 17
                          ? "عالی"
                          : child.avg_score >= 14
                          ? "خوب"
                          : child.avg_score >= 10
                          ? "متوسط"
                          : "نیاز به تلاش"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-slate-400" />
            <p
              className={`text-lg ${
                theme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              هنوز اطلاعات فرزندی ثبت نشده است
            </p>
            <p
              className={`text-sm mt-2 ${
                theme === "dark" ? "text-slate-500" : "text-gray-400"
              }`}
            >
              اطلاعات فرزندان پس از ثبت‌نام در مدرسه نمایش داده خواهد شد
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
