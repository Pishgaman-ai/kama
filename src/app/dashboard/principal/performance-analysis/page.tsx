"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@/app/components/ThemeContext";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type {
  PerformanceAnalysisFilterOptions,
  PerformanceAnalysisFilters,
  PerformanceAnalysisGranularity,
  PrincipalPerformanceAnalysisResponse,
} from "@/lib/principalPerformanceAnalysis";
import ChartContainer from "./components/ChartContainer";
import InsightPanel from "./components/InsightPanel";
import KpiCard from "./components/KpiCard";
import MultiSelectMenu from "./components/MultiSelectMenu";

type ComparisonMetric = "averageScore" | "activityVolume";
type ComparisonOrder = "top" | "bottom";
type StudentTab = "decline" | "engagement" | "absence";

const formatNumber = (
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions
) => (value ?? 0).toLocaleString("fa-IR", options);

const formatPercent = (value: number | null | undefined) =>
  `${formatNumber(value ?? 0, { maximumFractionDigits: 1 })}\u066A`;

const toPersianDigits = (value: string) =>
  value.replace(/\d/g, (digit) =>
    String.fromCharCode(0x06f0 + Number(digit))
  );

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("fa-IR") : "?";

const toGregorianString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const kpiLabels: Record<
  string,
  { title: string; description: string; breakdown?: Record<string, string> }
> = {
  "active-classes": {
    title: "کلاس‌های فعال",
    description: "تعداد کلاس‌های ثبت‌شده در سال تحصیلی منتخب",
  },
  "active-students": {
    title: "دانش‌آموزان فعال",
    description: "دانش‌آموزان عضو کلاس‌های انتخاب‌شده",
  },
  "educational-activities": {
    title: "فعالیت‌های آموزشی",
    description: "تعداد فعالیت‌های ثبت‌شده در بازه زمانی",
  },
  "average-performance": {
    title: "میانگین عملکرد تحصیلی",
    description: "میانگین درصد نمرات ثبت‌شده",
  },
  "exam-status": {
    title: "وضعیت آزمون‌ها",
    description: "جمع آزمون‌های فعال و منتشرشده",
    breakdown: {
      Draft: "پیش‌نویس",
      Published: "منتشرشده",
      Active: "فعال",
    },
  },
  "skill-coverage": {
    title: "پوشش ارزیابی مهارت",
    description: "سهم دانش‌آموزان دارای حداقل یک ارزیابی",
  },
};

const actionLabels: Record<
  string,
  { title: string; description: string; color: string }
> = {
  "classes-without-teachers": {
    title: "کلاس‌های بدون معلم",
    description: "کلاس‌هایی که هنوز مسئول آموزشی ندارند",
    color: "text-amber-600",
  },
  "students-without-parents": {
    title: "دانش‌آموزان بدون والد",
    description: "پرونده‌هایی که والد ثبت‌شده ندارند",
    color: "text-orange-600",
  },
  "activities-missing-files": {
    title: "فعالیت‌های بدون فایل",
    description: "فعالیت‌هایی که فایل سوال یا پاسخ ندارند",
    color: "text-rose-600",
  },
  "ai-errors": {
    title: "خطاهای تکراری هوش مصنوعی",
    description: "خطاهای ثبت‌شده در سرویس‌های هوش مصنوعی",
    color: "text-red-600",
  },
  "auth-errors": {
    title: "خطاهای احراز هویت",
    description: "ورودهای ناموفق یا دسترسی‌های مسدود شده",
    color: "text-slate-500",
  },
};

