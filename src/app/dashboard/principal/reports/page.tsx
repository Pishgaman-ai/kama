"use client";

import React from "react";
import Link from "next/link";
import DashboardLayout from "@/app/components/reports/DashboardLayout";
import { useTheme } from "@/app/components/ThemeContext";

const ReportsDashboard = () => {
  const { theme } = useTheme();

  const reportCategories = [
    {
      title: "نمای کلی مدرسه",
      description: "آمار کلی مدرسه، معلمان، کلاس‌ها و دانش‌آموزان",
      icon: "📊",
      link: "/dashboard/principal/reports/overview",
      color: "bg-blue-100 text-blue-800",
      darkColor: "bg-blue-500/20 text-blue-400",
    },
    {
      title: "گزارش معلمان",
      description: "عملکرد هر معلم بر اساس میانگین نمرات دانش‌آموزانش",
      icon: "👨‍🏫",
      link: "/dashboard/principal/reports/teachers",
      color: "bg-green-100 text-green-800",
      darkColor: "bg-green-500/20 text-green-400",
    },
    {
      title: "گزارش کلاس‌ها",
      description: "میانگین نمرات کلاس در هر درس و مقایسه بین کلاس‌ها",
      icon: "📚",
      link: "/dashboard/principal/reports/classes",
      color: "bg-yellow-100 text-yellow-800",
      darkColor: "bg-yellow-500/20 text-yellow-400",
    },
    {
      title: "گزارش دانش‌آموزان",
      description: "نمرات هر درس، تمرین و تکلیف هر دانش‌آموز",
      icon: "👩‍🎓",
      link: "/dashboard/principal/reports/students",
      color: "bg-purple-100 text-purple-800",
      darkColor: "bg-purple-500/20 text-purple-400",
    },
    {
      title: "گزارش والدین",
      description: "خلاصه وضعیت فرزندان برای هر والدین",
      icon: "👨‍👩‍👧‍👦",
      link: "/dashboard/principal/reports/parents",
      color: "bg-pink-100 text-pink-800",
      darkColor: "bg-pink-500/20 text-pink-400",
    },
    {
      title: "عملکرد هوش مصنوعی",
      description: "میانگین زمان پردازش و دقت تصحیح خودکار",
      icon: "🤖",
      link: "/dashboard/principal/reports/ai",
      color: "bg-indigo-100 text-indigo-800",
      darkColor: "bg-indigo-500/20 text-indigo-400",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            گزارشات و تحلیل عملکرد
          </h1>
          <p
            className={`mt-2 ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            انتخاب کنید که چه نوع گزارشی نیاز دارید:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCategories.map((category, index) => (
            <Link key={index} href={category.link} className="block group">
              <div
                className={`rounded-xl shadow p-6 hover:shadow-lg transition-all duration-200 h-full ${
                  theme === "dark"
                    ? "bg-slate-900/50 hover:bg-slate-900 border border-slate-800/50"
                    : "bg-white hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full ${
                    theme === "dark" ? category.darkColor : category.color
                  } flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform duration-200`}
                >
                  {category.icon}
                </div>
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                >
                  {category.title}
                </h3>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  {category.description}
                </p>
                <div
                  className={`mt-4 text-sm font-medium flex items-center ${
                    theme === "dark" ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  مشاهده گزارش
                  <span className="mr-2">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div
          className={`rounded-xl p-6 ${
            theme === "dark"
              ? "bg-blue-500/10 border border-blue-500/20"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-2 ${
              theme === "dark" ? "text-blue-400" : "text-blue-800"
            }`}
          >
            راهنمای استفاده
          </h3>
          <ul
            className={`list-disc pr-5 space-y-2 ${
              theme === "dark" ? "text-blue-300" : "text-blue-700"
            }`}
          >
            <li>
              در هر گزارش می‌توانید از فیلترها برای محدود کردن نتایج استفاده
              کنید
            </li>
            <li>
              با کلیک بر روی دکمه &quot;خروجی گرفتن&quot; می‌توانید داده‌ها را
              به صورت CSV یا JSON ذخیره کنید
            </li>
            <li>همه گزارش‌ها به صورت زنده و پویا از دیتابیس دریافت می‌شوند</li>
            <li>نمودارها به صورت خودکار به‌روزرسانی می‌شوند</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsDashboard;
