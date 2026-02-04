"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import ThemeToggle from "@/app/components/ThemeToggle";
import {
  Home,
  User,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Users,
  FileText,
  Search,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  created_at: Date;
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          router.push("/signin");
          return;
        }

        const data = await response.json();
        if (data.user.role !== "teacher") {
          router.push("/dashboard");
          return;
        }
        setUser(data.user);
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
    { icon: Home, label: "داشبورد", href: "/dashboard/teacher" },
    {
      icon: BookOpen,
      label: "آزمون‌ها و تکالیف",
      href: "/dashboard/teacher/exams",
    },
    { icon: Users, label: "کلاس‌ها", href: "/dashboard/teacher/classes" },
    { icon: BarChart3, label: "گزارش‌ها", href: "/dashboard/teacher/reports" },
    { icon: Settings, label: "تنظیمات", href: "/dashboard/teacher/settings" },
  ];

  // Add AI Communication item
  const additionalItems = [
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
      href: "/dashboard/teacher/ai-communication",
      isSpecial: true,
    },
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
          } backdrop-blur-sm`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        } ${
          theme === "dark"
            ? "bg-slate-900/95 border-slate-800/50"
            : "bg-white/95 border-gray-200/50"
        } backdrop-blur-xl border-l`}
      >
        {/* Logo */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            theme === "dark" ? "border-slate-800/50" : "border-gray-200/50"
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

        {/* User info */}
        <div
          className={`p-6 border-b ${
            theme === "dark" ? "border-slate-800/50" : "border-gray-200/50"
          }`}
        >
          <div
            className={`flex items-center gap-3 p-3 rounded-2xl ${
              theme === "dark" ? "bg-slate-800/30" : "bg-gray-100/50"
            } backdrop-blur-sm`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <User className="w-6 h-6 text-white" />
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
                معلم
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-6 flex-1">
          <ul className="space-y-2">
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
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                        isActive ? "text-current" : ""
                      }`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}

            {/* Additional Items */}
            {additionalItems &&
              additionalItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => alert("در دست طراحی می‌باشد")}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
                        theme === "dark"
                          ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                          : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 transition-transform group-hover:scale-110`}
                      />
                      <span className="font-medium">{item.label}</span>
                      {item.isSpecial && (
                        <span className="ml-auto px-2 py-1 text-xs rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                          جدید
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
          </ul>
        </nav>

        {/* Footer actions */}
        <div
          className={`p-6 border-t ${
            theme === "dark" ? "border-slate-800/50" : "border-gray-200/50"
          }`}
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
      </div>

      {/* Main content */}
      <div className="lg:mr-72">
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
                  {pathname === "/dashboard/teacher"
                    ? "داشبورد معلم"
                    : pathname === "/dashboard/teacher/classes"
                    ? "مدیریت کلاس‌ها"
                    : pathname.startsWith("/dashboard/teacher/classes/")
                    ? "جزئیات کلاس"
                    : pathname === "/dashboard/teacher/exams"
                    ? "آزمون‌ها و تکالیف"
                    : pathname === "/dashboard/teacher/reports"
                    ? "گزارش‌ها"
                    : pathname === "/dashboard/teacher/settings"
                    ? "تنظیمات"
                    : "داشبورد معلم"}
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

              <div className="relative hidden sm:block">
                <Search
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    theme === "dark" ? "text-slate-400" : "text-gray-400"
                  }`}
                />
                <input
                  type="text"
                  placeholder="جستجو..."
                  className={`pl-4 pr-11 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                      : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                  }`}
                />
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
