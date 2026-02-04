"use client";

import React from "react";
import { useTheme } from "@/app/components/ThemeContext";
import PersianDatePicker from "@/app/components/PersianDatePicker";
import { X, Save } from "lucide-react";
import { ActivityType, EducationalActivity } from "../types";

interface ActivityForm {
  id: string;
  student_id: string;
  activity_type: string;
  activity_title: string;
  activity_date: string;
  quantitative_score: string;
  qualitative_evaluation: string;
}

interface ActivityModalProps {
  isOpen: boolean;
  currentActivity: EducationalActivity | null;
  activityForm: ActivityForm;
  activityTypes: ActivityType[];
  onClose: () => void;
  onSave: () => void;
  onChange: (field: string, value: string) => void;
  requiresQuantitativeScore: (typeId: string) => boolean;
  requiresQualitativeEvaluation: (typeId: string) => boolean;
  convertToPersianDate: (gregorianDate: string | null) => string;
}

export default function ActivityModal({
  isOpen,
  currentActivity,
  activityForm,
  activityTypes,
  onClose,
  onSave,
  onChange,
  requiresQuantitativeScore,
  requiresQualitativeEvaluation,
  convertToPersianDate,
}: ActivityModalProps) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
              onChange={(e) => onChange("activity_type", e.target.value)}
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
              onChange={(e) => onChange("activity_title", e.target.value)}
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
                  onChange("activity_date", dates.gregorian);
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
                onChange={(e) => onChange("quantitative_score", e.target.value)}
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
                  onChange("qualitative_evaluation", e.target.value)
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
            onClick={onSave}
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
  );
}
