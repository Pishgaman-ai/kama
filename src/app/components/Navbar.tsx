"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Menu, X, User, LogOut, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
}

type NavbarProps = {
  mobileMenuOpen: boolean;
  onToggleMobile: () => void;
};

export default function Navbar({
  mobileMenuOpen,
  onToggleMobile,
}: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="w-full py-3 md:py-4 bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-purple">
              کاما
            </h1>
            <div className="hidden sm:block h-6 w-px bg-gray-200"></div>
            <span className="hidden sm:block text-sm font-medium text-gray-600">
              دستیار یادگیری هوشمند
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <a
              href="#"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-purple hover:bg-brand-purple/5 rounded-lg transition-all duration-200"
            >
              صفحه اصلی
            </a>
            <a
              href="#"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-purple hover:bg-brand-purple/5 rounded-lg transition-all duration-200"
            >
              درباره کاما
            </a>
            <a
              href="#"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-purple hover:bg-brand-purple/5 rounded-lg transition-all duration-200"
            >
              امکانات
            </a>

            {user ? (
              <div className="relative group">
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-purple hover:bg-brand-purple/5 rounded-lg cursor-pointer transition-all duration-200">
                  <User className="w-4 h-4" />
                  <span className="hidden lg:inline">{user.email}</span>
                </div>
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-purple/10 hover:text-brand-purple"
                  >
                    داشبورد
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-brand-purple/10 hover:text-brand-purple flex items-center justify-end gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    خروج
                  </button>
                </div>
              </div>
            ) : (
              <a
                href="/signin"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-purple bg-brand-purple/10 hover:bg-brand-purple/20 rounded-lg transition-all duration-200"
              >
                <LogIn className="w-4 h-4" />
                ورود
              </a>
            )}

            <a
              href="tel:021-22877895"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-purple hover:bg-brand-purple/5 rounded-lg transition-all duration-200"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden lg:inline">۰۲۱-۲۲۸۷۷۸۹۵</span>
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-brand-purple hover:bg-brand-purple/5 rounded-lg transition-all duration-200"
            onClick={onToggleMobile}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mt-4 pb-4 md:hidden border-t border-gray-100 pt-4">
            <nav className="flex flex-col gap-1">
              <a
                href="#"
                className="px-4 py-3 text-base font-medium text-gray-700 hover:text-brand-purple hover:bg-brand-purple/5 rounded-lg transition-all duration-200"
                onClick={onToggleMobile}
              >
                صفحه اصلی
              </a>
              <a
                href="#"
                className="px-4 py-3 text-base font-medium text-gray-700 hover:text-brand-purple hover:bg-brand-purple/5 rounded-lg transition-all duration-200"
                onClick={onToggleMobile}
              >
                درباره کاما
              </a>
              <a
                href="#"
                className="px-4 py-3 text-base font-medium text-gray-700 hover:text-brand-purple hover:bg-brand-purple/5 rounded-lg transition-all duration-200"
                onClick={onToggleMobile}
              >
                امکانات
              </a>

              {user ? (
                <>
                  <div className="px-4 py-3 border-t border-gray-100 mt-2">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      {user.email}
                    </div>
                    <Link
                      href="/dashboard"
                      className="block w-full text-right px-4 py-2 text-base font-medium text-gray-700 hover:bg-brand-purple/10 hover:text-brand-purple rounded-lg"
                      onClick={onToggleMobile}
                    >
                      داشبورد
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        onToggleMobile();
                      }}
                      className="w-full text-right px-4 py-2 text-base font-medium text-gray-700 hover:bg-brand-purple/10 hover:text-brand-purple rounded-lg flex items-center justify-end gap-2 mt-1"
                    >
                      <LogOut className="w-5 h-5" />
                      خروج
                    </button>
                  </div>
                </>
              ) : (
                <a
                  href="/signin"
                  className="flex items-center justify-center gap-2 px-4 py-3 text-base font-medium text-brand-purple bg-brand-purple/10 hover:bg-brand-purple/20 rounded-lg mt-2"
                  onClick={onToggleMobile}
                >
                  <LogIn className="w-5 h-5" />
                  ورود
                </a>
              )}

              <a
                href="tel:021-22877895"
                className="flex items-center justify-center gap-2 px-4 py-3 text-base font-medium text-gray-700 hover:text-brand-purple hover:bg-brand-purple/5 rounded-lg mt-2"
                onClick={onToggleMobile}
              >
                <Phone className="w-5 h-5" />
                ۰۲۱-۲۲۸۷۷۸۹۵
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
