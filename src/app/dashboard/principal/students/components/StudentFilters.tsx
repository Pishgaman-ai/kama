"use client";

import { useState } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { Search } from "lucide-react";

interface StudentClass {
  id: string;
  name: string;
  grade_level: string;
  section: string;
}

interface Parent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

interface Student {
  id: string;
  name: string;
  national_id: string;
  email?: string;
  phone?: string;
  grade_level?: string;
  classes: StudentClass[];
  created_at: string;
  parents: Parent[];
  profile_picture_url?: string;
}

export default function StudentFilters({
  searchTerm,
  setSearchTerm,
  students,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  students: Student[];
}) {
  const { theme } = useTheme();

  return (
    <>
      {/* Search Bar */}
      <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
        <div className="relative flex-1 max-w-md">
          <Search
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === "dark" ? "text-slate-400" : "text-gray-400"
            }`}
          />
          <input
            type="text"
            placeholder="جستجو در دانش‌آموزان..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-4 pr-11 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
              theme === "dark"
                ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
            }`}
          />
        </div>
      </div>
    </>
  );
}
