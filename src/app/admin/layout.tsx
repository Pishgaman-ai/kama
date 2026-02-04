"use client";
"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/app/components/ThemeContext";
import ThemeToggle from "@/app/components/ThemeToggle";
import {
  Shield,
  LogOut,
  School,
  Users,
  BarChart3,
  LineChart,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  User,
  Bot,
  FileText,
} from "lucide-react";

interface Admin {
  id: string;
  username: string;
  email: string;
  role: string;
}

type SidebarItem =
  | { icon: React.ElementType; label: string; href: string; isButton?: false }
  | {
      icon: React.ElementType;
      label: string;
      onClick: () => void;
      isButton: true;
    };

const SettingsPopup = ({
  isOpen,
  onClose,
  theme,
}: {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl ${
          theme === "dark"
            ? "bg-slate-800 border border-slate-700"
            : "bg-white border border-gray-200"
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 left-4 p-1 rounded-lg ${
            theme === "dark"
              ? "text-slate-400 hover:bg-slate-700"
              : "text-gray-500 hover:bg-gray-100"
          }`}
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>

          <h2
            className={`text-xl font-bold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            در دست طراحی
          </h2>

          <p
            className={`text-sm mb-6 ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            این بخش در حال توسعه است و به زودی در دسترس قرار خواهد گرفت.
          </p>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth/me");
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setAdmin(result.admin);
          } else {
            router.push("/admin/login");
          }
        } else {
          router.push("/admin/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  // If we're on the login page, don't apply the admin layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/me", { method: "DELETE" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/admin/login");
    }
  };

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

  if (!admin) {
    return null;
  }

  const sidebarItems: SidebarItem[] = [
    { icon: BarChart3, label: "داشبورد", href: "/admin" },
    { icon: LineChart, label: "????? ??????", href: "/admin/performance-analysis" },
    { icon: School, label: "مدیریت مدارس", href: "/admin/schools" },
    { icon: Users, label: "مدیریت کاربران", href: "/admin/users" },
    { icon: FileText, label: "منابع آموزشی", href: "/admin/resources" },
    { icon: Search, label: "لاگ‌ها", href: "/admin/logs" },
    { icon: Bot, label: "کمک‌کننده هوشمند", href: "/admin/ai-chat" },
    {
      icon: Settings,
      label: "تنظیمات",
      onClick: () => setShowSettingsPopup(true),
      isButton: true,
    },
  ];

  return (
    <div
      className={`min-h-screen ${
        theme === "dark" ? "bg-slate-950" : "bg-gray-50"
      }`}
      dir="rtl"
    >
      <SettingsPopup
        isOpen={showSettingsPopup}
        onClose={() => setShowSettingsPopup(false)}
        theme={theme}
      />

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
        } backdrop-blur-xl border-l flex flex-col`}
      >
        {/* Logo */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            theme === "dark" ? "border-slate-800/50" : "border-gray-200/50"
          }`}
        >
          <Link
            href="/admin"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
              پنل ادمین
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
                {admin?.username || "Admin"}
              </p>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                مدیر سیستم
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-6 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = !item.isButton && pathname === item.href;
              const Icon = item.icon;

              if (item.isButton) {
                return (
                  <li key={item.label}>
                    <button
                      onClick={item.onClick}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
                        theme === "dark"
                          ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                      }`}
                    >
                      <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              }

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
          </ul>
        </nav>

        {/* Footer actions */}
        <div
          className={`p-6 border-t ${
            theme === "dark" ? "border-slate-800/50" : "border-gray-200/50"
          }`}
        >
          <button
            onClick={handleLogout}
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
                  {pathname === "/admin"
                    ? "داشبورد ادمین"
                    : pathname === "/admin/performance-analysis"
                    ? "????? ??????"
                    : pathname === "/admin/schools"
                    ? "مدیریت مدارس"
                    : pathname === "/admin/users"
                    ? "مدیریت کاربران"
                    : pathname === "/admin/settings"
                    ? "تنظیمات"
                    : pathname === "/admin/logs"
                    ? "لاگ‌های سیستم"
                    : "پنل ادمین"}
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
                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 backdrop-blur-sm ${
                  theme === "dark"
                    ? "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    : "bg-gray-100/50 text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
                }`}
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
        <main className="p-3 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
