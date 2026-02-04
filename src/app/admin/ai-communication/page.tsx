"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AIChatComponent from "@/app/components/AIChatComponent";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  school_id: string;
  profile_picture_url?: string;
  created_at: Date;
}

export default function AICommunicationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication and get user info
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.push("/admin/login");
          return;
        }

        const data = await response.json();
        if (data.user.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        setUser(data.user);
        setLoading(false);
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50" dir="rtl">
      {/* AI Chat Component - full height */}
      <div className="flex-1 overflow-hidden container mx-auto py-4">
        {user && (
          <AIChatComponent user={user} onBack={() => router.push("/admin")} />
        )}
      </div>
    </div>
  );
}
