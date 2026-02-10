"use client";

import { useState, useRef, useEffect } from "react";
import { User, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Message, UserRole, RoleConfig } from "./types";

// Hook برای افکت تایپ‌شونده
function useTypewriter(text: string, speed = 30) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!text) {
      setDisplayText("");
      setIsComplete(false);
      indexRef.current = 0;
      return;
    }

    // If we already displayed everything so far, wait for more text
    if (indexRef.current >= text.length) {
      return;
    }

    setIsComplete(false);

    // Clear any existing timer before starting a new one
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        indexRef.current++;
        setDisplayText(text.slice(0, indexRef.current));
      } else {
        setIsComplete(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }, speed);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [text, speed]);

  return { displayText, isComplete };
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isGenerating?: boolean;
  roleConfig: RoleConfig;
  onSampleQuestionClick: (question: string) => void;
}

const getRoleColor = (role: UserRole, isUser: boolean) => {
  if (!isUser) return "bg-white border border-slate-200 rounded-2xl";

  switch (role) {
    case "admin":
      return "bg-slate-700 text-white rounded-2xl";
    case "teacher":
      return "bg-slate-700 text-white rounded-2xl";
    case "student":
      return "bg-slate-700 text-white rounded-2xl";
    case "parent":
      return "bg-slate-700 text-white rounded-2xl";
    default:
      return "bg-slate-700 text-white rounded-2xl";
  }
};

