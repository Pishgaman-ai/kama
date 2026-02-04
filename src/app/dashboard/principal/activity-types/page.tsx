"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  AlertCircle,
} from "lucide-react";

interface ActivityType {
  id: string;
  school_id: string;
  type_key: string;
  persian_name: string;
  requires_quantitative_score: boolean;
  requires_qualitative_evaluation: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function ActivityTypesPage() {
  const { theme } = useTheme();
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ActivityType>>({
    type_key: "",
    persian_name: "",
    requires_quantitative_score: true,
    requires_qualitative_evaluation: false,
    display_order: 0,
  });
  const [isCreatingDefaults, setIsCreatingDefaults] = useState(false);

  useEffect(() => {
    fetchActivityTypes();
  }, []);

  const fetchActivityTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/principal/activity-types");

      if (!response.ok) {
        throw new Error("Failed to fetch activity types");
      }

      const data = await response.json();
      setActivityTypes(data.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching activity types:", err);
      setError("خطا در بارگذاری انواع فعالیت");
    } finally {
      setLoading(false);
    }
  };

  // Generate type_key from persian_name
  const generateTypeKey = (persianName: string): string => {
    // Create a simple transliteration or use timestamp
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `activity_${timestamp}_${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.persian_name) {
      setError("لطفاً نام فارسی را وارد کنید");
      return;
    }

    // Auto-generate type_key if not provided
    const type_key = formData.type_key || generateTypeKey(formData.persian_name);

    try {
      const url = editingId
        ? `/api/principal/activity-types/${editingId}`
        : "/api/principal/activity-types";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          type_key,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save activity type");
      }

      // Reset form and close modal
      setFormData({
        type_key: "",
        persian_name: "",
        requires_quantitative_score: true,
        requires_qualitative_evaluation: false,
        display_order: 0,
      });
      setShowAddModal(false);
      setEditingId(null);
      setError(null);

      // Refresh list
      await fetchActivityTypes();
    } catch (err: any) {
      console.error("Error saving activity type:", err);
      setError(err.message || "خطا در ذخیره نوع فعالیت");
    }
  };

  const handleEdit = (activityType: ActivityType) => {
    setFormData({
      type_key: activityType.type_key,
      persian_name: activityType.persian_name,
      requires_quantitative_score: activityType.requires_quantitative_score,
      requires_qualitative_evaluation:
        activityType.requires_qualitative_evaluation,
      display_order: activityType.display_order,
    });
    setEditingId(activityType.id);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این نوع فعالیت اطمینان دارید؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/principal/activity-types/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete activity type");
      }

      await fetchActivityTypes();
    } catch (err: any) {
      console.error("Error deleting activity type:", err);
      alert(err.message || "خطا در حذف نوع فعالیت");
    }
  };

  const handleToggleActive = async (activityType: ActivityType) => {
    try {
      const response = await fetch(
        `/api/principal/activity-types/${activityType.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !activityType.is_active,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update activity type status");
      }

      await fetchActivityTypes();
    } catch (err) {
      console.error("Error toggling activity type status:", err);
      setError("خطا در تغییر وضعیت نوع فعالیت");
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormData({
      type_key: "",
      persian_name: "",
      requires_quantitative_score: true,
      requires_qualitative_evaluation: false,
      display_order: 0,
    });
    setError(null);
  };

  const handleCreateDefaults = async () => {
    if (!confirm("آیا می‌خواهید 7 نوع فعالیت پیش‌فرض را ایجاد کنید؟")) {
      return;
    }

    setIsCreatingDefaults(true);
    setError(null);

    const defaultTypes = [
      { type_key: "midterm_exam", persian_name: "آزمون میان‌ترم", requires_quantitative_score: true, requires_qualitative_evaluation: false, display_order: 1 },
      { type_key: "monthly_exam", persian_name: "آزمون ماهیانه", requires_quantitative_score: true, requires_qualitative_evaluation: false, display_order: 2 },
      { type_key: "weekly_exam", persian_name: "آزمون هفتگی", requires_quantitative_score: true, requires_qualitative_evaluation: false, display_order: 3 },
      { type_key: "final_exam", persian_name: "آزمون پایان ترم", requires_quantitative_score: true, requires_qualitative_evaluation: false, display_order: 4 },
      { type_key: "class_activity", persian_name: "فعالیت کلاسی", requires_quantitative_score: true, requires_qualitative_evaluation: true, display_order: 5 },
      { type_key: "class_homework", persian_name: "تکلیف کلاسی", requires_quantitative_score: true, requires_qualitative_evaluation: true, display_order: 6 },
      { type_key: "home_homework", persian_name: "تکلیف منزل", requires_quantitative_score: true, requires_qualitative_evaluation: false, display_order: 7 },
    ];

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const defaultType of defaultTypes) {
        try {
          const response = await fetch("/api/principal/activity-types", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(defaultType),
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            // If duplicate, it's ok
            if (errorData.error && errorData.error.includes("وجود دارد")) {
              console.log(`${defaultType.persian_name} already exists`);
            } else {
              errorCount++;
            }
          }
        } catch (err) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        alert(`${successCount} نوع فعالیت با موفقیت ایجاد شد`);
      }

