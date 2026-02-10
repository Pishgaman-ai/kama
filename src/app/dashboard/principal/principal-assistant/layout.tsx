"use client";

import React from "react";
import { useTheme } from "@/app/components/ThemeContext";

export default function PrincipalAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen ${
        theme === "dark" ? "bg-slate-950" : "bg-gray-50"
      }`}
      dir="rtl"
    >
      {children}
    </div>
  );
}
