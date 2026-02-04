"use client";

import React from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { Plus, Upload } from "lucide-react";

interface ActivitiesTabHeaderProps {
  onAddActivity: () => void;
  onBulkUpload: () => void;
}

export default function ActivitiesTabHeader({
  onAddActivity,
  onBulkUpload,
}: ActivitiesTabHeaderProps) {
  const { theme } = useTheme();

  return (
    <div className="flex items-center justify-between mb-4 sm:mb-6">
      <h2
        className={`text-lg sm:text-xl font-bold ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}
      >
        فعالیت‌های آموزشی
      </h2>
      <div className="flex gap-2">
        <button
          onClick={onBulkUpload}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            theme === "dark"
              ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
              : "bg-green-50 text-green-600 hover:bg-green-100"
          }`}
        >
          <Upload className="w-4 h-4" />
          آپلود دسته‌جمعی
        </button>
      </div>
    </div>
  );
}
