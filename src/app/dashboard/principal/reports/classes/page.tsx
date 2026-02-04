"use client";

import React, { useEffect, useState } from "react";
import StatsCard from "@/app/components/reports/StatsCard";
import ChartComponent from "@/app/components/reports/ChartComponent";
import DashboardLayout from "@/app/components/reports/DashboardLayout";
import { useTheme } from "@/app/components/ThemeContext";

// Define TypeScript interfaces for our data
interface ClassData {
  id: string;
  name: string;
  gradeLevel: string;
  studentCount: number;
  subjectPerformance: Array<{
    subject: string;
    averageScore: string;
    examCount: number;
  }>;
  activityData: {
    activeStudents: number;
    classAverage: string;
  };
  learningIndicators: {
    highAchievers: string;
    averagePerformers: string;
    strugglingStudents: string;
  };
  performanceTrend: Array<{
    month: string;
    averageScore: string;
  }>;
}

const ClassesReport = () => {
  const { theme } = useTheme();
  const [classesData, setClassesData] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassesData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create EventSource for streaming progress updates
        const eventSource = new EventSource("/api/principal/reports/classes");

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.complete) {
            if (data.error) {
              setError(data.error);
              setLoading(false);
            } else {
              setClassesData(data.data);
              setLoading(false);
            }
            eventSource.close();
          }
        };

        eventSource.onerror = (err) => {
          console.error("EventSource failed:", err);
          setError("خطا در ارتباط با سرور");
          setLoading(false);
          eventSource.close();
        };

        // Cleanup function
        return () => {
          eventSource.close();
        };
      } catch (err) {
        setError("خطا در ارتباط با سرور");
        setLoading(false);
        console.error(err);
      }
    };

    fetchClassesData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            تلاش مجدد
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (classesData.length === 0) {
    return (
      <DashboardLayout>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-700">داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare data for overall comparison charts
  const classAverageScores = classesData.map((classItem) => ({
    name: classItem.name,
    averageScore: parseFloat(classItem.activityData.classAverage),
  }));

  const subjectAverages = classesData.reduce(
    (acc: Record<string, { total: number; count: number }>, classItem) => {
      classItem.subjectPerformance.forEach((subject) => {
        if (!acc[subject.subject]) {
          acc[subject.subject] = { total: 0, count: 0 };
        }
        acc[subject.subject].total += parseFloat(subject.averageScore);
        acc[subject.subject].count += 1;
      });
      return acc;
    },
    {}
  );

  const subjectPerformanceData = Object.entries(subjectAverages).map(
    ([subject, data]) => ({
      name: subject,
      averageScore: parseFloat((data.total / data.count).toFixed(2)),
    })
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">گزارش کلاس‌ها</h1>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="تعداد کل کلاس‌ها"
            value={classesData.length}
            icon="📚"
            color="blue"
          />
          <StatsCard
            title="میانگین دانش‌آموزان در کلاس"
            value={(
              classesData.reduce(
                (sum, classItem) => sum + classItem.studentCount,
                0
              ) / classesData.length
            ).toFixed(1)}
            icon="👩‍🎓"
            color="green"
          />
          <StatsCard
            title="کل دانش‌آموزان"
            value={classesData.reduce(
              (sum, classItem) => sum + classItem.studentCount,
              0
            )}
            icon="👥"
            color="yellow"
          />
          <StatsCard
            title="میانگین کل نمرات"
            value={(
              classesData.reduce(
                (sum, classItem) =>
                  sum + parseFloat(classItem.activityData.classAverage),
                0
              ) / classesData.length
            ).toFixed(2)}
            icon="📈"
            color="purple"
          />
        </div>

        {/* Overall Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartComponent
            type="bar"
            data={classAverageScores}
            dataKey="averageScore"
            title="مقایسه میانگین نمرات بین کلاس‌ها"
            yAxisLabel="میانگین نمره"
            height={300}
          />
          <ChartComponent
            type="bar"
            data={subjectPerformanceData}
            dataKey="averageScore"
            title="میانگین نمرات بر اساس درس"
            yAxisLabel="میانگین نمره"
            height={300}
          />
        </div>

        {/* Individual Class Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {classesData.map((classItem) => {
            // Prepare data for charts
            const subjectPerformanceData = classItem.subjectPerformance.map(
              (subject) => ({
                name: subject.subject,
                averageScore: parseFloat(subject.averageScore),
              })
            );

            const trendData = classItem.performanceTrend.map((item) => ({
              name: new Date(item.month).toLocaleDateString("fa-IR", {
                month: "short",
                year: "numeric",
              }),
              averageScore: parseFloat(item.averageScore),
            }));

            const learningIndicatorsData = [
              {
                name: "بالا دست‌اند",
                value: parseFloat(classItem.learningIndicators.highAchievers),
              },
              {
                name: "متوسط",
                value: parseFloat(
                  classItem.learningIndicators.averagePerformers
                ),
              },
              {
                name: "نیاز به کمک",
                value: parseFloat(
                  classItem.learningIndicators.strugglingStudents
                ),
              },
            ];

            return (
              <div
                key={classItem.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {classItem.name}
                    </h3>
                    <p className="text-gray-600">
                      پایه {classItem.gradeLevel} - {classItem.studentCount}{" "}
                      دانش‌آموز
                    </p>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    میانگین: {classItem.activityData.classAverage}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <StatsCard
                    title="فعال"
                    value={classItem.activityData.activeStudents}
                    description="دانش‌آموز"
                    color="blue"
                  />
                  <StatsCard
                    title="میانگین"
                    value={classItem.activityData.classAverage}
                    description="نمره"
                    color="green"
                  />
                  <StatsCard
                    title="آزمون‌ها"
                    value={classItem.subjectPerformance.reduce(
                      (sum, subject) => sum + subject.examCount,
                      0
                    )}
                    description="تعداد"
                    color="yellow"
                  />
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">
                    عملکرد بر اساس درس
                  </h4>
                  <ChartComponent
                    type="bar"
                    data={subjectPerformanceData}
                    dataKey="averageScore"
                    yAxisLabel="میانگین نمره"
                    height={200}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      روند پیشرفت
                    </h4>
                    <ChartComponent
                      type="line"
                      data={trendData}
                      dataKey="averageScore"
                      xAxisKey="name"
                      yAxisLabel="میانگین نمره"
                      height={150}
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      شاخص‌های یادگیری
                    </h4>
                    <ChartComponent
                      type="pie"
                      data={learningIndicatorsData}
                      dataKey="value"
                      nameKey="name"
                      height={150}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClassesReport;