      if (errorCount > 0) {
        setError(`${errorCount} نوع فعالیت به دلیل خطا یا تکراری بودن ایجاد نشد`);
      }

      // Refresh list
      await fetchActivityTypes();
    } catch (err) {
      console.error("Error creating defaults:", err);
      setError("خطا در ایجاد انواع فعالیت پیش‌فرض");
    } finally {
      setIsCreatingDefaults(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2
            className={`text-2xl font-bold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            مدیریت انواع فعالیت
          </h2>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            تعریف و مدیریت انواع فعالیت‌های آموزشی مدرسه
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCreateDefaults}
            disabled={isCreatingDefaults}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingDefaults ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>در حال ایجاد...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>ایجاد فعالیت‌های پیش‌فرض</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>افزودن نوع فعالیت جدید</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
            theme === "dark"
              ? "bg-red-500/10 border border-red-500/20"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <AlertCircle
            className={`w-5 h-5 mt-0.5 ${
              theme === "dark" ? "text-red-400" : "text-red-600"
            }`}
          />
          <div className="flex-1">
            <p
              className={`font-medium ${
                theme === "dark" ? "text-red-400" : "text-red-800"
              }`}
            >
              {error}
            </p>
          </div>
          <button onClick={() => setError(null)}>
            <X
              className={`w-5 h-5 ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            />
          </button>
        </div>
      )}

      {/* Activity Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activityTypes.map((activityType) => (
          <div
            key={activityType.id}
            className={`p-6 rounded-xl border transition-all ${
              activityType.is_active
                ? theme === "dark"
                  ? "bg-slate-800/50 border-slate-700/50"
                  : "bg-white border-gray-200"
                : theme === "dark"
                ? "bg-slate-800/20 border-slate-700/20 opacity-60"
                : "bg-gray-50 border-gray-200 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3
                  className={`text-lg font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {activityType.persian_name}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(activityType)}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === "dark"
                      ? "hover:bg-slate-700/50 text-blue-400"
                      : "hover:bg-gray-100 text-blue-600"
                  }`}
                  title="ویرایش"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(activityType.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === "dark"
                      ? "hover:bg-slate-700/50 text-red-400"
                      : "hover:bg-gray-100 text-red-600"
                  }`}
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div
                className={`flex items-center gap-2 text-sm ${
                  theme === "dark" ? "text-slate-300" : "text-gray-700"
                }`}
              >
                {activityType.requires_quantitative_score ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span>نیاز به نمره کمی (عددی)</span>
              </div>
              <div
                className={`flex items-center gap-2 text-sm ${
                  theme === "dark" ? "text-slate-300" : "text-gray-700"
                }`}
              >
                {activityType.requires_qualitative_evaluation ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span>نیاز به ارزیابی کیفی (توصیفی)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
              <span
                className={`text-xs ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                ترتیب نمایش: {activityType.display_order}
              </span>
              <button
                onClick={() => handleToggleActive(activityType)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activityType.is_active
                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                }`}
              >
                {activityType.is_active ? "فعال" : "غیرفعال"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {activityTypes.length === 0 && (
        <div
          className={`text-center py-12 rounded-xl border-2 border-dashed ${
            theme === "dark"
              ? "border-slate-700 bg-slate-800/30"
              : "border-gray-300 bg-gray-50"
          }`}
        >
          <AlertCircle
            className={`w-12 h-12 mx-auto mb-4 ${
              theme === "dark" ? "text-slate-600" : "text-gray-400"
            }`}
          />
          <h3
            className={`text-lg font-semibold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            هنوز نوع فعالیتی تعریف نشده است
          </h3>
          <p
            className={`mb-6 ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            برای شروع، یک نوع فعالیت جدید اضافه کنید
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            افزودن نوع فعالیت
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={`w-full max-w-2xl rounded-2xl shadow-2xl ${
              theme === "dark" ? "bg-slate-800" : "bg-white"
            }`}
          >
            <div className="p-6 border-b border-slate-700">
              <h3
                className={`text-xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {editingId ? "ویرایش نوع فعالیت" : "افزودن نوع فعالیت جدید"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Persian Name */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  نام فارسی *
                </label>
                <input
                  type="text"
                  value={formData.persian_name}
                  onChange={(e) =>
                    setFormData({ ...formData, persian_name: e.target.value })
                  }
                  placeholder="مثلاً: فعالیت عکس، آزمون پایان ترم"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    theme === "dark"
                      ? "bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  }`}
                  required
                />
              </div>

              {/* Display Order */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  ترتیب نمایش
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_order: parseInt(e.target.value) || 0,
                    })
                  }
                  className={`w-full px-4 py-3 rounded-xl border ${
                    theme === "dark"
                      ? "bg-slate-700/50 border-slate-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requires_quantitative_score}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requires_quantitative_score: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    نیاز به نمره کمی (عددی) دارد
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requires_qualitative_evaluation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requires_qualitative_evaluation: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    نیاز به ارزیابی کیفی (توصیفی) دارد
                  </span>
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  <span>{editingId ? "ذخیره تغییرات" : "افزودن"}</span>
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-6 py-3 rounded-xl transition-colors ${
                    theme === "dark"
                      ? "bg-slate-700 text-white hover:bg-slate-600"
                      : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  }`}
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
