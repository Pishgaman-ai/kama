"use client";

import { useState, useEffect } from "react";
import AIChatComponent from "@/app/components/AIChat/index";
import type { User } from "@/app/components/AIChat/types";

export default function TestAIChatPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Mock user data for testing
    setUser({
      id: "test-user-123",
      name: "تست کاربر",
      role: "student",
      school_id: "school-456",
      national_code: "00256854", // Added national code for AI service
    });
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50" dir="rtl">
      <div className="flex-1 overflow-hidden">
        {user && (
          <AIChatComponent
            user={user}
            onBack={() => {
              console.log("Back button clicked");
              // In a real app, this would navigate to the dashboard
              if (typeof window !== "undefined") {
                window.history.back();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
