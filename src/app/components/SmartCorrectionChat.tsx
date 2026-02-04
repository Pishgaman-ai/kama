"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Square, Sparkles, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { useTheme } from "@/app/components/ThemeContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SmartCorrectionChatProps {
  onAnalysisComplete?: (analysis: string) => void;
}

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

interface SpeechRecognition extends EventTarget {
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

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export default function SmartCorrectionChat({
  onAnalysisComplete,
}: SmartCorrectionChatProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [displayedResult, setDisplayedResult] = useState<string>("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    ) {
      setSpeechSupported(true);
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();

        if (recognitionRef.current) {
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = "fa-IR";

          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
          };

          recognitionRef.current.onerror = () => {
            setIsListening(false);
          };

          recognitionRef.current.onend = () => {
            setIsListening(false);
          };
        }
      }
    }
  }, []);

  // Word-by-word typing effect
  useEffect(() => {
    if (!result) {
      setDisplayedResult("");
      return;
    }

    // Show error messages immediately
    if (isError) {
      setDisplayedResult(result);
      return;
    }

    // During active streaming, show chunks immediately to avoid lag
    if (isStreaming) {
      setDisplayedResult(result);
      return;
    }

    // After streaming is complete, animate word-by-word
    const words = result.split(' ');
    let currentWordIndex = 0;
    setDisplayedResult("");

    const wordInterval = setInterval(() => {
      if (currentWordIndex < words.length) {
        setDisplayedResult(words.slice(0, currentWordIndex + 1).join(' '));
        currentWordIndex++;
      } else {
        clearInterval(wordInterval);
      }
    }, 50); // 50ms per word

    return () => clearInterval(wordInterval);
  }, [result, isError, isStreaming]);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
      }
    }
  };

  // Image compression function
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Set max dimensions
          const maxWidth = 1024;
          const maxHeight = 1024;
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          // Create canvas and compress
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              // Create new file from blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.8 // 80% quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Check file size (max 10MB before compression)
        if (file.size > 10 * 1024 * 1024) {
          alert('حجم فایل نباید بیشتر از 10 مگابایت باشد');
          return;
        }

        // Compress image
        const compressedFile = await compressImage(file);
        console.log(`Image compressed: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`);

        setSelectedImage(compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error processing image:', error);
        alert('خطا در پردازش تصویر. لطفاً دوباره تلاش کنید.');
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage && !input.trim()) {
      setIsError(true);
      setResult("لطفاً یک تصویر بارگذاری کنید یا متن وارد کنید");
      return;
    }

    if (!selectedImage) {
      setIsError(true);
      setResult("لطفاً تصویر ورق دانش‌آموز را بارگذاری کنید");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setResult(null);
    setIsError(false);
    setIsStreaming(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      if (input.trim()) {
        formData.append("text", input.trim());
      }

      const response = await fetch("/api/teacher/ai-image-correction", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        setIsError(true);
        setIsStreaming(false);
        setResult(`خطا: ${error.error || "خطا در پردازش"}`);
        return;
      }

      // Handle streaming response with real-time display
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) {
        setIsError(true);
        setIsStreaming(false);
        setResult("خطا در دریافت پاسخ");
        return;
      }

      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulatedText += data.content;
                // Update result in real-time for streaming display
                setResult(accumulatedText);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Streaming finished, trigger word-by-word animation
      setIsStreaming(false);

      if (onAnalysisComplete && accumulatedText) {
        onAnalysisComplete(accumulatedText);
      }

    } catch (error) {
      console.error("Error:", error);
      setIsError(true);
      setIsStreaming(false);
      setResult("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={`rounded-2xl p-6 ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-800/50"
          : "bg-gradient-to-br from-white via-blue-50/30 to-white"
      } shadow-lg border ${
        theme === "dark" ? "border-slate-700" : "border-blue-100"
      }`}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`p-2 rounded-xl ${
            theme === "dark"
              ? "bg-purple-500/20 text-purple-400"
              : "bg-purple-100 text-purple-600"
          }`}
        >
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3
            className={`text-lg font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            تصحیح هوشمند با هوش مصنوعی
          </h3>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            تصویر ورق را بارگذاری کنید یا توضیحات بدهید...
          </p>
        </div>
      </div>

      {/* Image Upload Area */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
          id="image-upload"
        />

        {!imagePreview ? (
          <label
            htmlFor="image-upload"
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              theme === "dark"
                ? "border-slate-600 hover:border-purple-500 bg-slate-700/30 hover:bg-slate-700/50"
                : "border-gray-300 hover:border-purple-500 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <Upload className={`w-12 h-12 mb-2 ${
              theme === "dark" ? "text-slate-400" : "text-gray-400"
            }`} />
            <p className={`text-sm font-medium ${
              theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}>
              کلیک کنید یا تصویر را بکشید و رها کنید
            </p>
            <p className={`text-xs mt-1 ${
              theme === "dark" ? "text-slate-500" : "text-gray-500"
            }`}>
              JPG, PNG, GIF (حداکثر 10MB)
            </p>
          </label>
        ) : (
          <div className={`relative rounded-xl overflow-hidden border-2 ${
            theme === "dark" ? "border-slate-600" : "border-gray-300"
          }`}>
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-64 object-contain bg-slate-900/10"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 left-2 p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="حذف تصویر"
            >
              <X className="w-4 h-4" />
            </button>
            <div className={`absolute bottom-0 left-0 right-0 p-2 ${
              theme === "dark" ? "bg-slate-900/80" : "bg-white/80"
            } backdrop-blur-sm flex items-center gap-2`}>
              <ImageIcon className="w-4 h-4" />
              <span className="text-sm font-medium truncate">{selectedImage?.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="توضیحات اضافی (اختیاری): مثلاً سوالات آزمون، معیارهای نمره‌دهی..."
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-xl border ${
              theme === "dark"
                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
            } focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50`}
          />
          {speechSupported && (
            <button
              onClick={toggleVoice}
              disabled={isLoading}
              className={`p-3 rounded-xl transition-all ${
                isListening
                  ? theme === "dark"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-red-100 text-red-600"
                  : theme === "dark"
                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } disabled:opacity-50`}
            >
              {isListening ? (
                <Square className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedImage}
            className={`px-6 py-3 rounded-xl transition-all ${
              theme === "dark"
                ? "bg-purple-500 text-white hover:bg-purple-600"
                : "bg-purple-600 text-white hover:bg-purple-700"
            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>در حال تحلیل...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>تحلیل</span>
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {displayedResult && (
          <div
            className={`p-6 rounded-xl transition-all ${
              isError
                ? theme === "dark"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-red-50 text-red-600 border border-red-200"
                : theme === "dark"
                ? "bg-slate-700/50 border border-slate-600"
                : "bg-white border border-gray-200 shadow-sm"
            }`}
          >
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-inherit prose-p:text-inherit prose-strong:text-inherit prose-ul:text-inherit prose-ol:text-inherit">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayedResult}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
