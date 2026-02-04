"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  School,
  Users,
  BookOpen,
  TrendingUp,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  UserCircle,
  Settings,
  MapPin,
  Navigation,
  Eye,
} from "lucide-react";
import { useTheme } from "@/app/components/ThemeContext";
import SchoolDetailsModal from "./components/SchoolDetailsModal";

interface ContactPerson {
  id: string;
  name: string;
  title: string;
  phone: string;
}

interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  established_year: number;
  grade_level: string;
  region: string;
  gender_type: string;
  website_url: string;
  contact_persons: ContactPerson[];
  latitude?: number;
  longitude?: number;
  user_count: number;
  teacher_count: number;
  student_count: number;
  class_count: number;
  principal_count: number;
  created_at: string;
  logo_url?: string; // Add logo_url property
}

// Component for rendering school logo with fallback
const SchoolLogo: React.FC<{
  logoUrl?: string;
  schoolName: string;
  theme: string;
}> = ({ logoUrl, schoolName, theme }) => {
  const [imageError, setImageError] = useState(false);

  // Log for debugging
  useEffect(() => {
    if (logoUrl && !imageError) {
      console.log(`Attempting to load logo for ${schoolName}:`, logoUrl);
    }
  }, [logoUrl, schoolName, imageError]);

  if (!logoUrl || imageError) {
    if (logoUrl && imageError) {
      console.log(`Failed to load logo for ${schoolName}:`, logoUrl);
    }
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
        <School className="w-5 h-5 text-white" />
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`لوگوی ${schoolName}`}
      className="w-10 h-10 rounded-xl object-contain object-center"
      onError={() => {
        console.log(`Image failed to load for ${schoolName}:`, logoUrl);
        setImageError(true);
      }}
      onLoad={() => {
        console.log(`Image loaded successfully for ${schoolName}:`, logoUrl);
      }}
    />
  );
};

export default function AdminSchoolsPage() {
  const { theme } = useTheme();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/admin/schools");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSchools(result.data.schools);
          setError(null);
        } else {
          setError("خطا در بارگیری مدارس");
        }
      } else {
        setError("خطا در بارگیری مدارس");
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchool = async (school: School) => {
    if (!confirm(`آیا از حذف مدرسه "${school.name}" اطمینان دارید؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/schools/${school.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await fetchSchools();
      } else {
        alert(result.error || "خطا در حذف مدرسه");
      }
    } catch (error) {
      console.error("Error deleting school:", error);
      alert("خطا در ارتباط با سرور");
    }
  };

  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (school.address &&
        school.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  return (
    <div className="p-4 sm:p-6 space-y-6" dir="rtl">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در مدارس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-4 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                theme === "dark"
                  ? "bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                  : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500"
              }`}
            />
          </div>

          <Link
            href="/admin/schools/add"
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium whitespace-nowrap shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">مدرسه جدید</span>
            <span className="sm:hidden">جدید</span>
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          className={`rounded-2xl p-4 border ${
            theme === "dark"
              ? "bg-red-500/10 border-red-500/20"
              : "bg-red-50 border-red-200"
          }`}
        >
          <p
            className={`${theme === "dark" ? "text-red-400" : "text-red-600"}`}
          >
            {error}
          </p>
        </div>
      )}

      {/* Schools Table */}
      {filteredSchools.length === 0 ? (
        <div
          className={`text-center py-16 rounded-2xl border ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex justify-center mb-4">
            <SchoolLogo schoolName="مدرسه" theme={theme} />
          </div>
          <h3
            className={`text-xl font-semibold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {searchTerm ? "مدرسه‌ای یافت نشد" : "هنوز مدرسه‌ای ندارید"}
          </h3>
          <p
            className={`mb-6 ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            {searchTerm
              ? "جستجوی دیگری امتحان کنید"
              : "اولین مدرسه را اضافه کنید"}
          </p>
          {!searchTerm && (
            <Link
              href="/admin/schools/add"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              افزودن اولین مدرسه
            </Link>
          )}
        </div>
      ) : (
        <div
          className={`rounded-2xl border overflow-hidden ${
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
                    theme === "dark" ? "border-slate-800" : "border-gray-200"
                  }`}
                >
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    نام مدرسه
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    آدرس
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    تماس
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    سال تأسیس
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    آمار
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
                {filteredSchools.map((school) => (
                  <tr
                    key={school.id}
                    className={`border-b ${
                      theme === "dark"
                        ? "border-slate-800/50 hover:bg-slate-800/30"
                        : "border-gray-100 hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <SchoolLogo
                          logoUrl={school.logo_url}
                          schoolName={school.name}
                          theme={theme}
                        />
                        <div>
                          <h4
                            className={`font-medium ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {school.name}
                          </h4>
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-slate-400"
                                : "text-gray-500"
                            }`}
                          >
                            ایجاد شده: {school.created_at}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td
                      className={`p-4 max-w-xs ${
                        theme === "dark" ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      <div className="line-clamp-2">
                        {school.address || "—"}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {school.phone && (
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-gray-700"
                            }`}
                          >
                            {school.phone}
                          </p>
                        )}
                        {school.email && (
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-slate-400"
                                : "text-gray-500"
                            }`}
                          >
                            {school.email}
                          </p>
                        )}
                        {!school.phone && !school.email && (
                          <span
                            className={`${
                              theme === "dark"
                                ? "text-slate-500"
                                : "text-gray-400"
                            }`}
                          >
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      {school.established_year || "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            theme === "dark"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {school.teacher_count} معلم
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            theme === "dark"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {school.student_count} دانش‌آموز
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            theme === "dark"
                              ? "bg-violet-500/10 text-violet-400"
                              : "bg-violet-50 text-violet-600"
                          }`}
                        >
                          {school.class_count} کلاس
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            theme === "dark"
                              ? "bg-orange-500/10 text-orange-400"
                              : "bg-orange-50 text-orange-600"
                          }`}
                        >
                          {school.principal_count} مدیر
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedSchool(school)}
                          className={`p-2.5 rounded-xl transition-colors ${
                            theme === "dark"
                              ? "text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                              : "text-gray-500 hover:text-cyan-600 hover:bg-cyan-50"
                          }`}
                          title="مشاهده جزئیات"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <Link
                          href={`/admin/schools/${school.id}/principals`}
                          className={`p-2.5 rounded-xl transition-colors ${
                            theme === "dark"
                              ? "text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                              : "text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                          }`}
                          title="مدیریت مدیران"
                        >
                          <UserCircle className="w-5 h-5" />
                        </Link>
                        <Link
                          href={`/admin/schools/edit/${school.id}`}
                          className={`p-2.5 rounded-xl transition-colors ${
                            theme === "dark"
                              ? "text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                              : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                          }`}
                          title="ویرایش مدرسه"
                        >
                          <Edit3 className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteSchool(school)}
                          className={`p-2.5 rounded-xl transition-colors ${
                            theme === "dark"
                              ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                              : "text-gray-500 hover:text-red-600 hover:bg-red-50"
                          }`}
                          title="حذف مدرسه"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* School Details Modal */}
      {selectedSchool && (
        <SchoolDetailsModal
          school={selectedSchool}
          onClose={() => setSelectedSchool(null)}
        />
      )}
    </div>
  );
}
