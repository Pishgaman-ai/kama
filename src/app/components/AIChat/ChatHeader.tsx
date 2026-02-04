"use client";

import { Menu, Bot } from "lucide-react";
import { User as UserType, UserRole } from "./types";

interface ChatHeaderProps {
  user: UserType;
  onBack?: () => void;
  roleConfig: {
    title: string;
    color: string;
  };
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case "admin":
      return "from-blue-600 to-blue-800";
    case "teacher":
      return "from-purple-500 to-purple-700";
    case "student":
      return "from-green-500 to-green-700";
    case "parent":
      return "from-orange-500 to-orange-700";
    default:
      return "from-indigo-500 to-purple-600";
  }
};

export default function ChatHeader({
  user,
  onBack,
  roleConfig,
  sidebarOpen,
  setSidebarOpen,
}: ChatHeaderProps) {
  const hasMessages = false; // This will be updated when we integrate with the full chat

  return (
    <>
      {hasMessages && (
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-700"
              title="باز کردن منو"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-slate-800 font-bold text-lg">
                  دستیار هوشمند ایرانی
                </h1>
                <p className="text-slate-500 text-sm flex items-center space-x-1 space-x-reverse">
                  <span>🇮🇷</span>
                  <span>پیشگامان هوش مصنوعی</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-slate-500 text-sm">آنلاین</span>
          </div>
        </div>
      )}
    </>
  );
}
