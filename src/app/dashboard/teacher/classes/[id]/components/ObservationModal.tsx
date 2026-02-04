"use client";

import React from "react";
import { useTheme } from "@/app/components/ThemeContext";
import PersianDatePicker from "@/app/components/PersianDatePicker";
import { X, Save } from "lucide-react";
import { IndividualObservation } from "../types";

interface ObservationForm {
  id: string;
  student_id: string;
  subject_id: string;
  title: string;
  description: string;
  date: string;
}

interface ObservationModalProps {
  isOpen: boolean;
  currentObservation: IndividualObservation | null;
  observationForm: ObservationForm;
  onClose: () => void;
  onSave: () => void;
  onChange: (field: string, value: string) => void;
  convertToPersianDate: (gregorianDate: string | null) => string;
  subjectId: string;
}

export default function ObservationModal({
  isOpen,
  currentObservation,
  observationForm,
  onClose,
  onSave,
  onChange,
  convertToPersianDate,
  subjectId,
}: ObservationModalProps) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center ${
        theme === "dark" ? "bg-black/70" : "bg-black/50"
      }`}
      style={{ zIndex: 1000 }}
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
            {currentObservation ? "ویرایش مشاهده" : "افزودن مشاهده"}
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
          {/* Title */}
          <div className="sm:col-span-2">
            <label
              className={`block text-sm font-medium mb-2 ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              عنوان مشاهده
            </label>
            <input
              type="text"
              value={observationForm.title}
              onChange={(e) => onChange("title", e.target.value)}
              className={`w-full px-4 py-2 rounded-lg ${
                theme === "dark"
                  ? "bg-slate-700/30 text-white"
                  : "bg-gray-50 text-gray-900"
              }`}
              aria-label="عنوان مشاهده"
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label
              className={`block text-sm font-medium mb-2 ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              توضیحات
            </label>
            <textarea
              value={observationForm.description}
              onChange={(e) => onChange("description", e.target.value)}
              rows={4}
              className={`w-full px-4 py-2 rounded-lg ${
                theme === "dark"
                  ? "bg-slate-700/30 text-white"
                  : "bg-gray-50 text-gray-900"
              }`}
              aria-label="توضیحات"
            />
          </div>

          {/* Date */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              تاریخ مشاهده
            </label>
            <PersianDatePicker
              onDateChange={(dates) => {
                if (dates) {
                  onChange("date", dates.gregorian);
                }
              }}
              className="w-full"
              containerClassName="w-full"
            />
            {observationForm.date && (
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                تاریخ انتخاب شده: {convertToPersianDate(observationForm.date)}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === "dark"
                ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            }`}
            aria-label="ذخیره مشاهده"
          >
            <Save className="w-4 h-4" />
            ذخیره
          </button>
        </div>
      </div>
    </div>
  );
}
