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
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  description: string;
  grade_level: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

const GRADE_LEVELS = [
  // Elementary
  { value: "اول", label: "پایه اول" },
  { value: "دوم", label: "پایه دوم" },
  { value: "سوم", label: "پایه سوم" },
  { value: "چهارم", label: "پایه چهارم" },
  { value: "پنجم", label: "پایه پنجم" },
  { value: "ششم", label: "پایه ششم" },
  // Middle school
  { value: "هفتم", label: "پایه هفتم" },
  { value: "هشتم", label: "پایه هشتم" },
  { value: "نهم", label: "پایه نهم" },
  // High school - Common subjects
  { value: "دهم-مشترک", label: "دهم - دروس مشترک" },
  { value: "یازدهم-مشترک", label: "یازدهم - دروس مشترک" },
  { value: "دوازدهم-مشترک", label: "دوازدهم - دروس مشترک" },
  // High school - Math & Physics
  { value: "دهم-ریاضی", label: "دهم - ریاضی و فیزیک" },
  { value: "یازدهم-ریاضی", label: "یازدهم - ریاضی و فیزیک" },
  { value: "دوازدهم-ریاضی", label: "دوازدهم - ریاضی و فیزیک" },
  // High school - Experimental Sciences
  { value: "دهم-تجربی", label: "دهم - علوم تجربی" },
  { value: "یازدهم-تجربی", label: "یازدهم - علوم تجربی" },
  { value: "دوازدهم-تجربی", label: "دوازدهم - علوم تجربی" },
  // High school - Humanities
  { value: "دهم-انسانی", label: "دهم - علوم انسانی" },
  { value: "یازدهم-انسانی", label: "یازدهم - علوم انسانی" },
  { value: "دوازدهم-انسانی", label: "دوازدهم - علوم انسانی" },
  // High school - Islamic Studies
  { value: "دهم-معارف", label: "دهم - معارف اسلامی" },
  { value: "یازدهم-معارف", label: "یازدهم - معارف اسلامی" },
  { value: "دوازدهم-معارف", label: "دوازدهم - معارف اسلامی" },
  // High school - Technical & Vocational
  { value: "دهم-فنی", label: "دهم - فنی و حرفه‌ای" },
  { value: "یازدهم-فنی", label: "یازدهم - فنی و حرفه‌ای" },
  { value: "دوازدهم-فنی", label: "دوازدهم - فنی و حرفه‌ای" },
];

