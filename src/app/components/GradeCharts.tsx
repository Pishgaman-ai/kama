"use client";
import React from "react";
import { useTheme } from "@/app/components/ThemeContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface SubjectAverage {
  subject_name: string;
  average_percentage: number;
  exam_count: number;
}

interface PerformanceTrend {
  computed_at: string;
  percentage: number;
  exam_title: string;
}

interface GradeChartsProps {
  subjectAverages: SubjectAverage[];
  performanceTrend: PerformanceTrend[];
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function GradeCharts({
  subjectAverages,
  performanceTrend,
}: GradeChartsProps) {
  const { theme } = useTheme();

  // Prepare data for subject averages chart
  const subjectChartData = subjectAverages.map((subject) => ({
    name: subject.subject_name,
    میانگین: subject.average_percentage,
    "تعداد آزمون": subject.exam_count,
  }));

  // Prepare data for performance trend chart
  const trendChartData = performanceTrend.map((trend, index) => ({
    name: `آزمون ${index + 1}`,
    تاریخ: new Date(trend.computed_at).toLocaleDateString("fa-IR"),
    درصد: trend.percentage,
    آزمون: trend.exam_title,
  }));

  // Prepare data for pie chart (grade distribution)
  const gradeDistribution = performanceTrend.reduce((acc, trend) => {
    let gradeCategory = "نمره ضعیف";
    if (trend.percentage >= 90) gradeCategory = "عالی";
    else if (trend.percentage >= 80) gradeCategory = "خوب";
    else if (trend.percentage >= 70) gradeCategory = "متوسط";
    else if (trend.percentage >= 60) gradeCategory = "قابل قبول";

    acc[gradeCategory] = (acc[gradeCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(gradeDistribution).map(
    ([name, value], index) => ({
      name,
      value,
    })
  );

  const pieChartColors = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];

  return (
    <div className="space-y-8">
      {/* Subject Averages Bar Chart */}
      <div
        className={`rounded-xl p-4 ${
          theme === "dark" ? "bg-slate-900/50" : "bg-white"
        }`}
      >
        <h3
          className={`text-lg font-medium mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          میانگین نمرات بر اساس درس
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={subjectChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme === "dark" ? "#334155" : "#e2e8f0"}
              />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{
                  fill: theme === "dark" ? "#cbd5e1" : "#64748b",
                  fontSize: 12,
                }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{
                  fill: theme === "dark" ? "#cbd5e1" : "#64748b",
                  fontSize: 12,
                }}
              />
              <Tooltip
                contentStyle={
                  theme === "dark"
                    ? {
                        backgroundColor: "#1e293b",
                        borderColor: "#334155",
                        color: "#f1f5f9",
                      }
                    : {}
                }
                labelStyle={theme === "dark" ? { color: "#f1f5f9" } : {}}
                formatter={(value) => [`${value}%`, "درصد"]}
              />
              <Legend />
              <Bar
                dataKey="میانگین"
                name="میانگین نمره"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Trend Line Chart */}
      <div
        className={`rounded-xl p-4 ${
          theme === "dark" ? "bg-slate-900/50" : "bg-white"
        }`}
      >
        <h3
          className={`text-lg font-medium mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          روند پیشرفت
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme === "dark" ? "#334155" : "#e2e8f0"}
              />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{
                  fill: theme === "dark" ? "#cbd5e1" : "#64748b",
                  fontSize: 12,
                }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{
                  fill: theme === "dark" ? "#cbd5e1" : "#64748b",
                  fontSize: 12,
                }}
              />
              <Tooltip
                contentStyle={
                  theme === "dark"
                    ? {
                        backgroundColor: "#1e293b",
                        borderColor: "#334155",
                        color: "#f1f5f9",
                      }
                    : {}
                }
                labelStyle={theme === "dark" ? { color: "#f1f5f9" } : {}}
                formatter={(value, name, props) => {
                  if (name === "درصد") {
                    return [`${value}%`, "درصد"];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="درصد"
                name="درصد نمره"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grade Distribution Pie Chart */}
      {pieChartData.length > 0 && (
        <div
          className={`rounded-xl p-4 ${
            theme === "dark" ? "bg-slate-900/50" : "bg-white"
          }`}
        >
          <h3
            className={`text-lg font-medium mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            توزیع نمرات
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name}: ${((percent as number) * 100).toFixed(0)}%`
                  }
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={pieChartColors[index % pieChartColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={
                    theme === "dark"
                      ? {
                          backgroundColor: "#1e293b",
                          borderColor: "#334155",
                          color: "#f1f5f9",
                        }
                      : {}
                  }
                  formatter={(value) => [value, "تعداد"]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
