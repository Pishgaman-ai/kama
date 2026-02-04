"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/app/components/ThemeContext";

type PanelState = "ready" | "loading" | "empty" | "error";

interface InsightPanelProps {
  title: string;
  state?: PanelState;
  emptyMessage?: string;
  children?: ReactNode;
}

const stateCopy: Record<Exclude<PanelState, "ready">, string> = {
  loading: "در حال آماده‌سازی...",
  empty: "داده‌ای برای نمایش نیست",
  error: "خطا در دریافت داده",
};

const InsightPanel = ({
  title,
  state = "ready",
  emptyMessage,
  children,
}: InsightPanelProps) => {
  const { theme } = useTheme();

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${
        theme === "dark"
          ? "bg-slate-900/50 border-slate-800/50"
          : "bg-white border-gray-200"
      }`}
    >
      <h3
        className={`mb-4 text-base font-semibold ${
          theme === "dark" ? "text-white" : "text-slate-900"
        }`}
      >
        {title}
      </h3>

      {state === "ready" && children}

      {state !== "ready" && (
        <div
          className={`flex min-h-[160px] items-center justify-center text-sm ${
            theme === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {state === "empty" && emptyMessage ? emptyMessage : stateCopy[state]}
        </div>
      )}
    </div>
  );
};

export default InsightPanel;
