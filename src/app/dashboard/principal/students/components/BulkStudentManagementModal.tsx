"use client";

import { useTheme } from "@/app/components/ThemeContext";
import {
  X,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { useState, useRef } from "react";

interface BulkStudentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function BulkStudentManagementModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: BulkStudentManagementModalProps) {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // For progress bar
  const [totalRecords, setTotalRecords] = useState(0); // Total records to process
  const [processedRecords, setProcessedRecords] = useState(0); // Records processed so far
  const [uploadMessage, setUploadMessage] = useState<{
    type: "success" | "error" | "partial";
    text: string;
    details?: string;
    successMessages?: string;
    errorDetails?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    // Create a sample Excel template with asterisks for required fields
    const templateData = [
      [
        "نام دانش‌آموز *",
        "کد ملی *",
        "ایمیل",
        "پایه تحصیلی *",
        "نام والد 1 *",
        "شماره همراه والد 1 *",
        "ایمیل والد 1",
        "رابطه والد 1",
        "نام والد 2",
        "شماره همراه والد 2",
        "ایمیل والد 2",
        "رابطه والد 2",
      ],
      [
        "مثال: محمد محمدی",
        "1234567890",
        "mohammad@example.com",
        "دهم",
        "علی محمدی",
        "09123456789",
        "ali@example.com",
        "پدر",
        "فاطمه محمدی",
        "09129876543",
        "fateme@example.com",
        "مادر",
      ],
    ];

    // Convert to CSV format
    const csvContent = templateData.map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "قالب_دانش‌آموزان.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (
      !allowedTypes.includes(file.type) &&
      !["csv", "xlsx", "xls"].includes(fileExtension || "")
    ) {
      setUploadMessage({
        type: "error",
        text: "فایل انتخاب شده معتبر نیست. لطفاً فایل CSV یا Excel انتخاب کنید.",
      });
      return;
    }

    // Reset previous messages and progress
    setUploadMessage(null);
    setUploadProgress(0);
    setProcessedRecords(0);
    setTotalRecords(0);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/principal/students/bulk-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let result = "";
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          result += chunk;

