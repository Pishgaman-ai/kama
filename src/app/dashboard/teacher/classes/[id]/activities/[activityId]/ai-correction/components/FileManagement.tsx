import { useState } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import {
  FileText,
  Upload,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { ActivityDetails } from "../types";

interface FileManagementProps {
  activity: ActivityDetails;
  onFileUpload: (
    questionFile: File | null,
    answerFile: File | null
  ) => Promise<void>;
  onFileDelete: (fileType: "question" | "answer") => Promise<void>;
  onFileReplace: (fileType: "question" | "answer", file: File) => Promise<void>;
  uploading: boolean;
  uploadSuccess: boolean;
  error: string | null;
  deleting: { [key: string]: boolean };
}

export default function FileManagement({
  activity,
  onFileUpload,
  onFileDelete,
  onFileReplace,
  uploading,
  uploadSuccess,
  error,
  deleting,
}: FileManagementProps) {
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const { theme } = useTheme();

  const handleUpload = async () => {
    await onFileUpload(questionFile, answerFile);
    setQuestionFile(null);
    setAnswerFile(null);
  };

  return (
    <div
      className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
        theme === "dark"
          ? "bg-slate-900/50 border-slate-800/50"
          : "bg-white border-gray-200"
      }`}
    >
      <h2
        className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}
      >
        <FileText className="w-5 h-5" />
        فایل‌ها
      </h2>

      {/* File Upload Section */}
      <div className="mb-6">
        <h3
          className={`text-md font-medium mb-3 flex items-center gap-2 ${
            theme === "dark" ? "text-slate-300" : "text-gray-700"
          }`}
        >
          <Upload className="w-4 h-4" />
          بارگذاری فایل‌های جدید
        </h3>

        {uploadSuccess && (
          <div
            className={`p-3 rounded-lg mb-4 flex items-center gap-2 ${
              theme === "dark"
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-green-50 border border-green-200"
            }`}
          >
            <CheckCircle2
              className={`w-5 h-5 ${
                theme === "dark" ? "text-green-400" : "text-green-600"
              }`}
            />
            <p
              className={`text-sm ${
                theme === "dark" ? "text-green-400" : "text-green-600"
              }`}
            >
              فایل‌ها با موفقیت بارگذاری شدند
            </p>
          </div>
        )}

        {error && (
          <div
            className={`p-3 rounded-lg mb-4 flex items-center gap-2 ${
              theme === "dark"
                ? "bg-red-500/10 border border-red-500/20"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <XCircle
              className={`w-5 h-5 ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            />
            <p
              className={`text-sm ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            >
              {error}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="questionFile"
              className={`block text-sm font-medium mb-2 ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              فایل سوالات
            </label>
            <div className="flex gap-2">
              <input
                id="questionFile"
                type="file"
                onChange={(e) => setQuestionFile(e.target.files?.[0] || null)}
                className={`flex-1 block w-full text-sm ${
                  theme === "dark"
                    ? "text-slate-400 file:bg-slate-800 file:text-white file:border-slate-700"
                    : "text-gray-500 file:bg-gray-50 file:text-gray-700 file:border-gray-200"
                } file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:text-sm file:font-semibold hover:file:bg-gray-100`}
              />
              {activity.question_file_url && (
                <button
                  onClick={() => onFileDelete("question")}
                  disabled={deleting.question}
                  className={`p-2 rounded-lg ${
                    deleting.question
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-red-100 text-red-600 hover:bg-red-200"
                  } ${
                    theme === "dark" && !deleting.question
                      ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                      : ""
                  }`}
                  title="حذف فایل"
                >
                  {deleting.question ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="answerFile"
              className={`block text-sm font-medium mb-2 ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              فایل پاسخ‌ها
            </label>
            <div className="flex gap-2">
              <input
                id="answerFile"
                type="file"
                onChange={(e) => setAnswerFile(e.target.files?.[0] || null)}
                className={`flex-1 block w-full text-sm ${
                  theme === "dark"
                    ? "text-slate-400 file:bg-slate-800 file:text-white file:border-slate-700"
                    : "text-gray-500 file:bg-gray-50 file:text-gray-700 file:border-gray-200"
                } file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:text-sm file:font-semibold hover:file:bg-gray-100`}
              />
              {activity.answer_file_url && (
                <button
                  onClick={() => onFileDelete("answer")}
                  disabled={deleting.answer}
                  className={`p-2 rounded-lg ${
                    deleting.answer
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-red-100 text-red-600 hover:bg-red-200"
                  } ${
                    theme === "dark" && !deleting.answer
                      ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                      : ""
                  }`}
                  title="حذف فایل"
                >
                  {deleting.answer ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || (!questionFile && !answerFile)}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              uploading || (!questionFile && !answerFile)
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } ${
              theme === "dark" && !uploading && (questionFile || answerFile)
                ? "bg-blue-600 hover:bg-blue-700"
                : ""
            }`}
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                در حال بارگذاری...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                بارگذاری فایل‌ها
              </>
            )}
          </button>
        </div>
      </div>

      {/* Existing Files Section */}
      <div className="border-t pt-6 mt-6">
        <h3
          className={`text-md font-medium mb-3 flex items-center gap-2 ${
            theme === "dark" ? "text-slate-300" : "text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          فایل‌های موجود
        </h3>

        <div className="space-y-4">
          {activity.question_file_url ? (
            <div
              className={`p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-slate-800/30 border-slate-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4
                    className={`font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    فایل سوالات
                  </h4>
                  <p
                    className={`text-xs mt-1 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    برای جایگزینی، فایل جدیدی انتخاب کنید
                  </p>
                </div>
                <button
                  onClick={() => onFileDelete("question")}
                  disabled={deleting.question}
                  className={`p-2 rounded-lg ${
                    deleting.question
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-red-100 text-red-600 hover:bg-red-200"
                  } ${
                    theme === "dark" && !deleting.question
                      ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                      : ""
                  }`}
                  title="حذف فایل"
                >
                  {deleting.question ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={activity.question_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 px-3 py-2 rounded-lg text-sm text-center ${
                    theme === "dark"
                      ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
                      : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  }`}
                >
                  <Download className="w-4 h-4 inline ml-1" />
                  دانلود فایل
                </a>
                <label
                  className={`flex-1 px-3 py-2 rounded-lg text-sm text-center cursor-pointer ${
                    theme === "dark"
                      ? "bg-violet-900/30 text-violet-400 hover:bg-violet-900/50"
                      : "bg-violet-100 text-violet-600 hover:bg-violet-200"
                  }`}
                >
                  <RefreshCw className="w-4 h-4 inline ml-1" />
                  جایگزینی
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onFileReplace("question", file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div
              className={`p-4 rounded-lg border border-dashed text-center ${
                theme === "dark"
                  ? "bg-slate-800/30 border-slate-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <FileText
                className={`w-8 h-8 mx-auto mb-2 ${
                  theme === "dark" ? "text-slate-600" : "text-gray-400"
                }`}
              />
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                فایل سوالات موجود نیست
              </p>
            </div>
          )}

          {activity.answer_file_url ? (
            <div
              className={`p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-slate-800/30 border-slate-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4
                    className={`font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    فایل پاسخ‌ها
                  </h4>
                  <p
                    className={`text-xs mt-1 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    برای جایگزینی، فایل جدیدی انتخاب کنید
                  </p>
                </div>
                <button
                  onClick={() => onFileDelete("answer")}
                  disabled={deleting.answer}
                  className={`p-2 rounded-lg ${
                    deleting.answer
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-red-100 text-red-600 hover:bg-red-200"
                  } ${
                    theme === "dark" && !deleting.answer
                      ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                      : ""
                  }`}
                  title="حذف فایل"
                >
                  {deleting.answer ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={activity.answer_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 px-3 py-2 rounded-lg text-sm text-center ${
                    theme === "dark"
                      ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
                      : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  }`}
                >
                  <Download className="w-4 h-4 inline ml-1" />
                  دانلود فایل
                </a>
                <label
                  className={`flex-1 px-3 py-2 rounded-lg text-sm text-center cursor-pointer ${
                    theme === "dark"
                      ? "bg-violet-900/30 text-violet-400 hover:bg-violet-900/50"
                      : "bg-violet-100 text-violet-600 hover:bg-violet-200"
                  }`}
                >
                  <RefreshCw className="w-4 h-4 inline ml-1" />
                  جایگزینی
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onFileReplace("answer", file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div
              className={`p-4 rounded-lg border border-dashed text-center ${
                theme === "dark"
                  ? "bg-slate-800/30 border-slate-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <FileText
                className={`w-8 h-8 mx-auto mb-2 ${
                  theme === "dark" ? "text-slate-600" : "text-gray-400"
                }`}
              />
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                فایل پاسخ‌ها موجود نیست
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