// Separate component for individual messages to allow useTypewriter hook
function ChatMessageItem({
  message,
  index,
  isLatestAssistantMessage,
}: {
  message: Message;
  index: number;
  isLatestAssistantMessage: boolean;
}) {
  const isUser = message.role === "user";
  const Icon = isUser ? User : Bot;
  const content = message.content?.trim() || "";
  const isEn = isEnglish(content);

  // فقط برای آخرین پیام دستیار از typewriter استفاده کنید
  const shouldUseTypewriter = !isUser && isLatestAssistantMessage;
  const { displayText, isComplete } = useTypewriter(
    shouldUseTypewriter ? content : "",
    30
  );

  // برای پیام‌های کاربر و پیام‌های قدیمی، بلافاصله نمایش داده شود
  const finalContent = shouldUseTypewriter ? displayText : content;

  // Debug log for old messages
  if (!isUser && !shouldUseTypewriter && !content) {
    console.log("Empty assistant message (old):", message.id, content);
  }

  // Don't render empty user messages
  if (isUser && !content) return null;

  return (
    <div
      className={`flex items-start animate-in slide-in-from-bottom-2 duration-500 ${
        isUser ? "flex-row" : "flex-row-reverse"
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* آواتار */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
          isUser
            ? "bg-slate-700"
            : "bg-gradient-to-br from-indigo-500 to-purple-600"
        }`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>

      {/* پیام */}
      <div
        className={`max-w-[80%] sm:max-w-md md:max-w-lg lg:max-w-2xl mx-2 ${
          isUser ? "text-left" : "text-right"
        }`}
      >
        <div
          className={`px-5 py-3 rounded-3xl border transition-all duration-200 hover:shadow-md ${
            isUser
              ? "bg-slate-700 border-slate-500 text-white"
              : "bg-white border-slate-300 text-gray-900 shadow-sm dark:bg-slate-100 dark:text-gray-800"
          } dark:border-slate-300`}
        >
          {!isUser && !finalContent ? (
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
              <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
          ) : (
            <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              // Paragraph
              p: ({ node, ...props }) => (
                <p
                  className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base mb-3 last:mb-0"
                  dir={isEn ? "ltr" : "rtl"}
                  style={{ textAlign: isEn ? "left" : "right" }}
                  {...props}
                />
              ),

              // Headings
              h1: ({ node, ...props }) => (
                <h1
                  className="text-2xl sm:text-3xl font-bold mb-4 mt-6 text-indigo-700 border-b-2 border-indigo-200 pb-2"
                  dir={isEn ? "ltr" : "rtl"}
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  className="text-xl sm:text-2xl font-bold mb-3 mt-5 text-indigo-600"
                  dir={isEn ? "ltr" : "rtl"}
                  {...props}
                />
              ),
              h3: ({ node, ...props }) => (
                <h3
                  className="text-lg sm:text-xl font-semibold mb-2 mt-4 text-indigo-500"
                  dir={isEn ? "ltr" : "rtl"}
                  {...props}
                />
              ),
              h4: ({ node, ...props }) => (
                <h4
                  className="text-base sm:text-lg font-semibold mb-2 mt-3 text-slate-700"
                  dir={isEn ? "ltr" : "rtl"}
                  {...props}
                />
              ),

              // Lists
              ul: ({ node, ...props }) => (
                <ul
                  className="list-disc list-outside mr-6 ml-2 mb-3 space-y-1.5 text-sm sm:text-base"
                  dir={isEn ? "ltr" : "rtl"}
                  {...props}
                />
              ),
              ol: ({ node, ...props }) => (
                <ol
                  className="list-decimal list-outside mr-6 ml-2 mb-3 space-y-1.5 text-sm sm:text-base"
                  dir={isEn ? "ltr" : "rtl"}
                  {...props}
                />
              ),
              li: ({ node, ...props }) => (
                <li
                  className="leading-relaxed"
                  dir={isEn ? "ltr" : "rtl"}
                  {...props}
                />
              ),

              // Code blocks
              code: ({ node, className, children, ...props }) => {
                const isInline = !className;
                return isInline ? (
                  <code
                    className={`${isUser ? 'bg-slate-600' : 'bg-indigo-50'} px-1.5 py-0.5 rounded ${isUser ? 'text-yellow-200' : 'text-indigo-700'} font-mono text-sm border ${isUser ? 'border-slate-500' : 'border-indigo-200'}`}
                    dir="ltr"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <code
                    className={className}
                    dir="ltr"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              pre: ({ node, ...props }) => (
                <pre
                  className={`${isUser ? 'bg-slate-800' : 'bg-slate-50'} p-4 rounded-lg text-sm overflow-x-auto mb-3 border ${isUser ? 'border-slate-600' : 'border-slate-200'} shadow-sm`}
                  dir="ltr"
                  {...props}
                />
              ),

              // Emphasis
              strong: ({ node, ...props }) => (
                <strong className={`font-bold ${isUser ? 'text-yellow-200' : 'text-indigo-700'}`} {...props} />
              ),
              em: ({ node, ...props }) => (
                <em className={`italic ${isUser ? 'text-blue-200' : 'text-purple-600'}`} {...props} />
              ),

              // Blockquote
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className={`border-r-4 ${isUser ? 'border-yellow-400 bg-slate-600' : 'border-indigo-400 bg-indigo-50'} pr-4 pl-2 py-2 my-3 italic rounded`}
                  dir={isEn ? "ltr" : "rtl"}
                  {...props}
                />
              ),

              // Table
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-4">
                  <table
                    className={`min-w-full divide-y ${isUser ? 'divide-slate-600' : 'divide-slate-200'} border ${isUser ? 'border-slate-600' : 'border-slate-300'} rounded-lg`}
                    {...props}
                  />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead className={isUser ? 'bg-slate-700' : 'bg-indigo-50'} {...props} />
              ),
              tbody: ({ node, ...props }) => (
                <tbody className={`divide-y ${isUser ? 'divide-slate-600' : 'divide-slate-200'}`} {...props} />
              ),
              tr: ({ node, ...props }) => (
                <tr className={isUser ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} {...props} />
              ),
              th: ({ node, ...props }) => (
                <th
                  className={`px-4 py-2 text-right text-xs sm:text-sm font-semibold ${isUser ? 'text-yellow-200' : 'text-indigo-700'}`}
                  dir={isEn ? "ltr" : "rtl"}
                  {...props}
                />
              ),
              td: ({ node, ...props }) => (
                <td
                  className="px-4 py-2 text-xs sm:text-sm text-right"
                  dir={isEn ? "ltr" : "rtl"}
                  {...props}
                />
              ),

              // Horizontal rule
              hr: ({ node, ...props }) => (
                <hr className={`my-4 ${isUser ? 'border-slate-600' : 'border-slate-300'}`} {...props} />
              ),

              // Links
              a: ({ node, ...props }) => (
                <a
                  className={`${isUser ? 'text-blue-300 hover:text-blue-200' : 'text-indigo-600 hover:text-indigo-800'} underline font-medium`}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
            }}
          >
            {finalContent}
          </ReactMarkdown>
          )}

          {/* نشانگر تایپ در حال انجام */}
          {!isUser && finalContent && !isComplete && shouldUseTypewriter && (
            <span className="inline-block w-2 h-4 bg-indigo-500 ml-1 animate-pulse"></span>
          )}
        </div>

        {/* زمان */}
        <p
          className={`text-xs text-gray-400 mt-1 ${
            isUser ? "text-left" : "text-right"
          }`}
        >
          {new Date(message.timestamp || Date.now()).toLocaleTimeString(
            "fa-IR"
          )}
        </p>
      </div>
    </div>
  );
}

export default function ChatMessages({
  messages,
  isLoading,
  isGenerating,
  roleConfig,
  onSampleQuestionClick,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userRole, setUserRole] = useState<UserRole>("student");

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasMessages = messages.length > 0;

  // Find the index of the last assistant message (compatible way)
  let lastAssistantMessageIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      lastAssistantMessageIndex = i;
      break;
    }
  }

  // Use isGenerating to determine if we should animate, with fallback to time-based check
  const lastAssistantMessage = lastAssistantMessageIndex >= 0 ? messages[lastAssistantMessageIndex] : null;
  const isRecentMessage = isGenerating ?? (lastAssistantMessage
    ? (Date.now() - new Date(lastAssistantMessage.timestamp).getTime()) < 5000
    : false);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
      {messages.map((message, index) => (
        <ChatMessageItem
          key={message.id}
          message={message}
          index={index}
          isLatestAssistantMessage={
            message.role === "assistant" &&
            index === lastAssistantMessageIndex &&
            isRecentMessage
          }
        />
      ))}

      {isLoading && (
        <div className="flex items-start space-x-4 space-x-reverse animate-in slide-in-from-bottom-2 flex-row-reverse">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-slate-600">
                هوش مصنوعی در حال فکر کردن...
              </span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

function isEnglish(text: string) {
  return /^[\x00-\x7F]*$/.test(text.replace(/\s/g, ""));
}
