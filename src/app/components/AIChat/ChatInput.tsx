"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Square, Sparkles, Menu, ArrowRight } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { UserRole } from "./types";

// Define SpeechRecognition types
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

interface SpeechRecognition {
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

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isListening: boolean;
  onToggleVoice: () => void;
  isLoading: boolean;
  isGenerating: boolean;
  onStopGenerating: () => void;
  roleConfig: {
    title: string;
    sampleQuestions: string[];
  };
  hasMessages: boolean;
  onSampleQuestionClick: (question: string) => void;
  // New props for header
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onBack?: () => void;
}

export default function ChatInput({
  input,
  onInputChange,
  onSendMessage,
  onKeyPress,
  isListening,
  onToggleVoice,
  isLoading,
  isGenerating,
  onStopGenerating,
  roleConfig,
  hasMessages,
  onSampleQuestionClick,
  // New props
  sidebarOpen,
  setSidebarOpen,
  onBack,
}: ChatInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isListeningState, setIsListeningState] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [transitioned, setTransitioned] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (hasMessages && !transitioned) {
      setTransitioned(true);
    }
  }, [hasMessages]);

  useEffect(() => {
    if (recognitionRef.current) return; // ✅ فقط یکبار مقداردهی

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition: SpeechRecognitionConstructor })
        ?.SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition: SpeechRecognitionConstructor;
        }
      )?.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "fa-IR";

      recognition.onstart = () => setIsListeningState(true);

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) finalTranscript += result[0].transcript;
        }
        if (finalTranscript) onInputChange(input + finalTranscript + " ");
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setIsListeningState(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsListeningState(false);
      };
    }
  }, [onInputChange, input]);

  const toggleRecording = () => {
    if (!speechSupported) {
      alert("مرورگر شما از ضبط صدا پشتیبانی نمی‌کند");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }

    setIsRecording(!isRecording);
  };

  const renderRecordingStatus = () =>
    isRecording && (
      <div className="text-center mt-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full text-red-700 text-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          {isListeningState ? "در حال گوش دادن..." : "در حال ضبط..."}
        </div>
      </div>
    );

  const suggestions = roleConfig.sampleQuestions || [
    "کد بنویس",
    "مفاهیم را توضیح بده",
    "نوشتن خلاقانه",
    "حل مسئله",
  ];

  return !hasMessages && !transitioned ? (
    // 🟣 حالت شروع (مرکز صفحه)
    <div className="absolute inset-0 flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 z-10">
      {/* Header for initial state - only on mobile */}
      <div className="bg-white border-b border-slate-200 p-3 sm:p-4 flex items-center justify-between sm:hidden">
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-500 hover:text-slate-700"
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
            <div>
              <h1 className="text-slate-800 font-bold text-base">
                دستیار هوشمند
              </h1>
            </div>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center space-x-1 space-x-reverse text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg px-2 py-1 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-xs font-medium">بازگشت</span>
          </button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-3xl text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            className="text-4xl font-bold text-slate-800 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            دستیار هوشمند ایرانی
          </motion.h1>

          <motion.p
            className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            گفتگوی خود را شروع کنید و اجازه دهید هوش مصنوعی در هر سوال یا کاری
            به شما کمک کند.
          </motion.p>

          <motion.div
            className="relative transition-all"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {/* Input + Buttons */}
            <div className="relative transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder="پیام خود را بنویسید یا روی میکروفون کلیک کنید..."
                className="w-full p-6 pl-32 text-lg text-slate-800 bg-white/80 border rounded-3xl backdrop-blur-sm shadow-2xl placeholder-slate-500 border-slate-200/50 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500"
                dir="rtl"
                disabled={isLoading}
                autoFocus
              />

              {/* Mic */}
              {speechSupported && (
                <button
                  onClick={toggleRecording}
                  disabled={isLoading}
                  className={clsx(
                    "absolute left-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl transition-all flex items-center justify-center shadow-lg",
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-green-500 text-white hover:bg-green-600",
                    "hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                  )}
                  title={isRecording ? "توقف ضبط" : "شروع ضبط"}
                  aria-label={isRecording ? "توقف ضبط" : "شروع ضبط"}
                >
                  {isRecording ? (
                    <Square className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Send */}
              <button
                onClick={onSendMessage}
                disabled={isLoading || !input.trim()}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 disabled:opacity-50"
                title="ارسال پیام"
                aria-label="ارسال پیام"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {renderRecordingStatus()}
          </motion.div>

          {/* suggestions با انیمیشن */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            {suggestions.map((s, index) => (
              <button
                key={index}
                onClick={() => onSampleQuestionClick(s)}
                className="px-6 py-3 bg-white/60 backdrop-blur-sm hover:bg-white/80 border border-slate-200/50 rounded-2xl text-slate-700 hover:text-slate-900 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                title={`سوال نمونه: ${s}`}
              >
                {s}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  ) : (
    // ⚫ حالت پایین صفحه (بعد از اولین پیام)
    <div
      className={clsx(
        "p-6 bg-white border-t border-slate-200",
        transitioned && "animate-in slide-in-from-bottom-8"
      )}
    >
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="پیام خود را بنویسید یا روی میکروفون کلیک کنید..."
            className="w-full p-4 pl-28 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            dir="rtl"
            disabled={isLoading}
          />

          {/* Mic */}
          {speechSupported && (
            <button
              onClick={toggleRecording}
              disabled={isLoading}
              className={clsx(
                "absolute left-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl shadow-md flex items-center justify-center",
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-green-500 text-white hover:bg-green-600",
                "hover:scale-105 transition-all duration-200 disabled:opacity-50"
              )}
              title={isRecording ? "توقف ضبط" : "شروع ضبط"}
              aria-label={isRecording ? "توقف ضبط" : "شروع ضبط"}
            >
              {isRecording ? (
                <Square className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Send */}
          <button
            onClick={onSendMessage}
            disabled={isLoading || !input.trim()}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-md disabled:opacity-50"
            title="ارسال پیام"
            aria-label="ارسال پیام"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {renderRecordingStatus()}

        <p className="text-center text-slate-400 text-xs mt-2">
          Enter را برای ارسال فشار دهید • اطلاعات حساس را تأیید کنید
        </p>
      </div>
    </div>
  );
}
