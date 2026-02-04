"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import ActivityInfo from "./components/ActivityInfo";
import AIResults from "./components/AIResults";
import StudentInfo from "./components/StudentInfo";
import FileManagement from "./components/FileManagement";
import AISendText from "./components/AISendText";
import { ActivityDetails, AiQuestionResult, ActivityType } from "./types";

export default function AICorrectionPage({
  params,
}: {
  params: Promise<{ id: string; activityId: string }>;
}) {
  const [activity, setActivity] = useState<ActivityDetails | null>(null);
  const [aiQuestionResults, setAiQuestionResults] = useState<
    AiQuestionResult[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deleting, setDeleting] = useState<{ [key: string]: boolean }>({});
  const [sendingToAI, setSendingToAI] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();
  const [classId, setClassId] = useState<string>("");
  const [activityId, setActivityId] = useState<string>("");

  const activityTypes: ActivityType[] = [
    { id: "midterm_exam", name: "آزمون میان‌ترم" },
    { id: "monthly_exam", name: "آزمون ماهیانه" },
    { id: "weekly_exam", name: "آزمون هفتگی" },
    { id: "class_activity", name: "فعالیت کلاسی" },
    { id: "class_homework", name: "تکلیف کلاسی" },
    { id: "home_homework", name: "تکلیف منزل" },
  ];

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setClassId(resolvedParams.id);
      setActivityId(resolvedParams.activityId);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (classId && activityId) {
      fetchActivityDetails();
    }
  }, [classId, activityId]);

  const fetchActivityDetails = async () => {
    try {
      const response = await fetch(
        `/api/teacher/classes/${classId}/activities/${activityId}`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setActivity(result.data);
        } else {
          setError("خطا در بارگیری اطلاعات فعالیت");
        }
      } else {
        setError("فعالیت یافت نشد");
      }

      // Fetch AI question results
      const aiResultsResponse = await fetch(
        `/api/teacher/educational-activities/${activityId}/ai-results`
      );
      if (aiResultsResponse.ok) {
        const aiResults = await aiResultsResponse.json();
        setAiQuestionResults(aiResults.data || []);
      }
    } catch (err) {
      console.error("Error fetching activity details:", err);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    questionFile: File | null,
    answerFile: File | null
  ) => {
    if (!questionFile && !answerFile) {
      setError("لطفاً حداقل یک فایل انتخاب کنید");
      return;
    }

    setUploading(true);
    setUploadSuccess(false);
    setError(null);

    try {
      const formData = new FormData();
      if (questionFile) {
        formData.append("questionFile", questionFile);
      }
      if (answerFile) {
        formData.append("answerFile", answerFile);
      }

      const response = await fetch(
        `/api/teacher/educational-activities/${activityId}/upload-files`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Update the activity with the new file URLs
        if (activity) {
          setActivity({
            ...activity,
            question_file_url:
              result.activity.question_file_url || activity.question_file_url,
            answer_file_url:
              result.activity.answer_file_url || activity.answer_file_url,
            status: result.activity.status || activity.status,
          });
        }
        setUploadSuccess(true);
        // Reset success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        const errorResult = await response.json();
        setError(errorResult.error || "خطا در بارگذاری فایل‌ها");
      }
    } catch (err) {
      console.error("Error uploading files:", err);
      setError("خطا در ارتباط با سرور");
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileType: "question" | "answer") => {
    if (!activity) return;

    // Confirm deletion
    const confirmDelete = window.confirm(
      `آیا از حذف فایل ${
        fileType === "question" ? "سوالات" : "پاسخ‌ها"
      } اطمینان دارید؟`
    );

    if (!confirmDelete) return;

    setDeleting((prev) => ({ ...prev, [fileType]: true }));

    try {
      const response = await fetch(
        `/api/teacher/educational-activities/${activityId}/delete-files?fileType=${fileType}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Update the activity to remove the file URL
        if (activity) {
          setActivity({
            ...activity,
            question_file_url: result.activity.question_file_url,
            answer_file_url: result.activity.answer_file_url,
          });
        }
      } else {
        const errorResult = await response.json();
        setError(errorResult.error || "خطا در حذف فایل");
      }
    } catch (err) {
      console.error("Error deleting file:", err);
      setError("خطا در ارتباط با سرور");
    } finally {
      setDeleting((prev) => ({ ...prev, [fileType]: false }));
    }
  };

  const handleFileReplace = async (
    fileType: "question" | "answer",
    file: File
  ) => {
    if (!activity) return;

    setUploading(true);
    setError(null);

    try {
      // If there's an existing file, delete it first
      if (
        (fileType === "question" && activity.question_file_url) ||
        (fileType === "answer" && activity.answer_file_url)
      ) {
        await handleFileDelete(fileType);
      }

      // Upload the new file
      const formData = new FormData();
      if (fileType === "question") {
        formData.append("questionFile", file);
      } else {
        formData.append("answerFile", file);
      }

      const response = await fetch(
        `/api/teacher/educational-activities/${activityId}/upload-files`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Update the activity with the new file URL
        if (activity) {
          setActivity({
            ...activity,
            question_file_url:
              result.activity.question_file_url || activity.question_file_url,
            answer_file_url:
              result.activity.answer_file_url || activity.answer_file_url,
          });
        }
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        const errorResult = await response.json();
        setError(errorResult.error || "خطا در بارگذاری فایل");
      }
    } catch (err) {
      console.error("Error replacing file:", err);
      setError("خطا در ارتباط با سرور");
    } finally {
      setUploading(false);
    }
  };

  // Added function to send text to AI
  const handleSendToAI = async (prompt: string) => {
    if (!activity) return;

    setSendingToAI(true);
    setSendSuccess(false);
    setError(null);

    try {
      // Call the API endpoint to send text to AI
      const response = await fetch(
        `/api/teacher/educational-activities/${activityId}/send-to-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSendSuccess(true);

          // Reset success message after 3 seconds
          setTimeout(() => setSendSuccess(false), 3000);

          // Refresh the activity details to get updated AI results
          await fetchActivityDetails();
        } else {
          setError(result.error || "خطا در ارسال به هوش مصنوعی");
        }
      } else {
        const errorResult = await response.json();
        setError(errorResult.error || "خطا در ارتباط با سرور");
      }
    } catch (err) {
      setError("خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.");
    } finally {
      setSendingToAI(false);
    }
  };

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
            در حال بارگذاری...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-6" dir="rtl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            }`}
            aria-label="بازگشت"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            خطا در بارگیری فعالیت
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

  if (!activity) {
    return null;
  }

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            }`}
            aria-label="بازگشت"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1
              className={`text-xl sm:text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              تصحیح هوش مصنوعی
            </h1>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              مشاهده و تحلیل نتایج تصحیح هوش مصنوعی
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Information */}
        <div className="lg:col-span-2 space-y-6">
          <ActivityInfo activity={activity} activityTypes={activityTypes} />
          <AIResults
            aiQuestionResults={aiQuestionResults}
            activity={activity}
          />
        </div>

        {/* Student and Class Information */}
        <div className="space-y-6">
          <StudentInfo activity={activity} />
          <FileManagement
            activity={activity}
            onFileUpload={handleFileUpload}
            onFileDelete={handleFileDelete}
            onFileReplace={handleFileReplace}
            uploading={uploading}
            uploadSuccess={uploadSuccess}
            error={error}
            deleting={deleting}
          />
          <AISendText
            activity={activity}
            onSendToAI={handleSendToAI}
            sending={sendingToAI}
            sendSuccess={sendSuccess}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
