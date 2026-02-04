"use client";

import { useState } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { useRouter } from "next/navigation";
import { BookOpen, Eye, Edit, Trash2, User } from "lucide-react";

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

export default function StudentList({
  students,
  searchTerm,
  selectedGrade,
  onViewStudent,
  onDeleteStudent,
}: {
  students: Student[];
  searchTerm: string;
  selectedGrade: string;
  onViewStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}) {
  const { theme } = useTheme();
  const router = useRouter();

  // Filter students based on search term and selected grade
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.national_id.includes(searchTerm);

    const matchesGrade =
      selectedGrade === "all" || student.grade_level === selectedGrade;

    return matchesSearch && matchesGrade;
  });

  // Group students by grade level
  const groupedStudents = () => {
    const groups: { [key: string]: Student[] } = {};

    filteredStudents.forEach((student) => {
      const grade = student.grade_level || "نامشخص";
      if (!groups[grade]) {
        groups[grade] = [];
      }
      groups[grade].push(student);
    });

    return groups;
  };

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
          {searchTerm || selectedGrade !== "all"
            ? "دانش‌آموزی یافت نشد"
            : "هنوز دانش‌آموزی ندارید"}
        </h3>
        <p
          className={`text-sm mb-6 ${
            theme === "dark" ? "text-slate-400" : "text-gray-500"
          }`}
        >
          {searchTerm || selectedGrade !== "all"
            ? "جستجوی دیگری امتحان کنید"
            : "اولین دانش‌آموز خود را اضافه کنید"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedStudents()).map(([grade, studentsInGrade]) => (
        <div
          key={grade}
          className={`rounded-xl border ${
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`border-b ${
                    theme === "dark" ? "border-slate-700" : "border-gray-200"
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
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {student.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {student.national_id}
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {student.email || "-"}
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {student.classes && student.classes.length > 0
                        ? student.classes.map((cls) => cls.name).join(", ")
                        : "-"}
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
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
                            router.push(
                              `/dashboard/principal/students/edit?id=${student.id}`
                            );
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
      ))}
    </div>
  );
}
