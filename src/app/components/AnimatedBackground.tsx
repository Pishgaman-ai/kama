"use client";
import React from "react";
import { useTheme } from "./ThemeContext";

type AnimatedBackgroundProps = {
  mouseX: number;
  mouseY: number;
};

export default function AnimatedBackground({
  mouseX,
  mouseY,
}: AnimatedBackgroundProps) {
  const { theme } = useTheme();
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div
        className={
          theme === "dark"
            ? "absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"
            : "absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
        }
      ></div>
      <div
        className={`absolute w-[500px] h-[500px] rounded-full blur-3xl ${
          theme === "dark" ? "bg-blue-500/10" : "bg-blue-400/20"
        }`}
        style={{
          left: `${mouseX - 250}px`,
          top: `${mouseY - 250}px`,
          transition: "all 0.3s ease-out",
        }}
      ></div>
      <div
        className={`absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl animate-pulse ${
          theme === "dark" ? "bg-purple-500/10" : "bg-violet-300/30"
        }`}
      ></div>
      <div
        className={`absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-3xl animate-pulse ${
          theme === "dark" ? "bg-emerald-500/10" : "bg-cyan-300/20"
        }`}
        style={{ animationDelay: "1s" }}
      ></div>
    </div>
  );
}
