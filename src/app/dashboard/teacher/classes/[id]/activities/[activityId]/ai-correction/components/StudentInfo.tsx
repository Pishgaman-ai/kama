import { useTheme } from "@/app/components/ThemeContext";
import { User } from "lucide-react";
import { ActivityDetails } from "../types";

interface StudentInfoProps {
  activity: ActivityDetails;
}

export default function StudentInfo({ activity }: StudentInfoProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
        theme === "dark"
          ? "bg-slate-900/50 border-slate-800/50"
          : "bg-white border-gray-200"
      }`}
    >
      <h2
        className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}
      >
        <User className="w-5 h-5" />
        اطلاعات دانش‌آموز
      </h2>

      <div className="flex items-center gap-4 mb-6">
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center`}
        >
          <span className="text-white font-medium">
            {activity.student_name.charAt(0)}
          </span>
        </div>
        <div>
          <h3
            className={`font-medium ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {activity.student_name}
          </h3>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            کلاس
          </label>
          <p
            className={`px-4 py-3 rounded-lg ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            {activity.class_name}
          </p>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            درس
          </label>
          <p
            className={`px-4 py-3 rounded-lg ${
              theme === "dark"
                ? "bg-slate-800/30 text-white"
                : "bg-gray-50 text-gray-900"
            }`}
          >
            {activity.subject_name}
          </p>
        </div>
      </div>
    </div>
  );
}
