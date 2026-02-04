"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Square, Sparkles, Loader2, Users, ChevronDown } from "lucide-react";
import { useTheme } from "@/app/components/ThemeContext";

interface ExtractedData {
  student_name?: string | null;
  class_name?: string | null;
  subject_name?: string | null;
  activity_type?: string | null;
  activity_title?: string | null;
  activity_date?: string | null;
  quantitative_score?: number | null;
  qualitative_evaluation?: string | null;
}

interface Class {
  id: string;
  name: string;
  grade_level: string;
}

interface Student {
  id: string;
  name: string;
  national_id: string;
}

interface ClassInfo {
  class_name: string;
  grade_level: string;
  subject_id: string;
  subject_name: string;
}

interface SmartActivityChatProps {
  onExtractedData: (data: ExtractedData) => void;
  classes?: Class[];
  languageModel?: "cloud" | "local";
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [key: number]: {
    transcript: string;
  };
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResult[] & {
    [key: number]: SpeechRecognitionResult;
    length: number;
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export default function SmartActivityChat({
  onExtractedData,
  classes = [],
  languageModel,
}: SmartActivityChatProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [showStudentsList, setShowStudentsList] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    ) {
      setSpeechSupported(true);
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();

        if (recognitionRef.current) {
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = "fa-IR";

          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
          };

          recognitionRef.current.onerror = () => {
            setIsListening(false);
          };

          recognitionRef.current.onend = () => {
            setIsListening(false);
          };
        }
      }
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
      }
    }
  };

  // Load students when class is selected
  const handleClassSelect = async (classId: string) => {
    setSelectedClassId(classId);
    if (!classId) {
      setStudents([]);
      setClassInfo(null);
      setShowStudentsList(false);
      return;
    }

    setLoadingStudents(true);
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/students`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setClassInfo(data.classInfo || null);
        setShowStudentsList(true);
      } else {
        setStudents([]);
        setClassInfo(null);
        setShowStudentsList(false);
      }
    } catch (error) {
      console.error("Error loading students:", error);
      setStudents([]);
      setClassInfo(null);
      setShowStudentsList(false);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/teacher/ai-extract-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, languageModel }),
      });

      if (!response.ok) {
        const error = await response.json();
        setResult(`خطا: ${error.error || "خطا در پردازش"}`);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setResult("اطلاعات با موفقیت استخراج شد! لطفاً فرم زیر را بررسی کنید.");
        onExtractedData(data.data);
        setInput("");
      } else {
        setResult("خطا در استخراج اطلاعات. لطفاً دوباره تلاش کنید.");
      }
    } catch (error) {
      console.error("Error:", error);
      setResult("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={`rounded-2xl p-6 ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-800/50"
          : "bg-gradient-to-br from-white via-blue-50/30 to-white"
      } shadow-lg border ${
        theme === "dark" ? "border-slate-700" : "border-blue-100"
      }`}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`p-2 rounded-xl ${
            theme === "dark"
              ? "bg-purple-500/20 text-purple-400"
              : "bg-purple-100 text-purple-600"
          }`}
        >
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3
            className={`text-lg font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            ثبت هوشمند فعالیت با هوش مصنوعی
          </h3>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            اطلاعات فعالیت را بنویسید یا بگویید...
          </p>
        </div>
      </div>

      {/* Class Selector & Students List */}
      {classes.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <Users className={`w-5 h-5 ${theme === "dark" ? "text-slate-400" : "text-gray-600"}`} />
            <select
              value={selectedClassId}
              onChange={(e) => handleClassSelect(e.target.value)}
              className={`flex-1 px-4 py-2.5 rounded-xl border ${
                theme === "dark"
                  ? "bg-slate-700 border-slate-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-purple-500 outline-none`}
            >
              <option value="">انتخاب کلاس برای مشاهده دانش‌آموزان...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - پایه {cls.grade_level}
                </option>
              ))}
            </select>
          </div>

          {/* Students List */}
          {showStudentsList && (
            <div
              className={`rounded-xl border p-4 ${
                theme === "dark"
                  ? "bg-slate-700/50 border-slate-600"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4
                  className={`text-sm font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  لیست دانش‌آموزان
                  {classInfo?.subject_name && (
                    <span className={`${theme === "dark" ? "text-purple-400" : "text-purple-600"}`}>
                      {" "}- {classInfo.subject_name}
                    </span>
                  )}
                  {" "}({students.length} نفر)
                </h4>
                {loadingStudents && (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {students.map((student, index) => (
                  <div
                    key={student.id}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      theme === "dark"
                        ? "bg-slate-600/50 text-slate-200"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    <span className={`font-medium ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`}>
                      {index + 1}.
                    </span>{" "}
                    {student.name}
                  </div>
                ))}
              </div>
              <p
                className={`text-xs mt-3 ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                💡 نکته: می‌توانید نام دانش‌آموز را از لیست بالا پیدا کرده و در پیام صوتی یا متنی خود استفاده کنید
              </p>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="مثال: علی مرادی در کلاس بزرگان اندیشه، درس ریاضی، آزمون میان‌ترم فصل 1 با نمره 18"
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-xl border ${
              theme === "dark"
                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
            } focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50`}
          />
          {speechSupported && (
            <button
              onClick={toggleVoice}
              disabled={isLoading}
              className={`p-3 rounded-xl transition-all ${
                isListening
                  ? theme === "dark"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-red-100 text-red-600"
                  : theme === "dark"
                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } disabled:opacity-50`}
            >
              {isListening ? (
                <Square className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className={`px-6 py-3 rounded-xl transition-all ${
              theme === "dark"
                ? "bg-purple-500 text-white hover:bg-purple-600"
                : "bg-purple-600 text-white hover:bg-purple-700"
            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>در حال پردازش...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>استخراج</span>
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`p-4 rounded-xl ${
              result.includes("خطا")
                ? theme === "dark"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-red-50 text-red-600"
                : theme === "dark"
                ? "bg-green-500/20 text-green-400"
                : "bg-green-50 text-green-600"
            }`}
          >
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
