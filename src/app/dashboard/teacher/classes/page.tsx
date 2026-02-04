"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import Link from "next/link";
import {
  Users,
  BookOpen,
  BarChart3,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Calendar,
  GraduationCap,
  TrendingUp,
  X,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  created_at: Date;
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

export default function ClassesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<SubjectAssignment[]>([]);
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
        await fetchSubjects();
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/teacher/classes");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSubjects(result.data.subjects);
          setError(null);
        } else {
          setError("خطا در بارگیری دروس");
        }
      } else {
        setError("خطا در بارگیری دروس");
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
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

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.grade_level.includes(searchTerm) ||
      (subject.section &&
        subject.section.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      <div className="mb-6">
        <h1
          className={`text-xl sm:text-2xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          کلاس های من
        </h1>
        <p
          className={`mt-1 text-sm ${
            theme === "dark" ? "text-slate-400" : "text-gray-600"
          }`}
        >
          لیست دروس تخصیص یافته به شما
        </p>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                theme === "dark" ? "text-slate-400" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder="جستجو در دروس یا کلاس‌ها..."
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
      {filteredSubjects.length === 0 ? (
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
            {searchTerm ? "درسی یافت نشد" : "هنوز درسی ندارید"}
          </h3>
          <p
            className={`text-sm mb-6 ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            {searchTerm
              ? "جستجوی دیگری امتحان کنید"
              : "دروسی که به شما تخصیص داده شده نمایش داده خواهد شد"}
          </p>
        </div>
      ) : (
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
                    درس
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    کلاس
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
                    شعبه
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    تعداد دانش‌آموزان
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
                {filteredSubjects.map((subject) => (
                  <tr
                    key={subject.assignment_id}
                    className={`border-b ${
                      theme === "dark"
                        ? "border-slate-700 hover:bg-slate-800/50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            theme === "dark" ? "bg-slate-700" : "bg-gray-100"
                          }`}
                        >
                          <BookOpen
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
                          {subject.subject_name}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {subject.class_name}
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {subject.grade_level || "-"}
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {subject.section || "-"}
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{subject.student_count || 0} دانش‌آموز</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Link
                        href={
                          subject.subject_id
                            ? `/dashboard/teacher/classes/${subject.class_id}?subjectId=${subject.subject_id}`
                            : `/dashboard/teacher/classes/${subject.class_id}`
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          theme === "dark"
                            ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}
                      >
                        مشاهده
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
