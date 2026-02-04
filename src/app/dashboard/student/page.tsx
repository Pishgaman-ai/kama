"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/app/components/ThemeContext";
import ThemeToggle from "@/app/components/ThemeToggle";
import { getProfileImageUrl } from "@/lib/utils";
import {
  BookOpen,
  Home,
  CheckCircle2,
  Clock,
  BarChart3,
  Bell,
  User,
  Settings,
  Users,
  LogOut,
  Calendar,
  TrendingUp,
  Award,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Menu,
} from "lucide-react";

interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  national_id?: string;
  role: string;
  school_id?: string;
  profile_picture_url?: string;
  created_at: Date;
  class?: string;
  school?: string;
}

export default function StudentDashboard() {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState<string | null>(null);

  const isDark = theme === "dark";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          // Redirect to sign in if not authenticated
          window.location.href = "/signin";
          return;
        }

        const data = await response.json();
        setUser(data.user);

        // Fetch school name if school_id exists
        if (data.user.school_id) {
          try {
            const schoolResponse = await fetch(
              `/api/schools/${data.user.school_id}`
            );
            if (schoolResponse.ok) {
              const schoolData = await schoolResponse.json();
              setSchoolName(schoolData.school?.name || null);
            }
          } catch (error) {
            console.error("Error fetching school name:", error);
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        window.location.href = "/signin";
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleAIClick = () => {
    alert("در دست طراحی می‌باشد");
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === "dark"
            ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
            : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
        }`}
      >
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

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  // Mock data - replace with API calls
  const stats = [
    {
      title: "آزمون‌های در پیش",
      value: "3",
      icon: Clock,
      color: "blue",
      trend: null,
    },
    {
      title: "میانگین نمرات",
      value: "17.8",
      icon: BarChart3,
      color: "green",
      trend: "+0.5",
    },
    {
      title: "آزمون‌های تکمیل‌شده",
      value: "12",
      icon: CheckCircle2,
      color: "purple",
      trend: null,
    },
    {
      title: "رتبه کلاسی",
      value: "5",
      icon: Award,
      color: "amber",
      trend: "↑2",
    },
  ];

  const upcomingExams = [
    {
      id: 1,
      subject: "ریاضی",
      chapter: "فصل 2: مثلثات",
      date: "1403/07/15",
      time: "10:00",
      duration: "90 دقیقه",
      status: "باز",
    },
    {
      id: 2,
      subject: "فیزیک",
      chapter: "فصل 3: الکتریسیته",
      date: "1403/07/18",
      time: "14:00",
      duration: "60 دقیقه",
      status: "باز",
    },
    {
      id: 3,
      subject: "شیمی",
      chapter: "فصل 1: اتم و جدول تناوبی",
      date: "1403/07/20",
      time: "09:00",
      duration: "75 دقیقه",
      status: "باز",
    },
  ];

  const completedExams = [
    {
      id: 1,
      subject: "فارسی",
      chapter: "فصل 1: ادبیات کلاسیک",
      date: "1403/07/10",
      grade: 18.5,
      aiGrade: 18.0,
      status: "تصحیح شده",
    },
    {
      id: 2,
      subject: "عربی",
      chapter: "فصل 2: قواعد",
      date: "1403/07/08",
      grade: 17.0,
      aiGrade: 17.5,
      status: "تصحیح شده",
    },
    {
      id: 3,
      subject: "زیست‌شناسی",
      chapter: "فصل 4: ژنتیک",
      date: "1403/07/05",
      grade: 19.0,
      aiGrade: 19.0,
      status: "تصحیح شده",
    },
    {
      id: 4,
      subject: "انگلیسی",
      chapter: "فصل 3: گرامر پیشرفته",
      date: "1403/07/03",
      grade: 16.5,
      aiGrade: 16.0,
      status: "تصحیح شده",
    },
  ];

  const subjectPerformance = [
    { subject: "ریاضی", average: 17.5, exams: 8, trend: "up" },
    { subject: "فیزیک", average: 18.2, exams: 6, trend: "up" },
    { subject: "شیمی", average: 16.8, exams: 7, trend: "down" },
    { subject: "زیست‌شناسی", average: 19.0, exams: 5, trend: "up" },
    { subject: "فارسی", average: 18.5, exams: 6, trend: "stable" },
    { subject: "عربی", average: 17.0, exams: 4, trend: "up" },
  ];

  const notifications = [
    {
      id: 1,
      type: "exam",
      message: "آزمون ریاضی فردا برگزار می‌شود",
      time: "2 ساعت پیش",
    },
    {
      id: 2,
      type: "grade",
      message: "نمره آزمون فارسی ثبت شد",
      time: "5 ساعت پیش",
    },
    {
      id: 3,
      type: "info",
      message: "معلم فیزیک بازخورد جدیدی ارسال کرد",
      time: "1 روز پیش",
    },
  ];

  const sidebarItems = [
    { icon: Home, label: "داشبورد", href: "/dashboard", active: true },
    { icon: BookOpen, label: "آزمون‌ها", href: "/dashboard/exams" },
    { icon: Users, label: "کلاس‌ها", href: "/dashboard/classes" },
    { icon: BarChart3, label: "گزارش‌ها", href: "/dashboard/reports" },
    { icon: FileText, label: "منابع", href: "/dashboard/resources" },
    { icon: Settings, label: "تنظیمات", href: "/dashboard/settings" },
    {
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-sparkles"
          {...props}
        >
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          <path d="M5 3v4" />
          <path d="M19 17v4" />
          <path d="M3 5h4" />
          <path d="M17 19h4" />
        </svg>
      ),
      label: "ارتباط با هوش مصنوعی",
      onClick: handleAIClick,
      badge: "جدید",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: isDark
        ? "bg-blue-500/10 text-blue-400"
        : "bg-blue-50 text-blue-600",
      green: isDark
        ? "bg-green-500/10 text-green-400"
        : "bg-green-50 text-green-600",
      purple: isDark
        ? "bg-purple-500/10 text-purple-400"
        : "bg-purple-50 text-purple-600",
      amber: isDark
        ? "bg-amber-500/10 text-amber-400"
        : "bg-amber-50 text-amber-600",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div
      className={`${isDark ? "bg-slate-950" : "bg-gray-50"} min-h-screen`}
      dir="rtl"
    >
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className={`fixed inset-0 z-40 lg:hidden ${
            isDark ? "bg-black/60" : "bg-black/40"
          } backdrop-blur-sm`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        } ${
          isDark
            ? "bg-slate-900/95 border-slate-800/50"
            : "bg-white/95 border-gray-200/50"
        } backdrop-blur-xl border-l`}
      >
        {/* Logo */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDark ? "border-slate-800/50" : "border-gray-200/50"
          }`}
        >
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
              کاما
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`${
              isDark
                ? "hover:bg-slate-800/50 text-slate-400"
                : "hover:bg-gray-100 text-gray-500"
            } lg:hidden p-2 rounded-xl transition-colors`}
            aria-label="بستن منوی کناری"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div
          className={`p-6 border-b ${
            isDark ? "border-slate-800/50" : "border-gray-200/50"
          }`}
        >
          <div
            className={`flex items-center gap-3 p-3 rounded-2xl ${
              isDark ? "bg-slate-800/30" : "bg-gray-100/50"
            } backdrop-blur-sm`}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
              {user.profile_picture_url ? (
                <img
                  src={getProfileImageUrl(user.profile_picture_url)}
                  alt="Profile"
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`font-semibold truncate ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {user.name}
              </p>
              <p
                className={`text-sm ${
                  isDark ? "text-slate-400" : "text-gray-500"
                }`}
              >
                دانش‌آموز
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.href || item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active
                  ? isDark
                    ? "bg-gradient-to-l from-blue-500/10 to-violet-500/10 text-white border border-blue-500/20 shadow-lg shadow-blue-500/5"
                    : "bg-gradient-to-l from-blue-50 to-violet-50 text-blue-600 border border-blue-200 shadow-sm"
                  : isDark
                  ? "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              onClick={item.onClick}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <span className="mr-auto px-2 py-0.5 text-xs font-medium bg-amber-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
              {item.active && (
                <div className="mr-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="absolute bottom-6 left-4 right-4">
          <button
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isDark
                ? "text-slate-400 hover:bg-slate-800/50 hover:text-red-400"
                : "text-gray-600 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">خروج</span>
          </button>
        </div>
      </div>
      {/* Header */}
      <div className="lg:mr-72">
        <header
          className={`sticky top-0 z-30 backdrop-blur-xl border-b ${
            isDark
              ? "bg-slate-900/95 border-slate-800/50"
              : "bg-white/95 border-gray-200/50"
          }`}
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`${
                    isDark
                      ? "hover:bg-slate-800/50 text-slate-400"
                      : "hover:bg-gray-100 text-gray-500"
                  } lg:hidden p-2 rounded-xl transition-colors`}
                  aria-label="باز کردن منوی کناری"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div
                  className={`${
                    isDark ? "bg-blue-500/10" : "bg-blue-50"
                  } p-3 rounded-xl`}
                >
                  <BookOpen
                    className={`w-6 h-6 ${
                      isDark ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                </div>
                <div>
                  <h1
                    className={`text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    داشبورد دانش‌آموز
                  </h1>
                  <p
                    className={`text-sm ${
                      isDark ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    خوش آمدی، {user.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* School Logo and Info */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l9-5-9-5-9 5 9 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l9-5-9-5-9 5 9 5zm0 0v6"
                      />
                    </svg>
                  </div>
                  <div className="hidden sm:block">
                    <h2
                      className={`font-bold text-sm sm:text-base ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {schoolName || "مدرسه نمونه دولتی"}
                    </h2>
                    <p
                      className={`text-xs ${
                        isDark ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      {schoolName ? "اطلاعات مدرسه" : "تهران، منطقه ۳"}
                    </p>
                  </div>
                </div>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <button
                  aria-label="اعلان‌ها"
                  title="اعلان‌ها"
                  className={`relative p-2.5 rounded-xl transition-all border ${
                    isDark
                      ? "hover:bg-slate-800/50 text-slate-400 hover:text-white border-slate-700/50"
                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-gray-200"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-rose-500 rounded-full text-xs text-white flex items-center justify-center font-medium shadow-lg shadow-red-500/30">
                    3
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* User Info Bar */}
          <div
            className={`px-6 py-3 border-t ${
              isDark
                ? "border-slate-800/50 bg-slate-900/50"
                : "border-gray-200/50 bg-gray-50/50"
            }`}
          >
            <div className="flex items-center gap-6 text-sm">
              <span className={isDark ? "text-slate-400" : "text-gray-600"}>
                شماره دانش‌آموزی:{" "}
                <span className={isDark ? "text-slate-200" : "text-gray-900"}>
                  {user.national_id || "نامشخص"}
                </span>
              </span>
              <span className={isDark ? "text-slate-400" : "text-gray-600"}>
                کلاس:{" "}
                <span className={isDark ? "text-slate-200" : "text-gray-900"}>
                  {user.class || "نامشخص"}
                </span>
              </span>
              <span className={isDark ? "text-slate-400" : "text-gray-600"}>
                مدرسه:{" "}
                <span className={isDark ? "text-slate-200" : "text-gray-900"}>
                  {user.school || "نامشخص"}
                </span>
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 space-y-6">
          {/* Welcome Section */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 p-8 shadow-2xl shadow-blue-900/30">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2">
                خوش آمدی، {user.name} 👋
              </h2>
              <p className="text-blue-100 mb-6">
                امروز {stats[0].value} آزمون پیش رو و میانگین نمرات{" "}
                {stats[1].value}
              </p>
              <button className="px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                <span>شروع یادگیری</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const iconBg =
                stat.color === "blue"
                  ? isDark
                    ? "bg-blue-500/10"
                    : "bg-blue-50"
                  : stat.color === "green"
                  ? isDark
                    ? "bg-emerald-500/10"
                    : "bg-emerald-50"
                  : stat.color === "purple"
                  ? isDark
                    ? "bg-violet-500/10"
                    : "bg-violet-50"
                  : isDark
                  ? "bg-amber-500/10"
                  : "bg-amber-50";
              const iconColor =
                stat.color === "blue"
                  ? isDark
                    ? "text-blue-500"
                    : "text-blue-600"
                  : stat.color === "green"
                  ? isDark
                    ? "text-emerald-500"
                    : "text-emerald-600"
                  : stat.color === "purple"
                  ? isDark
                    ? "text-violet-500"
                    : "text-violet-600"
                  : isDark
                  ? "text-amber-500"
                  : "text-amber-600";
              const bgGradient =
                stat.color === "blue"
                  ? "from-blue-500/10 to-blue-600/10"
                  : stat.color === "green"
                  ? "from-emerald-500/10 to-emerald-600/10"
                  : stat.color === "purple"
                  ? "from-violet-500/10 to-violet-600/10"
                  : "from-amber-500/10 to-amber-600/10";
              return (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-2xl backdrop-blur-sm border p-6 transition-all hover:shadow-xl ${
                    isDark
                      ? "bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 hover:shadow-slate-900/50"
                      : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-gray-200/50"
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity`}
                  />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${iconBg}`}>
                        <stat.icon className={`w-6 h-6 ${iconColor}`} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p
                        className={`text-sm font-medium ${
                          isDark ? "text-slate-400" : "text-gray-500"
                        }`}
                      >
                        {stat.title}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <h3
                          className={`text-3xl font-bold ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {stat.value}
                        </h3>
                        {stat.trend && (
                          <span
                            className={`text-xs px-2 py-1 rounded-lg font-medium ${
                              stat.trend.includes("+") ||
                              stat.trend.includes("↑")
                                ? isDark
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-emerald-50 text-emerald-600"
                                : isDark
                                ? "bg-red-500/10 text-red-400"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {stat.trend}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Exams */}
              <div
                className={`rounded-2xl backdrop-blur-sm border ${
                  isDark
                    ? "bg-slate-900/50 border-slate-800/50"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="p-6 border-b border-inherit">
                  <div className="flex items-center justify-between">
                    <h2
                      className={`text-lg font-bold flex items-center gap-2 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      <Clock className="w-5 h-5" />
                      آزمون‌های پیش رو
                    </h2>
                    <button
                      className={`text-sm flex items-center gap-1 ${
                        isDark
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-700"
                      }`}
                    >
                      <span>مشاهده همه</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div
                  className={`divide-y ${
                    isDark ? "divide-slate-800/50" : "divide-gray-200"
                  }`}
                >
                  {upcomingExams.map((exam) => (
                    <div
                      key={exam.id}
                      className={`p-6 transition-colors ${
                        isDark ? "hover:bg-slate-800/30" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`font-bold ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {exam.subject}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                isDark
                                  ? "bg-green-500/10 text-green-400"
                                  : "bg-green-50 text-green-600"
                              }`}
                            >
                              {exam.status}
                            </span>
                          </div>
                          <p
                            className={`text-sm ${
                              isDark ? "text-slate-400" : "text-gray-600"
                            }`}
                          >
                            {exam.chapter}
                          </p>
                        </div>
                        <button
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-[1.02] ${
                            isDark
                              ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          شروع آزمون
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span
                          className={`flex items-center gap-1 ${
                            isDark ? "text-slate-400" : "text-gray-600"
                          }`}
                        >
                          <Calendar className="w-4 h-4" />
                          {exam.date}
                        </span>
                        <span
                          className={
                            isDark ? "text-slate-400" : "text-gray-600"
                          }
                        >
                          ساعت {exam.time}
                        </span>
                        <span
                          className={
                            isDark ? "text-slate-400" : "text-gray-600"
                          }
                        >
                          {exam.duration}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completed Exams */}
              <div
                className={`rounded-2xl backdrop-blur-sm border ${
                  isDark
                    ? "bg-slate-900/50 border-slate-800/50"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="p-6 border-b border-inherit">
                  <div className="flex items-center justify-between">
                    <h2
                      className={`text-lg font-bold flex items-center gap-2 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      آزمون‌های تصحیح شده
                    </h2>
                    <button
                      className={`text-sm flex items-center gap-1 ${
                        isDark
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-700"
                      }`}
                    >
                      <span>کارنامه کامل</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div
                  className={`divide-y ${
                    isDark ? "divide-slate-800/50" : "divide-gray-200"
                  }`}
                >
                  {completedExams.map((exam) => (
                    <div
                      key={exam.id}
                      className={`p-6 transition-colors ${
                        isDark ? "hover:bg-slate-800/30" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`font-bold ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {exam.subject}
                            </h3>
                          </div>
                          <p
                            className={`text-sm mb-2 ${
                              isDark ? "text-slate-400" : "text-gray-600"
                            }`}
                          >
                            {exam.chapter}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span
                              className={`flex items-center gap-1 ${
                                isDark ? "text-slate-400" : "text-gray-600"
                              }`}
                            >
                              <Calendar className="w-4 h-4" />
                              {exam.date}
                            </span>
                            {exam.aiGrade !== exam.grade && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  isDark
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-amber-50 text-amber-600"
                                }`}
                              >
                                نمره AI: {exam.aiGrade}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-left">
                          <div
                            className={`text-3xl font-bold mb-2 ${
                              exam.grade >= 18
                                ? isDark
                                  ? "text-emerald-400"
                                  : "text-emerald-600"
                                : exam.grade >= 15
                                ? isDark
                                  ? "text-blue-400"
                                  : "text-blue-600"
                                : isDark
                                ? "text-amber-400"
                                : "text-amber-600"
                            }`}
                          >
                            {exam.grade}
                          </div>
                          <button
                            className={`text-xs ${
                              isDark
                                ? "text-slate-400 hover:text-slate-300"
                                : "text-gray-600 hover:text-gray-700"
                            }`}
                          >
                            مشاهده جزئیات
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Subject Performance */}
              <div
                className={`rounded-2xl backdrop-blur-sm border ${
                  isDark
                    ? "bg-slate-900/50 border-slate-800/50"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="p-6 border-b border-inherit">
                  <h2
                    className={`text-lg font-bold flex items-center gap-2 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    عملکرد درس‌ها
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {subjectPerformance.map((subject, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm font-medium ${
                            isDark ? "text-slate-200" : "text-gray-900"
                          }`}
                        >
                          {subject.subject}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              subject.average >= 18
                                ? isDark
                                  ? "text-green-400"
                                  : "text-green-600"
                                : subject.average >= 15
                                ? isDark
                                  ? "text-blue-400"
                                  : "text-blue-600"
                                : isDark
                                ? "text-amber-400"
                                : "text-amber-600"
                            }`}
                          >
                            {subject.average}
                          </span>
                          <span className="text-xs">
                            {subject.trend === "up"
                              ? "📈"
                              : subject.trend === "down"
                              ? "📉"
                              : "➡️"}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`h-2 rounded-full overflow-hidden ${
                          isDark ? "bg-slate-800" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`h-full rounded-full ${
                            subject.average >= 18
                              ? "bg-green-500"
                              : subject.average >= 15
                              ? "bg-blue-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${(subject.average / 20) * 100}%` }}
                        />
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          isDark ? "text-slate-500" : "text-gray-500"
                        }`}
                      >
                        {subject.exams} آزمون
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div
                className={`rounded-2xl backdrop-blur-sm border ${
                  isDark
                    ? "bg-slate-900/50 border-slate-800/50"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="p-6 border-b border-inherit">
                  <h2
                    className={`text-lg font-bold flex items-center gap-2 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                    اعلان‌ها
                  </h2>
                </div>
                <div
                  className={`divide-y ${
                    isDark ? "divide-slate-800/50" : "divide-gray-200"
                  }`}
                >
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 transition-colors ${
                        isDark ? "hover:bg-slate-800/30" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`p-2 rounded-lg h-fit ${
                            notif.type === "exam"
                              ? isDark
                                ? "bg-blue-500/10"
                                : "bg-blue-50"
                              : notif.type === "grade"
                              ? isDark
                                ? "bg-green-500/10"
                                : "bg-green-50"
                              : isDark
                              ? "bg-purple-500/10"
                              : "bg-purple-50"
                          }`}
                        >
                          {notif.type === "exam" ? (
                            <Clock
                              className={`w-4 h-4 ${
                                isDark ? "text-blue-400" : "text-blue-600"
                              }`}
                            />
                          ) : notif.type === "grade" ? (
                            <CheckCircle2
                              className={`w-4 h-4 ${
                                isDark ? "text-green-400" : "text-green-600"
                              }`}
                            />
                          ) : (
                            <AlertCircle
                              className={`w-4 h-4 ${
                                isDark ? "text-purple-400" : "text-purple-600"
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm ${
                              isDark ? "text-slate-200" : "text-gray-900"
                            }`}
                          >
                            {notif.message}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isDark ? "text-slate-500" : "text-gray-500"
                            }`}
                          >
                            {notif.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
