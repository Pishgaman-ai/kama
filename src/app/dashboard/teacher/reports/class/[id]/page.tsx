"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import Link from "next/link";
import {
  ArrowRight,
  Users,
  Search,
  GraduationCap,
  BookOpen,
  FileText,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  national_id: string;
  is_active: boolean;
  joined_at: string;
}

interface ClassData {
  id: string;
  name: string;
  grade_level: string;
  section?: string;
  academic_year: string;
  description?: string;
  created_at: string;
}

interface ClassDetailsData {
  class: ClassData;
  students: Student[];
}

export default function ClassStudentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [classData, setClassData] = useState<ClassDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { theme } = useTheme();
  const router = useRouter();
  const [classId, setClassId] = useState<string>("");

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setClassId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (classId) {
      fetchClassDetails();
    }
  }, [classId]);

  const fetchClassDetails = async () => {
    try {
      const response = await fetch(`/api/teacher/classes/${classId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setClassData(result.data);
          setError(null);
        } else {
          setError("خطا در بارگیری اطلاعات کلاس");
        }
      } else {
        setError("کلاس یافت نشد");
      }
    } catch (error) {
      console.error("Error fetching class details:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            در حال بارگذاری...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-6" dir="rtl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            aria-label="بازگشت"
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            }`}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            خطا در بارگیری کلاس
          </h1>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            theme === "dark"
              ? "bg-red-500/10 border-red-500/20"
              : "bg-red-50 border-red-200"
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
      </div>
    );
  }

  if (!classData) {
    return null;
  }

  const filteredStudents = classData.students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.national_id.includes(searchTerm)
  );

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            aria-label="بازگشت"
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            }`}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1
              className={`text-xl sm:text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              دانش‌آموزان {classData.class.name}
            </h1>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              انتخاب دانش‌آموز برای مشاهده گزارش‌ها
            </p>
          </div>
        </div>

        {/* Add Exams Button */}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mb-6">
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

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <div
          className={`text-center py-16 rounded-2xl border-2 border-dashed ${
            theme === "dark" ? "border-slate-700" : "border-gray-300"
          }`}
        >
          <GraduationCap
            className={`w-16 h-16 mx-auto mb-4 ${
              theme === "dark" ? "text-slate-600" : "text-gray-400"
            }`}
          />
          <h3
            className={`text-xl font-semibold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {searchTerm ? "دانش‌آموزی یافت نشد" : "دانش‌آموزی در این کلاس نیست"}
          </h3>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            {searchTerm
              ? "جستجوی دیگری امتحان کنید"
              : "دانش‌آموزانی که در این کلاس ثبت نام کرده‌اند نمایش داده خواهند شد"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Link
              key={student.id}
              href={`/dashboard/teacher/reports/class/${classId}/student/${student.id}`}
              className={`group relative rounded-2xl border p-6 transition-all hover:shadow-xl hover:scale-[1.02] ${
                theme === "dark"
                  ? "bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center`}
                >
                  <span className="text-white font-medium">
                    {student.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3
                    className={`font-bold ${
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

              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-1 rounded-lg text-xs ${
                    student.is_active
                      ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                  }`}
                >
                  {student.is_active ? "فعال" : "غیرفعال"}
                </span>
                <BookOpen
                  className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
