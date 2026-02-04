"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  TrendingUp,
  Target,
  Heart,
  Lightbulb,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getAIAssessmentResults } from "./actions";

// Define interfaces for the assessment data
interface LifeSkillsAssessment {
  id: string;
  assessment_date: string;
  self_awareness_score: number;
  empathy_score: number;
  friendship_and_healthy_relationships_score: number;
  effective_communication_score: number;
  creative_thinking_score: number;
  problem_solving_score: number;
  decision_making_score: number;
  critical_thinking_score: number;
  emotion_management_score: number;
  self_confidence_score: number;
  created_at: string;
  updated_at: string;
}

interface ActiveLifeAssessment {
  id: string;
  assessment_date: string;
  belief_religious_ethical_score: number;
  social_political_score: number;
  biological_physical_score: number;
  aesthetic_artistic_score: number;
  economic_professional_score: number;
  scientific_technological_score: number;
  created_at: string;
  updated_at: string;
}

interface GrowthDevelopmentAssessment {
  id: string;
  assessment_date: string;
  linguistic_verbal_score: number;
  logical_mathematical_score: number;
  visual_spatial_score: number;
  musical_score: number;
  existential_score: number;
  bodily_kinesthetic_score: number;
  interpersonal_score: number;
  intrapersonal_score: number;
  naturalistic_score: number;
  moral_spiritual_score: number;
  created_at: string;
  updated_at: string;
}

interface AssessmentData {
  lifeSkills: LifeSkillsAssessment[];
  activeLife: ActiveLifeAssessment[];
  growthDevelopment: GrowthDevelopmentAssessment[];
}

