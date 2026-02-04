"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import Link from "next/link";
import {
  ArrowRight,
  Users,
  BookOpen,
  Calendar,
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
} from "lucide-react";
import PersianDatePicker from "@/app/components/PersianDatePicker";
// @ts-expect-error: persian-date doesn't have proper TypeScript definitions
import PersianDate from "persian-date";
import {
  ClassDetailsData,
  EducationalActivity,
  ActivityType,
  IndividualObservation,
} from "./types";
import ClassInfoTab from "./components/ClassInfoTab";
import StudentsListTab from "./components/StudentsListTab";
import ActivitiesTabContent from "./components/ActivitiesTabContent";
import IndividualObservationsList from "./components/IndividualObservationsList";
import ObservationModal from "./components/ObservationModal";

export default function ClassDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [classData, setClassData] = useState<ClassDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const router = useRouter();
  const [classId, setClassId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");

  // Tab state
  const [activeTab, setActiveTab] = useState<
    "classInfo" | "activities" | "observations" | "students"
  >("classInfo");

  // Educational activities state
  const [activities, setActivities] = useState<
    Record<string, EducationalActivity[]>
  >({});
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [currentActivity, setCurrentActivity] =
    useState<EducationalActivity | null>(null);
  const [activityForm, setActivityForm] = useState({
    id: "",
    student_id: "",
    activity_type: "",
    activity_title: "",
    activity_date: new Date().toISOString().split("T")[0],
    quantitative_score: "",
    qualitative_evaluation: "",
  });
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Bulk activities upload state
  const [showBulkActivitiesModal, setShowBulkActivitiesModal] = useState(false);

  // Individual observations state
  const [observations, setObservations] = useState<
    Record<string, IndividualObservation[]>
  >({});
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [currentObservation, setCurrentObservation] =
    useState<IndividualObservation | null>(null);
  const [observationForm, setObservationForm] = useState({
    id: "",
    student_id: "",
    subject_id: "",
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [observationsLoading, setObservationsLoading] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setClassId(resolvedParams.id);

      // Get subjectId from query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const subjectIdParam = urlParams.get("subjectId");
      if (subjectIdParam) {
        setSubjectId(subjectIdParam);
      }
    };
    getParams();
  }, [params]);

  // Update useEffect to fetch observations when class data is loaded
  useEffect(() => {
    if (classId) {
      fetchClassDetails();
      fetchActivityTypes();
      // Only fetch activities if subjectId is also available
      if (subjectId) {
        fetchEducationalActivities();
      }
      // Always fetch observations
      fetchIndividualObservations();
    }
  }, [classId, subjectId]);

  const fetchClassDetails = async () => {
    try {
      // Pass subjectId as a query parameter
      const response = await fetch(
        `/api/teacher/classes/${classId}?subjectId=${subjectId}`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setClassData(result.data);
          setError(null);
        } else {
          setError("خطا در بارگیری اطلاعات کلاس");
        }
      } else {
        setError("کلاس یافت نشد");
      }
    } catch (error) {
      console.error("Error fetching class details:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  // Fetch activity types from database
  const fetchActivityTypes = async () => {
    try {
      const response = await fetch("/api/teacher/activity-types");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setActivityTypes(result.data);
        }
      }
    } catch (error) {
      console.error("Error fetching activity types:", error);
      // Fallback to default types if fetch fails
      setActivityTypes([
        { id: "midterm_exam", name: "آزمون میان‌ترم" },
        { id: "monthly_exam", name: "آزمون ماهیانه" },
        { id: "weekly_exam", name: "آزمون هفتگی" },
        { id: "class_activity", name: "فعالیت کلاسی" },
        { id: "class_homework", name: "تکلیف کلاسی" },
        { id: "home_homework", name: "تکلیف منزل" },
      ]);
    }
  };

  // Fetch educational activities
  const fetchEducationalActivities = async () => {
    // Only fetch activities if subjectId is available
    if (!subjectId && (!classData || !classData.subject)) {
      return;
    }

    setActivitiesLoading(true);
    try {
      // Use subjectId from state or from classData
      const currentSubjectId =
        subjectId || (classData ? classData.subject.id : null);

      if (!currentSubjectId) {
        return;
      }

      // Pass subjectId as a query parameter
      const response = await fetch(
        `/api/teacher/classes/${classId}/activities?subjectId=${currentSubjectId}`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setActivities(result.data.activities);
        }
      }
    } catch (error) {
      console.error("Error fetching educational activities:", error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Fetch individual observations
  const fetchIndividualObservations = async () => {
    setObservationsLoading(true);
    try {
      // Pass subjectId as a query parameter
      const response = await fetch(
        `/api/teacher/classes/${classId}/observations?subjectId=${
          subjectId || (classData ? classData.subject.id : "")
        }`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setObservations(result.data.observations);
        }
      }
    } catch (error) {
      console.error("Error fetching individual observations:", error);
    } finally {
      setObservationsLoading(false);
    }
  };

  // Handle activity form changes
  const handleActivityFormChange = (field: string, value: string) => {
    setActivityForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Open activity modal for adding/editing
  const openActivityModal = (
    studentId?: string,
    activity?: EducationalActivity
  ) => {
    if (activity) {
      // Editing existing activity
      setActivityForm({
        id: activity.id,
        student_id: studentId || "",
        activity_type: activity.activity_type,
        activity_title: activity.activity_title,
        activity_date: activity.activity_date,
        quantitative_score:
          activity.quantitative_score !== null
            ? activity.quantitative_score.toString()
            : "",
        qualitative_evaluation: activity.qualitative_evaluation || "",
      });
      setCurrentActivity(activity);
    } else {
      // Adding new activity
      setActivityForm({
        id: "",
        student_id: studentId || "",
        activity_type: "",
        activity_title: "",
        activity_date: new Date().toISOString().split("T")[0],
        quantitative_score: "",
        qualitative_evaluation: "",
      });
      setCurrentActivity(null);
    }
    setShowActivityModal(true);
  };

  // Close activity modal
  const closeActivityModal = () => {
    setShowActivityModal(false);
    setCurrentActivity(null);
  };

  // Save activity
  const saveActivity = async () => {
    try {
      const activityData = {
        ...activityForm,
        subject_id: subjectId || (classData ? classData.subject.id : null), // Include the subject ID
        quantitative_score: activityForm.quantitative_score
          ? parseFloat(activityForm.quantitative_score)
          : null,
      };

      const response = await fetch(
        `/api/teacher/classes/${classId}/activities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ activity: activityData }),
        }
      );

      const result = await response.json();
      if (result.success) {
        closeActivityModal();
        fetchEducationalActivities(); // Refresh activities
        // Show success message to user
        alert("فعالیت آموزشی با موفقیت ذخیره شد");
      } else {
        console.error("Error saving activity:", result.error);
        alert("خطا در ذخیره فعالیت: " + result.error);
      }
    } catch (error) {
      console.error("Error saving activity:", error);
      alert("خطا در ذخیره فعالیت");
    }
  };

  // Delete activity
  const deleteActivity = async (activityId: string) => {
    try {
      const response = await fetch(
        `/api/teacher/classes/${classId}/activities?activityId=${activityId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      if (result.success) {
        fetchEducationalActivities(); // Refresh activities
        // Show success message to user
        alert("فعالیت آموزشی با موفقیت حذف شد");
      } else {
        console.error("Error deleting activity:", result.error);
        alert("خطا در حذف فعالیت: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("خطا در حذف فعالیت");
    }
  };

  // Handle observation form changes
  const handleObservationFormChange = (field: string, value: string) => {
    setObservationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Open observation modal for adding/editing
  const openObservationModal = (
    studentId?: string,
    observation?: IndividualObservation
  ) => {
    if (observation) {
      // Editing existing observation
      setObservationForm({
        id: observation.id,
        student_id: observation.student_id, // This should already be the national_id
        subject_id:
          observation.subject_id ||
          subjectId ||
          (classData ? classData.subject.id : "") ||
          "",
        title: observation.title,
        description: observation.description,
        date: observation.date,
      });
      setCurrentObservation(observation);
    } else {
      // Adding new observation
      setObservationForm({
        id: "",
        student_id: studentId || "", // This should be the national_id
        subject_id: subjectId || (classData ? classData.subject.id : "") || "",
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setCurrentObservation(null);
    }
    setShowObservationModal(true);
  };

  // Close observation modal
  const closeObservationModal = () => {
    setShowObservationModal(false);
    setCurrentObservation(null);
  };

  // Save observation
  const saveObservation = async () => {
    try {
      // Ensure we have the subject_id in the observation data
      const observationData = {
        ...observationForm,
        subject_id:
          observationForm.subject_id ||
          subjectId ||
          (classData ? classData.subject.id : null),
        // Make sure we're using national_id instead of user ID for student_id
        student_id: observationForm.student_id, // This should already be the national_id
      };

      // Log the data being sent for debugging
      console.log("Sending observation data:", observationData);

      const response = await fetch(
        `/api/teacher/classes/${classId}/observations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ observation: observationData }),
        }
      );

      const result = await response.json();
      if (result.success) {
        closeObservationModal();
        fetchIndividualObservations(); // Refresh observations
        alert("مشاهده با موفقیت ذخیره شد");
      } else {
        console.error("Error saving observation:", result.error);
        alert("خطا در ذخیره مشاهده: " + result.error);
      }
    } catch (error) {
      console.error("Error saving observation:", error);
      alert("خطا در ذخیره مشاهده");
    }
  };

  // Delete observation
  const deleteObservation = async (observationId: string) => {
    try {
      const response = await fetch(
        `/api/teacher/classes/${classId}/observations?observationId=${observationId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      if (result.success) {
        fetchIndividualObservations(); // Refresh observations
        alert("مشاهده با موفقیت حذف شد");
      } else {
        console.error("Error deleting observation:", result.error);
        alert("خطا در حذف مشاهده: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting observation:", error);
      alert("خطا در حذف مشاهده");
    }
  };

  // Get activity type name
  const getActivityTypeName = (typeId: string) => {
    const type = activityTypes.find((t) => t.id === typeId);
    return type ? type.name : typeId;
  };

  // Convert Gregorian date to Persian date
  const convertToPersianDate = (gregorianDate: string | null) => {
    if (!gregorianDate) return "-";

    try {
      // First, try to parse the date string regardless of format
      // Handle various date formats including those with Persian digits
      let dateString = gregorianDate;

      // If the date contains Persian digits, convert them to English
      const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
      const englishDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

      for (let i = 0; i < 10; i++) {
        dateString = dateString.replace(
          new RegExp(persianDigits[i], "g"),
          englishDigits[i]
        );
      }

      // Try different date formats
      let date: Date | null = null;

      // Format: YYYY-MM-DD (standard ISO format)
      if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        date = new Date(dateString);
      }
      // Format: YYYY/MM/DD
      else if (/^\d{4}\/\d{2}\/\d{2}/.test(dateString)) {
        const parts = dateString.split("/");
        date = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2])
        );
      }
      // Format: YYYY-MM-DDTHH:mm:ss (with time)
      else if (/^\d{4}-\d{2}-\d{2}T/.test(dateString)) {
        date = new Date(dateString);
      }
      // If none of the above, try to parse directly
      else {
        date = new Date(dateString);
      }

      // Check if the date is valid
      if (!date || isNaN(date.getTime())) {
        return "تاریخ نامعتبر";
      }

      // Additional validation for reasonable date ranges
      const year = date.getFullYear();
      if (year < 1300 || year > 2100) {
        return "تاریخ نامعتبر";
      }

      const persianDate = new PersianDate(date);
      return persianDate.format("YYYY/MM/DD");
    } catch (error) {
      console.error("Error converting date:", error);
      return "تاریخ نامعتبر";
    }
  };

  // Check if activity type requires quantitative score
  const requiresQuantitativeScore = (typeId: string) => {
    const activityType = activityTypes.find((type) => type.id === typeId);
    return activityType?.requires_quantitative_score !== false;
  };

  // Check if activity type requires qualitative evaluation
  const requiresQualitativeEvaluation = (typeId: string) => {
    const activityType = activityTypes.find((type) => type.id === typeId);
    return activityType?.requires_qualitative_evaluation === true;
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

  if (error) {
    return (
      <div className="p-3 sm:p-6" dir="rtl">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard/teacher/classes"
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            }`}
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            خطا در بارگیری کلاس
          </h1>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            theme === "dark"
              ? "bg-red-500/10 border-red-500/20"
              : "bg-red-50 border-red-200"
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
      </div>
    );
  }

  if (!classData) {
    return null;
  }

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/teacher/classes"
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            }`}
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1
              className={`text-xl sm:text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {classData?.subject.name} - {classData?.class.name}
            </h1>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              جزئیات کلاس و دانش‌آموزان
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("classInfo")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "classInfo"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              اطلاعات کلاس و درس
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "activities"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              فعالیت‌های آموزشی
            </button>
            <button
              onClick={() => setActiveTab("observations")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "observations"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              مشاهدات فردی
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "students"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              لیست دانش‌آموزان
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "classInfo" && classData && (
        <ClassInfoTab
          classData={classData.class}
          subjectName={classData.subject.name}
        />
      )}

      {activeTab === "activities" && classData && (
        <ActivitiesTabContent
          classData={classData}
          activities={activities}
          activityTypes={activityTypes}
          classId={classId}
          subjectId={subjectId}
          activitiesLoading={activitiesLoading}
          showBulkActivitiesModal={showBulkActivitiesModal}
          onAddActivity={openActivityModal}
          onDeleteActivity={deleteActivity}
          onBulkUpload={() => setShowBulkActivitiesModal(true)}
          onCloseBulkUpload={() => setShowBulkActivitiesModal(false)}
          onUploadSuccess={fetchEducationalActivities}
          getActivityTypeName={getActivityTypeName}
          convertToPersianDate={convertToPersianDate}
        />
      )}

      {activeTab === "observations" && classData && (
        <div
          className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2
              className={`text-lg sm:text-xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              مشاهدات فردی
            </h2>
          </div>

          {observationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <IndividualObservationsList
              students={classData.students}
              observations={observations}
              classId={classId}
              onAddObservation={openObservationModal}
              onDeleteObservation={deleteObservation}
              convertToPersianDate={convertToPersianDate}
            />
          )}
        </div>
      )}

      {activeTab === "students" && classData && (
        <div
          className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <h2
            className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            دانش‌آموزان ({classData.students.length})
          </h2>

          <StudentsListTab students={classData.students} />
        </div>
      )}

      {/* Activity Modal */}
      {showActivityModal && (
        <div
          className={`fixed inset-0 bg-black/50 flex items-center justify-center ${
            theme === "dark" ? "bg-black/70" : "bg-black/50"
          }`}
        >
          <div
            className={`bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl ${
              theme === "dark" ? "bg-slate-800" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`text-lg font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {currentActivity ? "ویرایش فعالیت" : "افزودن فعالیت"}
              </h2>
              <button
                onClick={closeActivityModal}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "hover:bg-slate-600 text-slate-400 hover:text-white"
                    : "hover:bg-gray-200 text-gray-500 hover:text-gray-900"
                }`}
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Activity Type */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  نوع فعالیت
                </label>
                <select
                  value={activityForm.activity_type}
                  onChange={(e) =>
                    handleActivityFormChange("activity_type", e.target.value)
                  }
                  className={`w-full px-4 py-2 rounded-lg ${
                    theme === "dark"
                      ? "bg-slate-700/30 text-white"
                      : "bg-gray-50 text-gray-900"
                  }`}
                  aria-label="نوع فعالیت"
                >
                  <option value="">انتخاب کنید</option>
                  {activityTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activity Title */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  عنوان فعالیت
                </label>
                <input
                  type="text"
                  value={activityForm.activity_title}
                  onChange={(e) =>
                    handleActivityFormChange("activity_title", e.target.value)
                  }
                  className={`w-full px-4 py-2 rounded-lg ${
                    theme === "dark"
                      ? "bg-slate-700/30 text-white"
                      : "bg-gray-50 text-gray-900"
                  }`}
                  aria-label="عنوان فعالیت"
                />
              </div>

              {/* Activity Date */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  تاریخ فعالیت
                </label>
                <PersianDatePicker
                  onDateChange={(dates) => {
                    if (dates) {
                      handleActivityFormChange(
                        "activity_date",
                        dates.gregorian
                      );
                    }
                  }}
                  className="w-full"
                  containerClassName="w-full"
                />
                {activityForm.activity_date && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    تاریخ انتخاب شده:{" "}
                    {convertToPersianDate(activityForm.activity_date)}
                  </p>
                )}
              </div>

              {/* Quantitative Score */}
              {requiresQuantitativeScore(activityForm.activity_type) && (
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    نمره
                  </label>
                  <input
                    type="number"
                    value={activityForm.quantitative_score}
                    onChange={(e) =>
                      handleActivityFormChange(
                        "quantitative_score",
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 rounded-lg ${
                      theme === "dark"
                        ? "bg-slate-700/30 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                    aria-label="نمره"
                  />
                </div>
              )}

              {/* Qualitative Evaluation */}
              {requiresQualitativeEvaluation(activityForm.activity_type) && (
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    ارزیابی
                  </label>
                  <textarea
                    value={activityForm.qualitative_evaluation}
                    onChange={(e) =>
                      handleActivityFormChange(
                        "qualitative_evaluation",
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 rounded-lg ${
                      theme === "dark"
                        ? "bg-slate-700/30 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                    aria-label="ارزیابی"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={saveActivity}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === "dark"
                    ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                }`}
                aria-label="ذخیره فعالیت"
              >
                <Save className="w-4 h-4" />
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Observation Modal */}
      <ObservationModal
        isOpen={showObservationModal}
        currentObservation={currentObservation}
        observationForm={observationForm}
        onClose={closeObservationModal}
        onSave={saveObservation}
        onChange={handleObservationFormChange}
        convertToPersianDate={convertToPersianDate}
        subjectId={subjectId || (classData ? classData.subject.id : "")}
      />
    </div>
  );
}
