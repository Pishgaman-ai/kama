"use client";
import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <button
      onClick={toggleTheme}
      aria-label="تغییر تم"
      className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group overflow-hidden backdrop-blur-xl shadow-lg hover:shadow-xl hover:scale-110 ${
        mounted && theme === "dark"
          ? "bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50"
          : "bg-white/80 hover:bg-white border border-slate-200"
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 ${
          mounted && theme === "dark"
            ? "from-blue-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100"
            : "from-blue-400/20 to-violet-400/20 opacity-0 group-hover:opacity-100"
        }`}
      ></div>

      <div className="relative">
        {!mounted ? (
          <Moon className="w-6 h-6 text-indigo-600 transition-all duration-500 rotate-0 group-hover:-rotate-12 group-hover:scale-110" />
        ) : theme === "dark" ? (
          <Sun className="w-6 h-6 text-amber-400 transition-all duration-500 rotate-0 group-hover:rotate-180 group-hover:scale-110" />
        ) : (
          <Moon className="w-6 h-6 text-indigo-600 transition-all duration-500 rotate-0 group-hover:-rotate-12 group-hover:scale-110" />
        )}
      </div>
    </button>
  );
}
