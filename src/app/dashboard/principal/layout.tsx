"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import ThemeToggle from "@/app/components/ThemeToggle";
import { getProfileImageUrl } from "@/lib/utils";
import {
  Home,
  User,
  BookOpen,
  BarChart3,
  LineChart,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Users,
  FileText,
  Search,
  GraduationCap,
  UserCheck,
  Bot,
  FileSpreadsheet,
  ListChecks,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  created_at: Date;
  profile_picture_url?: string;
  school_id?: string;
}

export default function PrincipalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // New state for collapsing
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on the AI communication full-screen page
  const isAICommunicationFullScreen =
    pathname === "/dashboard/principal/ai-communication";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          router.push("/signin");
          return;
        }

        const data = await response.json();
        if (data.user.role !== "principal") {
          router.push("/dashboard");
          return;
        }
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
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
      router.push("/");
    }
  };

  const sidebarItems = [
    { icon: Home, label: "داشبورد", href: "/dashboard/principal" },
    { icon: LineChart, label: "تحلیل عملکرد", href: "/dashboard/principal/performance-analysis" },
    { icon: Users, label: "معلمان", href: "/dashboard/principal/teachers" },
    {
      icon: UserCheck,
      label: "دانش‌آموزان",
      href: "/dashboard/principal/students",
    },
    {
      icon: GraduationCap,
      label: "کلاس‌ها",
      href: "/dashboard/principal/classes",
    },
    {
      icon: BookOpen,
      label: "درس‌ها",
      href: "/dashboard/principal/lessons",
    },
    {
      icon: ListChecks,
      label: "انواع فعالیت",
      href: "/dashboard/principal/activity-types",
    },
    {
      icon: FileSpreadsheet,
      label: "ورود و ویرایش گروهی فعالیت‌ها",
      href: "/dashboard/principal/bulk-activities",
    },
    {
      icon: BarChart3,
      label: "گزارش‌ها",
      href: "/dashboard/principal/reports",
    },
    {
      icon: Bot,
      label: "ارتباط با هوش مصنوعی",
      href: "/dashboard/principal/ai-communication",
    },
    { icon: Settings, label: "تنظیمات", href: "/dashboard/principal/settings" },
  ];

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

  // If we're on the AI communication full-screen page, render children without layout
  if (isAICommunicationFullScreen) {
    return <>{children}</>;
  }

  return (
    <div
      className={`min-h-screen ${
        theme === "dark" ? "bg-slate-950" : "bg-gray-50"
      }`}
      dir="rtl"
    >
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className={`fixed inset-0 z-40 lg:hidden ${
            theme === "dark" ? "bg-black/60" : "bg-black/40"
          } backdrop-blur-sm pointer-events-auto`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-50 transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        } ${sidebarCollapsed ? "w-20" : "w-72"} ${
          theme === "dark"
            ? "bg-slate-900/95 border-slate-800/50"
            : "bg-white/95 border-gray-200/50"
        } backdrop-blur-xl border-l flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            theme === "dark" ? "border-slate-800/50" : "border-gray-200/50"
          }`}
        >
          {!sidebarCollapsed || !sidebarOpen ? (
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
          ) : (
            <div className="flex items-center justify-center w-full">
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
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-xl transition-colors ${
                theme === "dark"
                  ? "hover:bg-slate-800/50 text-slate-400"
                  : "hover:bg-gray-100 text-gray-500"
              }`}
              aria-label={sidebarCollapsed ? "باز کردن منو" : "بستن منو"}
            >
              {sidebarCollapsed ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`lg:hidden p-2 rounded-xl transition-colors ${
                theme === "dark"
                  ? "hover:bg-slate-800/50 text-slate-400"
                  : "hover:bg-gray-100 text-gray-500"
              }`}
              aria-label="بستن منوی کناری"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User info */}
        <div
          className={`p-6 border-b ${
            theme === "dark" ? "border-slate-800/50" : "border-gray-200/50"
          } ${sidebarCollapsed ? "lg:hidden" : ""}`}
        >
          <div
            className={`flex items-center gap-3 p-3 rounded-2xl ${
              theme === "dark" ? "bg-slate-800/30" : "bg-gray-100/50"
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
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`font-semibold truncate ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {user?.name || user?.email || "کاربر"}
              </p>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                مدیر مدرسه
              </p>
            </div>
          </div>
        </div>

        {/* Collapsed user icon only - shown only on desktop when sidebar is collapsed */}
        {sidebarCollapsed && (
          <div className="p-6 flex justify-center hidden lg:flex">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
              {user.profile_picture_url ? (
                <img
                  src={getProfileImageUrl(user.profile_picture_url)}
                  alt="Profile"
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-6 flex-1 overflow-y-auto overscroll-contain mobile-sidebar-scrollable">
          <div className="pb-4">
            <ul
              className={`space-y-2 ${
                sidebarCollapsed ? "lg:flex lg:flex-col lg:items-center" : ""
              }`}
            >
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
                        isActive
                          ? theme === "dark"
                            ? "bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10"
                            : "bg-blue-50 text-blue-600 shadow-lg shadow-blue-500/5"
                          : theme === "dark"
                          ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                      } ${
                        sidebarCollapsed
                          ? "lg:justify-center lg:p-3 lg:rounded-xl"
                          : ""
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                          isActive ? "text-current" : ""
                        }`}
                      />
                      {(!sidebarCollapsed || !sidebarOpen) && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Footer actions */}
        <div
          className={`p-6 border-t ${
            theme === "dark" ? "border-slate-800/50" : "border-gray-200/50"
          } ${sidebarCollapsed ? "lg:hidden" : ""}`}
        >
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl transition-all duration-300 group ${
              theme === "dark"
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                : "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
            }`}
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-medium">خروج</span>
          </button>
        </div>

        {/* Collapsed logout icon only - shown only on desktop when sidebar is collapsed */}
        {sidebarCollapsed && (
          <div className="p-6 hidden lg:block">
            <button
              onClick={handleSignOut}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 group ${
                theme === "dark"
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                  : "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
              }`}
              title="خروج"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "lg:mr-20" : "lg:mr-72"
        } ${sidebarOpen ? "mr-72" : "mr-0"} lg:mr-0`}
      >
        {/* Dashboard Header */}
        <div className="p-3 sm:p-6 pb-0">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden p-2 rounded-xl transition-colors ${
                  theme === "dark"
                    ? "hover:bg-slate-800/50 text-slate-400"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
                aria-label="باز کردن منوی کناری"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div>
                <h1
                  className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {pathname === "/dashboard/principal"
                    ? "داشبورد مدیر مدرسه"
                    : pathname === "/dashboard/principal/performance-analysis"
                    ? "تحلیل عملکرد"
                    : pathname === "/dashboard/principal/teachers"
                    ? "مدیریت معلمان"
                    : pathname === "/dashboard/principal/students"
                    ? "مدیریت دانش‌آموزان"
                    : pathname === "/dashboard/principal/classes"
                    ? "مدیریت کلاس‌ها"
                    : pathname === "/dashboard/principal/lessons"
                    ? "مدیریت درس‌ها"
                    : pathname === "/dashboard/principal/activity-types"
                    ? "مدیریت انواع فعالیت"
                    : pathname === "/dashboard/principal/bulk-activities"
                    ? "ورود و ویرایش گروهی فعالیت‌ها"
                    : pathname === "/dashboard/principal/subjects"
                    ? "مدیریت درس‌ها"
                    : pathname === "/dashboard/principal/reports"
                    ? "گزارش‌ها"
                    : pathname === "/dashboard/principal/settings"
                    ? "تنظیمات"
                    : "داشبورد مدیر مدرسه"}
                </h1>
                <p
                  className={`text-xs sm:text-sm ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  امروز{" "}
                  {new Date().toLocaleDateString("fa-IR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    : "bg-gray-100/50 text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
                } backdrop-blur-sm`}
                aria-label="اعلان‌ها"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <ThemeToggle />
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
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
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {schoolName || "مدرسه نمونه دولتی"}
                  </h2>
                  <p
                    className={`text-xs ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    {schoolName ? "اطلاعات مدرسه" : "تهران، منطقه ۳"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
