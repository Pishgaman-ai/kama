"use client";

import { useTheme } from "@/app/components/ThemeContext";

type CardState = "ready" | "loading" | "empty" | "error";

interface KpiCardProps {
  title: string;
  value: string;
  deltaText: string;
  deltaDirection: "up" | "down" | "neutral";
  description: string;
  breakdown?: Array<{ label: string; value: string }>;
  state?: CardState;
}

const stateCopy: Record<Exclude<CardState, "ready">, string> = {
  loading: "در حال بارگذاری...",
  empty: "داده‌ای برای نمایش نیست",
  error: "خطا در دریافت داده",
};

const KpiCard = ({
  title,
  value,
  deltaText,
  deltaDirection,
  description,
  breakdown,
  state = "ready",
}: KpiCardProps) => {
  const { theme } = useTheme();

  if (state !== "ready") {
    return (
      <div
        className={`rounded-2xl border p-4 sm:p-5 ${
          theme === "dark"
            ? "bg-slate-900/50 border-slate-800/50"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="space-y-3">
          <div className="h-4 w-2/3 rounded bg-gray-200/70 animate-pulse dark:bg-slate-800" />
          <div className="h-7 w-1/2 rounded bg-gray-200/70 animate-pulse dark:bg-slate-800" />
          <div className="h-4 w-3/4 rounded bg-gray-200/70 animate-pulse dark:bg-slate-800" />
          <p className="text-xs text-slate-500">{stateCopy[state]}</p>
        </div>
      </div>
    );
  }

  const deltaColor =
    deltaDirection === "up"
      ? "text-emerald-600"
      : deltaDirection === "down"
      ? "text-rose-600"
      : "text-slate-500";

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
        theme === "dark"
          ? "bg-slate-900/50 border-slate-800/50"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p
            className={`text-sm font-medium ${
              theme === "dark" ? "text-slate-300" : "text-slate-600"
            }`}
          >
            {title}
          </p>
          <div className="flex items-end gap-2">
            <span
              className={`text-2xl font-semibold ${
                theme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              {value}
            </span>
            <span className={`text-xs font-semibold ${deltaColor}`}>
              {deltaText}
            </span>
          </div>
        </div>
      </div>

      <p
        className={`mt-3 text-xs ${
          theme === "dark" ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {description}
      </p>

      {breakdown && breakdown.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {breakdown.map((item) => (
            <span
              key={item.label}
              className={`rounded-full px-2 py-1 text-xs ${
                theme === "dark"
                  ? "bg-slate-800 text-slate-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
