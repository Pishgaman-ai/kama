"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTheme } from "./ThemeContext";

export type Stat = { value: string; label: string; icon: React.ReactNode };

type HeroProps = {
  stats: Stat[];
};

export default function Hero({ stats }: HeroProps) {
  const { theme } = useTheme();
  const heroImageSrc =
    theme === "dark" ? "/ai_assistant02.png" : "/ai_assistant01.png";

  return (
    <section className="relative pt-8 md:pt-12 pb-24 px-4">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          <div
            className={`inline-flex items-center space-x-2 space-x-reverse backdrop-blur-xl border px-5 py-2.5 rounded-full mb-8 group transition-all ${
              theme === "dark"
                ? "bg-white/5 border-white/10 hover:bg-white/10"
                : "bg-slate-900/5 border-slate-200 hover:bg-slate-900/10"
            }`}
          >
            <div className="relative">
              <Sparkles
                className={`w-4 h-4 animate-pulse ${
                  theme === "dark" ? "text-blue-400" : "text-blue-600"
                }`}
              />
            </div>
            <span
              className={`text-sm font-semibold transition-colors duration-300 ${
                theme === "dark" ? "text-slate-200" : "text-slate-800"
              }`}
            >
              انقلاب یادگیری با هوش مصنوعی
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
            <span className="inline-block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              یادگیری را متحول کنید
            </span>
            <br />
            <span
              className={`inline-block bg-gradient-to-r bg-clip-text text-transparent transition-colors duration-500 ${
                theme === "dark"
                  ? "from-slate-200 to-slate-400"
                  : "from-slate-700 to-slate-900"
              }`}
            >
              با هوش مصنوعی
            </span>
          </h1>

          <p
            className={`text-xl md:text-2xl mb-12 leading-relaxed max-w-3xl mx-auto transition-colors duration-500 ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            نمره‌دهی آزمون‌ها را خودکار کنید، بازخورد شخصی‌سازی شده ارائه دهید و
            تحلیل‌های قدرتمند برای بهینه‌سازی کل فرآیند یادگیری.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20">
            <button className="group relative px-10 py-5 font-bold text-lg text-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity"></div>
              <span className="relative flex items-center space-x-2 space-x-reverse">
                <span>شروع آزمایشی رایگان</span>
                <ArrowRight className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <Link
              href="/demo"
              className={`px-10 py-5 backdrop-blur-xl border rounded-2xl font-bold text-lg transition-all ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20"
                  : "bg-slate-900/5 border-slate-200 text-slate-800 hover:bg-slate-900/10 hover:border-slate-300"
              }`}
            >
              مشاهده دمو
            </Link>
          </div>

          <div className="relative mx-auto mb-16 w-full max-w-4xl">
            <div
              className={`relative rounded-3xl overflow-hidden border transition-colors duration-500 ${
                theme === "dark" ? "border-white/10" : "border-slate-200"
              }`}
            >
              <Image
                src={heroImageSrc}
                alt="هوش مصنوعی کاما"
                width={1600}
                height={900}
                priority
                className="w-full h-auto select-none"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="relative group">
                <div
                  className={`absolute inset-0 bg-gradient-to-br rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                    theme === "dark"
                      ? "from-blue-500/20 to-purple-500/20"
                      : "from-blue-400/30 to-purple-400/30"
                  }`}
                ></div>
                <div
                  className={`relative backdrop-blur-xl border rounded-2xl p-6 transition-all ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      : "bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center space-x-2 space-x-reverse mb-3 transition-colors duration-300 ${
                      theme === "dark" ? "text-blue-400" : "text-blue-600"
                    }`}
                  >
                    {stat.icon}
                  </div>
                  <div className="text-4xl md:text-5xl font-black bg-gradient-to-br from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div
                    className={`text-sm font-medium transition-colors duration-300 ${
                      theme === "dark" ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
