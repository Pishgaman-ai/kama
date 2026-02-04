"use client";

import React from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { Users } from "lucide-react";
import { Student } from "../types";

interface StudentsListTabProps {
  students: Student[];
}

export default function StudentsListTab({ students }: StudentsListTabProps) {
  const { theme } = useTheme();

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <Users
          className={`w-16 h-16 mx-auto mb-4 ${
            theme === "dark" ? "text-slate-600" : "text-gray-400"
          }`}
        />
        <h3
          className={`text-lg font-semibold mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          هنوز دانش‌آموزی در این کلاس ثبت نشده
        </h3>
        <p
          className={`text-sm ${
            theme === "dark" ? "text-slate-400" : "text-gray-500"
          }`}
        >
          تنها دانش‌آموزانی که توسط مدیر به این کلاس اضافه شده‌اند نمایش داده
          می‌شوند
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {students.map((student) => (
        <div
          key={student.id}
          className={`flex items-center justify-between p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-slate-800/30 border-slate-700/50"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center`}
            >
              <span className="text-white font-medium text-sm">
                {student.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3
                className={`font-medium ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {student.name}
              </h3>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                کد ملی: {student.national_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-lg text-xs ${
                student.is_active
                  ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
              }`}
            >
              {student.is_active ? "فعال" : "غیرفعال"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
