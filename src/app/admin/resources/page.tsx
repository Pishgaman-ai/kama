"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import ResourceUploadForm from "./components/ResourceUploadForm";

interface Resource {
  id: string;
  title: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  grade_level?: string;
  subject?: string;
  description?: string;
  school_id?: string;
  uploaded_by: string;
  visibility_level: string;
  created_at: string;
  updated_at: string;
  uploaded_by_name?: string;
  school_name?: string;
}

interface School {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  grade_level: string;
  school_id: string;
}

export default function AdminResourcesPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [resources, setResources] = useState<Resource[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // State for subjects and grade levels
  const [gradeLevels, setGradeLevels] = useState<string[]>([]);
  const [filterSubjects, setFilterSubjects] = useState<Subject[]>([]); // For filter dropdown

  // Filter state
  const [filters, setFilters] = useState({
    schoolId: "",
    gradeLevel: "",
    subject: "",
    search: "",
  });

  // Fetch resources, schools, subjects and grade levels
  useEffect(() => {
    fetchResources();
    fetchSchools();
  }, [filters]);

  // Fetch all subjects for filters (without grade level restriction)
  useEffect(() => {
    fetchAllSubjects(filters.schoolId || undefined);
  }, [filters.schoolId]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.schoolId) params.append("schoolId", filters.schoolId);
      if (filters.gradeLevel) params.append("gradeLevel", filters.gradeLevel);
      if (filters.subject) params.append("subject", filters.subject);
      if (filters.search) params.append("search", filters.search);

      const res = await fetch(`/api/admin/resources?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setResources(data.data.resources);
      } else {
        setError(data.error || "خطا در دریافت منابع");
      }
    } catch (err) {
      setError("خطا در اتصال به سرور");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const res = await fetch("/api/admin/schools");
      const data = await res.json();

      if (data.success) {
        setSchools(data.data.schools);
      } else {
        setError(data.error || "خطا در دریافت مدارس");
      }
    } catch (err) {
      setError("خطا در اتصال به سرور");
      console.error(err);
    }
  };

  const fetchAllSubjects = async (schoolId?: string) => {
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append("schoolId", schoolId);

      const queryString = params.toString();
      const url = `/api/admin/resources/subjects${
        queryString ? `?${queryString}` : ""
      }`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setFilterSubjects(data.data.subjects);
        setGradeLevels(data.data.gradeLevels);
      } else {
        setError(data.error || "خطا در دریافت دروس");
      }
    } catch (err) {
      setError("خطا در اتصال به سرور");
      console.error(err);
    }
  };

  const handleSubmit = async (formData: FormData): Promise<boolean> => {
    try {
      // Clear previous messages
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/resources", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("منبع آموزشی با موفقیت اضافه شد");
        setShowUploadForm(false);
        fetchResources(); // Refresh resources list
        return true;
      } else {
        setError(data.error || "خطا در ایجاد منبع");
        return false;
      }
    } catch (err) {
      setError("خطا در اتصال به سرور: " + (err as Error).message);
      console.error(err);
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این منبع اطمینان دارید؟")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        fetchResources(); // Refresh resources list
      } else {
        setError(data.error || "خطا در حذف منبع");
      }
    } catch (err) {
      setError("خطا در اتصال به سرور");
      console.error(err);
    }
  };

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, "_blank");
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "نامشخص";
    if (bytes < 1024) return bytes + " بایت";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fa-IR");
  };

  // Function to get school name by ID
  const getSchoolName = (id: string) => {
    const school = schools.find((s) => s.id === id);
    return school ? school.name : "وزارت آموزش و پرورش";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1
          className={`text-2xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          مدیریت منابع آموزشی
        </h1>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          {showUploadForm ? "لغو" : "افزودن منبع جدید"}
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div
          className={`px-4 py-3 rounded mb-4 ${
            theme === "dark"
              ? "bg-green-900/30 border border-green-700 text-green-300"
              : "bg-green-100 border border-green-400 text-green-700"
          }`}
        >
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && !success && (
        <div
          className={`px-4 py-3 rounded mb-4 ${
            theme === "dark"
              ? "bg-red-900/30 border border-red-700 text-red-300"
              : "bg-red-100 border border-red-400 text-red-700"
          }`}
        >
          {error}
        </div>
      )}

      {showUploadForm && (
        <ResourceUploadForm
          schools={schools}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowUploadForm(false);
            setError(null);
            setSuccess(null);
          }}
        />
      )}

      {/* Filters */}
      <div
        className={`rounded-lg shadow-md p-4 mb-6 ${
          theme === "dark" ? "bg-slate-800" : "bg-white"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label
              htmlFor="admin-search"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              جستجو
            </label>
            <input
              id="admin-search"
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              placeholder="عنوان یا توضیحات..."
              className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === "dark"
                  ? "bg-slate-700 border border-slate-600 text-white placeholder-gray-400"
                  : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
              title="جستجو در منابع"
            />
          </div>

          <div>
            <label
              htmlFor="admin-filterSchool"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              مدرسه
            </label>
            <select
              id="admin-filterSchool"
              value={filters.schoolId}
              onChange={(e) =>
                setFilters({ ...filters, schoolId: e.target.value })
              }
              className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === "dark"
                  ? "bg-slate-700 border border-slate-600 text-white"
                  : "bg-white border border-gray-300 text-gray-900"
              }`}
              title="فیلتر مدرسه"
            >
              <option
                value=""
                className={
                  theme === "dark"
                    ? "bg-slate-700 text-white"
                    : "bg-white text-gray-900"
                }
              >
                همه مدارس
              </option>
              {schools.map((school) => (
                <option
                  key={school.id}
                  value={school.id}
                  className={
                    theme === "dark"
                      ? "bg-slate-700 text-white"
                      : "bg-white text-gray-900"
                  }
                >
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="admin-filterGradeLevel"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              پایه
            </label>
            <select
              id="admin-filterGradeLevel"
              value={filters.gradeLevel}
              onChange={(e) =>
                setFilters({ ...filters, gradeLevel: e.target.value })
              }
              className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === "dark"
                  ? "bg-slate-700 border border-slate-600 text-white"
                  : "bg-white border border-gray-300 text-gray-900"
              }`}
              title="فیلتر پایه"
            >
              <option
                value=""
                className={
                  theme === "dark"
                    ? "bg-slate-700 text-white"
                    : "bg-white text-gray-900"
                }
              >
                همه پایه‌ها
              </option>
              {gradeLevels.map((level) => (
                <option
                  key={level}
                  value={level}
                  className={
                    theme === "dark"
                      ? "bg-slate-700 text-white"
                      : "bg-white text-gray-900"
                  }
                >
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="admin-filterSubject"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              درس
            </label>
            <select
              id="admin-filterSubject"
              value={filters.subject}
              onChange={(e) =>
                setFilters({ ...filters, subject: e.target.value })
              }
              className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === "dark"
                  ? "bg-slate-700 border border-slate-600 text-white"
                  : "bg-white border border-gray-300 text-gray-900"
              }`}
              title="فیلتر درس"
            >
              <option
                value=""
                className={
                  theme === "dark"
                    ? "bg-slate-700 text-white"
                    : "bg-white text-gray-900"
                }
              >
                همه درس‌ها
              </option>
              {filterSubjects.map((subj) => (
                <option
                  key={subj.id}
                  value={subj.name}
                  className={
                    theme === "dark"
                      ? "bg-slate-700 text-white"
                      : "bg-white text-gray-900"
                  }
                >
                  {subj.name} ({subj.grade_level}){" "}
                  {subj.school_id !== "00000000-0000-0000-0000-000000000000" &&
                    ` - ${getSchoolName(subj.school_id)}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({
                  schoolId: "",
                  gradeLevel: "",
                  subject: "",
                  search: "",
                })
              }
              className={`w-full px-4 py-2 rounded-md ${
                theme === "dark"
                  ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              پاک کردن فیلترها
            </button>
          </div>
        </div>
      </div>

      {/* Resources List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p
            className={`mt-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            در حال بارگذاری منابع...
          </p>
        </div>
      ) : error ? (
        <div
          className={`px-4 py-3 rounded ${
            theme === "dark"
              ? "bg-red-900/30 border border-red-700 text-red-300"
              : "bg-red-100 border border-red-400 text-red-700"
          }`}
        >
          {error}
        </div>
      ) : resources.length === 0 ? (
        <div
          className={`rounded-lg shadow-md p-8 text-center ${
            theme === "dark" ? "bg-slate-800" : "bg-white"
          }`}
        >
          <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
            هیچ منبعی یافت نشد.
          </p>
          <button
            onClick={() => setShowUploadForm(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            اولین منبع خود را اضافه کنید
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className={`rounded-lg shadow-md overflow-hidden ${
                theme === "dark" ? "bg-slate-800" : "bg-white"
              }`}
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3
                    className={`text-lg font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {resource.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      theme === "dark"
                        ? "bg-blue-900/30 text-blue-300"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {resource.visibility_level === "public" && "عمومی"}
                    {resource.visibility_level === "school" && "مدرسه"}
                    {resource.visibility_level === "class" && "کلاس"}
                    {resource.visibility_level === "private" && "خصوصی"}
                  </span>
                </div>

                {resource.description && (
                  <p
                    className={`mt-2 text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {resource.description}
                  </p>
                )}

                <div
                  className={`mt-3 text-xs space-y-1 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {resource.grade_level && (
                    <div>پایه: {resource.grade_level}</div>
                  )}
                  {resource.subject && <div>درس: {resource.subject}</div>}
                  {resource.school_name && (
                    <div>مدرسه: {resource.school_name}</div>
                  )}
                  <div>تاریخ: {formatDate(resource.created_at)}</div>
                  <div>حجم: {formatFileSize(resource.file_size)}</div>
                  {resource.uploaded_by_name && (
                    <div>آپلود شده توسط: {resource.uploaded_by_name}</div>
                  )}
                </div>
              </div>

              <div
                className={`px-4 py-3 flex justify-between items-center ${
                  theme === "dark" ? "bg-slate-700/50" : "bg-gray-50"
                }`}
              >
                <button
                  onClick={() => handleDownload(resource.file_url)}
                  className={`font-medium ${
                    theme === "dark"
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-600 hover:text-blue-800"
                  }`}
                >
                  دانلود
                </button>
                <button
                  onClick={() => handleDelete(resource.id)}
                  className={`font-medium ${
                    theme === "dark"
                      ? "text-red-400 hover:text-red-300"
                      : "text-red-600 hover:text-red-800"
                  }`}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
