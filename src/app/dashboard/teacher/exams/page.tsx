"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/app/components/ThemeContext";
import {
  Book,
  Send,
  Mic,
  Plus,
  X,
  FileText,
  MessageSquare,
  CheckCircle,
  Settings,
  Download,
  History,
  BarChart3,
  Share2,
  Database,
  Eye,
  Edit,
  Trash2,
  Copy,
  Clock,
  Target,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Save,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

interface Source {
  id: string;
  title: string;
  grade: string;
  subject: string;
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ExamSettings {
  difficulty: "easy" | "medium" | "hard";
  questionTypes: string[];
  timeLimit: number;
  chapter: string;
}

interface SavedExam {
  id: string;
  title: string;
  date: Date;
  subject: string;
  grade: string;
  questions: Question[];
  settings: ExamSettings;
}

interface Question {
  id: string;
  text: string;
  type: "multiple" | "essay" | "truefalse" | "fillblank";
  options?: string[];
  answer?: string;
  difficulty: string;
  topic: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  settings: ExamSettings;
}

export default function ExamsPage() {
  const { theme } = useTheme();
  const [selectedSources, setSelectedSources] = useState<Source[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedSources, setUploadedSources] = useState<Source[]>([]);
  const [newSourceName, setNewSourceName] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [activeTab, setActiveTab] = useState<
    "chat" | "history" | "bank" | "stats"
  >("chat");
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const [examSettings, setExamSettings] = useState<ExamSettings>({
    difficulty: "medium",
    questionTypes: ["multiple"],
    timeLimit: 60,
    chapter: "",
  });

  const [savedExams, setSavedExams] = useState<SavedExam[]>([
    {
      id: "1",
      title: "آزمون میان‌ترم ریاضی",
      date: new Date("2025-10-15"),
      subject: "ریاضی",
      grade: "نهم",
      questions: [],
      settings: examSettings,
    },
  ]);

  const [questionBank, setQuestionBank] = useState<Question[]>([
    {
      id: "1",
      text: "معادله درجه دوم چیست؟",
      type: "essay",
      difficulty: "medium",
      topic: "معادلات",
    },
  ]);

  const [currentExam, setCurrentExam] = useState<Question[]>([
    {
      id: "1",
      text: "کدام گزینه صحیح است؟",
      type: "multiple",
      options: ["گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴"],
      answer: "گزینه ۱",
      difficulty: "medium",
      topic: "فصل اول",
    },
    {
      id: "2",
      text: "توضیح دهید چرا...؟",
      type: "essay",
      difficulty: "hard",
      topic: "فصل دوم",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");

  const templates: Template[] = [
    {
      id: "1",
      name: "آزمون میان‌ترم",
      description: "۲۰ سوال تستی - ۶۰ دقیقه",
      settings: {
        difficulty: "medium",
        questionTypes: ["multiple"],
        timeLimit: 60,
        chapter: "",
      },
    },
    {
      id: "2",
      name: "آزمون پایان‌ترم",
      description: "۱۵ سوال تستی + ۵ تشریحی - ۹۰ دقیقه",
      settings: {
        difficulty: "hard",
        questionTypes: ["multiple", "essay"],
        timeLimit: 90,
        chapter: "",
      },
    },
    {
      id: "3",
      name: "تمرین سریع",
      description: "۱۰ سوال - ۳۰ دقیقه",
      settings: {
        difficulty: "easy",
        questionTypes: ["multiple", "truefalse"],
        timeLimit: 30,
        chapter: "",
      },
    },
  ];

  const educationalSources: Source[] = [
    { id: "1", title: "فارسی اول دبستان", grade: "اول", subject: "فارسی" },
    { id: "2", title: "ریاضی اول دبستان", grade: "اول", subject: "ریاضی" },
    { id: "3", title: "علوم دوم دبستان", grade: "دوم", subject: "علوم" },
    { id: "4", title: "فارسی سوم دبستان", grade: "سوم", subject: "فارسی" },
    { id: "5", title: "ریاضی چهارم دبستان", grade: "چهارم", subject: "ریاضی" },
    { id: "6", title: "علوم پنجم دبستان", grade: "پنجم", subject: "علوم" },
    { id: "7", title: "مطالعات اجتماعی ششم", grade: "ششم", subject: "اجتماعی" },
    { id: "8", title: "ریاضی هفتم", grade: "هفتم", subject: "ریاضی" },
    { id: "9", title: "علوم هفتم", grade: "هفتم", subject: "علوم" },
    { id: "10", title: "زبان انگلیسی هشتم", grade: "هشتم", subject: "انگلیسی" },
    { id: "11", title: "فارسی نهم", grade: "نهم", subject: "فارسی" },
    { id: "12", title: "علوم نهم", grade: "نهم", subject: "علوم" },
    { id: "13", title: "ریاضی دهم", grade: "دهم", subject: "ریاضی" },
    { id: "14", title: "فیزیک دهم", grade: "دهم", subject: "فیزیک" },
    { id: "15", title: "شیمی یازدهم", grade: "یازدهم", subject: "شیمی" },
    { id: "16", title: "زیست شناسی یازدهم", grade: "یازدهم", subject: "زیست" },
    { id: "17", title: "حسابان دوازدهم", grade: "دوازدهم", subject: "ریاضی" },
    { id: "18", title: "فیزیک دوازدهم", grade: "دوازدهم", subject: "فیزیک" },
  ];

  const grades = [
    "اول",
    "دوم",
    "سوم",
    "چهارم",
    "پنجم",
    "ششم",
    "هفتم",
    "هشتم",
    "نهم",
    "دهم",
    "یازدهم",
    "دوازدهم",
  ];
  const [selectedGrade, setSelectedGrade] = useState<string>("");

  const filteredSources = selectedGrade
    ? educationalSources.filter((s) => s.grade === selectedGrade)
    : educationalSources;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
    }
  };

  const handleAddCustomSource = () => {
    if (!newSourceName.trim() || !uploadedFileName) return;

    const newSource: Source = {
      id: `custom-${Date.now()}`,
      title: newSourceName,
      grade: "سفارشی",
      subject: "آپلود شده",
    };

    setUploadedSources([...uploadedSources, newSource]);
    setSelectedSources([...selectedSources, newSource]);
    setNewSourceName("");
    setUploadedFileName("");
    setShowUploadModal(false);
  };

  const handleSourceToggle = (source: Source) => {
    if (selectedSources.find((s) => s.id === source.id)) {
      setSelectedSources(selectedSources.filter((s) => s.id !== source.id));
    } else {
      setSelectedSources([...selectedSources, source]);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputText,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);

    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `بر اساس تنظیمات شما:\n• سطح سختی: ${
          examSettings.difficulty === "easy"
            ? "آسان"
            : examSettings.difficulty === "medium"
            ? "متوسط"
            : "سخت"
        }\n• زمان: ${examSettings.timeLimit} دقیقه\n• منابع: ${selectedSources
          .map((s) => s.title)
          .join(
            "، "
          )}\n\nآزمون شما آماده شد! برای مشاهده روی دکمه "پیش‌نمایش" کلیک کنید.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
      setShowPreview(true);
    }, 1000);

    setInputText("");
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setInputText("یک آزمون ۲۰ سوالی از فصل اول طراحی کن");
      }, 2000);
    }
  };

  const handleSaveExam = () => {
    const newExam: SavedExam = {
      id: Date.now().toString(),
      title: `آزمون ${selectedSources[0]?.subject || "جدید"}`,
      date: new Date(),
      subject: selectedSources[0]?.subject || "عمومی",
      grade: selectedSources[0]?.grade || "نامشخص",
      questions: currentExam,
      settings: examSettings,
    };
    setSavedExams([...savedExams, newExam]);
    alert("آزمون با موفقیت ذخیره شد!");
  };

  const handleDownloadPDF = () => {
    alert("در حال دانلود PDF...");
  };

  const handleDeleteExam = (id: string) => {
    setSavedExams(savedExams.filter((e) => e.id !== id));
  };

  const handleAddToBank = (question: Question) => {
    if (!questionBank.find((q) => q.id === question.id)) {
      setQuestionBank([...questionBank, question]);
      alert("سوال به بانک سوال اضافه شد!");
    }
  };

  const filteredQuestions = questionBank.filter((q) => {
    const matchesSearch =
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty =
      filterDifficulty === "all" || q.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const handleApplyTemplate = (template: Template) => {
    setExamSettings(template.settings);
    setShowTemplates(false);
    alert(`تمپلیت "${template.name}" اعمال شد!`);
  };

  const stats = {
    totalExams: savedExams.length,
    totalQuestions: questionBank.length,
    mostUsedSubject: "ریاضی",
    avgDifficulty: "متوسط",
  };

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      <div
        className={`flex h-[calc(100vh-180px)] rounded-2xl overflow-hidden ${
          theme === "dark" ? "bg-slate-900" : "bg-gray-50"
        }`}
        dir="rtl"
      >
        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`rounded-2xl p-6 w-full max-w-md shadow-2xl ${
                theme === "dark" ? "bg-slate-800" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={`text-xl font-bold ${
                    theme === "dark" ? "text-white" : "text-slate-800"
                  }`}
                >
                  افزودن منبع جدید
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className={`${
                    theme === "dark"
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  aria-label="بستن"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    نام منبع:
                  </label>
                  <input
                    type="text"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="مثلاً: جزوه شیمی فصل سوم"
                    className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === "dark"
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "border-2 border-slate-300"
                    }`}
                    aria-label="نام منبع"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    آپلود فایل:
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      id="file-upload"
                      aria-label="انتخاب فایل"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                        theme === "dark"
                          ? "border-slate-600 hover:border-blue-500 bg-slate-700 hover:bg-blue-500/10"
                          : "border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50"
                      }`}
                    >
                      <div className="text-center">
                        <Plus
                          className={`w-8 h-8 mx-auto mb-2 ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-slate-400"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            theme === "dark"
                              ? "text-slate-300"
                              : "text-slate-600"
                          }`}
                        >
                          {uploadedFileName || "فایل خود را انتخاب کنید"}
                        </span>
                        <p
                          className={`text-xs mt-1 ${
                            theme === "dark"
                              ? "text-slate-500"
                              : "text-slate-400"
                          }`}
                        >
                          PDF, DOC, DOCX, TXT
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleAddCustomSource}
                  disabled={!newSourceName.trim() || !uploadedFileName}
                  className={`w-full px-4 py-3 rounded-lg transition-all font-medium ${
                    !newSourceName.trim() || !uploadedFileName
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-90"
                  } ${
                    theme === "dark"
                      ? "bg-blue-600 text-white"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                  }`}
                >
                  افزودن منبع
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${
                theme === "dark" ? "bg-slate-800" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className={`text-2xl font-bold flex items-center gap-2 ${
                    theme === "dark" ? "text-white" : "text-slate-800"
                  }`}
                >
                  <Settings className="w-7 h-7" />
                  تنظیمات پیشرفته آزمون
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`${
                    theme === "dark"
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  aria-label="بستن"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    سطح سختی:
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "easy", label: "آسان", color: "green" },
                      { value: "medium", label: "متوسط", color: "yellow" },
                      { value: "hard", label: "سخت", color: "red" },
                    ].map((level) => (
                      <button
                        key={level.value}
                        onClick={() =>
                          setExamSettings({
                            ...examSettings,
                            difficulty: level.value as
                              | "easy"
                              | "medium"
                              | "hard",
                          })
                        }
                        className={`px-4 py-3 rounded-lg transition-all ${
                          examSettings.difficulty === level.value
                            ? `bg-${level.color}-500/20 text-${level.color}-500 border-${level.color}-500 border-2`
                            : theme === "dark"
                            ? "bg-slate-700 border-slate-600 hover:border-slate-500"
                            : "bg-slate-100 border-slate-200 hover:border-slate-300 border-2"
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    نوع سوالات:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "multiple", label: "تستی چهار گزینه‌ای" },
                      { value: "essay", label: "تشریحی" },
                      { value: "truefalse", label: "صحیح/غلط" },
                      { value: "fillblank", label: "جای خالی" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          const types = examSettings.questionTypes.includes(
                            type.value
                          )
                            ? examSettings.questionTypes.filter(
                                (t) => t !== type.value
                              )
                            : [...examSettings.questionTypes, type.value];
                          setExamSettings({
                            ...examSettings,
                            questionTypes: types,
                          });
                        }}
                        className={`px-4 py-3 rounded-lg transition-all text-sm ${
                          examSettings.questionTypes.includes(type.value)
                            ? "bg-blue-500/20 text-blue-500 border-blue-500 border-2"
                            : theme === "dark"
                            ? "bg-slate-700 border-slate-600 hover:border-slate-500"
                            : "bg-slate-100 border-slate-200 hover:border-slate-300 border-2"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    زمان آزمون: {examSettings.timeLimit} دقیقه
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="180"
                    step="15"
                    value={examSettings.timeLimit}
                    onChange={(e) =>
                      setExamSettings({
                        ...examSettings,
                        timeLimit: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                    aria-label="تنظیم زمان آزمون"
                  />
                  <div
                    className={`flex justify-between text-xs mt-1 ${
                      theme === "dark" ? "text-slate-500" : "text-slate-500"
                    }`}
                  >
                    <span>۱۵ دقیقه</span>
                    <span>۱۸۰ دقیقه</span>
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    فصل/بخش خاص:
                  </label>
                  <input
                    type="text"
                    value={examSettings.chapter}
                    onChange={(e) =>
                      setExamSettings({
                        ...examSettings,
                        chapter: e.target.value,
                      })
                    }
                    placeholder="مثلاً: فصل دوم - معادلات"
                    className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === "dark"
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "border-2 border-slate-300"
                    }`}
                    aria-label="فصل یا بخش خاص"
                  />
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className={`w-full px-4 py-3 rounded-lg transition-all font-medium ${
                    theme === "dark"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                  }`}
                >
                  اعمال تنظیمات
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto ${
                theme === "dark" ? "bg-slate-800" : "bg-white"
              }`}
            >
              <div
                className={`sticky top-0 p-6 flex items-center justify-between border-b ${
                  theme === "dark"
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                <h3
                  className={`text-2xl font-bold flex items-center gap-2 ${
                    theme === "dark" ? "text-white" : "text-slate-800"
                  }`}
                >
                  <Eye className="w-7 h-7" />
                  پیش‌نمایش آزمون
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      theme === "dark"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    <Download className="w-5 h-5" />
                    دانلود PDF
                  </button>
                  <button
                    onClick={handleSaveExam}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      theme === "dark"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    <Save className="w-5 h-5" />
                    ذخیره
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className={`${
                      theme === "dark"
                        ? "text-slate-400 hover:text-slate-200"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                    aria-label="بستن"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div
                  className={`p-4 rounded-lg mb-6 ${
                    theme === "dark" ? "bg-slate-700" : "bg-slate-50"
                  }`}
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">زمان:</span>{" "}
                      {examSettings.timeLimit} دقیقه
                    </div>
                    <div>
                      <span className="font-medium">سطح سختی:</span>{" "}
                      {examSettings.difficulty === "easy"
                        ? "آسان"
                        : examSettings.difficulty === "medium"
                        ? "متوسط"
                        : "سخت"}
                    </div>
                    <div>
                      <span className="font-medium">تعداد سوالات:</span>{" "}
                      {currentExam.length}
                    </div>
                    <div>
                      <span className="font-medium">نوع:</span> ترکیبی
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {currentExam.map((q, index) => (
                    <div
                      key={q.id}
                      className={`rounded-lg p-4 ${
                        theme === "dark"
                          ? "bg-slate-700 border-slate-600"
                          : "bg-white border-slate-200"
                      } border-2`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-3 py-1 rounded text-sm font-medium ${
                                theme === "dark"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              سوال {index + 1}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                q.difficulty === "easy"
                                  ? theme === "dark"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-green-100 text-green-700"
                                  : q.difficulty === "medium"
                                  ? theme === "dark"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-yellow-100 text-yellow-700"
                                  : theme === "dark"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {q.difficulty === "easy"
                                ? "آسان"
                                : q.difficulty === "medium"
                                ? "متوسط"
                                : "سخت"}
                            </span>
                          </div>
                          <p
                            className={`font-medium ${
                              theme === "dark" ? "text-white" : "text-slate-800"
                            }`}
                          >
                            {q.text}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToBank(q)}
                            className={`${
                              theme === "dark"
                                ? "text-blue-400 hover:text-blue-300"
                                : "text-blue-600 hover:text-blue-700"
                            }`}
                            title="افزودن به بانک سوال"
                          >
                            <Database className="w-5 h-5" />
                          </button>
                          <button
                            className={`${
                              theme === "dark"
                                ? "text-slate-400 hover:text-slate-300"
                                : "text-slate-600 hover:text-slate-700"
                            }`}
                            title="ویرایش"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      {q.options && (
                        <div className="space-y-2 mr-4">
                          {q.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 flex items-center justify-center rounded-full text-sm ${
                                  theme === "dark"
                                    ? "border-slate-500"
                                    : "border-slate-300"
                                } border-2`}
                              >
                                {i + 1}
                              </span>
                              <span
                                className={
                                  theme === "dark"
                                    ? "text-slate-300"
                                    : "text-slate-700"
                                }
                              >
                                {opt}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 ${
                      theme === "dark"
                        ? "bg-slate-700 hover:bg-slate-600 text-white"
                        : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                    }`}
                  >
                    <RefreshCw className="w-5 h-5" />
                    تولید مجدد
                  </button>
                  <button
                    className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 ${
                      theme === "dark"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                    افزودن سوال جدید
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates Modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`rounded-2xl w-full max-w-3xl shadow-2xl ${
                theme === "dark" ? "bg-slate-800" : "bg-white"
              }`}
            >
              <div
                className={`p-6 flex items-center justify-between border-b ${
                  theme === "dark" ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <h3
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-slate-800"
                  }`}
                >
                  تمپلیت‌های آماده
                </h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className={`${
                    theme === "dark"
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  aria-label="بستن"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`rounded-lg p-4 transition-all cursor-pointer border-2 ${
                      theme === "dark"
                        ? "border-slate-700 hover:border-blue-500 bg-slate-700"
                        : "border-slate-200 hover:border-blue-500 bg-white"
                    }`}
                    onClick={() => handleApplyTemplate(template)}
                  >
                    <h4
                      className={`font-bold mb-2 ${
                        theme === "dark" ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {template.name}
                    </h4>
                    <p
                      className={`text-sm mb-3 ${
                        theme === "dark" ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {template.description}
                    </p>
                    <div className="flex gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          theme === "dark"
                            ? "bg-slate-600 text-slate-300"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {template.settings.difficulty === "easy"
                          ? "آسان"
                          : template.settings.difficulty === "medium"
                          ? "متوسط"
                          : "سخت"}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          theme === "dark"
                            ? "bg-slate-600 text-slate-300"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {template.settings.timeLimit} دقیقه
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Full Width */}
        <div className="flex-1 flex flex-col">
          <div
            className={`border-b p-6 ${
              theme === "dark"
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className={`text-2xl font-bold flex items-center gap-3 ${
                    theme === "dark" ? "text-white" : "text-slate-800"
                  }`}
                >
                  <FileText className="w-8 h-8 text-blue-600" />
                  سیستم طراحی آزمون و تکلیف هوشمند
                </h1>
                <p
                  className={`mt-1 ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  با استفاده از هوش مصنوعی، آزمون و تمرین‌های خود را طراحی کنید
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTemplates(true)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    theme === "dark"
                      ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                      : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                  }`}
                >
                  <Copy className="w-5 h-5" />
                  تمپلیت‌ها
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    theme === "dark"
                      ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  تنظیمات
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {[
                { id: "chat", label: "چت", icon: MessageSquare },
                { id: "history", label: "تاریخچه", icon: History },
                { id: "bank", label: "بانک سوال", icon: Database },
                { id: "stats", label: "آمار", icon: BarChart3 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as "chat" | "history" | "bank" | "stats"
                    )
                  }
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    activeTab === tab.id
                      ? theme === "dark"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-blue-600 text-white shadow-md"
                      : theme === "dark"
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "chat" && (
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center max-w-2xl">
                      <MessageSquare
                        className={`w-16 h-16 mx-auto mb-4 ${
                          theme === "dark" ? "text-slate-600" : "text-slate-300"
                        }`}
                      />
                      <h3
                        className={`text-xl font-semibold mb-2 ${
                          theme === "dark" ? "text-white" : "text-slate-700"
                        }`}
                      >
                        به سیستم طراحی آزمون خوش آمدید!
                      </h3>
                      <p
                        className={`mb-6 ${
                          theme === "dark" ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        منابع درسی مورد نظر خود را از سمت راست انتخاب کنید و سپس
                        درخواست خود را بنویسید.
                      </p>
                      <div
                        className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-right rounded-xl p-4 ${
                          theme === "dark"
                            ? "bg-slate-700 border border-slate-600"
                            : "bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200"
                        }`}
                      >
                        <div>
                          <h4
                            className={`font-semibold mb-2 ${
                              theme === "dark"
                                ? "text-blue-400"
                                : "text-blue-900"
                            }`}
                          >
                            نمونه دستورات:
                          </h4>
                          <ul
                            className={`space-y-1 ${
                              theme === "dark"
                                ? "text-blue-300"
                                : "text-blue-700"
                            }`}
                          >
                            <li>• یک آزمون ۲۰ سوالی از فصل اول طراحی کن</li>
                            <li>• ده سوال تستی از مبحث کسرها بساز</li>
                            <li>• یک تمرین تشریحی از موضوع فتوسنتز</li>
                          </ul>
                        </div>
                        <div>
                          <h4
                            className={`font-semibold mb-2 ${
                              theme === "dark"
                                ? "text-green-400"
                                : "text-green-900"
                            }`}
                          >
                            امکانات:
                          </h4>
                          <ul
                            className={`space-y-1 ${
                              theme === "dark"
                                ? "text-green-300"
                                : "text-green-700"
                            }`}
                          >
                            <li>• طراحی سوالات تستی و تشریحی</li>
                            <li>• تولید تمرین و تکلیف</li>
                            <li>• مدیریت بانک سوال</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === "user"
                          ? "justify-start"
                          : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-2xl p-4 rounded-2xl shadow-sm ${
                          message.type === "user"
                            ? theme === "dark"
                              ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white"
                              : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                            : theme === "dark"
                            ? "bg-slate-700 text-slate-100 border border-slate-600"
                            : "bg-white text-slate-800 border border-slate-200"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>
                        <div
                          className={`text-xs mt-2 ${
                            message.type === "user"
                              ? theme === "dark"
                                ? "text-blue-200"
                                : "text-blue-100"
                              : theme === "dark"
                              ? "text-slate-400"
                              : "text-slate-400"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString("fa-IR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`text-xl font-bold ${
                      theme === "dark" ? "text-white" : "text-slate-800"
                    }`}
                  >
                    آزمون‌های ذخیره شده
                  </h3>
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {savedExams.length} آزمون
                  </span>
                </div>
                {savedExams.map((exam) => (
                  <div
                    key={exam.id}
                    className={`rounded-lg p-4 transition-all ${
                      theme === "dark"
                        ? "bg-slate-700 border-slate-600"
                        : "bg-white border-slate-200"
                    } border-2 hover:border-blue-300`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4
                          className={`font-bold mb-1 ${
                            theme === "dark" ? "text-white" : "text-slate-800"
                          }`}
                        >
                          {exam.title}
                        </h4>
                        <div className="flex gap-2 text-sm mb-2">
                          <span
                            className={`px-2 py-1 rounded ${
                              theme === "dark"
                                ? "bg-slate-600 text-slate-300"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {exam.grade}
                          </span>
                          <span
                            className={`px-2 py-1 rounded ${
                              theme === "dark"
                                ? "bg-slate-600 text-slate-300"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {exam.subject}
                          </span>
                          <span
                            className={`px-2 py-1 rounded ${
                              theme === "dark"
                                ? "bg-slate-600 text-slate-300"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {exam.date.toLocaleDateString("fa-IR")}
                          </span>
                        </div>
                        <p
                          className={`text-sm ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-slate-500"
                          }`}
                        >
                          {exam.questions.length} سوال •{" "}
                          {exam.settings.timeLimit} دقیقه
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setCurrentExam(exam.questions);
                            setShowPreview(true);
                          }}
                          className={`p-2 rounded-lg ${
                            theme === "dark"
                              ? "text-blue-400 hover:bg-blue-500/20"
                              : "text-blue-600 hover:bg-blue-50"
                          }`}
                          title="مشاهده"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          className={`p-2 rounded-lg ${
                            theme === "dark"
                              ? "text-green-400 hover:bg-green-500/20"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          title="کپی"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                        <button
                          className={`p-2 rounded-lg ${
                            theme === "dark"
                              ? "text-purple-400 hover:bg-purple-500/20"
                              : "text-purple-600 hover:bg-purple-50"
                          }`}
                          title="اشتراک‌گذاری"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className={`p-2 rounded-lg ${
                            theme === "dark"
                              ? "text-red-400 hover:bg-red-500/20"
                              : "text-red-600 hover:bg-red-50"
                          }`}
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "bank" && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search
                      className={`w-5 h-5 absolute right-3 top-3 ${
                        theme === "dark" ? "text-slate-500" : "text-slate-400"
                      }`}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجو در بانک سوال..."
                      className={`w-full pr-10 pl-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === "dark"
                          ? "bg-slate-700 border-slate-600 text-white"
                          : "border-2 border-slate-300"
                      }`}
                      aria-label="جستجو در بانک سوال"
                    />
                  </div>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className={`px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === "dark"
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "border-2 border-slate-300"
                    }`}
                    aria-label="فیلتر بر اساس سطح سختی"
                  >
                    <option value="all">همه سطوح</option>
                    <option value="easy">آسان</option>
                    <option value="medium">متوسط</option>
                    <option value="hard">سخت</option>
                  </select>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`text-xl font-bold ${
                      theme === "dark" ? "text-white" : "text-slate-800"
                    }`}
                  >
                    بانک سوالات
                  </h3>
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {filteredQuestions.length} سوال
                  </span>
                </div>

                {filteredQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`rounded-lg p-4 transition-all ${
                      theme === "dark"
                        ? "bg-slate-700 border-slate-600"
                        : "bg-white border-slate-200"
                    } border-2 hover:border-blue-300`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              question.type === "multiple"
                                ? theme === "dark"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-blue-100 text-blue-700"
                                : question.type === "essay"
                                ? theme === "dark"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : "bg-purple-100 text-purple-700"
                                : question.type === "truefalse"
                                ? theme === "dark"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-amber-100 text-amber-700"
                                : theme === "dark"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {question.type === "multiple"
                              ? "تستی"
                              : question.type === "essay"
                              ? "تشریحی"
                              : question.type === "truefalse"
                              ? "صحیح/غلط"
                              : "جای خالی"}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              question.difficulty === "easy"
                                ? theme === "dark"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-green-100 text-green-700"
                                : question.difficulty === "medium"
                                ? theme === "dark"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-yellow-100 text-yellow-700"
                                : theme === "dark"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {question.difficulty === "easy"
                              ? "آسان"
                              : question.difficulty === "medium"
                              ? "متوسط"
                              : "سخت"}
                          </span>
                          <span
                            className={`text-xs ${
                              theme === "dark"
                                ? "text-slate-400"
                                : "text-slate-500"
                            }`}
                          >
                            {question.topic}
                          </span>
                        </div>
                        <p
                          className={
                            theme === "dark" ? "text-white" : "text-slate-800"
                          }
                        >
                          {question.text}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className={`p-2 rounded-lg ${
                            theme === "dark"
                              ? "text-blue-400 hover:bg-blue-500/20"
                              : "text-blue-600 hover:bg-blue-50"
                          }`}
                          title="استفاده در آزمون"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button
                          className={`p-2 rounded-lg ${
                            theme === "dark"
                              ? "text-slate-400 hover:bg-slate-600"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                          title="ویرایش"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "stats" && (
              <div className="space-y-6">
                <h3
                  className={`text-xl font-bold mb-6 ${
                    theme === "dark" ? "text-white" : "text-slate-800"
                  }`}
                >
                  آمار و گزارش‌ها
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    className={`rounded-xl p-6 shadow-lg ${
                      theme === "dark"
                        ? "bg-gradient-to-br from-blue-600/20 to-indigo-600/20"
                        : "bg-gradient-to-br from-blue-500 to-indigo-600"
                    } text-white`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <FileText className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">
                        {stats.totalExams}
                      </span>
                    </div>
                    <p
                      className={
                        theme === "dark" ? "text-blue-200" : "text-blue-100"
                      }
                    >
                      آزمون‌های ساخته شده
                    </p>
                  </div>

                  <div
                    className={`rounded-xl p-6 shadow-lg ${
                      theme === "dark"
                        ? "bg-gradient-to-br from-green-600/20 to-emerald-600/20"
                        : "bg-gradient-to-br from-green-500 to-emerald-600"
                    } text-white`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Database className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">
                        {stats.totalQuestions}
                      </span>
                    </div>
                    <p
                      className={
                        theme === "dark" ? "text-green-200" : "text-green-100"
                      }
                    >
                      سوالات بانک
                    </p>
                  </div>

                  <div
                    className={`rounded-xl p-6 shadow-lg ${
                      theme === "dark"
                        ? "bg-gradient-to-br from-purple-600/20 to-pink-600/20"
                        : "bg-gradient-to-br from-purple-500 to-pink-600"
                    } text-white`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Target className="w-8 h-8 opacity-80" />
                      <span className="text-2xl font-bold">
                        {stats.mostUsedSubject}
                      </span>
                    </div>
                    <p
                      className={
                        theme === "dark" ? "text-purple-200" : "text-purple-100"
                      }
                    >
                      محبوب‌ترین درس
                    </p>
                  </div>

                  <div
                    className={`rounded-xl p-6 shadow-lg ${
                      theme === "dark"
                        ? "bg-gradient-to-br from-orange-600/20 to-red-600/20"
                        : "bg-gradient-to-br from-orange-500 to-red-600"
                    } text-white`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <BarChart3 className="w-8 h-8 opacity-80" />
                      <span className="text-2xl font-bold">
                        {stats.avgDifficulty}
                      </span>
                    </div>
                    <p
                      className={
                        theme === "dark" ? "text-orange-200" : "text-orange-100"
                      }
                    >
                      میانگین سختی
                    </p>
                  </div>
                </div>

                <div
                  className={`rounded-xl p-6 ${
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600"
                      : "bg-white border-slate-200"
                  } border-2`}
                >
                  <h4
                    className={`font-bold mb-4 ${
                      theme === "dark" ? "text-white" : "text-slate-800"
                    }`}
                  >
                    فعالیت اخیر
                  </h4>
                  <div className="space-y-3">
                    {savedExams.slice(0, 5).map((exam) => (
                      <div
                        key={exam.id}
                        className={`flex items-center justify-between py-2 border-b last:border-0 ${
                          theme === "dark"
                            ? "border-slate-600"
                            : "border-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              theme === "dark"
                                ? "bg-blue-500/20"
                                : "bg-blue-100"
                            }`}
                          >
                            <FileText
                              className={`w-5 h-5 ${
                                theme === "dark"
                                  ? "text-blue-400"
                                  : "text-blue-600"
                              }`}
                            />
                          </div>
                          <div>
                            <p
                              className={`font-medium ${
                                theme === "dark"
                                  ? "text-white"
                                  : "text-slate-800"
                              }`}
                            >
                              {exam.title}
                            </p>
                            <p
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-slate-400"
                                  : "text-slate-500"
                              }`}
                            >
                              {exam.date.toLocaleDateString("fa-IR")}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-sm ${
                            theme === "dark"
                              ? "text-slate-300"
                              : "text-slate-600"
                          }`}
                        >
                          {exam.questions.length} سوال
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`rounded-xl p-6 ${
                      theme === "dark"
                        ? "bg-slate-700 border-slate-600"
                        : "bg-white border-slate-200"
                    } border-2`}
                  >
                    <h4
                      className={`font-bold mb-4 ${
                        theme === "dark" ? "text-white" : "text-slate-800"
                      }`}
                    >
                      توزیع سطح سختی
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>آسان</span>
                          <span>35%</span>
                        </div>
                        <div
                          className={`w-full rounded-full h-2 ${
                            theme === "dark" ? "bg-slate-600" : "bg-slate-200"
                          }`}
                        >
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: "35%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>متوسط</span>
                          <span>45%</span>
                        </div>
                        <div
                          className={`w-full rounded-full h-2 ${
                            theme === "dark" ? "bg-slate-600" : "bg-slate-200"
                          }`}
                        >
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: "45%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>سخت</span>
                          <span>20%</span>
                        </div>
                        <div
                          className={`w-full rounded-full h-2 ${
                            theme === "dark" ? "bg-slate-600" : "bg-slate-200"
                          }`}
                        >
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: "20%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`rounded-xl p-6 ${
                      theme === "dark"
                        ? "bg-slate-700 border-slate-600"
                        : "bg-white border-slate-200"
                    } border-2`}
                  >
                    <h4
                      className={`font-bold mb-4 ${
                        theme === "dark" ? "text-white" : "text-slate-800"
                      }`}
                    >
                      محبوب‌ترین موضوعات
                    </h4>
                    <div className="space-y-2">
                      {["معادلات", "هندسه", "جبر", "احتمال", "مثلثات"].map(
                        (topic, index) => (
                          <div
                            key={topic}
                            className="flex items-center justify-between"
                          >
                            <span
                              className={
                                theme === "dark"
                                  ? "text-slate-300"
                                  : "text-slate-700"
                              }
                            >
                              {topic}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                theme === "dark"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {15 - index * 2} سوال
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className={`border-t p-6 shadow-lg ${
              theme === "dark"
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="درخواست خود را بنویسید... (مثلاً: یک آزمون ۱۵ سوالی از فصل دوم ریاضی طراحی کن)"
                    className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      theme === "dark"
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "border-2 border-slate-300"
                    }`}
                    rows={3}
                    aria-label="درخواست طراحی آزمون"
                  />
                </div>
                <button
                  onClick={toggleRecording}
                  className={`p-4 rounded-xl transition-all shadow-md ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 animate-pulse"
                      : theme === "dark"
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-200 hover:bg-slate-300"
                  }`}
                  aria-label={isRecording ? "توقف ضبط" : "شروع ضبط"}
                >
                  <Mic
                    className={`w-6 h-6 ${
                      isRecording
                        ? "text-white"
                        : theme === "dark"
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className={`px-6 py-4 rounded-xl transition-all shadow-md hover:shadow-lg ${
                    !inputText.trim()
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-90"
                  } ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                  }`}
                  aria-label="ارسال پیام"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
              {isRecording && (
                <div
                  className={`mt-3 text-center text-sm font-medium animate-pulse ${
                    theme === "dark" ? "text-red-400" : "text-red-600"
                  }`}
                >
                  در حال ضبط صدا...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
