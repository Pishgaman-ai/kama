"use client";

import { useState, useEffect } from "react";

interface DashboardData {
  success: boolean;
  data?: {
    stats: {
      totalClasses: number;
      totalTeachers: number;
      totalStudents: number;
      totalParents: number;
    };
    schoolName: string;
  };
  error?: string;
}

export default function TestPrincipalDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/principal/dashboard");
        const result: DashboardData = await response.json();
        setData(result);
      } catch (err) {
        setError("Error fetching data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">تست داشبورد مدیر</h1>
      {data?.success ? (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">اطلاعات مدرسه</h2>
            <p>نام مدرسه: {data.data?.schoolName}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-4 shadow">
              <h3 className="font-medium text-gray-700">کلاس‌ها</h3>
              <p className="text-2xl font-bold text-blue-600">{data.data?.stats.totalClasses}</p>
            </div>
            
            <div className="bg-white border rounded-lg p-4 shadow">
              <h3 className="font-medium text-gray-700">معلمان</h3>
              <p className="text-2xl font-bold text-green-600">{data.data?.stats.totalTeachers}</p>
            </div>
            
            <div className="bg-white border rounded-lg p-4 shadow">
              <h3 className="font-medium text-gray-700">دانش‌آموزان</h3>
              <p className="text-2xl font-bold text-purple-600">{data.data?.stats.totalStudents}</p>
            </div>
            
            <div className="bg-white border rounded-lg p-4 shadow">
              <h3 className="font-medium text-gray-700">اولیاء</h3>
              <p className="text-2xl font-bold text-orange-600">{data.data?.stats.totalParents}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2 text-red-800">خطا</h2>
          <p className="text-red-600">{data?.error || "خطای نامشخص"}</p>
        </div>
      )}
    </div>
  );
}