"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import {
  ChevronRight,
  ChevronDown,
  User,
  BookOpen,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

interface Parent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

interface StudentClass {
  id: string;
  name: string;
  grade_level: string;
  section: string;
}

interface Student {
  id: string;
  name: string;
  national_id: string;
  email?: string;
  phone?: string;
  grade_level?: string;
  classes: StudentClass[];
  created_at: string;
  parents: Parent[];
  profile_picture_url?: string;
}

export default function StudentTreeView({
  students,
  searchTerm,
  onViewStudent,
  onDeleteStudent,
  onEditStudent,
  onDeleteGrade, // New prop for deleting entire grade
}: {
  students: Student[];
  searchTerm: string;
  onViewStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onEditStudent: (student: Student) => void;
  onDeleteGrade?: (
    gradeLevel: string,
    studentCount: number,
    parentCount: number
  ) => void; // New prop
}) {
  const { theme } = useTheme();
  const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>(
    {}
  );

  // Filter students based on search term
  const filteredStudents = students.filter((student) => {
    return (
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.national_id.includes(searchTerm)
    );
  });

  // Group students by grade level
  const groupedStudents: Record<string, Student[]> = {};
  filteredStudents.forEach((student) => {
    const grade = student.grade_level || "نامشخص";
    if (!groupedStudents[grade]) {
      groupedStudents[grade] = [];
    }
    groupedStudents[grade].push(student);
  });

  // Count parents for each grade
  const getParentCountForGrade = (gradeStudents: Student[]) => {
    const parentIds = new Set<string>();
    gradeStudents.forEach((student) => {
      student.parents.forEach((parent) => {
        parentIds.add(parent.id);
      });
    });
    return parentIds.size;
  };

  // Toggle grade expansion
  const toggleGrade = (grade: string) => {
    setExpandedGrades((prev) => ({
      ...prev,
      [grade]: !prev[grade],
    }));
  };

  // Sort grades numerically if possible, otherwise alphabetically
  const sortedGrades = Object.keys(groupedStudents).sort((a, b) => {
    const aNum = parseInt(a.replace(/[^\d]/g, ""));
    const bNum = parseInt(b.replace(/[^\d]/g, ""));

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }

    return a.localeCompare(b, "fa");
  });

  if (filteredStudents.length === 0) {
    return (
      <div
        className={`rounded-xl border p-8 text-center ${
          theme === "dark"
            ? "bg-slate-900/50 border-slate-800/50"
            : "bg-white border-gray-200"
        }`}
      >
        <User
          className={`w-16 h-16 mx-auto mb-4 ${
            theme === "dark" ? "text-slate-600" : "text-gray-400"
          }`}
        />
        <h3
          className={`text-xl font-semibold mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {searchTerm ? "دانش‌آموزی یافت نشد" : "هنوز دانش‌آموزی ندارید"}
        </h3>
        <p
          className={`text-sm mb-6 ${
            theme === "dark" ? "text-slate-400" : "text-gray-500"
          }`}
        >
          {searchTerm
            ? "جستجوی دیگری امتحان کنید"
            : "اولین دانش‌آموز خود را اضافه کنید"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar Tree View */}
      <div
        className={`md:w-64 rounded-xl border ${
          theme === "dark"
            ? "bg-slate-900/50 border-slate-800/50"
            : "bg-white border-gray-200"
        }`}
      >
        <div
          className={`p-4 border-b ${
            theme === "dark" ? "border-slate-700" : "border-gray-200"
          }`}
        >
          <h2
            className={`font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            پایه‌های تحصیلی
          </h2>
        </div>
        <div className="p-2">
          {sortedGrades.map((grade) => {
            const isExpanded = expandedGrades[grade] ?? false; // Default to collapsed
            const studentsInGrade = groupedStudents[grade];
            const parentCount = getParentCountForGrade(studentsInGrade);

            return (
              <div key={grade} className="mb-1">
                <div className="flex items-center">
                  <button
                    onClick={() => toggleGrade(grade)}
                    className={`flex-1 flex items-center justify-between p-3 rounded-lg text-right transition-colors ${
                      theme === "dark"
                        ? "hover:bg-slate-800 text-slate-200"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <BookOpen
                        className={`w-4 h-4 ${
                          theme === "dark" ? "text-slate-400" : "text-gray-500"
                        }`}
                      />
                      <span className="font-medium">
                        {grade} ({studentsInGrade.length})
                      </span>
                    </div>
                  </button>
                  {onDeleteGrade && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGrade(
                          grade,
                          studentsInGrade.length,
                          parentCount
                        );
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === "dark"
                          ? "hover:bg-red-500/20 text-red-400"
                          : "hover:bg-red-50 text-red-500"
                      }`}
                      title="حذف کل پایه"
                      aria-label={`حذف پایه ${grade}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="mr-2 border-r-2 border-gray-200 dark:border-slate-700 py-1">
                    {studentsInGrade.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => onViewStudent(student)}
                        className={`w-full flex items-center gap-2 p-2 pl-4 rounded text-right transition-colors ${
                          theme === "dark"
                            ? "hover:bg-slate-800 text-slate-300"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            theme === "dark" ? "bg-slate-700" : "bg-gray-100"
                          }`}
                        >
                          <User className="w-3 h-3" />
                        </div>
                        <span className="truncate text-sm">{student.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {sortedGrades.map((grade) => {
          const isExpanded = expandedGrades[grade] ?? false;
          const studentsInGrade = groupedStudents[grade];
          const parentCount = getParentCountForGrade(studentsInGrade);

          if (!isExpanded) return null;

          return (
            <div
              key={grade}
              className={`rounded-xl border mb-6 ${
                theme === "dark"
                  ? "bg-slate-900/50 border-slate-800/50"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`p-4 border-b flex items-center justify-between ${
                  theme === "dark" ? "border-slate-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                  <h2
                    className={`text-lg font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    پایه {grade} ({studentsInGrade.length} دانش‌آموز)
                  </h2>
                </div>
                {onDeleteGrade && (
                  <button
                    onClick={() =>
                      onDeleteGrade(grade, studentsInGrade.length, parentCount)
                    }
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      theme === "dark"
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف پایه
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className={`border-b ${
                        theme === "dark"
                          ? "border-slate-700"
                          : "border-gray-200"
                      }`}
                    >
                      <th
                        className={`text-right p-4 font-medium ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        نام و نام خانوادگی
                      </th>
                      <th
                        className={`text-right p-4 font-medium ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        کد ملی
                      </th>
                      <th
                        className={`text-right p-4 font-medium ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        ایمیل
                      </th>
                      <th
                        className={`text-right p-4 font-medium ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        کلاس‌ها
                      </th>
                      <th
                        className={`text-right p-4 font-medium ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        والدین
                      </th>
                      <th
                        className={`text-right p-4 font-medium ${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        عملیات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsInGrade.map((student) => (
                      <tr
                        key={student.id}
                        className={`border-b cursor-pointer ${
                          theme === "dark"
                            ? "border-slate-700 hover:bg-slate-800/50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => onViewStudent(student)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full overflow-hidden`}
                            >
                              {student.profile_picture_url ? (
                                <img
                                  src={student.profile_picture_url}
                                  alt={student.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex items-center justify-center ${
                                    theme === "dark"
                                      ? "bg-slate-700"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  <User
                                    className={`w-5 h-5 ${
                                      theme === "dark"
                                        ? "text-slate-300"
                                        : "text-gray-600"
                                    }`}
                                  />
                                </div>
                              )}
                            </div>
                            <span
                              className={`font-medium ${
                                theme === "dark"
                                  ? "text-white"
                                  : "text-gray-900"
                              }`}
                            >
                              {student.name}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`p-4 ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-600"
                          }`}
                        >
                          {student.national_id}
                        </td>
                        <td
                          className={`p-4 ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-600"
                          }`}
                        >
                          {student.email || "-"}
                        </td>
                        <td
                          className={`p-4 ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-600"
                          }`}
                        >
                          {student.classes && student.classes.length > 0
                            ? student.classes.map((cls) => cls.name).join(", ")
                            : "-"}
                        </td>
                        <td
                          className={`p-4 ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-600"
                          }`}
                        >
                          {student.parents && student.parents.length > 0
                            ? `${student.parents.length} والد`
                            : "بدون والد"}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewStudent(student);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === "dark"
                                  ? "hover:bg-slate-700 text-slate-400"
                                  : "hover:bg-gray-100 text-gray-500"
                              }`}
                              title="مشاهده جزئیات"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditStudent(student);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === "dark"
                                  ? "hover:bg-slate-700 text-slate-400"
                                  : "hover:bg-gray-100 text-gray-500"
                              }`}
                              title="ویرایش"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteStudent(student.id);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === "dark"
                                  ? "hover:bg-red-500/20 text-red-400"
                                  : "hover:bg-red-50 text-red-500"
                              }`}
                              title="حذف"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