export default function AIAssessmentResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ studentId: string }>;
}) {
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const router = useRouter();
  const [classId, setClassId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      const resolvedSearchParams = await searchParams;
      setClassId(resolvedParams.id);
      setStudentId(resolvedSearchParams.studentId);
    };
    getParams();
  }, [params, searchParams]);

  useEffect(() => {
    if (classId && studentId) {
      fetchAssessmentData();
    }
  }, [classId, studentId]);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      const result = await getAIAssessmentResults(classId, studentId);

      if (result.success && result.data) {
        setAssessmentData(result.data);
        setError(null);
      } else {
        setError(result.error || "خطا در بارگیری نتایج تحلیل هوش مصنوعی");
      }
    } catch (err) {
      console.error("Error fetching assessment data:", err);
      setError("خطا در بارگیری نتایج تحلیل هوش مصنوعی");
    } finally {
      setLoading(false);
    }
  };

  // Function to get score color based on value
  const getScoreColor = (score: number, maxScore: number = 5) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 60) return "text-yellow-500";
    if (percentage >= 40) return "text-orange-500";
    return "text-red-500";
  };

  // Function to get score bar width
  const getScoreWidth = (score: number, maxScore: number = 5) => {
    return `${(score / maxScore) * 100}%`;
  };

  // Life skills data with icons and labels
  const lifeSkillsData = [
    { key: "self_awareness_score", label: "خودآگاهی", icon: Brain },
    { key: "empathy_score", label: "همدلی", icon: Heart },
    {
      key: "friendship_and_healthy_relationships_score",
      label: "دوستی و روابط سالم",
      icon: Users,
    },
    {
      key: "effective_communication_score",
      label: "ارتباط مؤثر",
      icon: TrendingUp,
    },
    { key: "creative_thinking_score", label: "تفکر خلاق", icon: Lightbulb },
    { key: "problem_solving_score", label: "حل مسئله", icon: Target },
    { key: "decision_making_score", label: "تصمیم‌گیری", icon: Brain },
    { key: "critical_thinking_score", label: "تفکر انتقادی", icon: Lightbulb },
    { key: "emotion_management_score", label: "مدیریت احساسات", icon: Heart },
    { key: "self_confidence_score", label: "اعتماد به نفس", icon: TrendingUp },
  ];

  // Active life data
  const activeLifeData = [
    { key: "belief_religious_ethical_score", label: "باورهای دینی و اخلاقی" },
    { key: "social_political_score", label: "اجتماعی و سیاسی" },
    { key: "biological_physical_score", label: "زیستی و جسمانی" },
    { key: "aesthetic_artistic_score", label: "زیبایی‌شناسی و هنری" },
    { key: "economic_professional_score", label: "اقتصادی و حرفه‌ای" },
    { key: "scientific_technological_score", label: "علمی و فناورانه" },
  ];

  // Growth and development data
  const growthDevelopmentData = [
    { key: "linguistic_verbal_score", label: "زبانی-کلامی" },
    { key: "logical_mathematical_score", label: "منطقی-ریاضی" },
    { key: "visual_spatial_score", label: "تصویری-فضایی" },
    { key: "musical_score", label: "موسیقیایی" },
    { key: "existential_score", label: "وجودی" },
    { key: "bodily_kinesthetic_score", label: "جنبشی-بدنی" },
    { key: "interpersonal_score", label: "میان‌فردی" },
    { key: "intrapersonal_score", label: "درون‌فردی" },
    { key: "naturalistic_score", label: "طبیعت‌گرا" },
    { key: "moral_spiritual_score", label: "اخلاقی-معنوی" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            در حال بارگذاری نتایج...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-6" dir="rtl">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/dashboard/teacher/classes/${classId}`}
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            }`}
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            خطا در بارگیری نتایج
          </h1>
        </div>
        <div
          className={`p-4 rounded-xl border ${
            theme === "dark"
              ? "bg-red-500/10 border-red-500/20"
              : "bg-red-50 border-red-200"
          }`}
        >
          <p
            className={`text-sm ${
              theme === "dark" ? "text-red-400" : "text-red-600"
            }`}
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/teacher/classes/${classId}`}
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            }`}
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1
              className={`text-xl sm:text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              نتایج تحلیل هوش مصنوعی از مشاهدات فردی
            </h1>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              تحلیل جامع مهارت‌ها و توانمندی‌های دانش‌آموز
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Life Skills Section */}
        <div
          className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <Brain className="w-5 h-5" />
            </div>
            <h2
              className={`text-lg sm:text-xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              مهارت‌های زندگی
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lifeSkillsData.map((skill) => {
              const IconComponent = skill.icon;
              const scoreValue =
                assessmentData?.lifeSkills[0]?.[
                  skill.key as keyof LifeSkillsAssessment
                ] || 0;
              const score = typeof scoreValue === "number" ? scoreValue : 0;
              return (
                <div
                  key={skill.key}
                  className={`p-4 rounded-lg ${
                    theme === "dark" ? "bg-slate-800/50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4 text-blue-500" />
                      <span
                        className={`font-medium ${
                          theme === "dark" ? "text-slate-200" : "text-gray-700"
                        }`}
                      >
                        {skill.label}
                      </span>
                    </div>
                    <span className={`font-bold ${getScoreColor(score)}`}>
                      {score}/5
                    </span>
                  </div>
                  <div
                    className={`w-full h-2 rounded-full ${
                      theme === "dark" ? "bg-slate-700" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`h-2 rounded-full ${getScoreColor(
                        score
                      ).replace("text", "bg")}`}
                      style={{ width: getScoreWidth(score) }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Life Standardization Section */}
        <div
          className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-green-500/10 text-green-400"
                  : "bg-green-50 text-green-600"
              }`}
            >
              <Target className="w-5 h-5" />
            </div>
            <h2
              className={`text-lg sm:text-xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              استانداردسازی زندگی فعال
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeLifeData.map((item) => {
              const scoreValue =
                assessmentData?.activeLife[0]?.[
                  item.key as keyof ActiveLifeAssessment
                ] || 0;
              const score = typeof scoreValue === "number" ? scoreValue : 0;
              return (
                <div
                  key={item.key}
                  className={`p-4 rounded-lg ${
                    theme === "dark" ? "bg-slate-800/50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-medium ${
                        theme === "dark" ? "text-slate-200" : "text-gray-700"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className={`font-bold ${getScoreColor(score, 3)}`}>
                      {score}/3
                    </span>
                  </div>
                  <div
                    className={`w-full h-2 rounded-full ${
                      theme === "dark" ? "bg-slate-700" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`h-2 rounded-full ${getScoreColor(
                        score,
                        3
                      ).replace("text", "bg")}`}
                      style={{ width: getScoreWidth(score, 3) }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Growth and Development Section */}
        <div
          className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-purple-500/10 text-purple-400"
                  : "bg-purple-50 text-purple-600"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2
              className={`text-lg sm:text-xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              رشد و توسعه
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {growthDevelopmentData.map((item) => {
              const scoreValue =
                assessmentData?.growthDevelopment[0]?.[
                  item.key as keyof GrowthDevelopmentAssessment
                ] || 0;
              const score = typeof scoreValue === "number" ? scoreValue : 0;
              return (
                <div
                  key={item.key}
                  className={`p-4 rounded-lg ${
                    theme === "dark" ? "bg-slate-800/50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-medium ${
                        theme === "dark" ? "text-slate-200" : "text-gray-700"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className={`font-bold ${getScoreColor(score)}`}>
                      {score}/5
                    </span>
                  </div>
                  <div
                    className={`w-full h-2 rounded-full ${
                      theme === "dark" ? "bg-slate-700" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`h-2 rounded-full ${getScoreColor(
                        score
                      ).replace("text", "bg")}`}
                      style={{ width: getScoreWidth(score) }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
