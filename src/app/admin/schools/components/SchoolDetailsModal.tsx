"use client";
import React from "react";
import {
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  BookOpen,
  UserCircle,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "@/app/components/ThemeContext";

interface ContactPerson {
  id: string;
  name: string;
  title: string;
  phone: string;
}

interface School {
  id: string;
  name: string;
  address: string;
  postal_code?: string;
  phone: string;
  email: string;
  established_year: number;
  grade_level: string;
  region: string;
  gender_type: string;
  website_url: string;
  contact_persons: ContactPerson[];
  latitude?: number;
  longitude?: number;
  user_count: number;
  teacher_count: number;
  student_count: number;
  class_count: number;
  principal_count: number;
  created_at: string;
}

interface SchoolDetailsModalProps {
  school: School;
  onClose: () => void;
}

export default function SchoolDetailsModal({
  school,
  onClose,
}: SchoolDetailsModalProps) {
  const { theme } = useTheme();

  const getGenderTypeLabel = (type: string) => {
    switch (type) {
      case "boys":
        return "پسرانه";
      case "girls":
        return "دخترانه";
      case "mixed":
        return "مختلط";
      default:
        return type;
    }
  };

  const getRegionLabel = (region: string) => {
    return region ? `منطقه ${region}` : "—";
  };

  const getGradeLevelLabel = (gradeLevel: string) => {
    if (!gradeLevel) return "—";

    const levels = gradeLevel.split(",");
    const labels: Record<string, string> = {
      elementary: "ابتدایی",
      middle: "متوسطه اول",
      high: "متوسطه دوم",
    };

    return levels.map((level) => labels[level] || level).join(", ");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${
          theme === "dark"
            ? "bg-slate-900/95 border-slate-800"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
            theme === "dark"
              ? "bg-slate-900/90 border-slate-800"
              : "bg-white border-gray-200"
          }`}
        >
          <h2
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            اطلاعات مدرسه
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800 text-slate-400"
                : "hover:bg-gray-100 text-gray-500"
            }`}
            aria-label="بستن"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* School Basic Info */}
          <div>
            <h3
              className={`text-xl font-semibold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {school.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      آدرس
                    </p>
                    <p
                      className={`mt-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {school.address || "—"}
                    </p>
                    {school.postal_code && (
                      <p
                        className={`text-sm mt-1 ${
                          theme === "dark" ? "text-slate-400" : "text-gray-500"
                        }`}
                      >
                        کد پستی: {school.postal_code}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      شماره تماس
                    </p>
                    <p
                      className={`mt-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {school.phone || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      ایمیل
                    </p>
                    <p
                      className={`mt-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {school.email || "—"}
                    </p>
                  </div>
                </div>

                {school.website_url && (
                  <div className="flex items-start gap-3">
                    <ExternalLink
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-slate-400" : "text-gray-500"
                        }`}
                      >
                        وب‌سایت
                      </p>
                      <a
                        href={school.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-1 inline-flex items-center gap-1 ${
                          theme === "dark"
                            ? "text-blue-400 hover:text-blue-300"
                            : "text-blue-600 hover:text-blue-800"
                        }`}
                      >
                        {school.website_url}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      سال تأسیس
                    </p>
                    <p
                      className={`mt-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {school.established_year || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      منطقه
                    </p>
                    <p
                      className={`mt-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {getRegionLabel(school.region)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      نوعیت جنسیتی
                    </p>
                    <p
                      className={`mt-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {getGenderTypeLabel(school.gender_type)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BookOpen
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      دوره تحصیلی
                    </p>
                    <p
                      className={`mt-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {getGradeLevelLabel(school.grade_level)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3
              className={`text-lg font-semibold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              آمار مدرسه
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div
                className={`p-4 rounded-xl ${
                  theme === "dark" ? "bg-slate-800/50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    معلمان
                  </span>
                </div>
                <p
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {school.teacher_count}
                </p>
              </div>

              <div
                className={`p-4 rounded-xl ${
                  theme === "dark" ? "bg-slate-800/50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    دانش‌آموزان
                  </span>
                </div>
                <p
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {school.student_count}
                </p>
              </div>

              <div
                className={`p-4 rounded-xl ${
                  theme === "dark" ? "bg-slate-800/50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-violet-400" : "text-violet-600"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    کلاس‌ها
                  </span>
                </div>
                <p
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {school.class_count}
                </p>
              </div>

              <div
                className={`p-4 rounded-xl ${
                  theme === "dark" ? "bg-slate-800/50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-orange-400" : "text-orange-600"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    مدیران
                  </span>
                </div>
                <p
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {school.principal_count}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Persons */}
          <div>
            <h3
              className={`text-lg font-semibold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              اشخاص تماس
            </h3>
            {school.contact_persons && school.contact_persons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {school.contact_persons.map((person) => (
                  <div
                    key={person.id}
                    className={`p-4 rounded-xl border ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <h4
                      className={`font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {person.name || "—"}
                    </h4>
                    {person.title && (
                      <p
                        className={`text-sm mt-1 ${
                          theme === "dark" ? "text-slate-400" : "text-gray-500"
                        }`}
                      >
                        {person.title}
                      </p>
                    )}
                    {person.phone && (
                      <div className="flex items-center gap-2 mt-2">
                        <Phone
                          className={`w-4 h-4 ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-500"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            theme === "dark"
                              ? "text-slate-300"
                              : "text-gray-700"
                          }`}
                        >
                          {person.phone}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={`text-center py-8 rounded-xl border-2 border-dashed ${
                  theme === "dark"
                    ? "border-slate-700 text-slate-500"
                    : "border-gray-300 text-gray-400"
                }`}
              >
                <UserCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">هیچ شخص تماسی ثبت نشده است</p>
              </div>
            )}
          </div>

          {/* Location */}
          {(school.latitude !== undefined ||
            school.longitude !== undefined) && (
            <div>
              <h3
                className={`text-lg font-semibold mb-4 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                موقعیت جغرافیایی
              </h3>
              <div
                className={`p-4 rounded-xl ${
                  theme === "dark" ? "bg-slate-800/50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Navigation
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    مختصات:{" "}
                    {school.latitude !== undefined &&
                    school.longitude !== undefined
                      ? `${Number(school.latitude).toFixed(6)}, ${Number(
                          school.longitude
                        ).toFixed(6)}`
                      : "—"}
                  </span>
                </div>
                <p
                  className={`text-xs mt-1 ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  ایجاد شده: {school.created_at}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
