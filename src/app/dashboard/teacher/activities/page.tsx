"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/colors/teal.css";
import "./datepicker-custom.css";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  Calendar,
  BookOpen,
  Users,
  ClipboardList,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  created_at: Date;
}

interface Class {
  id: string;
  name: string;
  grade_level: string;
  section?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  national_id: string;
}

interface Subject {
  id: string;
  name: string;
  class_id: string;
}

interface Activity {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  activity_type: string;
  activity_title: string;
  activity_date: string;
  quantitative_score: number | null;
  qualitative_evaluation: string | null;
  created_at: string;
}

interface ActivityFormData {
  class_id: string;
  student_id: string;
  subject_id: string;
  activity_type: string;
  activity_title: string;
  activity_date: string;
  quantitative_score: string;
  qualitative_evaluation: string;
}

interface APISubject {
  class_id: string;
  class_name: string;
  grade_level: string;
  section?: string;
  subject_id: string;
  subject_name: string;
}

interface DatePickerValue {
  toDate: () => Date;
}

interface ActivityType {
  id: string;
  name: string;
  requires_quantitative_score: boolean;
  requires_qualitative_evaluation: boolean;
}

export default function ActivitiesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [formData, setFormData] = useState<ActivityFormData>({
    class_id: "",
    student_id: "",
    subject_id: "",
    activity_type: "",
    activity_title: "",
    activity_date: new Date().toISOString().split("T")[0],
    quantitative_score: "",
    qualitative_evaluation: "",
  });

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
        await fetchClasses();
        await fetchActivityTypes();
        await fetchActivities();
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/teacher/classes");
      if (response.ok) {
        const data = await response.json();
        // Map subjects to classes format
        const classesData = (data.data?.subjects || []).map((subject: APISubject) => ({
          id: subject.class_id,
          name: subject.class_name,
          grade_level: subject.grade_level,
          section: subject.section,
        }));
        // Remove duplicates based on class_id
        const uniqueClasses = classesData.filter(
          (cls: Class, index: number, self: Class[]) =>
            index === self.findIndex((c) => c.id === cls.id)
        );
        setClasses(uniqueClasses);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      console.log("Fetching students for class:", classId);
      const response = await fetch(`/api/teacher/classes/${classId}/students`);
      console.log("Students response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Students data:", data);
        setStudents(data.students || []);
      } else {
        const errorText = await response.text();
        console.error("Error fetching students:", errorText);
        setStudents([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    }
  };

  const fetchSubjects = async (classId: string) => {
    try {
      // Fetch only subjects this teacher teaches in this specific class
      const response = await fetch(`/api/teacher/subjects?class_id=${classId}`);
      if (response.ok) {
        const data = await response.json();
        const classSubjects = (data.subjects || []).map((subject: any) => ({
          id: subject.id,
          name: subject.name,
          class_id: classId,
        }));
        setSubjects(classSubjects);
      } else {
        console.error("Error fetching subjects:", await response.text());
        setSubjects([]);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    }
  };

  const fetchActivityTypes = async () => {
    try {
      const response = await fetch("/api/teacher/activity-types");
      if (response.ok) {
        const data = await response.json();
        setActivityTypes(data.activityTypes || []);
      }
    } catch (error) {
      console.error("Error fetching activity types:", error);
      setActivityTypes([]);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/teacher/activities");
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const handleClassChange = (classId: string) => {
    setFormData({ ...formData, class_id: classId, student_id: "", subject_id: "" });
    setStudents([]);
    setSubjects([]);
    if (classId) {
      fetchStudents(classId);
      fetchSubjects(classId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const activityData = {
      ...formData,
      quantitative_score: formData.quantitative_score
        ? parseFloat(formData.quantitative_score)
        : null,
    };

    try {
      const url = editingId
        ? `/api/teacher/activities/${editingId}`
        : "/api/teacher/activities";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activityData),
      });

      if (response.ok) {
        await fetchActivities();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.message || "خطا در ثبت فعالیت");
      }
    } catch (error) {
      console.error("Error saving activity:", error);
      alert("خطا در ثبت فعالیت");
    }
  };

  const handleEdit = (activity: Activity) => {
    setFormData({
      class_id: activity.class_id,
      student_id: activity.student_id,
      subject_id: activity.subject_id,
      activity_type: activity.activity_type,
      activity_title: activity.activity_title,
      activity_date: activity.activity_date,
      quantitative_score: activity.quantitative_score?.toString() || "",
      qualitative_evaluation: activity.qualitative_evaluation || "",
    });
    setEditingId(activity.id);
    setShowForm(true);
    fetchStudents(activity.class_id);
    fetchSubjects(activity.class_id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این فعالیت اطمینان دارید؟")) return;

    try {
      const response = await fetch(`/api/teacher/activities/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchActivities();
      } else {
        alert("خطا در حذف فعالیت");
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("خطا در حذف فعالیت");
    }
  };

  const resetForm = () => {
    setFormData({
      class_id: "",
      student_id: "",
      subject_id: "",
      activity_type: "",
      activity_title: "",
      activity_date: new Date().toISOString().split("T")[0],
      quantitative_score: "",
      qualitative_evaluation: "",
    });
    setEditingId(null);
    setShowForm(false);
    setStudents([]);
    setSubjects([]);
  };

  const filteredActivities = activities.filter(
    (activity) =>
      activity.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.activity_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.class_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2
            className={`text-2xl font-bold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            ثبت فعالیت‌های دانش‌آموزان
          </h2>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            مدیریت و ثبت فعالیت‌های آموزشی دانش‌آموزان
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            theme === "dark"
              ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
          }`}
        >
          {showForm ? (
            <>
              <X className="w-5 h-5" />
              <span>لغو</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>ثبت فعالیت جدید</span>
            </>
          )}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div
          className={`mb-6 p-6 rounded-2xl ${
            theme === "dark" ? "bg-slate-800/50" : "bg-white"
          } shadow-lg`}
        >
          <h3
            className={`text-lg font-bold mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {editingId ? "ویرایش فعالیت" : "ثبت فعالیت جدید"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Class Selection */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  <Users className="w-4 h-4 inline ml-1" />
                  کلاس
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) => handleClassChange(e.target.value)}
                  required
                  className={`w-full px-4 py-2 rounded-xl border ${
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 outline-none`}
                >
                  <option value="">انتخاب کلاس</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.grade_level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Selection */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  دانش‌آموز
                </label>
                <select
                  value={formData.student_id}
                  onChange={(e) =>
                    setFormData({ ...formData, student_id: e.target.value })
                  }
                  required
                  disabled={!formData.class_id}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50`}
                >
                  <option value="">انتخاب دانش‌آموز</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selection */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  <BookOpen className="w-4 h-4 inline ml-1" />
                  درس
                </label>
                <select
                  value={formData.subject_id}
                  onChange={(e) =>
                    setFormData({ ...formData, subject_id: e.target.value })
                  }
                  required
                  disabled={!formData.class_id}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50`}
                >
                  <option value="">انتخاب درس</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activity Type */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  <ClipboardList className="w-4 h-4 inline ml-1" />
                  نوع فعالیت
                </label>
                <select
                  value={formData.activity_type}
                  onChange={(e) =>
                    setFormData({ ...formData, activity_type: e.target.value })
                  }
                  required
                  className={`w-full px-4 py-2 rounded-xl border ${
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 outline-none`}
                >
                  <option value="">انتخاب نوع فعالیت</option>
                  {activityTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activity Date */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  <Calendar className="w-4 h-4 inline ml-1" />
                  تاریخ
                </label>
                <DatePicker
                  value={formData.activity_date ? new DateObject(new Date(formData.activity_date)).convert(persian, persian_fa) : ""}
                  onChange={(date: DatePickerValue | null) => {
                    if (date) {
                      // Convert Persian date to Gregorian (YYYY-MM-DD format)
                      const gregorianDate = new Date(date.toDate());
                      const year = gregorianDate.getFullYear();
                      const month = String(gregorianDate.getMonth() + 1).padStart(2, '0');
                      const day = String(gregorianDate.getDate()).padStart(2, '0');
                      const formattedDate = `${year}-${month}-${day}`;
                      setFormData({ ...formData, activity_date: formattedDate });
                    }
                  }}
                  calendar={persian}
                  locale={persian_fa}
                  format="YYYY/MM/DD"
                  calendarPosition="bottom-center"
                  placeholder="انتخاب تاریخ"
                  editable={false}
                  className={`${theme === "dark" ? "bg-dark" : ""}`}
                  inputClass={`w-full px-4 py-2 rounded-xl border ${
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  } focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer`}
                  containerClassName="w-full"
                  style={{
                    width: "100%",
                    direction: "rtl"
                  }}
                />
              </div>

              {/* Activity Title */}
              <div className="md:col-span-2">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  <BookOpen className="w-4 h-4 inline ml-1" />
                  عنوان فعالیت
                </label>
                <input
                  type="text"
                  value={formData.activity_title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      activity_title: e.target.value,
                    })
                  }
                  placeholder="مثال: حل تمرین صفحه 45"
                  className={`w-full px-4 py-2 rounded-xl border ${
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  } focus:ring-2 focus:ring-blue-500 outline-none`}
                />
              </div>

              {/* Quantitative Score */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  نمره کمی (از 20)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={formData.quantitative_score}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantitative_score: e.target.value,
                    })
                  }
                  placeholder="مثال: 18.5"
                  className={`w-full px-4 py-2 rounded-xl border ${
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  } focus:ring-2 focus:ring-blue-500 outline-none`}
                />
              </div>

              {/* Qualitative Evaluation */}
              <div className="md:col-span-2">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  ارزیابی کیفی
                </label>
                <textarea
                  value={formData.qualitative_evaluation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      qualitative_evaluation: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="توضیحات و ارزیابی کیفی فعالیت..."
                  className={`w-full px-4 py-2 rounded-xl border ${
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  } focus:ring-2 focus:ring-blue-500 outline-none resize-none`}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${
                  theme === "dark"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? "ذخیره تغییرات" : "ثبت فعالیت"}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className={`px-6 py-2 rounded-xl transition-all ${
                  theme === "dark"
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                لغو
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="relative">
          <Search
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              theme === "dark" ? "text-slate-400" : "text-gray-400"
            }`}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس نام دانش‌آموز، عنوان یا کلاس..."
            className={`w-full pr-12 pl-4 py-3 rounded-xl border ${
              theme === "dark"
                ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
            } focus:ring-2 focus:ring-blue-500 outline-none`}
          />
        </div>
      </div>

      {/* Activities Table */}
      <div
        className={`rounded-2xl overflow-hidden ${
          theme === "dark" ? "bg-slate-800/50" : "bg-white"
        } shadow-lg`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead
              className={`${
                theme === "dark" ? "bg-slate-700/50" : "bg-gray-50"
              }`}
            >
              <tr>
                <th
                  className={`px-6 py-4 text-right text-sm font-semibold ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  دانش‌آموز
                </th>
                <th
                  className={`px-6 py-4 text-right text-sm font-semibold ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  کلاس
                </th>
                <th
                  className={`px-6 py-4 text-right text-sm font-semibold ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  درس
                </th>
                <th
                  className={`px-6 py-4 text-right text-sm font-semibold ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  نوع فعالیت
                </th>
                <th
                  className={`px-6 py-4 text-right text-sm font-semibold ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  عنوان
                </th>
                <th
                  className={`px-6 py-4 text-right text-sm font-semibold ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  تاریخ
                </th>
                <th
                  className={`px-6 py-4 text-right text-sm font-semibold ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  نمره
                </th>
                <th
                  className={`px-6 py-4 text-right text-sm font-semibold ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className={`px-6 py-12 text-center ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    {searchTerm
                      ? "هیچ فعالیتی یافت نشد"
                      : "هنوز فعالیتی ثبت نشده است"}
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity, index) => (
                  <tr
                    key={activity.id}
                    className={`border-t ${
                      theme === "dark"
                        ? "border-slate-700 hover:bg-slate-700/30"
                        : "border-gray-200 hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <td
                      className={`px-6 py-4 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {activity.student_name}
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      {activity.class_name}
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      {activity.subject_name || "-"}
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          theme === "dark"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {
                          activityTypes.find(
                            (t) => t.id === activity.activity_type
                          )?.name
                        }
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      {activity.activity_title}
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {new Date(activity.activity_date).toLocaleDateString(
                        "fa-IR"
                      )}
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      {activity.quantitative_score !== null ? (
                        <span
                          className={`font-semibold ${
                            activity.quantitative_score >= 15
                              ? "text-green-500"
                              : activity.quantitative_score >= 10
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                        >
                          {activity.quantitative_score}
                        </span>
                      ) : (
                        <span
                          className={`text-sm ${
                            theme === "dark"
                              ? "text-slate-500"
                              : "text-gray-400"
                          }`}
                        >
                          ثبت نشده
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(activity)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-slate-600 text-blue-400"
                              : "hover:bg-gray-100 text-blue-600"
                          }`}
                          title="ویرایش"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(activity.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-slate-600 text-red-400"
                              : "hover:bg-gray-100 text-red-600"
                          }`}
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      {activities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div
            className={`p-4 rounded-xl ${
              theme === "dark" ? "bg-slate-800/50" : "bg-white"
            } shadow`}
          >
            <p
              className={`text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-600"
              }`}
            >
              مجموع فعالیت‌ها
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {activities.length}
            </p>
          </div>
          <div
            className={`p-4 rounded-xl ${
              theme === "dark" ? "bg-slate-800/50" : "bg-white"
            } shadow`}
          >
            <p
              className={`text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-600"
              }`}
            >
              میانگین نمرات
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {(
                activities
                  .filter((a) => a.quantitative_score !== null)
                  .reduce((sum, a) => sum + (a.quantitative_score || 0), 0) /
                activities.filter((a) => a.quantitative_score !== null).length
              ).toFixed(1) || "0"}
            </p>
          </div>
          <div
            className={`p-4 rounded-xl ${
              theme === "dark" ? "bg-slate-800/50" : "bg-white"
            } shadow`}
          >
            <p
              className={`text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-600"
              }`}
            >
              فعالیت‌های امروز
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {
                activities.filter(
                  (a) =>
                    a.activity_date === new Date().toISOString().split("T")[0]
                ).length
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
