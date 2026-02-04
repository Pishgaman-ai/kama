import { useTheme } from "@/app/components/ThemeContext";
import { Brain, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { AiQuestionResult, ActivityDetails } from "../types";

interface AIResultsProps {
  aiQuestionResults: AiQuestionResult[];
  activity: ActivityDetails;
}

export default function AIResults({
  aiQuestionResults,
  activity,
}: AIResultsProps) {
  const { theme } = useTheme();

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
        <Brain className="w-5 h-5" />
        نتایج تصحیح هوش مصنوعی
      </h2>

      {aiQuestionResults && aiQuestionResults.length > 0 ? (
        <div className="space-y-6">
          {aiQuestionResults.map((question) => (
            <div
              key={question.id}
              className={`p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-slate-800/30 border-slate-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3
                  className={`font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  سؤال {question.question_number}
                </h3>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    question.score ===
                    (typeof question.max_score === "string"
                      ? parseInt(question.max_score)
                      : question.max_score)
                      ? "bg-green-100 text-green-800"
                      : question.score >=
                        (typeof question.max_score === "string"
                          ? parseInt(question.max_score)
                          : question.max_score) *
                          0.7
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {question.score} از {question.max_score}
                </div>
              </div>

              <div className="mb-4">
                <p
                  className={`text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  متن سؤال:
                </p>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {question.question_text}
                </p>
              </div>

              <div className="mb-4">
                <p
                  className={`text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  پاسخ دانش‌آموز:
                </p>
                <p
                  className={`text-sm p-3 rounded ${
                    theme === "dark"
                      ? "bg-slate-700/50 text-white"
                      : "bg-white border border-gray-200 text-gray-900"
                  }`}
                >
                  {question.student_answer}
                </p>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4
                  className={`text-sm font-medium mb-3 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  تحلیل:
                </h4>

                {question.analysis.positives &&
                  question.analysis.positives.length > 0 && (
                    <div className="mb-3">
                      <p
                        className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                          theme === "dark" ? "text-green-400" : "text-green-700"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        نکات مثبت:
                      </p>
                      <ul
                        className={`text-sm space-y-1 ${
                          theme === "dark" ? "text-slate-300" : "text-gray-600"
                        }`}
                      >
                        {question.analysis.positives.map((positive, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="ml-2">•</span>
                            <span>{positive}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {question.analysis.negatives &&
                  question.analysis.negatives.length > 0 && (
                    <div className="mb-3">
                      <p
                        className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                          theme === "dark"
                            ? "text-yellow-400"
                            : "text-yellow-700"
                        }`}
                      >
                        <AlertCircle className="w-4 h-4" />
                        نکات منفی:
                      </p>
                      <ul
                        className={`text-sm space-y-1 ${
                          theme === "dark" ? "text-slate-300" : "text-gray-600"
                        }`}
                      >
                        {question.analysis.negatives.map((negative, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="ml-2">•</span>
                            <span>{negative}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {question.analysis.mistakes &&
                  question.analysis.mistakes.length > 0 && (
                    <div className="mb-3">
                      <p
                        className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                          theme === "dark" ? "text-red-400" : "text-red-700"
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        اشتباهات:
                      </p>
                      <ul
                        className={`text-sm space-y-1 ${
                          theme === "dark" ? "text-slate-300" : "text-gray-600"
                        }`}
                      >
                        {question.analysis.mistakes.map((mistake, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="ml-2">•</span>
                            <span>{mistake}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {question.analysis.corrected_version && (
                  <div>
                    <p
                      className={`text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-blue-400" : "text-blue-700"
                      }`}
                    >
                      نسخه‌ی اصلاح‌شده‌ی پاسخ:
                    </p>
                    <p
                      className={`text-sm p-3 rounded ${
                        theme === "dark"
                          ? "bg-blue-900/20 text-blue-300"
                          : "bg-blue-50 text-blue-900"
                      }`}
                    >
                      {question.analysis.corrected_version}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Overall Score Summary */}
          <div
            className={`p-4 rounded-lg border ${
              theme === "dark"
                ? "bg-slate-800/30 border-slate-700"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <h3
              className={`font-bold mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              خلاصه نمرات:
            </h3>
            <div className="flex items-center gap-4">
              <div>
                <span
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-300" : "text-gray-600"
                  }`}
                >
                  نمره کل:
                </span>
                <span
                  className={`font-bold mr-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {activity?.ai_score || 0} از{" "}
                  {aiQuestionResults.reduce(
                    (sum, q) =>
                      sum +
                      (typeof q.max_score === "string"
                        ? parseInt(q.max_score)
                        : q.max_score || 0),
                    0
                  )}
                </span>
              </div>
              <div>
                <span
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-300" : "text-gray-600"
                  }`}
                >
                  تعداد سؤالات:
                </span>
                <span
                  className={`font-bold mr-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {aiQuestionResults.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Brain
            className={`w-12 h-12 mx-auto mb-3 ${
              theme === "dark" ? "text-slate-600" : "text-gray-400"
            }`}
          />
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            هنوز نتایج تصحیح هوش مصنوعی موجود نیست
          </p>
        </div>
      )}
    </div>
  );
}
