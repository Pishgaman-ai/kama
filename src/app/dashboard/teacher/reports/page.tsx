"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Search,
  Filter,
  ChevronRight,
  GraduationCap,
  BarChart3,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  created_at: Date;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface SubjectAssignment {
  assignment_id: string;
  subject_id: string;
  subject_name: string;
  class_id: string;
  class_name: string;
  grade_level: string;
  section?: string;
  academic_year: string;
  student_count: number;
}

interface ClassData {
  id: string;
  name: string;
  grade_level: string;
  section?: string;
  academic_year: string;
  student_count: number;
}

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.push("/signin");
          return;
        }
        const data = await response.json();
        setUser(data.user);
        await fetchTeacherSubjectsAndClasses();
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchTeacherSubjectsAndClasses = async () => {
    try {
      // Fetch classes taught by this teacher
      const response = await fetch("/api/teacher/classes");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Transform subjects data to classes data
          const transformedClasses = result.data.subjects.map(
            (subject: SubjectAssignment) => ({
              id: subject.class_id,
              name: subject.class_name,
              grade_level: subject.grade_level,
              section: subject.section,
              academic_year: subject.academic_year,
              student_count: subject.student_count,
            })
          );

          // Remove duplicates by class_id
          const uniqueClasses = transformedClasses.filter(
            (cls: ClassData, index: number, self: ClassData[]) =>
              index === self.findIndex((c) => c.id === cls.id)
          );

          setClasses(uniqueClasses);
          setError(null);
        } else {
          setError("خطا در بارگیری کلاس‌ها");
        }
      } else {
        setError("خطا در بارگیری کلاس‌ها");
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      setError("خطا در ارتباط با سرور");
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

  if (!user) {
    return null;
  }

  // Add safety check to ensure classes is an array before filtering
  const filteredClasses = Array.isArray(classes)
    ? classes.filter(
        (cls) =>
          cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cls.grade_level.includes(searchTerm) ||
          (cls.section &&
            cls.section.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

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
            گزارش دانش‌آموزان
          </h1>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            مشاهده و مدیریت گزارش‌های دانش‌آموزان در درس‌های مختلف
          </p>
        </div>

        {/* Dashboard Link */}
        <Link
          href="/dashboard/teacher/reports/dashboard"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            theme === "dark"
              ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-sm">داشبورد</span>
        </Link>
      </div>

      {/* Information Banner */}
      <div
        className={`rounded-xl p-4 mb-6 ${
          theme === "dark"
            ? "bg-blue-500/10 border border-blue-500/20"
            : "bg-blue-50 border border-blue-200"
        }`}
      >
        <div className="flex items-start gap-3">
          <BookOpen
            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              theme === "dark" ? "text-blue-400" : "text-blue-600"
            }`}
          />
          <div>
            <h3
              className={`font-medium ${
                theme === "dark" ? "text-blue-400" : "text-blue-700"
              }`}
            >
              قابلیت‌های جدید گزارشات
            </h3>
            <p
              className={`text-sm mt-1 ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              اکناعمکانات جدیدی برای گزارش‌دهی اضافه شده است:
            </p>
            <ul
              className={`text-sm mt-2 space-y-1 ${
                theme === "dark" ? "text-slate-400" : "text-gray-600"
              }`}
            >
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>ثبت و مشاهده گزارش‌های توصیفی دانش‌آموزان</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>مدیریت نمرات عددی و آمار عملکرد</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>ثبت گزارش‌های رفتاری دانش‌آموزان</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>نمایش داده‌ها به صورت نمودار و آماری</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === "dark" ? "text-slate-400" : "text-gray-400"
            }`}
          />
          <input
            type="text"
            placeholder="جستجو در کلاس‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-4 pr-11 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
              theme === "dark"
                ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
            }`}
          />
        </div>

        <button
          aria-label="فیلتر کردن"
          className={`p-3 rounded-xl transition-all border ${
            theme === "dark"
              ? "hover:bg-slate-800/50 text-slate-400 hover:text-white border-slate-700/50"
              : "hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-gray-200"
          }`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Error State */}
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

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
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
            {searchTerm ? "کلاسی یافت نشد" : "هنوز کلاسی ندارید"}
          </h3>
          <p
            className={`text-sm mb-6 ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            {searchTerm
              ? "جستجوی دیگری امتحان کنید"
              : "کلاس‌هایی که به شما تخصیص داده شده نمایش داده خواهد شد"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <Link
              key={classItem.id}
              href={`/dashboard/teacher/reports/class/${classItem.id}`}
              className={`group relative rounded-2xl border p-6 transition-all hover:shadow-xl hover:scale-[1.02] ${
                theme === "dark"
                  ? "bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3
                    className={`text-lg font-bold mb-1 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {classItem.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={`px-2 py-1 rounded-lg ${
                        theme === "dark"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      پایه {classItem.grade_level}
                    </span>
                    {classItem.section && (
                      <span
                        className={`px-2 py-1 rounded-lg ${
                          theme === "dark"
                            ? "bg-violet-500/10 text-violet-400"
                            : "bg-violet-50 text-violet-600"
                        }`}
                      >
                        {classItem.section}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users
                    className={`w-4 h-4 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    {classItem.student_count} دانش‌آموز
                  </span>
                </div>
                <ChevronRight
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
