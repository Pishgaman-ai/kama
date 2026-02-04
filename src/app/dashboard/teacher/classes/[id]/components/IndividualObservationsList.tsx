"use client";

import React, { useState } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Edit, Trash2, Brain } from "lucide-react";
import { Student, IndividualObservation } from "../types";

interface IndividualObservationsListProps {
  students: Student[];
  observations: Record<string, IndividualObservation[]>;
  classId: string;
  onAddObservation: (
    studentId?: string,
    observation?: IndividualObservation
  ) => void;
  onDeleteObservation: (observationId: string) => void;
  convertToPersianDate: (gregorianDate: string | null) => string;
}

export default function IndividualObservationsList({
  students,
  observations,
  classId,
  onAddObservation,
  onDeleteObservation,
  convertToPersianDate,
}: IndividualObservationsListProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const [expandedStudents, setExpandedStudents] = useState<
    Record<string, boolean>
  >({});

  // Get observations for a specific student
  const getStudentObservations = (studentNationalId: string) => {
    return observations[studentNationalId] || [];
  };

  // Toggle student expansion
  const toggleStudentExpansion = (studentNationalId: string) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentNationalId]: !prev[studentNationalId],
    }));
  };

  // Navigate to AI assessment results page
  const navigateToAIResults = (studentId: string) => {
    router.push(
      `/dashboard/teacher/classes/${classId}/ai-assessment-results?studentId=${studentId}`
    );
  };

  return (
    <div className="space-y-4">
      {students.map((student) => {
        const studentObservations = getStudentObservations(student.national_id);
        const isExpanded = expandedStudents[student.national_id] || false;

        return (
          <div
            key={student.national_id}
            className={`rounded-lg border ${
              theme === "dark"
                ? "bg-slate-800/30 border-slate-700/50"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            {/* Student Header - Always visible */}
            <div
              className={`flex items-center justify-between p-4 cursor-pointer ${
                theme === "dark" ? "border-slate-700/50" : "border-gray-200"
              } ${isExpanded ? "border-b" : ""}`}
              onClick={() => toggleStudentExpansion(student.national_id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center`}
                >
                  <span className="text-white font-medium text-xs">
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
                    className={`text-xs ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    کد ملی: {student.national_id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToAIResults(student.national_id);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                      : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                  }`}
                  aria-label="نتایج هوش مصنوعی از مشاهدات فردی"
                >
                  <Brain className="w-3 h-3" />
                  نتایج هوش مصنوعی
                </button>

                <span
                  className={`px-2 py-1 rounded text-xs ${
                    theme === "dark"
                      ? "bg-slate-700 text-slate-300"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {studentObservations.length} مشاهده
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddObservation(student.national_id);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                  aria-label="افزودن مشاهده"
                >
                  <Plus className="w-3 h-3" />
                  افزودن مشاهده
                </button>

                <div
                  className={`transform transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Collapsible Content - Only visible when expanded */}
            {isExpanded && (
              <div className="p-4">
                {studentObservations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr
                          className={
                            theme === "dark"
                              ? "bg-slate-700/30 text-slate-300"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          <th className="text-right py-2 px-3 text-xs font-medium">
                            عنوان
                          </th>
                          <th className="text-right py-2 px-3 text-xs font-medium">
                            توضیحات
                          </th>
                          <th className="text-right py-2 px-3 text-xs font-medium">
                            تاریخ
                          </th>
                          <th className="text-right py-2 px-3 text-xs font-medium">
                            عملیات
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentObservations.map((observation) => (
                          <tr
                            key={observation.id}
                            className={
                              theme === "dark"
                                ? "border-b border-slate-700/30 hover:bg-slate-700/20"
                                : "border-b border-gray-200 hover:bg-gray-100"
                            }
                          >
                            <td
                              className={`py-2 px-3 text-sm ${
                                theme === "dark"
                                  ? "text-slate-300"
                                  : "text-gray-700"
                              }`}
                            >
                              {observation.title}
                            </td>
                            <td
                              className={`py-2 px-3 text-sm max-w-xs truncate ${
                                theme === "dark"
                                  ? "text-slate-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {observation.description}
                            </td>
                            <td
                              className={`py-2 px-3 text-sm ${
                                theme === "dark"
                                  ? "text-slate-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {convertToPersianDate(observation.date)}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    onAddObservation(
                                      student.national_id,
                                      observation
                                    )
                                  }
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    theme === "dark"
                                      ? "hover:bg-slate-600 text-slate-400 hover:text-white"
                                      : "hover:bg-gray-200 text-gray-500 hover:text-gray-900"
                                  }`}
                                  aria-label="ویرایش"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    onDeleteObservation(observation.id)
                                  }
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    theme === "dark"
                                      ? "hover:bg-red-500/20 text-red-400 hover:text-red-300"
                                      : "hover:bg-red-100 text-red-500 hover:text-red-700"
                                  }`}
                                  aria-label="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen
                      className={`w-12 h-12 mx-auto mb-3 ${
                        theme === "dark" ? "text-slate-600" : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      هنوز مشاهده‌ای برای این دانش‌آموز ثبت نشده است
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
