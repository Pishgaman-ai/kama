"use client";

import React from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { Calendar, GraduationCap } from "lucide-react";
import { ClassData } from "../types";

interface ClassInfoTabProps {
  classData: ClassData;
  subjectName: string;
}

export default function ClassInfoTab({
  classData,
  subjectName,
}: ClassInfoTabProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
        theme === "dark"
          ? "bg-slate-900/50 border-slate-800/50"
          : "bg-white border-gray-200"
      }`}
    >
      <h2
        className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}
      >
        اطلاعات کلاس و درس
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            نام کلاس
          </label>
          <p
            className={`px-4 py-3 rounded-lg ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            {classData.name}
          </p>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            پایه تحصیلی
          </label>
          <p
            className={`px-4 py-3 rounded-lg ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            پایه {classData.grade_level}
          </p>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            بخش
          </label>
          <p
            className={`px-4 py-3 rounded-lg ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            {classData.section || "تعیین نشده"}
          </p>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            سال تحصیلی
          </label>
          <p
            className={`px-4 py-3 rounded-lg ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            {classData.academic_year}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6">
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            درس
          </label>
          <p
            className={`px-4 py-3 rounded-lg ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            {subjectName}
          </p>
        </div>
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            توضیحات
          </label>
          <p
            className={`px-4 py-3 rounded-lg min-h-[100px] ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            {classData.description || "توضیحاتی وارد نشده است."}
          </p>
        </div>
      </div>

      {/* Class Metadata */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>ایجاد شده در {classData.created_at}</span>
          </div>
          {classData.school_name && (
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>{classData.school_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
