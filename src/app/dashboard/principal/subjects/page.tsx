"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/app/components/ThemeContext";
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  BookOpen,
  Search,
  ArrowLeft,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  grade_level: string;
  created_at: string;
  teacher_count: number;
}

export default function SubjectsManagementPage() {
  const [subjects, setSubjects] = useState<{ [key: string]: Subject[] }>({});
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    description: "",
    grade_level: "",
  });
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    description: "",
    grade_level: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { theme } = useTheme();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/principal/subjects");
      if (response.ok) {
        const result = await response.json();
        setSubjects(result.subjects);

        // Flatten subjects for search
        const flattenedSubjects: Subject[] = Object.values(
          result.subjects || {}
        ).flat() as Subject[];
        setAllSubjects(flattenedSubjects);

        setError(null);
      } else {
        setError("خطا در بارگذاری دروس");
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.name.trim()) {
      alert("نام درس الزامی است");
      return;
    }

    if (!newSubject.grade_level) {
      alert("پایه تحصیلی الزامی است");
      return;
    }

    try {
      const response = await fetch("/api/principal/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSubject),
      });

      if (response.ok) {
        const result = await response.json();
        // Reset form
        setNewSubject({
          name: "",
          code: "",
          description: "",
          grade_level: "",
        });
        setShowAddForm(false);
        setSuccess("درس با موفقیت اضافه شد");
        // Refresh subjects
        fetchSubjects();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const error = await response.json();
        setError(error.error || "خطا در ایجاد درس");
      }
    } catch (error) {
      console.error("Error adding subject:", error);
      setError("خطا در ارتباط با سرور");
    }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject || !editForm.name.trim()) {
      alert("نام درس الزامی است");
      return;
    }

    try {
      const response = await fetch(
        `/api/principal/subjects/${editingSubject.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editForm),
        }
      );

      if (response.ok) {
        // Reset edit state
        setEditingSubject(null);
        setSuccess("درس با موفقیت بروزرسانی شد");
        // Refresh subjects
        fetchSubjects();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const error = await response.json();
        setError(error.error || "خطا در بروزرسانی درس");
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      setError("خطا در ارتباط با سرور");
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("آیا از حذف این درس اطمینان دارید؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/principal/subjects/${subjectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("درس با موفقیت حذف شد");
        // Refresh subjects
        fetchSubjects();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const error = await response.json();
        setError(error.error || "خطا در حذف درس");
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      setError("خطا در ارتباط با سرور");
    }
  };

  const startEditing = (subject: Subject) => {
    setEditingSubject(subject);
    setEditForm({
      name: subject.name,
      code: subject.code || "",
      description: subject.description || "",
      grade_level: subject.grade_level || "",
    });
  };

  const cancelEditing = () => {
    setEditingSubject(null);
  };

  // Filter subjects based on search term
  const filteredSubjects = allSubjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.grade_level?.includes(searchTerm) ||
      subject.code?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="p-3 sm:p-6" dir="rtl">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className={`text-xl sm:text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              مدیریت دروس
            </h1>
            <p
              className={`mt-1 text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-600"
              }`}
            >
              مدیریت دروس مدرسه بر اساس پایه تحصیلی
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/principal/classes"
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium text-sm sm:text-base whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>بازگشت به لیست کلاس‌ها</span>
            </Link>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium text-sm sm:text-base whitespace-nowrap"
              aria-label="افزودن درس جدید"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              درس جدید
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                theme === "dark" ? "text-slate-400" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder="جستجوی دروس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pr-10 pl-4 py-3 rounded-xl border focus:ring-2 focus:outline-none ${
                theme === "dark"
                  ? "bg-slate-800 border-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              }`}
              aria-label="جستجوی دروس"
            />
          </div>
        </div>

        {/* Success/Error Messages */}
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
      </div>

      {/* Add Subject Form */}
      {showAddForm && (
        <div
          className={`mb-8 rounded-xl border ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-lg font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                افزودن درس جدید
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className={`p-2 rounded-lg ${
                  theme === "dark"
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
                aria-label="بستن فرم افزودن درس"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  نام درس *
                </label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, name: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none ${
                    theme === "dark"
                      ? "bg-slate-800 border-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="مثال: ریاضی"
                  aria-label="نام درس"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  کد درس
                </label>
                <input
                  type="text"
                  value={newSubject.code}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, code: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none ${
                    theme === "dark"
                      ? "bg-slate-800 border-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="مثال: MATH01"
                  aria-label="کد درس"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  پایه تحصیلی
                </label>
                <select
                  value={newSubject.grade_level}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      grade_level: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none ${
                    theme === "dark"
                      ? "bg-slate-800 border-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  title="انتخاب پایه تحصیلی"
                  aria-label="پایه تحصیلی"
                >
                  <option value="">انتخاب پایه</option>
                  <option value="اول">اول</option>
                  <option value="دوم">دوم</option>
                  <option value="سوم">سوم</option>
                  <option value="چهارم">چهارم</option>
                  <option value="پنجم">پنجم</option>
                  <option value="ششم">ششم</option>
                  <option value="هفتم">هفتم</option>
                  <option value="هشتم">هشتم</option>
                  <option value="نهم">نهم</option>
                  <option value="دهم">دهم</option>
                  <option value="یازدهم">یازدهم</option>
                  <option value="دوازدهم">دوازدهم</option>
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  توضیحات
                </label>
                <input
                  type="text"
                  value={newSubject.description}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      description: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none ${
                    theme === "dark"
                      ? "bg-slate-800 border-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="توضیحات درس"
                  aria-label="توضیحات درس"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className={`px-6 py-3 rounded-xl font-medium ${
                  theme === "dark"
                    ? "bg-slate-800 hover:bg-slate-700 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
                aria-label="انصراف از افزودن درس"
              >
                انصراف
              </button>
              <button
                onClick={handleAddSubject}
                className={`px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:shadow-lg hover:scale-[1.02] transition-all`}
                aria-label="افزودن درس"
              >
                افزودن درس
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subjects Table */}
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
                  نام درس
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
                  کد درس
                </th>
                <th
                  className={`text-right p-4 font-medium ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  تعداد معلمان
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
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8">
                    <BookOpen
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
                        : "اولین درس خود را اضافه کنید"}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                        aria-label="افزودن اولین درس"
                      >
                        افزودن اولین درس
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => (
                  <tr
                    key={subject.id}
                    className={`border-b ${
                      theme === "dark"
                        ? "border-slate-700 hover:bg-slate-800/50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {editingSubject?.id === subject.id ? (
                      // Edit form row
                      <td colSpan={5} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none ${
                                theme === "dark"
                                  ? "bg-slate-800 border-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
                                  : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                              }`}
                              placeholder="نام درس"
                              aria-label="نام درس"
                            />
                          </div>
                          <div>
                            <select
                              value={editForm.grade_level}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  grade_level: e.target.value,
                                })
                              }
                              className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none ${
                                theme === "dark"
                                  ? "bg-slate-800 border-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
                                  : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                              }`}
                              title="انتخاب پایه تحصیلی"
                              aria-label="پایه تحصیلی"
                            >
                              <option value="">انتخاب پایه</option>
                              <option value="اول">اول</option>
                              <option value="دوم">دوم</option>
                              <option value="سوم">سوم</option>
                              <option value="چهارم">چهارم</option>
                              <option value="پنجم">پنجم</option>
                              <option value="ششم">ششم</option>
                              <option value="هفتم">هفتم</option>
                              <option value="هشتم">هشتم</option>
                              <option value="نهم">نهم</option>
                              <option value="دهم">دهم</option>
                              <option value="یازدهم">یازدهم</option>
                              <option value="دوازدهم">دوازدهم</option>
                            </select>
                          </div>
                          <div>
                            <input
                              type="text"
                              value={editForm.code}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  code: e.target.value,
                                })
                              }
                              className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none ${
                                theme === "dark"
                                  ? "bg-slate-800 border-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
                                  : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                              }`}
                              placeholder="کد درس"
                              aria-label="کد درس"
                            />
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`px-3 py-2 rounded-lg text-sm ${
                                theme === "dark"
                                  ? "bg-blue-900/30 text-blue-300"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {subject.teacher_count} معلم
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={cancelEditing}
                              className={`p-2 rounded-lg ${
                                theme === "dark"
                                  ? "hover:bg-slate-700 text-slate-400"
                                  : "hover:bg-gray-200 text-gray-500"
                              }`}
                              aria-label="انصراف از ویرایش"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleUpdateSubject}
                              className={`p-2 rounded-lg ${
                                theme === "dark"
                                  ? "hover:bg-slate-700 text-green-400"
                                  : "hover:bg-green-100 text-green-600"
                              }`}
                              aria-label="ذخیره تغییرات"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      // Display subject row
                      <>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                theme === "dark"
                                  ? "bg-slate-700"
                                  : "bg-gray-100"
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
                                theme === "dark"
                                  ? "text-white"
                                  : "text-gray-900"
                              }`}
                            >
                              {subject.name}
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
                          {subject.grade_level || "-"}
                        </td>
                        <td
                          className={`p-4 ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-600"
                          }`}
                        >
                          {subject.code || "-"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              theme === "dark"
                                ? "bg-blue-900/30 text-blue-300"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {subject.teacher_count} معلم
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(subject)}
                              className={`p-2 rounded-lg ${
                                theme === "dark"
                                  ? "hover:bg-slate-700 text-slate-400"
                                  : "hover:bg-gray-200 text-gray-500"
                              }`}
                              aria-label="ویرایش درس"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(subject.id)}
                              className={`p-2 rounded-lg ${
                                theme === "dark"
                                  ? "hover:bg-red-900/30 text-red-400"
                                  : "hover:bg-red-100 text-red-600"
                              }`}
                              aria-label="حذف درس"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
