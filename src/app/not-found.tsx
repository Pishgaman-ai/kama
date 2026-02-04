"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "./components/ThemeContext";
import { useChrome } from "./components/SiteChrome";

export default function NotFoundPage() {
  const { theme } = useTheme();
  const { setChromeHidden } = useChrome();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isDark = theme === "dark";

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    setChromeHidden(true);
    return () => setChromeHidden(false);
  }, [setChromeHidden]);

  return (
    <main
      className={`min-h-screen w-full relative overflow-hidden flex items-center justify-center px-4 transition-colors duration-700 ${
        isDark ? "bg-slate-950" : "bg-gradient-to-br from-slate-50 to-slate-100"
      }`}
    >
      {/* Animated cursor glow */}
      <div
        className="pointer-events-none fixed w-96 h-96 rounded-full blur-3xl opacity-20 transition-opacity duration-300"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)"
            : "radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)",
          left: mousePos.x - 192,
          top: mousePos.y - 192,
        }}
      />

      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className={`absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-30 animate-pulse ${
            isDark ? "bg-violet-600" : "bg-violet-400"
          }`}
          style={{ animationDuration: "4s" }}
        />
        <div
          className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-25 animate-pulse ${
            isDark ? "bg-blue-600" : "bg-blue-400"
          }`}
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full blur-[120px] opacity-20 ${
            isDark ? "bg-fuchsia-600" : "bg-indigo-400"
          }`}
        />
      </div>

      {/* Theme controlled globally via Navbar */}

      {/* Main card */}
      <div
        className={`relative z-10 max-w-3xl w-full rounded-3xl backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-700 ${
          isDark
            ? "bg-slate-900/40 border border-slate-700/50"
            : "bg-white/60 border border-white/80"
        }`}
      >
        {/* Gradient border effect */}
        <div
          className={`absolute inset-0 rounded-3xl opacity-60 ${
            isDark
              ? "bg-gradient-to-br from-violet-500/20 via-transparent to-blue-500/20"
              : "bg-gradient-to-br from-violet-300/30 via-transparent to-blue-300/30"
          }`}
        />

        <div className="relative p-8 md:p-12 text-center">
          {/* Animated 404 badge */}
          <div className="relative mx-auto mb-8 inline-block">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500 to-blue-500 blur-xl opacity-60 animate-pulse" />
            <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <span className="text-4xl font-black tracking-tight">404</span>
            </div>
          </div>

          {/* Title with gradient */}
          <h1
            className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r ${
              isDark
                ? "from-violet-200 via-white to-blue-200"
                : "from-violet-600 via-slate-900 to-blue-600"
            }`}
          >
            صفحه‌ای که دنبالش بودید پیدا نشد
          </h1>

          <p
            className={`text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            ممکن است آدرس را اشتباه وارد کرده باشید یا صفحه حذف شده باشد.
            <br />
            <span className="font-semibold">
              نگران نباشید، ما کمکتان می‌کنیم!
            </span>
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center mb-8">
            <Link
              href="/"
              className={`group relative inline-flex items-center justify-center rounded-2xl px-8 py-4 text-base font-bold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 overflow-hidden ${
                isDark
                  ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white ring-violet-500/50"
                  : "bg-gradient-to-r from-violet-600 to-blue-600 text-white ring-violet-600/50"
              }`}
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-violet-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                بازگشت به صفحه اصلی
              </span>
            </Link>

            {null}
          </div>

          {/* Quick links */}
          <div
            className={`pt-8 border-t ${
              isDark ? "border-slate-700/50" : "border-slate-200"
            }`}
          >
            <p
              className={`text-sm mb-4 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              یا می‌توانید این صفحات را امتحان کنید:
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                { label: "تماس با ما", icon: "📞" },
                { label: "پشتیبانی", icon: "💬" },
                { label: "وبلاگ", icon: "📝" },
                { label: "محصولات", icon: "🛍️" },
              ].map((item) => (
                <a
                  key={item.label}
                  href="#"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    isDark
                      ? "bg-slate-800/60 text-slate-300 hover:bg-slate-700/80"
                      : "bg-white/60 text-slate-700 hover:bg-white/90"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Error code */}
          <div
            className={`mt-8 text-sm font-mono ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            <span className="opacity-60">ERROR_CODE:</span> 404 • PAGE_NOT_FOUND
          </div>
        </div>
      </div>

      {/* Animated grid overlay */}
      <div
        className={`pointer-events-none fixed inset-0 opacity-[0.03] ${
          isDark
            ? "[background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)]"
            : "[background-image:linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)]"
        } [background-size:50px_50px]`}
        style={{
          transform: `translate(${mousePos.x * 0.01}px, ${
            mousePos.y * 0.01
          }px)`,
        }}
      />
    </main>
  );
}
