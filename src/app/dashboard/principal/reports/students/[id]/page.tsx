"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StatsCard from "@/app/components/reports/StatsCard";
import ChartComponent from "@/app/components/reports/ChartComponent";
import DashboardLayout from "@/app/components/reports/DashboardLayout";

// Define TypeScript interfaces for our data
interface SubjectScore {
  subject: string;
  averageScore: string;
  examCount: number;
  lastExamDate: string;
}

interface Metrics {
  overallAverage: string;
  totalExams: number;
  lowestScore: string;
  highestScore: string;
  progressPercentage: string;
}

interface ProgressTrend {
  month: string;
  averageScore: string;
}

interface Strength {
  subject: string;
  averageScore: string;
}

interface Weakness {
  subject: string;
  averageScore: string;
}

interface StudentReportData {
  id: string;
  name: string;
  nationalId: string;
  className: string;
  gradeLevel: string;
  subjectScores: SubjectScore[];
  metrics: Metrics;
  progressTrend: ProgressTrend[];
  strengths: Strength[];
  weaknesses: Weakness[];
  performanceAnalysis: string;
}

const StudentDetailReport = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [studentData, setStudentData] = useState<StudentReportData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setLoadingProgress(0);

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setLoadingProgress((prev) => {
            if (prev < 90) {
              return prev + 10;
            }
            return prev;
          });
        }, 200);

        // In a real implementation, we would fetch data for the specific student ID
        const response = await fetch(
          `/api/principal/reports/students/${params.id}`
        );

        clearInterval(progressInterval);
        setLoadingProgress(100);

        const data = await response.json();

        if (data.success) {
          setStudentData(data.data);
        } else {
          setError(data.error || "خطا در بارگذاری داده‌ها");
        }
      } catch (err) {
        setError("خطا در ارتباط با سرور");
        console.error(err);
      } finally {
        setTimeout(() => {
          setLoading(false);
          setLoadingProgress(0);
        }, 500); // Small delay to show 100% progress
      }
    };

    if (params.id) {
      fetchStudentData();
    }
  }, [params.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-64 bg-gray-200 rounded-full h-4 mb-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-gray-700">
            {loadingProgress}% - در حال بارگذاری گزارش دانش‌آموز...
          </p>
          <div className="mt-4 animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            بازگشت
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!studentData) {
    return (
      <DashboardLayout>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-700">داده‌ای برای نمایش وجود ندارد</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            بازگشت
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare data for charts
  const subjectScoresData = studentData.subjectScores.map((subject) => ({
    name: subject.subject,
    averageScore: parseFloat(subject.averageScore),
  }));

  const trendData = studentData.progressTrend.map((item) => ({
    name: new Date(item.month).toLocaleDateString("fa-IR", {
      month: "short",
      year: "numeric",
    }),
    averageScore: parseFloat(item.averageScore),
  }));

  const strengthsData = studentData.strengths.map((strength) => ({
    name: strength.subject,
    score: parseFloat(strength.averageScore),
  }));

  const weaknessesData = studentData.weaknesses.map((weakness) => ({
    name: weakness.subject,
    score: parseFloat(weakness.averageScore),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            گزارش دانش‌آموز - {studentData.name}
          </h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            بازگشت
          </button>
        </div>

        {/* Student Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">نام دانش‌آموز</p>
              <p className="font-semibold">{studentData.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">کد ملی</p>
              <p className="font-semibold">{studentData.nationalId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">کلاس</p>
              <p className="font-semibold">{studentData.className}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">پایه</p>
              <p className="font-semibold">{studentData.gradeLevel}</p>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <StatsCard
            title="میانگین کل"
            value={studentData.metrics.overallAverage}
            icon="📈"
            color="blue"
          />
          <StatsCard
            title="کل آزمون‌ها"
            value={studentData.metrics.totalExams}
            icon="📝"
            color="green"
          />
          <StatsCard
            title="بالاترین نمره"
            value={studentData.metrics.highestScore}
            icon="🏆"
            color="yellow"
          />
          <StatsCard
            title="پایین‌ترین نمره"
            value={studentData.metrics.lowestScore}
            icon="📉"
            color="red"
          />
          <StatsCard
            title="پیشرفت"
            value={`${studentData.metrics.progressPercentage}%`}
            icon="📊"
            color="purple"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartComponent
            type="bar"
            data={subjectScoresData}
            dataKey="averageScore"
            title="نمرات بر اساس درس"
            yAxisLabel="نمره"
            height={300}
          />
          <ChartComponent
            type="line"
            data={trendData}
            dataKey="averageScore"
            xAxisKey="name"
            title="پیشرفت در طول زمان"
            yAxisLabel="نمره"
            height={300}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartComponent
            type="radar"
            data={strengthsData}
            dataKey="score"
            xAxisKey="name"
            title="نقاط قوت"
            height={300}
          />
          <ChartComponent
            type="radar"
            data={weaknessesData}
            dataKey="score"
            xAxisKey="name"
            title="نقاط ضعف"
            height={300}
          />
        </div>

        {/* Performance Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">تحلیل عملکرد</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">{studentData.performanceAnalysis}</p>
          </div>
        </div>

        {/* Subject Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">جزئیات درس‌ها</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    درس
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    میانگین نمره
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تعداد آزمون
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    آخرین آزمون
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentData.subjectScores.map((subject, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {subject.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subject.averageScore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subject.examCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(subject.lastExamDate).toLocaleDateString(
                        "fa-IR"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDetailReport;
