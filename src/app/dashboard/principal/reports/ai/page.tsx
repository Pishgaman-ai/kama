"use client";

import React, { useEffect, useState } from "react";
import StatsCard from "@/app/components/reports/StatsCard";
import ChartComponent from "@/app/components/reports/ChartComponent";
import DashboardLayout from "@/app/components/reports/DashboardLayout";
import { useTheme } from "@/app/components/ThemeContext";

// Define TypeScript interfaces for our data
interface ProcessingStats {
  averageTime: string;
  minTime: number;
  maxTime: number;
  totalProcessed: number;
  successRate: string;
}

interface AccuracyStats {
  averageDifference: string;
  accuracyRate: string;
  totalComparisons: number;
  averageConfidence: string;
}

interface ModelPerformance {
  modelVersion: string;
  averageTime: string;
  accuracyRate: string;
  totalProcessed: number;
}

interface TrendData {
  week: string;
  averageDifference: string;
  accuracyRate: string;
  averageTime: string;
}

interface AiReportData {
  processingStats: ProcessingStats;
  accuracyStats: AccuracyStats;
  modelPerformance: ModelPerformance[];
  trendData: TrendData[];
}

const AiPerformanceReport = () => {
  const { theme } = useTheme();
  const [aiData, setAiData] = useState<AiReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAiData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create EventSource for streaming progress updates
        const eventSource = new EventSource("/api/principal/reports/ai");

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.complete) {
            if (data.error) {
              setError(data.error);
              setLoading(false);
            } else {
              setAiData(data.data);
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

    fetchAiData();
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

  if (!aiData) {
    return (
      <DashboardLayout>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-700">داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare data for charts
  const modelPerformanceData = aiData.modelPerformance.map((model) => ({
    name: model.modelVersion,
    accuracy: parseFloat(model.accuracyRate),
    time: parseFloat(model.averageTime),
  }));

  const trendAccuracyData = aiData.trendData.map((item) => ({
    name: new Date(item.week).toLocaleDateString("fa-IR", {
      month: "short",
      day: "numeric",
    }),
    accuracy: parseFloat(item.accuracyRate),
  }));

  const trendTimeData = aiData.trendData.map((item) => ({
    name: new Date(item.week).toLocaleDateString("fa-IR", {
      month: "short",
      day: "numeric",
    }),
    time: parseFloat(item.averageTime),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">
          گزارش عملکرد هوش مصنوعی
        </h1>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="میانگین زمان پردازش"
            value={`${aiData.processingStats.averageTime} میلی‌ثانیه`}
            icon="⏱️"
            color="blue"
          />
          <StatsCard
            title="درصد دقت تصحیح خودکار"
            value={`${aiData.accuracyStats.accuracyRate}%`}
            icon="🎯"
            color="green"
          />
          <StatsCard
            title="تعداد پردازش‌ها"
            value={aiData.processingStats.totalProcessed}
            icon="⚙️"
            color="yellow"
          />
          <StatsCard
            title="میانگین اطمینان"
            value={`${aiData.accuracyStats.averageConfidence}%`}
            icon="🔒"
            color="purple"
          />
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">آمار پردازش</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatsCard
                title="حداقل زمان"
                value={`${aiData.processingStats.minTime} میلی‌ثانیه`}
                color="blue"
              />
              <StatsCard
                title="حداکثر زمان"
                value={`${aiData.processingStats.maxTime} میلی‌ثانیه`}
                color="green"
              />
              <StatsCard
                title="نرخ موفقیت"
                value={`${aiData.processingStats.successRate}%`}
                color="yellow"
              />
              <StatsCard
                title="تعداد مقایسه‌ها"
                value={aiData.accuracyStats.totalComparisons}
                color="purple"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">دقت مدل</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatsCard
                title="میانگین اختلاف"
                value={aiData.accuracyStats.averageDifference}
                description="با نمرات نهایی"
                color="blue"
              />
              <StatsCard
                title="دقت"
                value={`${aiData.accuracyStats.accuracyRate}%`}
                description="در حد ±۲ نمره"
                color="green"
              />
            </div>
          </div>
        </div>

        {/* Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartComponent
            type="line"
            data={trendAccuracyData}
            dataKey="accuracy"
            xAxisKey="name"
            title="روند بهبود دقت مدل در طول زمان"
            yAxisLabel="درصد دقت"
            height={300}
          />
          <ChartComponent
            type="line"
            data={trendTimeData}
            dataKey="time"
            xAxisKey="name"
            title="روند زمان پردازش"
            yAxisLabel="میلی‌ثانیه"
            height={300}
          />
        </div>

        {/* Model Performance Comparison */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">مقایسه عملکرد مدل‌ها</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartComponent
              type="bar"
              data={modelPerformanceData}
              dataKey="accuracy"
              xAxisKey="name"
              title="دقت بر اساس نسخه مدل"
              yAxisLabel="درصد دقت"
              height={300}
            />
            <ChartComponent
              type="bar"
              data={modelPerformanceData}
              dataKey="time"
              xAxisKey="name"
              title="زمان پردازش بر اساس نسخه مدل"
              yAxisLabel="میلی‌ثانیه"
              height={300}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AiPerformanceReport;
