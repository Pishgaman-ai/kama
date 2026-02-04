"use client";
import { useState } from "react";

export default function DataManagement() {
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const clearAllData = async () => {
    if (!window.confirm("آیا مطمئن هستید که می‌خواهید تمام داده‌های جداول را پاک کنید؟\n\nاین عمل غیرقابل بازگشت است!")) {
      return;
    }

    if (!window.confirm("آخرین هشدار: این عمل تمام مدارس، کاربران، کلاس‌ها، آزمون‌ها و سایر داده‌ها را پاک خواهد کرد.\n\nآیا ادامه می‌دهید؟")) {
      return;
    }

    setIsClearing(true);
    setMessage("");
    
    try {
      const response = await fetch("/api/clear-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ ${result.message}\n\nجداول پاک شده: ${result.cleared_tables.length} جدول`);
        setMessageType("success");
      } else {
        setMessage(`❌ ${result.error}\n\nجزئیات: ${result.details || "خطای نامشخص"}`);
        setMessageType("error");
      }
    } catch (error) {
      setMessage(`❌ خطا در ارتباط با سرور: ${error instanceof Error ? error.message : "خطای نامشخص"}`);
      setMessageType("error");
    } finally {
      setIsClearing(false);
    }
  };

  const showTablesInfo = async () => {
    try {
      const response = await fetch("/api/clear-data", {
        method: "GET",
      });

      const result = await response.json();
      
      const tablesInfo = result.tables_to_be_cleared.join('\n• ');
      alert(`جداولی که پاک خواهند شد:

• ${tablesInfo}

${result.warning}

${result.note}`);
    } catch (error) {
      alert("خطا در دریافت اطلاعات جداول");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            مدیریت داده‌های پایگاه داده
          </h1>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  هشدار مهم
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    این ابزار تمام داده‌های موجود در جداول پروژه EduHelper را پاک می‌کند.
                    ساختار جداول دست نخورده باقی می‌ماند اما تمام اطلاعات از بین می‌رود.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={showTablesInfo}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                📋 مشاهده لیست جداول
              </button>
              
              <button
                onClick={clearAllData}
                disabled={isClearing}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                  isClearing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isClearing ? "در حال پاک کردن..." : "🗑️ پاک کردن تمام داده‌ها"}
              </button>
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${
                messageType === "success" 
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : messageType === "error"
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "bg-blue-50 border border-blue-200 text-blue-700"
              }`}>
                <pre className="whitespace-pre-wrap font-medium">{message}</pre>
              </div>
            )}
          </div>

          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              راهنمای استفاده
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>ابتدا با کلیک روی &ldquo;مشاهده لیست جداول&rdquo; لیست جداولی که پاک خواهند شد را ببینید</li>
              <li>مطمئن شوید که از داده‌های مهم پشتیبان تهیه کرده‌اید</li>
              <li>با کلیک روی &ldquo;پاک کردن تمام داده‌ها&rdquo; عملیات را آغاز کنید</li>
              <li>دو بار تأیید کنید تا عملیات انجام شود</li>
              <li>منتظر پیام موفقیت باشید</li>
            </ol>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              بازگشت به داشبورد
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}