"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/colors/teal.css";
import "../../teacher/smart-activities/datepicker-custom.css";
import {
  Search,
  Download,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  school_id: string;
  created_at: Date;
}

interface Activity {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  grade_level: string;
  section?: string;
  subject_id: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  activity_type: string;
  activity_title: string;
  activity_date: string;
  quantitative_score: number | null;
  qualitative_evaluation: string | null;
  created_at: string;
}

interface DatePickerValue {
  toDate: () => Date;
}

export default function BulkActivitiesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityTypes, setActivityTypes] = useState([
    { id: "midterm_exam", name: "آزمون میان‌ترم" },
    { id: "monthly_exam", name: "آزمون ماهیانه" },
    { id: "weekly_exam", name: "آزمون هفتگی" },
    { id: "class_activity", name: "فعالیت کلاسی" },
    { id: "class_homework", name: "تکلیف کلاسی" },
    { id: "home_homework", name: "تکلیف منزل" },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [showTemplateGenerator, setShowTemplateGenerator] = useState(false);

  // Template Generator State
  const [gradeLevels, setGradeLevels] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);
  const [defaultScore, setDefaultScore] = useState<string>("");
  const [defaultDate, setDefaultDate] = useState<string>("");
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

  const { theme } = useTheme();
  const router = useRouter();

  const gradeLabelByValue = React.useMemo(() => {
    const map = new Map<string, string>();
    gradeLevels.forEach((grade) => {
      if (grade?.value) {
        map.set(grade.value, grade.label);
      }
    });
    return map;
  }, [gradeLevels]);

  const formatGradeLabel = (gradeValue: string) => {
    const label = gradeLabelByValue.get(gradeValue) || gradeValue;
    return label.replace(/^پایه\s+/g, "").trim() || gradeValue;
  };

  const filteredClasses = React.useMemo(() => {
    if (selectedGradeLevels.length === 0) {
      return classes;
    }
    return classes.filter((classItem) =>
      selectedGradeLevels.includes(classItem.grade_level)
    );
  }, [classes, selectedGradeLevels]);

  const effectiveGradeLevels = React.useMemo(() => {
    if (selectedGradeLevels.length > 0) {
      return selectedGradeLevels;
    }
    const gradeSet = new Set<string>();
    classes.forEach((classItem) => {
      if (selectedClasses.includes(classItem.id) && classItem.grade_level) {
        gradeSet.add(classItem.grade_level);
      }
    });
    return Array.from(gradeSet);
  }, [selectedGradeLevels, selectedClasses, classes]);

  const filteredLessons = React.useMemo(() => {
    if (effectiveGradeLevels.length === 0) {
      return lessons;
    }
    return lessons.filter(
      (lesson) =>
        lesson.grade_level === "همه" ||
        effectiveGradeLevels.includes(lesson.grade_level)
    );
  }, [lessons, effectiveGradeLevels]);

  const lessonGroups = React.useMemo(() => {
    const map = new Map<string, { name: string; ids: string[] }>();
    const list: { name: string; ids: string[] }[] = [];
    filteredLessons.forEach((lesson) => {
      const lessonName = (lesson.name || "").trim() || lesson.id;
      if (!map.has(lessonName)) {
        const group = { name: lessonName, ids: [] as string[] };
        map.set(lessonName, group);
        list.push(group);
      }
      map.get(lessonName)!.ids.push(lesson.id);
    });
    return { map, list };
  }, [filteredLessons]);

  const lessonNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    lessons.forEach((lesson) => {
      const name = (lesson.name || "").trim();
      if (name) {
        map.set(lesson.id, name);
      }
    });
    return map;
  }, [lessons]);

  useEffect(() => {
    if (selectedGradeLevels.length === 0) {
      return;
    }
    const allowedClassIds = new Set(filteredClasses.map((cls) => cls.id));
    setSelectedClasses((prev) => prev.filter((id) => allowedClassIds.has(id)));
  }, [selectedGradeLevels, filteredClasses]);

  useEffect(() => {
    if (selectedLessons.length === 0) {
      return;
    }
    const selectedNames = new Set(
      selectedLessons
        .map((id) => lessonNameById.get(id))
        .filter((name): name is string => Boolean(name))
    );
    const nextSelected = new Set<string>();
    selectedNames.forEach((name) => {
      const group = lessonGroups.map.get(name);
      if (group) {
        group.ids.forEach((id) => nextSelected.add(id));
      }
    });
    const nextSelectedArray = Array.from(nextSelected);
    const isSame =
      nextSelectedArray.length === selectedLessons.length &&
      nextSelectedArray.every((id) => selectedLessons.includes(id));
    if (!isSame) {
      setSelectedLessons(nextSelectedArray);
    }
  }, [lessonGroups, lessonNameById, selectedLessons]);

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
        await fetchActivities();
        await fetchActivityTypes();
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/principal/activities");
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const fetchActivityTypes = async () => {
    try {
      const response = await fetch("/api/principal/activity-types");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const transformedTypes = result.data.map((type: any) => ({
            id: type.type_key,
            name: type.persian_name,
          }));
          setActivityTypes(transformedTypes);
        }
      }
    } catch (error) {
      console.error("Error fetching activity types:", error);
      // Keep default types as fallback
    }
  };

  const fetchGradeLevels = async () => {
    try {
      const response = await fetch("/api/principal/grade-levels");
      if (response.ok) {
        const data = await response.json();
        const allGrades = [
          ...data.gradeLevels.elementary,
          ...data.gradeLevels.middleSchool,
          ...data.gradeLevels.highSchool,
        ];
        setGradeLevels(allGrades);
      }
    } catch (error) {
      console.error("Error fetching grade levels:", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/principal/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await fetch("/api/principal/subjects");
      if (response.ok) {
        const data = await response.json();
        const allLessons = Object.values(data.subjects || {}).flat() as any[];
        setLessons(allLessons);
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
    }
  };

  const filteredActivities = activities.filter(
    (activity) =>
      activity.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.activity_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.teacher_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredActivities.length / itemsPerPage)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pagedActivities = filteredActivities.slice(startIndex, endIndex);
  const rangeStart = filteredActivities.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(endIndex, filteredActivities.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, searchTerm]);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  const handleExport = async () => {
    if (activities.length === 0) {
      alert("هیچ فعالیتی برای خروجی وجود ندارد");
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch("/api/principal/activities/export");

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "خطا در خروجی گرفتن فعالیت‌ها");
        return;
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "school_activities.xlsx";
      if (contentDisposition) {
        const matches = /filename\*=UTF-8''(.+)/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = decodeURIComponent(matches[1]);
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("خطا در خروجی گرفتن فعالیت‌ها");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/principal/activities/template");

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "خطا در دانلود فایل نمونه");
        return;
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "school_activities_template.xlsx";
      if (contentDisposition) {
        const matches = /filename\*=UTF-8''(.+)/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = decodeURIComponent(matches[1]);
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Template download error:", error);
      alert("خطا در دانلود فایل نمونه");
    }
  };

  const handleGenerateCustomTemplate = async () => {
    // Validation
    if (
      selectedGradeLevels.length === 0 &&
      selectedClasses.length === 0
    ) {
      alert("لطفاً حداقل یک پایه یا یک کلاس را انتخاب کنید");
      return;
    }

    if (selectedLessons.length === 0) {
      alert("لطفاً حداقل یک درس را انتخاب کنید");
      return;
    }

    if (selectedActivityTypes.length === 0) {
      alert("لطفاً حداقل یک نوع فعالیت را انتخاب کنید");
      return;
    }

    setIsGeneratingTemplate(true);

    try {
      // defaultDate is already in Gregorian format (YYYY-MM-DD) from DatePicker
      const gregorianDate = defaultDate || null;

      const response = await fetch("/api/principal/activities/custom-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradeLevels: selectedGradeLevels,
          classes: selectedClasses,
          lessons: selectedLessons,
          activityTypes: selectedActivityTypes,
          defaultScore: defaultScore ? parseFloat(defaultScore) : null,
          defaultDate: gregorianDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "خطا در تولید فایل الگو");
        return;
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "custom_activities_template.xlsx";
      if (contentDisposition) {
        const matches = /filename\*=UTF-8''(.+)/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = decodeURIComponent(matches[1]);
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Close modal
      setShowTemplateGenerator(false);
    } catch (error) {
      console.error("Custom template generation error:", error);
      alert("خطا در تولید فایل الگو");
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      alert("لطفاً فقط فایل Excel انتخاب کنید");
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/principal/activities/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data);
        setShowImportDialog(true);
        // Refresh activities list
        await fetchActivities();
      } else {
        alert(data.error || "خطا در ورود اطلاعات");
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("خطا در ورود اطلاعات");
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = "";
    }
  };

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
            ورود و ویرایش فعالیت‌ها بصورت گروهی
          </h2>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            مدیریت گروهی فعالیت‌های آموزشی مدرسه از طریق فایل اکسل
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setShowTemplateGenerator(true);
              fetchGradeLevels();
              fetchClasses();
              fetchLessons();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              theme === "dark"
                ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            }`}
            title="ایجاد فرم خام سفارشی"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>ایجاد فرم خام</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              theme === "dark"
                ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                : "bg-purple-50 text-purple-600 hover:bg-purple-100"
            }`}
            title="دانلود فایل نمونه"
          >
            <Download className="w-5 h-5" />
            <span>دانلود نمونه</span>
          </button>

          <label
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              isImporting
                ? "bg-gray-400 cursor-not-allowed text-white"
                : theme === "dark"
                ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                : "bg-orange-50 text-orange-600 hover:bg-orange-100"
            }`}
            title="ورود از اکسل"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                <span>در حال ورود...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>ورود از اکسل</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  disabled={isImporting}
                  className="hidden"
                />
              </>
            )}
          </label>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || activities.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              isExporting || activities.length === 0
                ? "bg-gray-400 cursor-not-allowed text-white"
                : theme === "dark"
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                : "bg-green-50 text-green-600 hover:bg-green-100"
            }`}
            title="خروجی اکسل"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                <span>در حال خروجی...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-5 h-5" />
                <span>خروجی اکسل</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
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
            placeholder="جستجو بر اساس نام دانش‌آموز، معلم، عنوان یا کلاس..."
            className={`w-full pr-12 pl-4 py-3 rounded-xl border ${
              theme === "dark"
                ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
            } focus:ring-2 focus:ring-blue-500 outline-none`}
          />
        </div>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            نمایش {rangeStart} تا {rangeEnd} از {filteredActivities.length}
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="bulk-activities-page-size"
              className={`text-sm ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              تعداد در صفحه:
            </label>
            <select
              id="bulk-activities-page-size"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className={`px-3 py-2 rounded-lg border text-sm ${
                theme === "dark"
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-blue-500 outline-none`}
            >
              {[20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
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
                  className={`px-4 py-4 text-center text-sm font-semibold ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  ردیف
                </th>
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
                  معلم
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
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
                pagedActivities.map((activity, index) => (
                  <tr
                    key={activity.id}
                    className={`border-t ${
                      theme === "dark"
                        ? "border-slate-700 hover:bg-slate-700/30"
                        : "border-gray-200 hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <td
                      className={`px-4 py-4 text-center ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      {startIndex + index + 1}
                    </td>
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
                      {activity.section
                        ? `${activity.class_name}-${activity.section}`
                        : activity.class_name}
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
                      {new Date(activity.activity_date + 'T12:00:00').toLocaleDateString(
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
                    <td
                      className={`px-6 py-4 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      {activity.teacher_name}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t ${
            theme === "dark" ? "border-slate-700" : "border-gray-200"
          }`}
        >
          <div
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            صفحه {safeCurrentPage} از {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                safeCurrentPage === 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : theme === "dark"
                  ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              قبلی
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={safeCurrentPage === totalPages}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                safeCurrentPage === totalPages
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : theme === "dark"
                  ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              بعدی
            </button>
          </div>
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
              {(() => {
                const activitiesWithScore = activities.filter(
                  (a) => a.quantitative_score !== null
                );
                if (activitiesWithScore.length === 0) return "0";
                const average =
                  activitiesWithScore.reduce(
                    (sum, a) => sum + (a.quantitative_score || 0),
                    0
                  ) / activitiesWithScore.length;
                return average.toFixed(1);
              })()}
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
              تعداد دانش‌آموزان فعال
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {new Set(activities.map((a) => a.student_id)).size}
            </p>
          </div>
        </div>
      )}

      {/* Custom Template Generator Modal */}
      {showTemplateGenerator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
              theme === "dark" ? "bg-slate-800" : "bg-white"
            }`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  ایجاد فرم خام سفارشی
                </h2>
                <button
                  onClick={() => setShowTemplateGenerator(false)}
                  className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <X
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-6">
                {/* Grade Levels Selection */}
                <div>
                  <label
                    className={`block text-sm font-semibold mb-3 ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    انتخاب پایه‌های تحصیلی (چند انتخابی)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {gradeLevels.map((grade) => (
                      <label
                        key={grade.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedGradeLevels.includes(grade.value)
                            ? theme === "dark"
                              ? "bg-blue-500/20 border-blue-500"
                              : "bg-blue-50 border-blue-500"
                            : theme === "dark"
                            ? "bg-slate-700/50 border-slate-600 hover:border-slate-500"
                            : "bg-gray-50 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedGradeLevels.includes(grade.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGradeLevels([...selectedGradeLevels, grade.value]);
                            } else {
                              setSelectedGradeLevels(selectedGradeLevels.filter((g) => g !== grade.value));
                            }
                          }}
                          className="rounded"
                        />
                        <span
                          className={`text-sm ${
                            theme === "dark" ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          {grade.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Classes Selection */}
                <div>
                  <label
                    className={`block text-sm font-semibold mb-3 ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    انتخاب کلاس‌ها (چند انتخابی)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {filteredClasses.map((classItem) => (
                      <label
                        key={classItem.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedClasses.includes(classItem.id)
                            ? theme === "dark"
                              ? "bg-green-500/20 border-green-500"
                              : "bg-green-50 border-green-500"
                            : theme === "dark"
                            ? "bg-slate-700/50 border-slate-600 hover:border-slate-500"
                            : "bg-gray-50 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(classItem.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClasses([...selectedClasses, classItem.id]);
                            } else {
                              setSelectedClasses(selectedClasses.filter((c) => c !== classItem.id));
                            }
                          }}
                          className="rounded"
                        />
                        <span
                          className={`text-sm ${
                            theme === "dark" ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          {selectedGradeLevels.length > 0
                            ? `${formatGradeLabel(classItem.grade_level)}-${classItem.name}${
                                classItem.section ? `-${classItem.section}` : ""
                              }`
                            : `${classItem.name}${classItem.section ? `-${classItem.section}` : ""}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Lessons Selection */}
                <div>
                  <label
                    className={`block text-sm font-semibold mb-3 ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    انتخاب دروس (چند انتخابی) *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {lessonGroups.list.map((lessonGroup) => {
                      const isSelected = lessonGroup.ids.some((id) =>
                        selectedLessons.includes(id)
                      );
                      return (
                        <label
                          key={lessonGroup.name}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? theme === "dark"
                                ? "bg-purple-500/20 border-purple-500"
                                : "bg-purple-50 border-purple-500"
                              : theme === "dark"
                              ? "bg-slate-700/50 border-slate-600 hover:border-slate-500"
                              : "bg-gray-50 border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const nextSelected = new Set(selectedLessons);
                                lessonGroup.ids.forEach((id) => nextSelected.add(id));
                                setSelectedLessons(Array.from(nextSelected));
                              } else {
                                setSelectedLessons(
                                  selectedLessons.filter((id) => !lessonGroup.ids.includes(id))
                                );
                              }
                            }}
                            className="rounded"
                          />
                          <span
                            className={`text-sm ${
                              theme === "dark" ? "text-slate-300" : "text-gray-700"
                            }`}
                          >
                            {lessonGroup.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Activity Types Selection */}
                <div>
                  <label
                    className={`block text-sm font-semibold mb-3 ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    انتخاب انواع فعالیت (چند انتخابی) *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {activityTypes.map((type) => (
                      <label
                        key={type.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedActivityTypes.includes(type.id)
                            ? theme === "dark"
                              ? "bg-orange-500/20 border-orange-500"
                              : "bg-orange-50 border-orange-500"
                            : theme === "dark"
                            ? "bg-slate-700/50 border-slate-600 hover:border-slate-500"
                            : "bg-gray-50 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedActivityTypes.includes(type.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedActivityTypes([...selectedActivityTypes, type.id]);
                            } else {
                              setSelectedActivityTypes(selectedActivityTypes.filter((t) => t !== type.id));
                            }
                          }}
                          className="rounded"
                        />
                        <span
                          className={`text-sm ${
                            theme === "dark" ? "text-slate-300" : "text-gray-700"
                          }`}
                        >
                          {type.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Default Values */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      نمره پیش‌فرض (اختیاری)
                    </label>
                    <input
                      type="number"
                      value={defaultScore}
                      onChange={(e) => setDefaultScore(e.target.value)}
                      min="0"
                      max="20"
                      step="0.5"
                      placeholder="مثال: 15"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === "dark"
                          ? "bg-slate-700 border-slate-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      } focus:ring-2 focus:ring-blue-500 outline-none`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      تاریخ پیش‌فرض (اختیاری)
                    </label>
                    <DatePicker
                      value={defaultDate ? new DateObject(new Date(defaultDate + 'T12:00:00')).convert(persian, persian_fa) : ""}
                      onChange={(date: DatePickerValue | null) => {
                        if (date) {
                          // Convert Persian date to Gregorian (YYYY-MM-DD format)
                          const gregorianDate = date.toDate();
                          const year = gregorianDate.getFullYear();
                          const month = String(gregorianDate.getMonth() + 1).padStart(2, '0');
                          const day = String(gregorianDate.getDate()).padStart(2, '0');
                          const formattedDate = `${year}-${month}-${day}`;
                          setDefaultDate(formattedDate);
                        } else {
                          setDefaultDate("");
                        }
                      }}
                      calendar={persian}
                      locale={persian_fa}
                      format="YYYY/MM/DD"
                      calendarPosition="bottom-center"
                      placeholder="انتخاب تاریخ"
                      editable={false}
                      className={`${theme === "dark" ? "bg-dark" : ""}`}
                      inputClass={`w-full px-4 py-2 rounded-lg border ${
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
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowTemplateGenerator(false)}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                      theme === "dark"
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleGenerateCustomTemplate}
                    disabled={isGeneratingTemplate}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                      isGeneratingTemplate
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg"
                    }`}
                  >
                    {isGeneratingTemplate ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        در حال تولید...
                      </span>
                    ) : (
                      "تولید و دانلود فرم"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Result Dialog */}
      {showImportDialog && importResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
              theme === "dark" ? "bg-slate-800" : "bg-white"
            }`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  نتیجه ورود اطلاعات از اکسل
                </h2>
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <X
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div
                  className={`p-4 rounded-xl ${
                    theme === "dark"
                      ? "bg-blue-500/10 border border-blue-500/20"
                      : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      theme === "dark" ? "text-blue-400" : "text-blue-600"
                    }`}
                  >
                    {importResult.summary.total}
                  </div>
                  <div
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    کل ردیف‌ها
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    theme === "dark"
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-green-50 border border-green-200"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {importResult.summary.added || 0}
                  </div>
                  <div
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    اضافه شده
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    theme === "dark"
                      ? "bg-yellow-500/10 border border-yellow-500/20"
                      : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      theme === "dark" ? "text-yellow-400" : "text-yellow-600"
                    }`}
                  >
                    {importResult.summary.updated || 0}
                  </div>
                  <div
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    به‌روز شده
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    theme === "dark"
                      ? "bg-red-500/10 border border-red-500/20"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      theme === "dark" ? "text-red-400" : "text-red-600"
                    }`}
                  >
                    {importResult.summary.failed}
                  </div>
                  <div
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    ناموفق
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {importResult.summary.success > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-green-500 font-medium">
                      {importResult.message}
                    </span>
                  </div>
                </div>
              )}

              {/* Errors */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mb-6">
                  <h3
                    className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    خطاها:
                  </h3>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {importResult.errors.map((error: string, index: number) => (
                      <div
                        key={index}
                        className={`text-sm p-2 rounded ${
                          theme === "dark"
                            ? "bg-red-500/10 text-red-300"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results Details */}
              {importResult.results && importResult.results.length > 0 && (
                <div>
                  <h3
                    className={`text-lg font-semibold mb-3 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    فعالیت‌های ثبت شده:
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {importResult.results.map((result: any, index: number) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          theme === "dark"
                            ? "bg-slate-700/50"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-4 h-4 flex-shrink-0 ${
                              result.status === "added"
                                ? theme === "dark"
                                  ? "text-green-400"
                                  : "text-green-600"
                                : theme === "dark"
                                ? "text-yellow-400"
                                : "text-yellow-600"
                            }`}
                          />
                          <span
                            className={`text-sm flex-1 ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-gray-700"
                            }`}
                          >
                            ردیف {result.row}: {result.student} - {result.activity} (معلم: {result.teacher})
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                              result.status === "added"
                                ? theme === "dark"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-green-100 text-green-700"
                                : theme === "dark"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {result.status === "added" ? "جدید" : "به‌روز شده"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