          // Process each line (SSE format)
          const lines = result.split("\n\n");
          result = lines.pop() || ""; // Keep incomplete line for next iteration

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "progress") {
                  setUploadProgress(data.progress);
                  setProcessedRecords(data.processed);
                  setTotalRecords(data.total);
                } else if (data.type === "result") {
                  const result = data.data;

                  if (result.success) {
                    // Handle partial success (some records processed, some with errors)
                    if (result.hasErrors) {
                      setUploadMessage({
                        type: "partial",
                        text: result.message,
                        successMessages: result.successMessages,
                        errorDetails: result.errorDetails,
                      });
                    } else {
                      // Full success
                      setUploadMessage({
                        type: "success",
                        text: result.message,
                        successMessages: result.successMessages,
                      });
                    }

                    // Refresh the student list but keep modal open
                    onUploadSuccess();
                  } else {
                    setUploadMessage({
                      type: "error",
                      text: result.error || "خطا در پردازش فایل",
                      details: result.details,
                    });
                  }
                }
              } catch (parseError) {
                console.error("Error parsing SSE data:", parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage({
        type: "error",
        text: "خطا در ارتباط با سرور",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 m-4">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              افزودن/به‌روزرسانی دسته‌جمعی دانش‌آموزان
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="بستن"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-200">
                  راهنمای استفاده
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  برای افزودن یا به‌روزرسانی دسته‌جمعی دانش‌آموزان، ابتدا قالب
                  اکسل را دانلود کنید. سپس اطلاعات دانش‌آموزان و والدین را در آن
                  وارد کنید. دانش‌آموزان جدید ایجاد می‌شوند و دانش‌آموزان موجود
                  به‌روزرسانی می‌شوند.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                1. دانلود قالب اکسل
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                قالب آماده اکسل را دانلود کنید و اطلاعات دانش‌آموزان را در آن
                وارد کنید.
              </p>
              <button
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                <Download className="w-4 h-4" />
                دانلود قالب اکسل
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                2. آپلود فایل اکسل
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                فایل اکسل پر شده را آپلود کنید تا سیستم دانش‌آموزان را ایجاد یا
                به‌روزرسانی کند.
              </p>
              <button
                onClick={triggerFileInput}
                disabled={isUploading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 ${
                  isUploading
                    ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg"
                } text-white rounded-lg transition-all font-medium`}
              >
                <Upload className="w-4 h-4" />
                {isUploading ? "در حال پردازش..." : "انتخاب و آپلود فایل"}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.xlsx,.xls"
                className="hidden"
                aria-label="انتخاب فایل اکسل"
              />
            </div>
          </div>

          {/* Progress bar section */}
          {isUploading && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                در حال پردازش فایل
              </h3>
              <div className="space-y-4">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>پیشرفت: {uploadProgress}%</span>
                  <span>
                    {processedRecords} از {totalRecords} رکورد پردازش شده
                  </span>
                </div>
              </div>
            </div>
          )}

          {uploadMessage && (
            <div
              className={`rounded-lg p-4 ${
                uploadMessage.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : uploadMessage.type === "partial"
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {uploadMessage.type === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                ) : uploadMessage.type === "partial" ? (
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="w-full">
                  <p
                    className={`text-sm ${
                      uploadMessage.type === "success"
                        ? "text-green-700 dark:text-green-300"
                        : uploadMessage.type === "partial"
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    {uploadMessage.text}
                  </p>

                  {/* Success messages */}
                  {uploadMessage.successMessages && (
                    <div className="mt-3 text-xs bg-green-100 dark:bg-green-900/30 p-3 rounded text-green-800 dark:text-green-200">
                      <p className="font-medium mb-1">رکوردهای پردازش شده:</p>
                      <pre className="font-mono whitespace-pre-wrap break-words overflow-x-auto">
                        {uploadMessage.successMessages}
                      </pre>
                    </div>
                  )}

                  {/* Error details */}
                  {uploadMessage.errorDetails && (
                    <div className="mt-3 text-xs bg-red-100 dark:bg-red-900/30 p-3 rounded text-red-800 dark:text-red-200">
                      <p className="font-medium mb-1">رکوردهای دارای خطا:</p>
                      <pre className="font-mono whitespace-pre-wrap break-words overflow-x-auto">
                        {uploadMessage.errorDetails}
                      </pre>
                    </div>
                  )}

                  {/* General error details */}
                  {uploadMessage.details && (
                    <div className="mt-3 text-xs bg-red-100 dark:bg-red-900/30 p-3 rounded text-red-800 dark:text-red-200">
                      <p className="font-medium mb-1">جزئیات خطا:</p>
                      <pre className="font-mono whitespace-pre-wrap break-words overflow-x-auto">
                        {uploadMessage.details}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                  نکات مهم
                </h3>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 list-disc pr-5 space-y-1">
                  <li>
                    فیلدهای دارای ستاره (*) اجباری هستند و باید برای هر
                    دانش‌آموز پر شوند
                  </li>
                  <li>
                    دانش‌آموزانی که قبلاً وجود دارند بر اساس کد ملی به‌روزرسانی
                    می‌شوند
                  </li>
                  <li>
                    والدینی که قبلاً وجود دارند بر اساس شماره همراه به‌روزرسانی
                    می‌شوند
                  </li>
                  <li>
                    در صورت خالی بودن فیلد &#34;رابطه والد&#34;، مقدار پیش‌فرض
                    استفاده می‌شود
                  </li>
                  <li>فایل باید در قالب CSV یا Excel باشد</li>
                  <li>
                    رکوردهای صحیح پردازش می‌شوند و رکوردهای نامعتبر گزارش داده
                    می‌شوند
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
