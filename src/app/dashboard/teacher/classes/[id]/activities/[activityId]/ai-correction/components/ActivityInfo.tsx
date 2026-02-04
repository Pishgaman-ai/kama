import { useTheme } from "@/app/components/ThemeContext";
// @ts-expect-error: persian-date doesn't have proper TypeScript definitions
import PersianDate from "persian-date";
import { ActivityDetails, ActivityType } from "../types";

interface ActivityInfoProps {
  activity: ActivityDetails;
  activityTypes: ActivityType[];
}

export default function ActivityInfo({
  activity,
  activityTypes,
}: ActivityInfoProps) {
  const { theme } = useTheme();

  const getActivityTypeName = (typeId: string) => {
    const type = activityTypes.find((t) => t.id === typeId);
    return type ? type.name : typeId;
  };

  const convertToPersianDate = (gregorianDate: string | null) => {
    if (!gregorianDate) return "-";

    try {
      // Handle different date formats
      let date: Date;

      // If it's already a valid date string, use it directly
      if (gregorianDate.includes("T")) {
        // ISO date format (2023-12-25T00:00:00.000Z)
        date = new Date(gregorianDate);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(gregorianDate)) {
        // YYYY-MM-DD format
        date = new Date(gregorianDate);
      } else if (/^\d{4}\/\d{2}\/\d{2}$/.test(gregorianDate)) {
        // YYYY/MM/DD format
        const parts = gregorianDate.split("/");
        date = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2])
        );
      } else {
        // Try to parse as a general date string
        date = new Date(gregorianDate);
      }

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "تاریخ نامعتبر";
      }

      const persianDate = new PersianDate(date);
      return persianDate.format("YYYY/MM/DD");
    } catch (error) {
      console.error("Error converting date:", error, "Input:", gregorianDate);
      return "تاریخ نامعتبر";
    }
  };

  return (
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
        اطلاعات فعالیت
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            عنوان فعالیت
          </label>
          <p
            className={`px-4 py-3 rounded-lg ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            {activity.activity_title}
          </p>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            نوع فعالیت
          </label>
          <p
            className={`px-4 py-3 rounded-lg ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            {getActivityTypeName(activity.activity_type)}
          </p>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            تاریخ فعالیت
          </label>
          <p
            className={`px-4 py-3 rounded-lg ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            {convertToPersianDate(activity.activity_date)}
          </p>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            نمره ثبت شده
          </label>
          <p
            className={`px-4 py-3 rounded-lg ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            {activity.quantitative_score !== null
              ? activity.quantitative_score
              : "-"}
          </p>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            نمره هوش مصنوعی
          </label>
          <p
            className={`px-4 py-3 rounded-lg ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            {activity.ai_score !== null ? activity.ai_score : "-"}
          </p>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            وضعیت
          </label>
          <div
            className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
              theme === "dark" ? "bg-slate-800/30" : "bg-gray-50"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${
                activity.status === "Completed"
                  ? "bg-green-500"
                  : activity.status === "Pending" ||
                    activity.status === "Processing"
                  ? "bg-yellow-500"
                  : activity.status === "files_uploaded" ||
                    activity.status === "Draft"
                  ? "bg-blue-500"
                  : "bg-gray-500"
              }`}
            ></div>
            <span
              className={`${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              {activity.status === "files_uploaded" ||
              activity.status === "Draft"
                ? "پیش از ارسال"
                : activity.status === "Pending" ||
                  activity.status === "Processing"
                ? "در حال بررسی توسط هوش مصنوعی"
                : activity.status === "Completed"
                ? "نتایج آماده شده"
                : activity.status || "-"}
            </span>
          </div>

          {/* Status Legend */}
          <div className="mt-2 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span
                className={
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }
              >
                Draft — پیش از ارسال
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span
                className={
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }
              >
                Pending / Processing — در حال بررسی توسط هوش مصنوعی
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span
                className={
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }
              >
                Completed — نتایج آماده شده
              </span>
            </div>
          </div>
        </div>
      </div>

      {activity.qualitative_evaluation && (
        <div className="mt-6">
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            ارزیابی کیفی
          </label>
          <p
            className={`px-4 py-3 rounded-lg min-h-[100px] ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            {activity.qualitative_evaluation}
          </p>
        </div>
      )}

      {activity.teacher_note && (
        <div className="mt-6">
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            یادداشت معلم
          </label>
          <p
            className={`px-4 py-3 rounded-lg min-h-[100px] ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            {activity.teacher_note}
          </p>
        </div>
      )}
    </div>
  );
}
