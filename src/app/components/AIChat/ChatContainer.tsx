"use client";

import { useState, useEffect } from "react";
import { Menu, ArrowRight } from "lucide-react";
import { useChat } from "./hooks/useChat";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import ChatSidebar from "./ChatSidebar";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { AIChatComponentProps, RoleConfig, UserRole, User } from "./types";

interface ChatContainerProps {
  user: User;
  onBack?: () => void;
  apiPath?: string;
}

const roleConfigs: Record<UserRole, RoleConfig> = {
  admin: {
    title: "مدیر",
    description: "دستیار آموزشی شخصی شما برای مدیریت مدرسه",
    color: "bg-blue-600",
    greeting: "سلام! به دستیار آموزشی مخصوص مدیران خوش آمدید.",
    sampleQuestions: [
      "چگونه می‌توانم عملکرد معلمان را ارزیابی کنم؟",
      "روش‌های بهبود نتایج آموزشی مدرسه چیست؟",
      "چگونه بودجه مدرسه را به‌طور مؤثر مدیریت کنم؟",
      "استراتژی‌های جذب معلمان باکیفیت چیست؟",
    ],
  },
  teacher: {
    title: "معلم",
    description: "دستیار آموزشی شخصی شما برای تدریس مؤثر",
    color: "bg-purple-500",
    greeting: "سلام! به دستیار آموزشی مخصوص معلمان خوش آمدید.",
    sampleQuestions: [
      "چگونه می‌توانم انگیزه دانش‌آموزان را افزایش دهم؟",
      "روش‌های ارزیابی عملکرد دانش‌آموزان چیست؟",
      "چگونه می‌توانم با دانش‌آموزان مشکل‌دار بهتر ارتباط برقرار کنم؟",
      "استراتژی‌های مدیریت کلاس چیست؟",
    ],
  },
  student: {
    title: "دانش‌آموز",
    description: "دستیار یادگیری شخصی شما",
    color: "bg-green-500",
    greeting: "سلام! به دستیار یادگیری مخصوص دانش‌آموزان خوش آمدید.",
    sampleQuestions: [
      "چگونه می‌توانم بهتر مطالعه کنم؟",
      "روش‌های حل مسئله در ریاضی چیست؟",
      "چگونه می‌توانم زمان خود را بهتر مدیریت کنم؟",
      "استراتژی‌های یادگیری زبان انگلیسی چیست؟",
    ],
  },
  parent: {
    title: "والد",
    description: "دستیار آموزشی شخصی شما برای پشتیبانی از فرزند",
    color: "bg-orange-500",
    greeting: "سلام! به دستیار آموزشی مخصوص والدین خوش آمدید.",
    sampleQuestions: [
      "چگونه می‌توانم در یادگیری فرزندم مؤثرتر کمک کنم؟",
      "روش‌های تشخیص مشکلات یادگیری فرزند چیست؟",
      "چگونه می‌توانم با معلم فرزندم بهتر ارتباط برقرار کنم؟",
      "استراتژی‌های ایجاد انگیزه در فرزند چیست؟",
    ],
  },
};

export default function ChatContainer({
  user,
  onBack,
  apiPath,
}: ChatContainerProps) {
  const {
    chats,
    currentChat,
    messages,
    currentChatId,
    isLoading,
    isGenerating,
    createNewChat,
    switchToChat,
    deleteChat,
    sendMessage,
    stopGeneration,
  } = useChat(user, apiPath);

  const { isListening, transcript, toggleListening } = useSpeechRecognition();

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const roleConfig = roleConfigs[user.role as UserRole] || roleConfigs.student;

  // Set sidebar open by default on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle speech recognition transcript
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSendMessage = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSampleQuestionClick = (question: string) => {
    setInput(question);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full bg-slate-50 rounded-xl overflow-hidden shadow-lg" dir="rtl">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        user={user}
        onCreateNewChat={createNewChat}
        onSwitchToChat={switchToChat}
        onDeleteChat={deleteChat}
        roleConfig={roleConfig}
        onBack={onBack}
        sidebarOpen={sidebarOpen}
        sidebarWidth={sidebarWidth}
        setSidebarOpen={setSidebarOpen}
        onSidebarWidthChange={setSidebarWidth}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header - Only show when there are messages */}
        {hasMessages && (
          <div className="bg-white border-b border-slate-200 p-3 sm:p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-500 hover:text-slate-700"
                title="باز کردن منو"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  {/* Bot icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-white"
                  >
                    <path d="M12 8V4H8" />
                    <rect width="16" height="12" x="4" y="8" rx="2" />
                    <path d="M2 14h2" />
                    <path d="M20 14h2" />
                    <path d="M15 13v2" />
                    <path d="M9 13v2" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-slate-800 font-bold text-lg">
                    دستیار هوشمند ایرانی
                  </h1>
                  <p className="text-slate-500 text-xs sm:text-sm flex items-center space-x-1 space-x-reverse">
                    <span>🇮🇷</span>
                    <span>پیشگامان هوش مصنوعی</span>
                  </p>
                </div>
                {/* Simplified version for mobile */}
                <div className="sm:hidden">
                  <h1 className="text-slate-800 font-bold text-base">
                    دستیار هوشمند
                  </h1>
                </div>
              </div>
            </div>

            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center space-x-1 sm:space-x-2 space-x-reverse text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg px-2 py-1 sm:px-3 sm:py-2 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium hidden md:inline">
                  بازگشت به داشبورد
                </span>
                <span className="text-xs sm:text-sm font-medium md:hidden">
                  بازگشت
                </span>
              </button>
            )}

            <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse hidden sm:flex">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-slate-500 text-xs sm:text-sm">آنلاین</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          isGenerating={isGenerating}
          roleConfig={roleConfig}
          onSampleQuestionClick={handleSampleQuestionClick}
        />

        {/* Chat Input */}
        <ChatInput
          key={currentChatId || "new"}
          input={input}
          onInputChange={setInput}
          onSendMessage={handleSendMessage}
          onKeyPress={handleKeyPress}
          isListening={isListening}
          onToggleVoice={toggleListening}
          isLoading={isLoading}
          isGenerating={isGenerating}
          onStopGenerating={stopGeneration}
          roleConfig={roleConfig}
          hasMessages={hasMessages}
          onSampleQuestionClick={handleSampleQuestionClick}
          // New props for header in initial state
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onBack={onBack}
        />
      </div>
    </div>
  );
}