export default function LessonsManagementPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    grade_level: "",
  });
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    grade_level: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGradeLevel, setFilterGradeLevel] = useState<string>("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>(
    {}
  );
  const { theme } = useTheme();

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/principal/lessons");
      if (response.ok) {
        const result = await response.json();
        setLessons(result.lessons || []);
        setError(null);
      } else {
        setError("خطا در بارگذاری درس‌ها");
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async () => {
    if (!newLesson.title.trim()) {
      alert("عنوان درس الزامی است");
      return;
    }

    if (!newLesson.grade_level) {
      alert("پایه تحصیلی الزامی است");
      return;
    }

    try {
      const response = await fetch("/api/principal/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newLesson),
      });

      if (response.ok) {
        setNewLesson({
          title: "",
          description: "",
          grade_level: "",
        });
        setShowAddForm(false);
        setSuccess("درس با موفقیت اضافه شد");
        fetchLessons();

        setTimeout(() => setSuccess(null), 3000);
      } else {
        const result = await response.json();
        setError(result.error || "خطا در ایجاد درس");
      }
    } catch (error) {
      console.error("Error adding lesson:", error);
      setError("خطا در ارتباط با سرور");
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson || !editForm.title.trim()) {
      alert("عنوان درس الزامی است");
      return;
    }

    try {
      const response = await fetch(`/api/principal/lessons/${editingLesson.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setEditingLesson(null);
        setSuccess("درس با موفقیت بروزرسانی شد");
        fetchLessons();

        setTimeout(() => setSuccess(null), 3000);
      } else {
        const result = await response.json();
        setError(result.error || "خطا در بروزرسانی درس");
      }
    } catch (error) {
      console.error("Error updating lesson:", error);
      setError("خطا در ارتباط با سرور");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("آیا از حذف این درس اطمینان دارید؟")) {
      return;
    }

    try {
      setDeleting(lessonId);
      const response = await fetch(`/api/principal/lessons/${lessonId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("درس با موفقیت حذف شد");
        fetchLessons();

        setTimeout(() => setSuccess(null), 3000);
      } else {
        const result = await response.json();
        setError(result.error || "خطا در حذف درس");
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setDeleting(null);
    }
  };

  const handleSyncCurriculumLessons = async (gradeLevel: string) => {
    if (
      !confirm(
        `آیا می‌خواهید دروس استاندارد برنامه درسی ملی برای پایه "${gradeLevel}" را همگام‌سازی کنید؟\n\nدروسی که از قبل وجود دارند تکرار نمی‌شوند.`
      )
    ) {
      return;
    }

    try {
      setSyncing(gradeLevel);
      const response = await fetch("/api/principal/sync-curriculum-lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade_level: gradeLevel }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(result.message || "دروس استاندارد با موفقیت همگام‌سازی شد");
        setTimeout(() => setSuccess(null), 5000);
        fetchLessons();
      } else {
        const result = await response.json();
        setError(result.error || "خطا در همگام‌سازی دروس استاندارد");
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error("Error syncing curriculum lessons:", error);
      setError("خطا در ارتباط با سرور");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSyncing(null);
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditForm({
      title: lesson.title,
      description: lesson.description,
      grade_level: lesson.grade_level,
    });
  };

  const handleCancelEdit = () => {
    setEditingLesson(null);
  };

  // Filter lessons based on search term and grade level
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGradeLevel ? lesson.grade_level === filterGradeLevel : true;
    return matchesSearch && matchesGrade;
  });

  // Group lessons by grade level
  const lessonsByGrade = filteredLessons.reduce((acc, lesson) => {
    const grade = lesson.grade_level;
    if (!acc[grade]) {
      acc[grade] = [];
    }
    acc[grade].push(lesson);
    return acc;
  }, {} as { [key: string]: Lesson[] });

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
              مدیریت درس‌ها
            </h1>
            <p
              className={`mt-1 text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-600"
              }`}
            >
              تعریف و ویرایش درس‌های آموزشی برای هر پایه
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium text-sm sm:text-base whitespace-nowrap"
            aria-label="افزودن درس جدید"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            درس جدید
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                theme === "dark" ? "text-slate-400" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder="جستجوی درس‌ها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pr-10 pl-4 py-3 rounded-xl border focus:ring-2 focus:outline-none ${
                theme === "dark"
                  ? "bg-slate-800 border-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              }`}
              aria-label="جستجوی درس‌ها"
            />
          </div>

          <select
            value={filterGradeLevel}
            onChange={(e) => setFilterGradeLevel(e.target.value)}
            className={`px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none ${
              theme === "dark"
                ? "bg-slate-800 border-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
                : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            }`}
            aria-label="فیلتر براساس پایه"
          >
            <option value="">همه پایه‌ها</option>
            {GRADE_LEVELS.map((grade) => (
              <option key={grade.value} value={grade.value}>
                {grade.label}
              </option>
            ))}
          </select>
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

      {/* Add Lesson Form */}
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
                className={`p-2 hover:bg-opacity-20 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "hover:bg-white text-slate-300"
                    : "hover:bg-gray-300 text-gray-600"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  عنوان درس *
                </label>
                <input
                  type="text"
                  value={newLesson.title}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, title: e.target.value })
                  }
                  placeholder="عنوان درس را وارد کنید"
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none ${
                    theme === "dark"
                      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500"
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  پایه تحصیلی *
                </label>
                <select
                  value={newLesson.grade_level}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, grade_level: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none ${
                    theme === "dark"
                      ? "bg-slate-800 border-slate-700 text-white focus:ring-blue-500"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                  }`}
                >
                  <option value="">انتخاب کنید</option>
                  {GRADE_LEVELS.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
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
                <textarea
                  value={newLesson.description}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, description: e.target.value })
                  }
                  placeholder="توضیحات درس..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none ${
                    theme === "dark"
                      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500"
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    theme === "dark"
                      ? "bg-slate-700 hover:bg-slate-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  انصراف
                </button>
                <button
                  onClick={handleAddLesson}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  ثبت درس
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lessons List by Grade Level */}
      <div className="space-y-8">
        {GRADE_LEVELS.map((gradeInfo) => {
          const gradeLessons = lessonsByGrade[gradeInfo.value] || [];
          const isExpanded = !!expandedGrades[gradeInfo.value];

          // Skip if there's a grade filter and this is not the selected grade
          if (filterGradeLevel && filterGradeLevel !== gradeInfo.value) {
            return null;
          }

          // In default view, hide grades with no lessons
          if (!searchTerm && !filterGradeLevel && gradeLessons.length === 0) {
            return null;
          }

          // Skip if there's a search term and no lessons match for this grade
          if (searchTerm && gradeLessons.length === 0) {
            return null;
          }

            return (
              <div key={gradeInfo.value}>
                <div className={`flex items-center justify-between mb-4 pb-3 border-b-2 ${
                  theme === "dark"
                    ? "border-slate-700"
                    : "border-gray-200"
                }`}>
                  <h2
                    className={`text-lg font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {gradeInfo.label}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setExpandedGrades((prev) => ({
                          ...prev,
                          [gradeInfo.value]: !isExpanded,
                        }))
                      }
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        theme === "dark"
                          ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      <span>{isExpanded ? "Hide lessons" : "View lessons"}</span>
                    </button>
                    <button
                      onClick={() => handleSyncCurriculumLessons(gradeInfo.value)}
                      disabled={syncing === gradeInfo.value}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        syncing === gradeInfo.value
                          ? "opacity-50 cursor-not-allowed bg-blue-600 text-white"
                          : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:shadow-lg"
                      }`}
                    >
                      {syncing === gradeInfo.value ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>???? ?????? ?????????????????????...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>????????????????????? ???????? ??????????????????</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {!isExpanded ? (
                  <div
                    className={`rounded-xl border p-4 ${
                      theme === "dark"
                        ? "bg-slate-900/30 border-slate-800 text-slate-300"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    <p className="text-sm">{gradeLessons.length} lessons</p>
                  </div>
                ) : gradeLessons.length === 0 ? (
                  <div
                    className={`text-center py-8 rounded-xl border-2 border-dashed ${
                      theme === "dark"
                        ? "border-slate-700 bg-slate-900/20"
                        : "border-gray-300 bg-gray-50"
                    }`}
                  >
                    <BookOpen
                      className={`w-10 h-10 mx-auto mb-3 ${
                        theme === "dark" ? "text-slate-500" : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-600"
                      }`}
                    >
                      هنوز درسی برای این پایه ثبت نشده است
                    </p>
                    <p
                      className={`text-xs ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      روی دکمه "همگام‌سازی دروس استاندارد" کلیک کنید یا درس جدید اضافه کنید
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {gradeLessons.map((lesson) => (
                      <div key={lesson.id}>
                        {editingLesson?.id === lesson.id ? (
                          // Edit Form
                          <div
                            className={`rounded-xl border p-4 ${
                              theme === "dark"
                                ? "bg-slate-800/50 border-slate-700"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                          <div className="space-y-4">
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  title: e.target.value,
                                })
                              }
                              className={`w-full px-3 py-2 rounded-lg border ${
                                theme === "dark"
                                  ? "bg-slate-700 border-slate-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              }`}
                            />
                            <textarea
                              value={editForm.description}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  description: e.target.value,
                                })
                              }
                              rows={3}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                theme === "dark"
                                  ? "bg-slate-700 border-slate-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              }`}
                            />
                            <select
                              value={editForm.grade_level}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  grade_level: e.target.value,
                                })
                              }
                              className={`w-full px-3 py-2 rounded-lg border ${
                                theme === "dark"
                                  ? "bg-slate-700 border-slate-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              }`}
                            >
                              {GRADE_LEVELS.map((grade) => (
                                <option key={grade.value} value={grade.value}>
                                  {grade.label}
                                </option>
                              ))}
                            </select>
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={handleCancelEdit}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                  theme === "dark"
                                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                                }`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleUpdateLesson}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <div
                          className={`rounded-xl border p-4 ${
                            theme === "dark"
                              ? "bg-slate-800 border-slate-700 hover:bg-slate-700/50"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          } transition-colors`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3
                                className={`font-bold text-base ${
                                  theme === "dark"
                                    ? "text-white"
                                    : "text-gray-900"
                                }`}
                              >
                                {lesson.title}
                              </h3>
                              {lesson.description && (
                                <p
                                  className={`text-sm mt-2 ${
                                    theme === "dark"
                                      ? "text-slate-300"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {lesson.description}
                                </p>
                              )}
                              <p
                                className={`text-xs mt-2 ${
                                  theme === "dark"
                                    ? "text-slate-400"
                                    : "text-gray-500"
                                }`}
                              >
                                ایجاد شده توسط: {lesson.created_by_name} در{" "}
                                {new Date(lesson.created_at).toLocaleDateString(
                                  "fa-IR"
                                )}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditLesson(lesson)}
                                className="p-2 hover:bg-blue-500/20 text-blue-600 rounded-lg transition-colors"
                                aria-label="ویرایش درس"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteLesson(lesson.id)}
                                disabled={deleting === lesson.id}
                                className={`p-2 rounded-lg transition-colors ${
                                  deleting === lesson.id
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-red-500/20 text-red-600"
                                }`}
                                aria-label="حذف درس"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
}
