"use client";
import React, { useState, useEffect } from "react";
import { School, Users, BookOpen, TrendingUp } from "lucide-react";
import { useTheme } from "@/app/components/ThemeContext";
import SchoolsMap from "./components/SchoolsMap";

interface SchoolData {
  id: string;
  name: string;
  created_at: string;
  user_count: number;
  teacher_count: number;
  student_count: number;
  class_count: number;
}

interface DashboardStats {
  totalSchools: number;
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  recentSchools: Array<{
    id: string;
    name: string;
    created_at: string;
    user_count: number;
  }>;
}

export default function AdminDashboardPage() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalClasses: 0,
    recentSchools: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/schools");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const schools = result.data.schools;

          // Calculate stats from schools data
          const totalSchools = schools.length;
          const totalTeachers = schools.reduce(
            (sum: number, school: SchoolData) => sum + school.teacher_count,
            0
          );
          const totalStudents = schools.reduce(
            (sum: number, school: SchoolData) => sum + school.student_count,
            0
          );
          const totalUsers = totalTeachers + totalStudents;
          const totalClasses = schools.reduce(
            (sum: number, school: SchoolData) => sum + school.class_count,
            0
          );

          // Get recent schools (last 5)
          const recentSchools = schools
            .slice(0, 5)
            .map((school: SchoolData) => ({
              id: school.id,
              name: school.name,
              created_at: school.created_at,
              user_count: school.user_count,
            }));

          setStats({
            totalSchools,
            totalUsers,
            totalTeachers,
            totalStudents,
            totalClasses,
            recentSchools,
          });
          setError(null);
        } else {
          setError("خطا در بارگیری آمار");
        }
      } else {
        setError("خطا در بارگیری آمار");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
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

  const statCards = [
    {
      title: "تعداد مدارس",
      value: stats.totalSchools.toLocaleString("fa-IR"),
      icon: School,
      color: "blue",
      change: "+12%",
    },
    {
      title: "کل کاربران",
      value: stats.totalUsers.toLocaleString("fa-IR"),
      icon: Users,
      color: "green",
      change: "+8%",
    },
    {
      title: "تعداد معلمان",
      value: stats.totalTeachers.toLocaleString("fa-IR"),
      icon: Users,
      color: "purple",
      change: "+5%",
    },
    {
      title: "تعداد دانش‌آموزان",
      value: stats.totalStudents.toLocaleString("fa-IR"),
      icon: Users,
      color: "orange",
      change: "+15%",
    },
    {
      title: "تعداد کلاس‌ها",
      value: stats.totalClasses.toLocaleString("fa-IR"),
      icon: BookOpen,
      color: "pink",
      change: "+10%",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-gradient-to-br from-blue-500/10 to-blue-600/10",
          text: "text-blue-500",
          lightBg: "bg-blue-50",
          lightText: "text-blue-600",
          border: "border-blue-500/20",
        };
      case "green":
        return {
          bg: "bg-gradient-to-br from-emerald-500/10 to-emerald-600/10",
          text: "text-emerald-500",
          lightBg: "bg-emerald-50",
          lightText: "text-emerald-600",
          border: "border-emerald-500/20",
        };
      case "purple":
        return {
          bg: "bg-gradient-to-br from-violet-500/10 to-violet-600/10",
          text: "text-violet-500",
          lightBg: "bg-violet-50",
          lightText: "text-violet-600",
          border: "border-violet-500/20",
        };
      case "orange":
        return {
          bg: "bg-gradient-to-br from-amber-500/10 to-amber-600/10",
          text: "text-amber-500",
          lightBg: "bg-amber-50",
          lightText: "text-amber-600",
          border: "border-amber-500/20",
        };
      case "pink":
        return {
          bg: "bg-gradient-to-br from-pink-500/10 to-pink-600/10",
          text: "text-pink-500",
          lightBg: "bg-pink-50",
          lightText: "text-pink-600",
          border: "border-pink-500/20",
        };
      default:
        return {
          bg: "bg-gradient-to-br from-slate-500/10 to-slate-600/10",
          text: "text-slate-500",
          lightBg: "bg-slate-50",
          lightText: "text-slate-600",
          border: "border-slate-500/20",
        };
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-6" dir="rtl">
      {/* Error State */}
      {error && (
        <div
          className={`rounded-xl sm:rounded-2xl p-4 border ${
            theme === "dark"
              ? "bg-red-500/10 border-red-500/20"
              : "bg-red-50 border-red-200"
          }`}
        >
          <p
            className={`${theme === "dark" ? "text-red-400" : "text-red-600"}`}
          >
            {error}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {statCards.map((stat) => {
          const colors = getColorClasses(stat.color);
          return (
            <div
              key={stat.title}
              className={`relative overflow-hidden rounded-xl sm:rounded-2xl border p-4 sm:p-6 transition-all hover:shadow-lg hover:scale-[1.02] ${
                theme === "dark"
                  ? "bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`absolute inset-0 ${colors.bg} opacity-50`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div
                    className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${
                      theme === "dark" ? colors.bg : colors.lightBg
                    }`}
                  >
                    <stat.icon
                      className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        theme === "dark" ? colors.text : colors.lightText
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-emerald-500">{stat.change}</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
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
          );
        })}
      </div>

      {/* Schools Map */}
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
            نقشه مدارس
          </h2>
        </div>
        <SchoolsMap />
      </div>

      {/* Recent Schools */}
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
            مدارس اخیر
          </h2>
          <a
            href="/admin/schools"
            className={`text-xs sm:text-sm font-medium transition-colors ${
              theme === "dark"
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-700"
            }`}
          >
            مشاهده همه →
          </a>
        </div>

        {stats.recentSchools.length === 0 ? (
          <div className="text-center py-8">
            <School
              className={`w-12 h-12 mx-auto mb-4 ${
                theme === "dark" ? "text-slate-600" : "text-gray-400"
              }`}
            />
            <p
              className={`text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              هنوز مدرسه‌ای ثبت نشده است
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentSchools.map((school) => (
              <div
                key={school.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md ${
                  theme === "dark"
                    ? "bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50"
                    : "bg-gray-50 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
                    <School className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4
                      className={`font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {school.name}
                    </h4>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      ایجاد شده: {school.created_at}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      theme === "dark"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {school.user_count} کاربر
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div
        className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
          theme === "dark"
            ? "bg-slate-900/50 border-slate-800/50"
            : "bg-white border-gray-200"
        }`}
      >
        <h2
          className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          عملیات سریع
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <a
            href="/admin/schools"
            className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-4 sm:p-6 transition-all hover:shadow-xl hover:scale-[1.02] ${
              theme === "dark"
                ? "bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-5 group-hover:opacity-10 transition-opacity" />
            <div className="relative">
              <div className="inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 bg-gradient-to-r from-blue-500 to-blue-600">
                <School className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h4
                className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                مدیریت مدارس
              </h4>
              <p
                className={`text-xs sm:text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-600"
                }`}
              >
                اضافه، ویرایش و حذف مدارس
              </p>
            </div>
          </a>

          <div
            className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 cursor-not-allowed opacity-60 ${
              theme === "dark"
                ? "bg-slate-800/50 border-slate-700"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div
              className={`inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 ${
                theme === "dark" ? "bg-slate-700" : "bg-gray-200"
              }`}
            >
              <Users
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  theme === "dark" ? "text-slate-500" : "text-gray-500"
                }`}
              />
            </div>
            <h4
              className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${
                theme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              مدیریت کاربران
            </h4>
            <p
              className={`text-xs sm:text-sm ${
                theme === "dark" ? "text-slate-500" : "text-gray-400"
              }`}
            >
              به زودی...
            </p>
          </div>

          <div
            className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 cursor-not-allowed opacity-60 ${
              theme === "dark"
                ? "bg-slate-800/50 border-slate-700"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div
              className={`inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 ${
                theme === "dark" ? "bg-slate-700" : "bg-gray-200"
              }`}
            >
              <TrendingUp
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  theme === "dark" ? "text-slate-500" : "text-gray-500"
                }`}
              />
            </div>
            <h4
              className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${
                theme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              گزارشات
            </h4>
            <p
              className={`text-xs sm:text-sm ${
                theme === "dark" ? "text-slate-500" : "text-gray-400"
              }`}
            >
              به زودی...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
