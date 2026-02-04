"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { useRouter } from "next/navigation";
import {
  X,
  Search,
  Users,
  BookOpen,
  Check,
  Loader2,
  ArrowLeft,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  national_id: string;
  email: string;
  grade_level: string;
  classes: {
    id: string;
    name: string;
    grade_level: string;
    section: string;
  }[];
}

interface Class {
  id: string;
  name: string;
  grade_level: string;
  section: string;
  academic_year: string;
  description: string;
  student_count: number;
  created_at: string;
}

// Helper function to normalize grade levels
const normalizeGradeLevel = (grade: string): string => {
  const gradeMap: { [key: string]: string } = {
    '1': 'اول',
    '2': 'دوم',
    '3': 'سوم',
    '4': 'چهارم',
    '5': 'پنجم',
    '6': 'ششم',
    '7': 'هفتم',
    '8': 'هشتم',
    '9': 'نهم',
    '10': 'دهم',
    '11': 'یازدهم',
    '12': 'دوازدهم',
  };

  // If it's already in Persian format, return as is
  if (Object.values(gradeMap).includes(grade)) {
    return grade;
  }

  // If it's a number, convert to Persian
  return gradeMap[grade] || grade;
};

export default function AssignStudentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap the params promise
  const unwrappedParams = React.use(params);
  const classId = unwrappedParams.id;

  const router = useRouter();
  const { theme } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // New state for saving process
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [initiallyAssignedStudents, setInitiallyAssignedStudents] = useState<
    string[]
  >([]);

  useEffect(() => {
    fetchClassData();
    fetchStudents();

    // Track the last time we refreshed data to prevent excessive refreshes
    let lastRefreshTime = Date.now();

    // Add event listener to refresh data when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        // Only refresh if it's been more than 30 seconds since last refresh
        if (now - lastRefreshTime > 30000) {
          fetchStudents();
          fetchClassData();
          lastRefreshTime = now;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [classId]);

  const fetchClassData = async () => {
    try {
      const response = await fetch(`/api/principal/classes/${classId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentClass(data.class);
      } else {
        const data = await response.json();
        setError(data.error || "خطا در بارگذاری اطلاعات کلاس");
      }
    } catch (error) {
      setError("خطا در ارتباط با سرور");
    }
  };

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      // Fetch students and assigned students in parallel to improve performance
      const [studentsResponse, assignedResponse] = await Promise.all([
        fetch("/api/principal/students"),
        fetch(`/api/principal/classes/${classId}/students`),
      ]);

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        // Normalize grade levels when setting students
        const normalizedStudents = (studentsData.students || []).map((student: Student) => ({
          ...student,
          grade_level: normalizeGradeLevel(student.grade_level),
        }));
        setStudents(normalizedStudents);
      }

      if (assignedResponse.ok) {
        const assignedData = await assignedResponse.json();
        const assignedIds =
          assignedData.students?.map((s: Student) => s.id) || [];
        setSelectedStudents(assignedIds);
        setInitiallyAssignedStudents(assignedIds);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("خطا در بارگذاری اطلاعات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true); // Set saving state to true

    try {
      const response = await fetch(
        `/api/principal/classes/${classId}/students`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentIds: selectedStudents,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("تغییرات با موفقیت ذخیره شد");
        // Update initially assigned students to reflect current state
        setInitiallyAssignedStudents([...selectedStudents]);
        // Refresh the student data to reflect the changes
        fetchStudents();
      } else {
        setError(data.error || "خطا در ذخیره تغییرات");
      }
    } catch (error) {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsSaving(false); // Always set saving state to false when done
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const toggleAllStudents = () => {
    // Get all students in the same grade level as the class
    if (!currentClass) return;

    const studentsInGrade = students
      .filter((student) => student.grade_level === currentClass.grade_level)
      .map((student) => student.id);

    // If all are selected, deselect all; otherwise select all
    if (selectedStudents.length === studentsInGrade.length) {
      // Deselect all
      setSelectedStudents(
        selectedStudents.filter((id) => !studentsInGrade.includes(id))
      );
    } else {
      // Select all students in grade (merge with existing selections from other grades if any)
      const otherSelected = selectedStudents.filter(
        (id) =>
          !studentsInGrade.includes(id) ||
          students.find((s) => s.id === id)?.grade_level !==
            currentClass.grade_level
      );
      setSelectedStudents([...otherSelected, ...studentsInGrade]);
    }
  };

  const isAllSelected = () => {
    if (!currentClass) return false;

    const studentsInGrade = students
      .filter((student) => student.grade_level === currentClass.grade_level)
      .map((student) => student.id);

    return (
      studentsInGrade.length > 0 &&
      studentsInGrade.every((id) => selectedStudents.includes(id))
    );
  };

  const filteredStudents = students.filter((student) => {
    // Only show students in the same grade level as the class
    if (!currentClass || student.grade_level !== currentClass.grade_level) {
      return false;
    }

    // Apply search filter
    return (
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.national_id.includes(searchTerm)
    );
  });

  const hasChanges = () => {
    // Check if there are any differences between selected and initially assigned
    const added = selectedStudents.filter(
      (id) => !initiallyAssignedStudents.includes(id)
    );
    const removed = initiallyAssignedStudents.filter(
      (id) => !selectedStudents.includes(id)
    );
    return added.length > 0 || removed.length > 0;
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6" dir="rtl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              تخصیص دانش‌آموزان به کلاس
            </h1>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              در حال بارگذاری اطلاعات کلاس و دانش‌آموزان
            </p>
          </div>
        </div>
        <div
          className={`rounded-xl border ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
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
                    نام دانش‌آموز
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
                    پایه تحصیلی
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    کلاس‌های فعلی
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    انتخاب
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="p-8">
                    <div className="flex flex-col items-center justify-center w-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span
                        className={`mt-3 ${
                          theme === "dark" ? "text-slate-400" : "text-gray-500"
                        }`}
                      >
                        در حال بارگذاری...
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            تخصیص دانش‌آموزان به کلاس
          </h1>
          {currentClass && (
            <p
              className={`text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              {currentClass.name} - پایه {currentClass.grade_level}
            </p>
          )}
        </div>
        <button
          onClick={() => router.push("/dashboard/principal/classes")}
          className={`group flex items-center gap-2 px-4 py-2 transition-all hover:gap-3 ${
            theme === "dark"
              ? "text-slate-400 hover:text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">بازگشت به لیست کلاس‌ها</span>
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div
          className={`p-4 rounded-xl mb-6 ${
            theme === "dark"
              ? "bg-green-500/10 border border-green-500/20"
              : "bg-green-50 border border-green-200"
          }`}
        >
          <p
            className={`text-sm ${
              theme === "dark" ? "text-green-400" : "text-green-600"
            }`}
          >
            {success}
          </p>
        </div>
      )}

      {error && (
        <div
          className={`p-4 rounded-xl mb-6 ${
            theme === "dark"
              ? "bg-red-500/10 border border-red-500/20"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <p
            className={`text-sm ${
              theme === "dark" ? "text-red-400" : "text-red-600"
            }`}
          >
            {error}
          </p>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === "dark" ? "text-slate-400" : "text-gray-400"
            }`}
          />
          <input
            type="text"
            placeholder="جستجو در دانش‌آموزان..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-4 pr-11 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
              theme === "dark"
                ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
            }`}
          />
        </div>
      </div>

      {/* Students List */}
      <form onSubmit={handleAssignStudents}>
        <div
          className={`rounded-xl border ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          {/* Header with Select All */}
          <div
            className={`p-4 border-b ${
              theme === "dark" ? "border-slate-700" : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2
                className={`font-medium ${
                  theme === "dark" ? "text-slate-300" : "text-gray-700"
                }`}
              >
                دانش‌آموزان پایه {currentClass?.grade_level || ""}
              </h2>
              <button
                type="button"
                onClick={toggleAllStudents}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg ${
                  theme === "dark"
                    ? "text-slate-400 hover:bg-slate-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                aria-label={isAllSelected() ? "لغو انتخاب همه" : "انتخاب همه"}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isAllSelected()
                      ? "bg-blue-500 border-blue-500"
                      : theme === "dark"
                      ? "border-slate-600"
                      : "border-gray-300"
                  }`}
                >
                  {isAllSelected() && <Check className="w-3 h-3 text-white" />}
                </div>
                انتخاب همه
              </button>
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
                    انتخاب
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    نام دانش‌آموز
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
                    پایه تحصیلی
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    کلاس‌های فعلی
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8">
                      <Users
                        className={`w-16 h-16 mx-auto mb-4 ${
                          theme === "dark" ? "text-slate-600" : "text-gray-400"
                        }`}
                      />
                      <h3
                        className={`text-xl font-semibold mb-2 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {searchTerm
                          ? "دانش‌آموزی یافت نشد"
                          : "دانش‌آموزی در این پایه وجود ندارد"}
                      </h3>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-slate-400" : "text-gray-500"
                        }`}
                      >
                        {searchTerm
                          ? "جستجوی دیگری امتحان کنید"
                          : "دانش‌آموزان را در بخش مدیریت دانش‌آموزان اضافه کنید"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className={`border-b ${
                        theme === "dark"
                          ? "border-slate-700 hover:bg-slate-800/50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStudentSelection(student.id)}
                          className={`w-5 h-5 rounded border flex items-center justify-center mx-auto ${
                            selectedStudents.includes(student.id)
                              ? "bg-blue-500 border-blue-500"
                              : theme === "dark"
                              ? "border-slate-600"
                              : "border-gray-300"
                          }`}
                          aria-label={
                            selectedStudents.includes(student.id)
                              ? "لغو انتخاب"
                              : "انتخاب"
                          }
                        >
                          {selectedStudents.includes(student.id) && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              theme === "dark" ? "bg-slate-700" : "bg-gray-100"
                            }`}
                          >
                            <Users
                              className={`w-5 h-5 ${
                                theme === "dark"
                                  ? "text-slate-300"
                                  : "text-gray-600"
                              }`}
                            />
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
                        {student.grade_level}
                      </td>
                      <td className="p-4">
                        {student.classes && student.classes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {student.classes.map((cls) => (
                              <span
                                key={cls.id}
                                className={`text-xs px-2 py-1 rounded-full ${
                                  cls.id === classId
                                    ? "bg-green-500/20 text-green-500"
                                    : theme === "dark"
                                    ? "bg-slate-700 text-slate-300"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {cls.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span
                            className={`text-xs ${
                              theme === "dark"
                                ? "text-slate-500"
                                : "text-gray-500"
                            }`}
                          >
                            بدون کلاس
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={() => router.push("/dashboard/principal/classes")}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              theme === "dark"
                ? "bg-slate-700 text-white hover:bg-slate-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={!hasChanges() || isSaving}
            className={`px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium flex items-center gap-2 ${
              hasChanges() && !isSaving
                ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              <>
                ذخیره تغییرات
                {selectedStudents.length > 0 && (
                  <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
                    {selectedStudents.length}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
