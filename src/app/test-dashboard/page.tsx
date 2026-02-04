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

export default function TestDashboard() {
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Test Dashboard</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}