"use client";
import React from "react";
import { useTheme } from "./ThemeContext";

export type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  borderGradient: string;
};

type FeaturesProps = {
  features: Feature[];
};

export default function Features({ features }: FeaturesProps) {
  const { theme } = useTheme();
  return (
    <section id="features" className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div
            className={`inline-block px-4 py-2 rounded-full mb-6 border ${
              theme === "dark"
                ? "bg-white/5 border-white/10"
                : "bg-white border-slate-200"
            }`}
          >
            <span
              className={`text-sm font-semibold ${
                theme === "dark" ? "text-blue-400" : "text-blue-600"
              }`}
            >
              امکانات قدرتمند
            </span>
          </div>
          <h2
            className={`text-5xl md:text-6xl font-black mb-6 ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}
          >
            همه چیز برای موفقیت شما
          </h2>
          <p
            className={`text-xl max-w-2xl mx-auto ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            ابزارهای پیشرفته برای متحول کردن تجربه آموزشی
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group relative">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 rounded-3xl blur-2xl transition-all duration-500`}
              ></div>
              <div
                className={`relative backdrop-blur-xl border rounded-3xl p-8 transition-all duration-500 group-hover:-translate-y-2 ${
                  theme === "dark"
                    ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div
                  className={`relative w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                >
                  <div className="text-white">{feature.icon}</div>
                </div>
                <h3
                  className={`text-2xl font-bold mb-4 ${
                    theme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {feature.title}
                </h3>
                <p
                  className={`${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  } leading-relaxed`}
                >
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
