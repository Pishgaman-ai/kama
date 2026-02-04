import { useState } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { Send, Bot, Loader2 } from "lucide-react";
import { ActivityDetails } from "../types";

interface AISendTextProps {
  activity: ActivityDetails;
  onSendToAI: (prompt: string) => Promise<void>;
  sending: boolean;
  sendSuccess: boolean;
  error: string | null;
}

export default function AISendText({
  activity,
  onSendToAI,
  sending,
  sendSuccess,
  error,
}: AISendTextProps) {
  const [prompt, setPrompt] = useState("");
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !sending) {
      await onSendToAI(prompt);
      setPrompt("");
    }
  };

  // Check if files are uploaded
  const filesUploaded = activity.question_file_url || activity.answer_file_url;

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
        <Bot className="w-5 h-5" />
        ارسال به هوش مصنوعی
      </h2>

      {!filesUploaded ? (
        <div
          className={`p-4 rounded-lg text-center ${
            theme === "dark"
              ? "bg-amber-500/10 border border-amber-500/20"
              : "bg-amber-50 border border-amber-200"
          }`}
        >
          <p
            className={`text-sm ${
              theme === "dark" ? "text-amber-400" : "text-amber-600"
            }`}
          >
            لطفاً ابتدا فایل‌های سوالات یا پاسخ‌ها را بارگذاری کنید تا بتوانید
            متن خود را به هوش مصنوعی ارسال کنید.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {sendSuccess && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                theme === "dark"
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  theme === "dark" ? "bg-green-400" : "bg-green-600"
                }`}
              />
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-green-400" : "text-green-600"
                }`}
              >
                متن شما با موفقیت به هوش مصنوعی ارسال شد
              </p>
            </div>
          )}

          {error && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                theme === "dark"
                  ? "bg-red-500/10 border border-red-500/20"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  theme === "dark" ? "bg-red-400" : "bg-red-600"
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

          <div>
            <label
              htmlFor="aiPrompt"
              className={`block text-sm font-medium mb-2 ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              متن خود را برای هوش مصنوعی بنویسید:
            </label>
            <textarea
              id="aiPrompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={sending}
              rows={4}
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                theme === "dark"
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              }`}
              placeholder="مثلاً: لطفاً پاسخ‌های دانش‌آموز را با دقت بررسی کن و نکات مثبت و منفی را تحلیل کن..."
            />
          </div>

          <button
            type="submit"
            disabled={sending || !prompt.trim()}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              sending || !prompt.trim()
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } ${
              theme === "dark" && !sending && prompt.trim()
                ? "bg-blue-600 hover:bg-blue-700"
                : ""
            }`}
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال ارسال...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                ارسال به هوش مصنوعی
              </>
            )}
          </button>

          <div
            className={`text-xs ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            <p>
              فایل‌های سوالات:{" "}
              {activity.question_file_url ? (
                <span className="text-green-500">بارگذاری شده</span>
              ) : (
                <span className="text-red-500">بارگذاری نشده</span>
              )}
            </p>
            <p>
              فایل‌های پاسخ‌ها:{" "}
              {activity.answer_file_url ? (
                <span className="text-green-500">بارگذاری شده</span>
              ) : (
                <span className="text-red-500">بارگذاری نشده</span>
              )}
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
