"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";

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

export default function TeacherResourcesPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [gradeLevels] = useState([
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ]);
  const [subjects] = useState([
    "ریاضی",
    "علوم",
    "فارسی",
    "انگلیسی",
    "تاریخ",
    "جغرافیا",
    "عربی",
    "قرآن",
    "نگارش",
    "ادبیات",
  ]);
  const [visibilityOptions] = useState([
    { value: "school", label: "قابل مشاهده برای دانش‌آموزان مدرسه" },
    { value: "class", label: "فقط معلمین" },
    { value: "private", label: "فقط خودم" },
  ]);

  // Form state
  const [title, setTitle] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [visibilityLevel, setVisibilityLevel] = useState("school");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [filters, setFilters] = useState({
    gradeLevel: "",
    subject: "",
    search: "",
  });

  // Fetch resources
  useEffect(() => {
    fetchResources();
  }, [filters]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.gradeLevel) params.append("gradeLevel", filters.gradeLevel);
      if (filters.subject) params.append("subject", filters.subject);
      if (filters.search) params.append("search", filters.search);

      const res = await fetch(`/api/teacher/resources?${params.toString()}`);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !file) {
      setError("عنوان و فایل الزامی هستند");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("gradeLevel", gradeLevel);
      formData.append("subject", subject);
      formData.append("description", description);
      formData.append("visibilityLevel", visibilityLevel);

      const res = await fetch("/api/teacher/resources", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        // Reset form
        setTitle("");
        setGradeLevel("");
        setSubject("");
        setDescription("");
        setVisibilityLevel("school");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setShowUploadForm(false);
        fetchResources(); // Refresh resources list
      } else {
        setError(data.error || "خطا در ایجاد منبع");
      }
    } catch (err) {
      setError("خطا در اتصال به سرور");
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این منبع اطمینان دارید؟")) {
      return;
    }

    try {
      const res = await fetch(`/api/teacher/resources/${id}`, {
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

      {showUploadForm && (
        <div
          className={`rounded-lg shadow-md p-6 mb-6 ${
            theme === "dark" ? "bg-slate-800" : "bg-white"
          }`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            افزودن منبع جدید
          </h2>
          {error && (
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                عنوان *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === "dark"
                    ? "bg-slate-700 border border-slate-600 text-white"
                    : "bg-white border border-gray-300 text-gray-900"
                }`}
                required
                placeholder="عنوان منبع"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="gradeLevel"
                  className={`block text-sm font-medium mb-1 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  پایه
                </label>
                <select
                  id="gradeLevel"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === "dark"
                      ? "bg-slate-700 border border-slate-600 text-white"
                      : "bg-white border border-gray-300 text-gray-900"
                  }`}
                  title="انتخاب پایه"
                >
                  <option value="">انتخاب پایه</option>
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
                  htmlFor="subject"
                  className={`block text-sm font-medium mb-1 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  درس
                </label>
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === "dark"
                      ? "bg-slate-700 border border-slate-600 text-white"
                      : "bg-white border border-gray-300 text-gray-900"
                  }`}
                  title="انتخاب درس"
                >
                  <option value="">انتخاب درس</option>
                  {subjects.map((subj) => (
                    <option
                      key={subj}
                      value={subj}
                      className={
                        theme === "dark"
                          ? "bg-slate-700 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      {subj}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                توضیحات
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === "dark"
                    ? "bg-slate-700 border border-slate-600 text-white"
                    : "bg-white border border-gray-300 text-gray-900"
                }`}
                placeholder="توضیحات منبع"
              />
            </div>

            <div>
              <label
                htmlFor="visibilityLevel"
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                سطح نمایش
              </label>
              <select
                id="visibilityLevel"
                value={visibilityLevel}
                onChange={(e) => setVisibilityLevel(e.target.value)}
                className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === "dark"
                    ? "bg-slate-700 border border-slate-600 text-white"
                    : "bg-white border border-gray-300 text-gray-900"
                }`}
                title="انتخاب سطح نمایش"
              >
                {visibilityOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className={
                      theme === "dark"
                        ? "bg-slate-700 text-white"
                        : "bg-white text-gray-900"
                    }
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="file"
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                فایل *
              </label>
              <input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
                  theme === "dark"
                    ? "bg-slate-700 border border-slate-600 text-white dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-800/50"
                    : "bg-white border border-gray-300 text-gray-900 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                }`}
                required
                title="انتخاب فایل"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className={`px-4 py-2 rounded-md ${
                  theme === "dark"
                    ? "border border-slate-600 text-gray-300 hover:bg-slate-700"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                لغو
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                ذخیره منبع
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div
        className={`rounded-lg shadow-md p-4 mb-6 ${
          theme === "dark" ? "bg-slate-800" : "bg-white"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="search"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              جستجو
            </label>
            <input
              id="search"
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
              htmlFor="filterGradeLevel"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              پایه
            </label>
            <select
              id="filterGradeLevel"
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
              htmlFor="filterSubject"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              درس
            </label>
            <select
              id="filterSubject"
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
              {subjects.map((subj) => (
                <option
                  key={subj}
                  value={subj}
                  className={
                    theme === "dark"
                      ? "bg-slate-700 text-white"
                      : "bg-white text-gray-900"
                  }
                >
                  {subj}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({ gradeLevel: "", subject: "", search: "" })
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
                {resource.uploaded_by === "current_user_id" && (
                  <div className="space-x-2">
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
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
