"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/app/components/ThemeContext";

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

interface ResourceUploadFormProps {
  schools: School[];
  onSubmit: (formData: FormData) => Promise<boolean>;
  onCancel: () => void;
}

export default function ResourceUploadForm({
  schools,
  onSubmit,
  onCancel,
}: ResourceUploadFormProps) {
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [visibilityLevel, setVisibilityLevel] = useState("public");
  const [schoolId, setSchoolId] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // State for subjects and grade levels
  const [gradeLevels, setGradeLevels] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);

  const visibilityOptions = [
    { value: "public", label: "عمومی" },
    { value: "school", label: "مخصوص یک مدرسه" },
  ];

  // Fetch subjects when school or grade level changes
  useEffect(() => {
    fetchSubjectsAndGrades(schoolId || undefined, gradeLevel || undefined);
  }, [schoolId, gradeLevel]);

  const fetchSubjectsAndGrades = async (
    schoolId?: string,
    gradeLevel?: string
  ) => {
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append("schoolId", schoolId);
      if (gradeLevel) params.append("gradeLevel", gradeLevel);

      const queryString = params.toString();
      const url = `/api/admin/resources/subjects${
        queryString ? `?${queryString}` : ""
      }`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setSubjects(data.data.subjects);
        setFilteredSubjects(data.data.subjects);
        setGradeLevels(data.data.gradeLevels);
      } else {
        setError(data.error || "خطا در دریافت دروس و پایه‌ها");
      }
    } catch (err) {
      setError("خطا در اتصال به سرور");
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);

    if (!title || !file) {
      setError("عنوان و فایل الزامی هستند");
      return;
    }

    // If visibility is school-specific, schoolId is required
    if (visibilityLevel === "school" && !schoolId) {
      setError("برای منابع مخصوص مدرسه، انتخاب مدرسه الزامی است");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("gradeLevel", gradeLevel);
      formData.append("subject", subject);
      formData.append("description", description);
      if (visibilityLevel === "school") {
        formData.append("schoolId", schoolId);
      }
      formData.append("visibilityLevel", visibilityLevel);

      const success = await onSubmit(formData);

      if (success) {
        // Reset form
        setTitle("");
        setGradeLevel("");
        setSubject("");
        setDescription("");
        setSchoolId("");
        setVisibilityLevel("public");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (err) {
      setError("خطا در اتصال به سرور: " + (err as Error).message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to get school name by ID
  const getSchoolName = (id: string) => {
    const school = schools.find((s) => s.id === id);
    return school ? school.name : "وزارت آموزش و پرورش";
  };

  return (
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
            htmlFor="admin-title"
            className={`block text-sm font-medium mb-1 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            عنوان *
          </label>
          <input
            id="admin-title"
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
              htmlFor="admin-visibilityLevel"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              نوع منبع
            </label>
            <select
              id="admin-visibilityLevel"
              value={visibilityLevel}
              onChange={(e) => setVisibilityLevel(e.target.value)}
              className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === "dark"
                  ? "bg-slate-700 border border-slate-600 text-white"
                  : "bg-white border border-gray-300 text-gray-900"
              }`}
              title="انتخاب نوع منبع"
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

          {visibilityLevel === "school" && (
            <div>
              <label
                htmlFor="admin-schoolId"
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                انتخاب مدرسه *
              </label>
              <select
                id="admin-schoolId"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === "dark"
                    ? "bg-slate-700 border border-slate-600 text-white"
                    : "bg-white border border-gray-300 text-gray-900"
                }`}
                required={visibilityLevel === "school"}
                title="انتخاب مدرسه"
              >
                <option value="">انتخاب مدرسه</option>
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
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="admin-gradeLevel"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              پایه
            </label>
            <select
              id="admin-gradeLevel"
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
              htmlFor="admin-subject"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              درس
            </label>
            <select
              id="admin-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === "dark"
                  ? "bg-slate-700 border border-slate-600 text-white"
                  : "bg-white border border-gray-300 text-gray-900"
              }`}
              title="انتخاب درس"
              disabled={!gradeLevel} // Disable if no grade level is selected
            >
              <option value="">انتخاب درس</option>
              {filteredSubjects.map((subj) => (
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
            {!gradeLevel && (
              <p
                className={`text-xs mt-1 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                ابتدا پایه تحصیلی را انتخاب کنید
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="admin-description"
            className={`block text-sm font-medium mb-1 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            توضیحات
          </label>
          <textarea
            id="admin-description"
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
            htmlFor="admin-file"
            className={`block text-sm font-medium mb-1 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            فایل *
          </label>
          <input
            id="admin-file"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-5 file:text-blue-700 hover:file:bg-blue-100 ${
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
            onClick={onCancel}
            className={`px-4 py-2 rounded-md ${
              theme === "dark"
                ? "border border-slate-600 text-gray-300 hover:bg-slate-700"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
            disabled={isSubmitting}
          >
            لغو
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "در حال ذخیره..." : "ذخیره منبع"}
          </button>
        </div>
      </form>
    </div>
  );
}
