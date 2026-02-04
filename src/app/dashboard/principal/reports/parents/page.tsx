"use client";

import React, { useEffect, useState } from "react";
import StatsCard from "@/app/components/reports/StatsCard";
import ChartComponent from "@/app/components/reports/ChartComponent";
import DashboardLayout from "@/app/components/reports/DashboardLayout";
import { useTheme } from "@/app/components/ThemeContext";

// Define TypeScript interfaces for our data
interface ChildPerformance {
  studentId: string;
  studentName: string;
  className: string;
  gradeLevel: string;
  subjectScores: Array<{
    subject: string;
    averageScore: string;
    examCount: number;
  }>;
  metrics: {
    overallAverage: string;
    totalExams: number;
  };
  progressTrend: Array<{
    month: string;
    averageScore: string;
  }>;
}

interface ParentData {
  id: string;
  name: string;
  phone: string;
  childrenCount: number;
  children: ChildPerformance[];
}

const ParentsReport = () => {
  const { theme } = useTheme();
  const [parentsData, setParentsData] = useState<ParentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParentsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create EventSource for streaming progress updates
        const eventSource = new EventSource("/api/principal/reports/parents");

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.complete) {
            if (data.error) {
              setError(data.error);
              setLoading(false);
            } else {
              setParentsData(data.data);
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

    fetchParentsData();
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

  if (parentsData.length === 0) {
    return (
      <DashboardLayout>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-700">داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">گزارش والدین</h1>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="تعداد کل والدین"
            value={parentsData.length}
            icon="👨‍👩‍👧‍👦"
            color="blue"
          />
          <StatsCard
            title="میانگین فرزندان"
            value={(
              parentsData.reduce(
                (sum, parent) => sum + parent.childrenCount,
                0
              ) / parentsData.length
            ).toFixed(1)}
            icon="👨‍👩‍👧‍👦"
            color="green"
          />
          <StatsCard
            title="کل دانش‌آموزان"
            value={parentsData.reduce(
              (sum, parent) => sum + parent.childrenCount,
              0
            )}
            icon="👩‍🎓"
            color="yellow"
          />
          <StatsCard
            title="والدین فعال"
            value={
              parentsData.filter((parent) => parent.childrenCount > 0).length
            }
            icon="✅"
            color="purple"
          />
        </div>

        {/* Parent Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {parentsData.map((parent) => (
            <div key={parent.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {parent.name}
                  </h3>
                  <p className="text-gray-600">{parent.phone}</p>
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {parent.childrenCount} فرزند
                </div>
              </div>

              <div className="space-y-6">
                {parent.children.map((child) => {
                  // Prepare data for charts
                  const subjectScoresData = child.subjectScores.map(
                    (subject) => ({
                      name: subject.subject,
                      averageScore: parseFloat(subject.averageScore),
                    })
                  );

                  const trendData = child.progressTrend.map((item) => ({
                    name: new Date(item.month).toLocaleDateString("fa-IR", {
                      month: "short",
                      year: "numeric",
                    }),
                    averageScore: parseFloat(item.averageScore),
                  }));

                  return (
                    <div
                      key={child.studentId}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {child.studentName}
                          </h4>
                          <p className="text-gray-600">
                            {child.className} - پایه {child.gradeLevel}
                          </p>
                        </div>
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          میانگین: {child.metrics.overallAverage}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <StatsCard
                          title="کل آزمون‌ها"
                          value={child.metrics.totalExams}
                          color="blue"
                        />
                        <StatsCard
                          title="تعداد درس‌ها"
                          value={child.subjectScores.length}
                          color="green"
                        />
                      </div>

                      <div className="mb-4">
                        <h5 className="font-medium text-gray-700 mb-2">
                          نمرات بر اساس درس
                        </h5>
                        <ChartComponent
                          type="bar"
                          data={subjectScoresData}
                          dataKey="averageScore"
                          yAxisLabel="نمره"
                          height={150}
                        />
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">
                          تغییر نمرات در طول زمان
                        </h5>
                        <ChartComponent
                          type="line"
                          data={trendData}
                          dataKey="averageScore"
                          xAxisKey="name"
                          yAxisLabel="نمره"
                          height={150}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentsReport;
