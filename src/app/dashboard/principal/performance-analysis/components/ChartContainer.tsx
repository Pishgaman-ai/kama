"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/app/components/ThemeContext";

type ChartState = "ready" | "loading" | "empty" | "error";

interface ChartContainerProps {
  title: string;
  description?: string;
  state?: ChartState;
  emptyMessage?: string;
  children?: ReactNode;
}

const stateCopy: Record<Exclude<ChartState, "ready">, string> = {
  loading: "در حال بارگذاری نمودار...",
  empty: "داده‌ای برای ترسیم نمودار وجود ندارد",
  error: "خطا در دریافت داده‌ها",
};

const ChartContainer = ({
  title,
  description,
  state = "ready",
  emptyMessage,
  children,
}: ChartContainerProps) => {
  const { theme } = useTheme();

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-6 ${
        theme === "dark"
          ? "bg-slate-900/50 border-slate-800/50"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="mb-4 space-y-1">
        <h3
          className={`text-base font-semibold ${
            theme === "dark" ? "text-white" : "text-slate-900"
          }`}
        >
          {title}
        </h3>
        {description && (
          <p
            className={`text-xs ${
              theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {description}
          </p>
        )}
      </div>

      {state === "ready" && children}

      {state !== "ready" && (
        <div
          className={`flex h-56 items-center justify-center text-sm ${
            theme === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {state === "empty" && emptyMessage ? emptyMessage : stateCopy[state]}
        </div>
      )}
    </div>
  );
};

export default ChartContainer;
