"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatContainer from "@/app/components/AIChat/ChatContainer";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  school_id: string;
  profile_picture_url?: string;
  created_at: Date;
  national_id?: string; // Added for AI service integration
}

export default function PrincipalAssistantPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication and get user info
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.push("/signin");
          return;
        }

        const data = await response.json();
        if (data.user.role !== "principal") {
          router.push("/dashboard");
          return;
        }

        setUser(data.user);
        setLoading(false);
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/signin");
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
    <div className="h-[calc(100vh-8rem)]">
      {user && (
        <ChatContainer
          user={user}
          apiPath="/api/principal/ai-assistant"
          onBack={() => router.push("/dashboard/principal")}
        />
      )}
    </div>
  );
}