export default function PerformanceAnalysisPage() {
  const { theme } = useTheme();
  const [data, setData] =
    useState<PrincipalPerformanceAnalysisResponse | null>(null);
  const [filters, setFilters] = useState<PerformanceAnalysisFilters | null>(
    null
  );
  const [options, setOptions] = useState<PerformanceAnalysisFilterOptions | null>(
    null
  );
  const [granularity, setGranularity] =
    useState<PerformanceAnalysisGranularity>("day");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonMetric, setComparisonMetric] =
    useState<ComparisonMetric>("averageScore");
  const [comparisonOrder, setComparisonOrder] =
    useState<ComparisonOrder>("top");
  const [studentTab, setStudentTab] = useState<StudentTab>("decline");
  const [showDataSources, setShowDataSources] = useState(false);

  const fetchAnalysis = async (override?: PerformanceAnalysisFilters) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      const target = override ?? filters;

      if (target?.academicYear) {
        params.set("academic_year", target.academicYear);
      }
      if (target?.gradeLevel && target.gradeLevel.length > 0) {
        target.gradeLevel.forEach((level) =>
          params.append("grade_level", level)
        );
      }
      if (target?.classId && target.classId.length > 0) {
        target.classId.forEach((id) => params.append("class_id", id));
      }
      if (target?.lessonId && target.lessonId.length > 0) {
        target.lessonId.forEach((id) => params.append("lesson_id", id));
      }
      if (target?.dateRange?.start) {
        params.set("start_date", target.dateRange.start);
      }
      if (target?.dateRange?.end) {
        params.set("end_date", target.dateRange.end);
      }

      const response = await fetch(
        `/api/principal/performance-analysis?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("خطا در دریافت داده‌ها");
      }

      const result: PrincipalPerformanceAnalysisResponse = await response.json();
      setData(result);
      setFilters(result.filters.current);
      setOptions(result.filters.options);
      setGranularity(result.meta.granularity);
    } catch (err) {
      console.error(err);
      setError("خطا در دریافت داده‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const handleFilterChange = (
    key: keyof PerformanceAnalysisFilters,
    value: string[] | null
  ) => {
    if (!filters) return;
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    fetchAnalysis(nextFilters);
  };

  const handleAcademicYearChange = (value: string | null) => {
    if (!filters) return;
    const nextFilters = { ...filters, academicYear: value };
    setFilters(nextFilters);
    fetchAnalysis(nextFilters);
  };

  const handleDateChange = (key: "start" | "end", value: string | null) => {
    if (!filters) return;
    const nextFilters: PerformanceAnalysisFilters = {
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [key]: value ?? filters.dateRange[key],
      },
    };
    setFilters(nextFilters);
    fetchAnalysis(nextFilters);
  };

  const kpiCards = useMemo(() => {
    if (!data) return [];
    return data.kpis.cards.map((card) => {
      const meta = kpiLabels[card.id];
      const valueText =
        card.format === "percent"
          ? formatPercent(card.value)
          : formatNumber(card.value);
      const deltaPrefix =
        card.delta.value > 0 ? "+" : card.delta.value < 0 ? "-" : "";
      const deltaText =
        card.delta.percent === null
          ? "بدون مقایسه"
          : `${deltaPrefix}${formatPercent(Math.abs(card.delta.percent))}`;
      const breakdown =
        card.id === "exam-status" && card.breakdown
          ? card.breakdown.map((item) => ({
            label: meta?.breakdown?.[item.label] ?? item.label,
            value: formatNumber(item.value),
          }))
          : undefined;

      return {
        id: card.id,
        title: meta?.title ?? card.title,
        description: meta?.description ?? card.description,
        valueText,
        deltaText,
        deltaDirection: card.delta.direction,
        breakdown,
      };
    });
  }, [data]);

  const trendData = useMemo(() => {
    if (!data) {
      return { chart: [], maxCount: 0, maxAverage: 0 };
    }

    const activityCounts = data.trends.learningActivityTrend.map(
      (item) => item.educationalActivities
    );
    const averageScores = data.trends.learningActivityTrend.map(
      (item) => item.averageActivityScore ?? 0
    );
    const maxCount = Math.max(0, ...activityCounts);
    const maxAverage = Math.max(0, ...averageScores);

    const chart = data.trends.learningActivityTrend.map((item) => {
      const count = item.educationalActivities;
      const average = item.averageActivityScore ?? 0;
      const countNorm = maxCount === 0 ? 0 : (count / maxCount) * 100;
      const averageNorm = maxAverage === 0 ? 0 : (average / maxAverage) * 100;

      return {
        name: new Date(item.date).toLocaleDateString("fa-IR", {
          month: "short",
          day: "numeric",
        }),
        activityCount: count,
        activityAverage: average,
        activityCountNorm: countNorm,
        activityAverageNorm: averageNorm,
      };
    });

    return { chart, maxCount, maxAverage };
  }, [data]);

  const comparisonData = useMemo(() => {
    if (!data) return [];
    const metricLabelMap: Record<ComparisonMetric, string> = {
      averageScore: "میانگین نمره",
      activityVolume: "حجم فعالیت",
    };
    const items = [...data.trends.classComparison].map((item) => {
      const value =
        comparisonMetric === "averageScore"
          ? item.averageScore ?? 0
          : item.activityVolume;
      return {
        name: toPersianDigits(item.className),
        value,
        label: metricLabelMap[comparisonMetric],
      };
    });

    items.sort((a, b) =>
      comparisonOrder === "top" ? b.value - a.value : a.value - b.value
    );
    return items.slice(0, 5);
  }, [data, comparisonMetric, comparisonOrder]);

  const teachers = data?.insights.teachers ?? [];
  const studentsDecline = data?.insights.students.academicDecline ?? [];
  const studentsEngagement = data?.insights.students.lowEngagement ?? [];
  const studentsAbsence = data?.insights.students.behavioralRisk ?? [];
  const actions = data?.actions.items ?? [];

  const comparisonMetricLabels: Record<ComparisonMetric, string> = {
    averageScore: "میانگین نمره",
    activityVolume: "حجم فعالیت",
  };

  const formatComparisonValue = (value: number) => formatNumber(value);

      const studentMetricLabels: Record<StudentTab, string> = {
    decline: "کاهش میانگین نمره نسبت به هفته قبل",
    engagement: "تعداد فعالیت‌ها در هفته جاری",
    absence: "روزهای بدون فعالیت در هفته جاری",
  };

  const lessonOptions = useMemo(() => {
    if (!options) return [];
    const seen = new Set<string>();
    return options.lessons
      .map((lesson) => ({
        value: lesson.id,
        label: toPersianDigits(lesson.title),
      }))
      .filter((lesson) => {
        if (seen.has(lesson.label)) return false;
        seen.add(lesson.label);
        return true;
      });
  }, [options]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p
            className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"
              }`}
          >
            در حال بارگذاری داشبورد تحلیلی...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16" dir="rtl">
        <div className="text-center">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchAnalysis(filters ?? undefined)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
          >
            تلاش دوباره
          </button>
        </div>
      </div>
    );
  }

  if (!data || !filters || !options) {
    return (
      <div className="flex items-center justify-center py-16" dir="rtl">
        <p
          className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
        >
          داده‌ای برای نمایش موجود نیست.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6" dir="rtl">
      <section className="rounded-2xl border p-4 sm:p-5 bg-white border-gray-200 dark:bg-slate-900/50 dark:border-slate-800/50">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-500">سال تحصیلی</label>
              <select
                value={filters.academicYear ?? ""}
                onChange={(event) =>
                  handleAcademicYearChange(event.target.value || null)
                }
                className="w-full rounded-lg border px-3 py-2 text-sm text-slate-700 dark:text-slate-100 dark:bg-slate-900/50 dark:border-slate-700"
              >
                {options.academicYears.map((year) => (
                  <option key={year} value={year}>
                    {toPersianDigits(year)}
                  </option>
                ))}
              </select>
            </div>

            <MultiSelectMenu
              label="پایه تحصیلی"
              placeholder="همه پایه‌ها"
              value={filters.gradeLevel}
              onChange={(value) => handleFilterChange("gradeLevel", value)}
              options={options.gradeLevels.map((level) => ({
                value: level,
                label: toPersianDigits(level),
              }))}
              formatCountLabel={(count) => `${toPersianDigits(String(count))} مورد`}
            />

            <MultiSelectMenu
              label="کلاس"
              placeholder="همه کلاس‌ها"
              value={filters.classId}
              onChange={(value) => handleFilterChange("classId", value)}
              options={options.classes.map((cls) => ({
                value: cls.id,
                label: toPersianDigits(
                  cls.gradeLevel
                    ? `${cls.gradeLevel}-${cls.section ? cls.section : cls.name}`
                    : cls.section
                      ? `${cls.name}-${cls.section}`
                      : cls.name
                ),
              }))}
              formatCountLabel={(count) => `${toPersianDigits(String(count))} مورد`}
            />

            <MultiSelectMenu
              label="درس"
              placeholder="همه درس‌ها"
              value={filters.lessonId}
              onChange={(value) => handleFilterChange("lessonId", value)}
              options={lessonOptions}
              formatCountLabel={(count) => `${toPersianDigits(String(count))} مورد`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-500">شروع بازه</label>
              <DatePicker
                value={
                  filters.dateRange.start
                    ? new DateObject(new Date(filters.dateRange.start)).convert(
                      persian,
                      persian_fa
                    )
                    : ""
                }
                onChange={(date) => {
                  if (date && "toDate" in date) {
                    handleDateChange("start", toGregorianString(date.toDate()));
                  }
                }}
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD"
                calendarPosition="bottom-center"
                placeholder="انتخاب تاریخ شروع"
                editable={false}
                inputClass="w-full px-4 py-2 rounded-lg border text-sm text-slate-700 dark:text-slate-100 dark:bg-slate-900/50 dark:border-slate-700"
                containerClassName="w-full"
                style={{ width: "100%", direction: "rtl" }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-500">پایان بازه</label>
              <DatePicker
                value={
                  filters.dateRange.end
                    ? new DateObject(new Date(filters.dateRange.end)).convert(
                      persian,
                      persian_fa
                    )
                    : ""
                }
                onChange={(date) => {
                  if (date && "toDate" in date) {
                    handleDateChange("end", toGregorianString(date.toDate()));
                  }
                }}
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD"
                calendarPosition="bottom-center"
                placeholder="انتخاب تاریخ پایان"
                editable={false}
                inputClass="w-full px-4 py-2 rounded-lg border text-sm text-slate-700 dark:text-slate-100 dark:bg-slate-900/50 dark:border-slate-700"
                containerClassName="w-full"
                style={{ width: "100%", direction: "rtl" }}
              />
            </div>
            <div className="flex items-end text-xs text-slate-500">
              بازه فعال: {formatDate(filters.dateRange.start)} تا{" "}
              {formatDate(filters.dateRange.end)}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpiCards.map((card) => (
          <KpiCard
            key={card.id}
            title={card.title}
            value={card.valueText}
            deltaText={card.deltaText}
            deltaDirection={card.deltaDirection}
            description={card.description}
            breakdown={card.breakdown}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer
          title="روند فعالیت‌های یادگیری"
          description={`نمایش ${granularity === "day" ? "روزانه" : "هفتگی"} فعالیت‌ها و میانگین نمره`}
          state={trendData.chart.length === 0 ? "empty" : "ready"}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData.chart}
                margin={{ left: 24, right: 24, top: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickMargin={8} />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  tickMargin={14}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    const realValue =
                      (trendData.maxCount * Number(value)) / 100;
                    return formatNumber(Math.round(realValue));
                  }}
                  width={64}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickMargin={14}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    formatNumber((trendData.maxAverage * Number(value)) / 100, {
                      maximumFractionDigits: 1,
                    })
                  }
                  width={64}
                />
                <Tooltip
                  formatter={(value: number, name: string, props) => {
                    const payload = props.payload as {
                      activityCount: number;
                      activityAverage: number;
                    };
                    if (name === "تعداد فعالیت‌ها") {
                      return [formatNumber(payload.activityCount), name];
                    }
                    return [
                      formatNumber(payload.activityAverage, {
                        maximumFractionDigits: 1,
                      }),
                      name,
                    ];
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ direction: "rtl" }}
                  formatter={(value) => (
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {value}
                    </span>
                  )}
                />
                <Line
                  type="monotone"
                  name="تعداد فعالیت‌ها"
                  dataKey="activityCountNorm"
                  stroke="#2563eb"
                  strokeWidth={2}
                  yAxisId="left"
                />
                <Line
                  type="monotone"
                  name="میانگین نمره فعالیت‌ها"
                  dataKey="activityAverageNorm"
                  stroke="#f97316"
                  strokeWidth={2}
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        <ChartContainer
          title="مقایسه عملکرد کلاس‌ها"
          description="رتبه‌بندی کلاس‌ها بر اساس شاخص انتخابی"
          state={comparisonData.length === 0 ? "empty" : "ready"}
        >
          <div className="flex flex-wrap gap-2 mb-4">
            {(["averageScore", "activityVolume"] as const).map(
              (metric) => (
                <button
                  key={metric}
                  onClick={() => setComparisonMetric(metric)}
                  className={`rounded-full px-3 py-1 text-xs border ${comparisonMetric === metric
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-slate-200 text-slate-600 dark:text-slate-200 dark:border-slate-700"
                    }`}
                >
                  {comparisonMetricLabels[metric]}
                </button>
              )
            )}
            <button
              onClick={() =>
                setComparisonOrder(comparisonOrder === "top" ? "bottom" : "top")
              }
              className="rounded-full px-3 py-1 text-xs border border-slate-200 text-slate-600 dark:text-slate-200 dark:border-slate-700"
            >
              {comparisonOrder === "top" ? "۵ کلاس برتر" : "۵ کلاس پایین"}
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  orientation="right"
                  tickMargin={8}
                  tickFormatter={(value) => formatComparisonValue(Number(value))}
                  width={48}
                />
                <Tooltip
                  formatter={(value: number) => formatComparisonValue(value)}
                  labelFormatter={(label) => `کلاس ${label}`}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InsightPanel
          title="تعامل و عملکرد دبیران"
          state={teachers.length === 0 ? "empty" : "ready"}
          emptyMessage="هیچ داده‌ای برای دبیران ثبت نشده است"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-right">
              <thead>
                <tr className="text-slate-500">
                  <th className="py-2">نام دبیر</th>
                  <th className="py-2">کلاس‌ها</th>
                  <th className="py-2">فعالیت‌ها</th>
                  <th className="py-2">میانگین</th>
                  <th className="py-2">آخرین فعالیت</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.teacherId} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2">
                      {toPersianDigits(teacher.teacherName)}
                    </td>
                    <td className="py-2">{formatNumber(teacher.classesCount)}</td>
                    <td className="py-2">{formatNumber(teacher.activitiesCount)}</td>
                    <td className="py-2">
                      {teacher.averageScore === null
                        ? "—"
                        : formatPercent(teacher.averageScore)}
                    </td>
                    <td className="py-2">{formatDate(teacher.lastActivityDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InsightPanel>

        <InsightPanel
          title="دانش‌آموزان نیازمند توجه"
          state={
            studentsDecline.length === 0 &&
              studentsEngagement.length === 0 &&
              studentsAbsence.length === 0
              ? "empty"
              : "ready"
          }
          emptyMessage="هیچ موردی برای پیگیری ثبت نشده است"
        >
          <div className="flex gap-2 mb-4">
            {[
              { key: "decline", label: "افت تحصیلی" },
              { key: "engagement", label: "تعامل پایین" },
              { key: "absence", label: "بیشترین غیبت" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStudentTab(tab.key as StudentTab)}
                className={`rounded-full px-3 py-1 text-xs border ${studentTab === tab.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 text-slate-600 dark:text-slate-200 dark:border-slate-700"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-3 text-sm">
            {(studentTab === "decline"
              ? studentsDecline
              : studentTab === "engagement"
                ? studentsEngagement
                : studentsAbsence
            ).map((student) => (
              <div
                key={student.studentId}
                className="rounded-lg border border-slate-100 p-3 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{student.studentName}</span>
                  <span className="text-xs text-slate-500">
                    {student.className ? toPersianDigits(student.className) : "—"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{studentMetricLabels[studentTab]}</span>
                  <span>
                    {student.metricValue === null
                      ? "—"
                      : formatNumber(student.metricValue)}
                  </span>
                </div>
                {student.lastActivityDate && (
                  <div className="mt-1 text-xs text-slate-400">
                    آخرین فعالیت: {formatDate(student.lastActivityDate)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </InsightPanel>

        <InsightPanel
          title="مصرف هوش مصنوعی و بار سیستم"
          state={data.insights.aiUsage.requestCount === 0 ? "empty" : "ready"}
          emptyMessage="داده‌ای برای مصرف هوش مصنوعی ثبت نشده است"
        >
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>تعداد درخواست‌ها</span>
              <span>{formatNumber(data.insights.aiUsage.requestCount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>نرخ موفقیت</span>
              <span>{formatPercent(data.insights.aiUsage.successRate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>نرخ خطا</span>
              <span>{formatPercent(data.insights.aiUsage.errorRate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>میانگین زمان پاسخ</span>
              <span>
                {data.insights.aiUsage.averageResponseTimeMs === null
                  ? "—"
                  : `${formatNumber(data.insights.aiUsage.averageResponseTimeMs)} میلی‌ثانیه`}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">توزیع مدل‌ها</p>
              <div className="space-y-2">
                {data.insights.aiUsage.modelDistribution.map((model) => {
                  const modelName =
                    model.model === "Unknown" ? "نامشخص" : model.model;
                  return (
                    <div
                      key={model.model}
                      className="flex items-center justify-between text-xs"
                    >
                      <span>{modelName}</span>
                      <span>{formatNumber(model.count)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </InsightPanel>
      </section>

      <section className="rounded-2xl border p-4 sm:p-5 bg-white border-gray-200 dark:bg-slate-900/50 dark:border-slate-800/50">
        <h3 className="text-base font-semibold mb-4">مرکز اقدام و سلامت داده</h3>
        <div className="space-y-3">
          {actions.map((item) => {
            const meta = actionLabels[item.id];
            return (
              <Link
                key={item.id}
                href={item.actionUrl}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm transition hover:border-blue-300 dark:border-slate-800"
              >
                <div>
                  <p className={`font-medium ${meta?.color ?? "text-slate-700"}`}>
                    {meta?.title ?? item.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {meta?.description ?? item.description}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {formatNumber(item.count)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border bg-white border-gray-200 dark:bg-slate-900/50 dark:border-slate-800/50">
        <button
          onClick={() => setShowDataSources((prev) => !prev)}
          className="flex w-full items-center justify-between p-4 sm:p-5 text-right"
        >
          <h2 className="text-base font-semibold">منابع داده داشبورد</h2>
          <svg
            className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${showDataSources ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showDataSources && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-600 dark:text-slate-300">
            <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
              <p className="font-semibold mb-1">فیلترهای جهانی</p>
              <p>سال تحصیلی: جدول classes (ستون academic_year)</p>
              <p>بازه تاریخ: educational_activities.activity_date، answers.submitted_at، exams.starts_at/ends_at</p>
              <p>پایه: جدول classes (ستون grade_level)</p>
              <p>کلاس: جدول classes (ستون id)</p>
              <p>درس: جدول lessons (ستون id)</p>
            </div>
            <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
              <p className="font-semibold mb-1">کارت‌های KPI</p>
              <p>کلاس‌های فعال: classes</p>
              <p>دانش‌آموزان فعال: users (role=student) + class_memberships</p>
              <p>فعالیت‌های آموزشی: educational_activities</p>
              <p>میانگین عملکرد: class_grades</p>
              <p>وضعیت آزمون‌ها: exams</p>
              <p>پوشش ارزیابی مهارت: life_skills_assessments / active_life_assessments / growth_development_assessments</p>
            </div>
            <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
              <p className="font-semibold mb-1">نمودارها</p>
              <p>روند فعالیت‌های یادگیری: educational_activities</p>
              <p>مقایسه عملکرد کلاس‌ها: educational_activities</p>
            </div>
            <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
              <p className="font-semibold mb-1">پنل‌های بینش</p>
              <p>تعامل دبیران: users (teacher) + teacher_assignments + educational_activities + class_grades</p>
              <p>دانش‌آموزان نیازمند توجه: class_grades + educational_activities + behavioral_reports + ai_reports</p>
              <p>مصرف هوش مصنوعی: ai_logs</p>
            </div>
            <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
              <p className="font-semibold mb-1">مرکز اقدام و سلامت داده</p>
              <p>کلاس بدون دبیر: teacher_assignments</p>
              <p>دانش‌آموز بدون والد: parent_student_relations</p>
              <p>فعالیت بدون فایل: educational_activities</p>
              <p>خطاهای هوش مصنوعی/احراز هویت: logs</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}