"use client";
import React from "react";
import { CheckCircle } from "lucide-react";
import { useTheme } from "./ThemeContext";

export type Role = {
  title: string;
  description: string;
  benefits: string[];
  icon: React.ReactNode;
  gradient: string;
};

type RolesProps = {
  roles: Role[];
};

export default function Roles({ roles }: RolesProps) {
  const { theme } = useTheme();
  return (
    <section id="roles" className="relative py-24 px-4">
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
                theme === "dark" ? "text-purple-400" : "text-purple-600"
              }`}
            >
              ساخته شده برای همه
            </span>
          </div>
          <h2
            className={`text-5xl md:text-6xl font-black mb-6 ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}
          >
            تجربه‌ای منحصر به فرد
          </h2>
          <p
            className={`text-xl max-w-2xl mx-auto ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            راه‌حل‌های تخصصی برای معلمان، دانش‌آموزان و والدین
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {roles.map((role, index) => (
            <div key={index} className="group relative">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-20 rounded-3xl blur-2xl transition-opacity duration-500`}
              ></div>
              <div
                className={`relative backdrop-blur-xl border rounded-3xl p-8 transition-all duration-500 ${
                  theme === "dark"
                    ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${role.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                >
                  <div className="text-white">{role.icon}</div>
                </div>
                <h3
                  className={`text-2xl font-bold mb-4 ${
                    theme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {role.title}
                </h3>
                <p
                  className={`${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  } mb-6 leading-relaxed`}
                >
                  {role.description}
                </p>
                <ul className="space-y-3">
                  {role.benefits.map((benefit, idx) => (
                    <li
                      key={idx}
                      className="flex items-start space-x-3 space-x-reverse group/item"
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                      <span
                        className={`${
                          theme === "dark"
                            ? "text-slate-400 group-hover/item:text-slate-300"
                            : "text-slate-600 group-hover/item:text-slate-700"
                        } transition-colors`}
                      >
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
