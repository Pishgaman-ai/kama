"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import {
  User,
  Mail,
  Phone,
  IdCard,
  MessageCircle,
  Save,
  AlertCircle,
  Edit,
  Lock,
} from "lucide-react";
import { getProfileImageUrl } from "@/lib/utils";

interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  national_id?: string;
  role: string;
  profile_picture_url?: string;
  profile?: {
    language_model?: "cloud" | "local";
    telegram_chat_id?: string;
    bale_chat_id?: string;
  };
  created_at: Date;
}

export default function TeacherSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    national_id: "",
    telegram_chat_id: "",
    bale_chat_id: "",
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const [existingProfilePicture, setExistingProfilePicture] = useState<
    string | null
  >(null);
  const [profilePictureTimestamp, setProfilePictureTimestamp] =
    useState<number>(Date.now());

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [languageModel, setLanguageModel] = useState<"cloud" | "local">("cloud");
  const [languageModelError, setLanguageModelError] = useState<string | null>(
    null
  );
  const [languageModelSuccess, setLanguageModelSuccess] = useState<
    string | null
  >(null);

  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          router.push("/signin");
          return;
        }

        const data = await response.json();
        setUser(data.user);
        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          national_id: data.user.national_id || "",
          telegram_chat_id: data.user.profile?.telegram_chat_id || "",
          bale_chat_id: data.user.profile?.bale_chat_id || "",
        });
        setLanguageModel(
          data.user.profile?.language_model === "local" ? "local" : "cloud"
        );

        // Set existing profile picture if available
        if (data.user.profile_picture_url) {
          setExistingProfilePicture(data.user.profile_picture_url);
          // Update timestamp to ensure fresh image load
          setProfilePictureTimestamp(Date.now());
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle profile picture change
  const handleProfilePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Create form data to handle file upload
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("national_id", formData.national_id);
      formDataToSend.append("telegram_chat_id", formData.telegram_chat_id);
      formDataToSend.append("bale_chat_id", formData.bale_chat_id);

      if (profilePicture) {
        formDataToSend.append("profile_picture", profilePicture);
      }

      const response = await fetch("/api/teacher/settings/profile", {
        method: "PUT",
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess("اطلاعات با موفقیت به‌روزرسانی شد");
        // Update user state with new data
        setUser({
          ...user!,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          national_id: formData.national_id,
          profile_picture_url: result.user.profile_picture_url,
          profile: {
            ...user?.profile,
            telegram_chat_id: formData.telegram_chat_id,
            bale_chat_id: formData.bale_chat_id,
          },
        });

        // Update existing profile picture if a new picture was uploaded
        if (result.user.profile_picture_url) {
          setExistingProfilePicture(result.user.profile_picture_url);
          // Update timestamp to force image refresh
          setProfilePictureTimestamp(Date.now());
        }

        // Reset profile picture states
        setProfilePicture(null);
        setProfilePicturePreview(null);
      } else {
        setError(result.error || "خطا در به‌روزرسانی اطلاعات");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("خطا در ارتباط با سرور");
    }
  };

  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLanguageModelChange = async (nextValue: "cloud" | "local") => {
    setLanguageModel(nextValue);
    setLanguageModelError(null);
    setLanguageModelSuccess(null);

    try {
      const response = await fetch("/api/teacher/settings/language-model", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ languageModel: nextValue }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setLanguageModelSuccess("مدل زبانی با موفقیت به‌روزرسانی شد.");
      } else {
        setLanguageModelError(
          result.error || "خطا در به‌روزرسانی مدل زبانی"
        );
      }
    } catch (err) {
      console.error("Error updating language model:", err);
      setLanguageModelError("خطا در به‌روزرسانی مدل زبانی");
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("رمزهای عبور جدید مطابقت ندارند");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }

    try {
      const response = await fetch("/api/teacher/settings/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setPasswordSuccess(result.message);
        // Reset password form
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setPasswordError(result.error || "خطا در تغییر رمز عبور");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setPasswordError("خطا در ارتباط با سرور");
    }
  };

  // Function to add cache-busting parameter to image URLs
  const getImageUrlWithTimestamp = (url: string | null) => {
    if (!url) return null;

    // If it's already a proxy URL, use it as is
    if (url.startsWith("/api/image")) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}t=${profilePictureTimestamp}`;
    }

    // For direct S3 URLs, add cache-busting
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}t=${profilePictureTimestamp}`;
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

  if (!user) {
    return null;
  }

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div
          className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <h1
            className={`text-xl sm:text-2xl font-bold mb-6 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            اطلاعات شخصی
          </h1>

          {error && (
            <div
              className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
                theme === "dark"
                  ? "bg-red-900/30 text-red-300 border border-red-800/50"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
                theme === "dark"
                  ? "bg-green-900/30 text-green-300 border border-green-800/50"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {profilePicturePreview ? (
                    <img
                      src={profilePicturePreview}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : existingProfilePicture ? (
                    <img
                      src={
                        getImageUrlWithTimestamp(existingProfilePicture) ||
                        getProfileImageUrl(existingProfilePicture)
                      }
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center ${
                        theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                      }`}
                    >
                      <User
                        className={`w-12 h-12 ${
                          theme === "dark" ? "text-slate-500" : "text-slate-400"
                        }`}
                      />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="profile-picture"
                  className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ${
                    theme === "dark"
                      ? "bg-slate-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  aria-label="ویرایش عکس پروفایل"
                >
                  <Edit className="w-5 h-5" />
                </label>
                <input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                  aria-label="انتخاب عکس پروفایل"
                />
              </div>
              <p
                className={`text-sm mt-3 ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                عکس پروفایل
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  نام و نام خانوادگی
                </label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <User
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                    placeholder="نام و نام خانوادگی"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  ایمیل
                </label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Mail
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                    placeholder="ایمیل"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  شماره موبایل
                </label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Phone
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                    placeholder="شماره موبایل"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="national_id"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  کد ملی
                </label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <IdCard
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="text"
                    id="national_id"
                    name="national_id"
                    value={formData.national_id}
                    onChange={handleInputChange}
                    className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                    placeholder="کد ملی"
                  />
                </div>
                <p
                  className={`mt-2 text-xs ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  کد ملی خود را وارد کنید
                </p>
              </div>

              <div>
                <label
                  htmlFor="telegram_chat_id"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  چت آیدی تلگرام
                </label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <MessageCircle
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="text"
                    id="telegram_chat_id"
                    name="telegram_chat_id"
                    value={formData.telegram_chat_id}
                    onChange={handleInputChange}
                    className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                    placeholder="@your_telegram_id"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="bale_chat_id"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  چت آیدی بله
                </label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <MessageCircle
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="text"
                    id="bale_chat_id"
                    name="bale_chat_id"
                    value={formData.bale_chat_id}
                    onChange={handleInputChange}
                    className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                    placeholder="@your_bale_id"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>ذخیره تغییرات</span>
              </button>
            </div>
          </form>

          {/* Language Model Selection */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-700">
            <h2
              className={`text-lg sm:text-xl font-bold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              انتخاب مدل زبانی
            </h2>
            <div className="space-y-3">
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                  theme === "dark"
                    ? "bg-slate-800/50 border-slate-700/50 text-slate-200"
                    : "bg-white border-gray-200 text-gray-800"
                }`}
              >
                <input
                  type="radio"
                  name="languageModel"
                  value="cloud"
                  checked={languageModel === "cloud"}
                  onChange={() => handleLanguageModelChange("cloud")}
                />
                <span>مدل زبانی ابری</span>
              </label>
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                  theme === "dark"
                    ? "bg-slate-800/50 border-slate-700/50 text-slate-200"
                    : "bg-white border-gray-200 text-gray-800"
                }`}
              >
                <input
                  type="radio"
                  name="languageModel"
                  value="local"
                  checked={languageModel === "local"}
                  onChange={() => handleLanguageModelChange("local")}
                />
                <span>مدل اختصاصی</span>
              </label>
            </div>
            {languageModelError && (
              <p className="mt-3 text-sm text-red-600">{languageModelError}</p>
            )}
            {languageModelSuccess && (
              <p className="mt-3 text-sm text-green-600">
                {languageModelSuccess}
              </p>
            )}
          </div>

          {/* Password Change Section */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-700">
            <h2
              className={`text-lg sm:text-xl font-bold mb-6 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              تغییر رمز عبور
            </h2>

            {passwordError && (
              <div
                className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
                  theme === "dark"
                    ? "bg-red-900/30 text-red-300 border border-red-800/50"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div
                className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
                  theme === "dark"
                    ? "bg-green-900/30 text-green-300 border border-green-800/50"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}
              >
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="currentPassword"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  رمز عبور فعلی
                </label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Lock
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                    placeholder="رمز عبور فعلی"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="newPassword"
                    className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    رمز عبور جدید
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Lock
                        className={`w-5 h-5 ${
                          theme === "dark" ? "text-slate-400" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
                        theme === "dark"
                          ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                          : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                      }`}
                      placeholder="رمز عبور جدید"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    تکرار رمز عبور جدید
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Lock
                        className={`w-5 h-5 ${
                          theme === "dark" ? "text-slate-400" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
                        theme === "dark"
                          ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                          : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                      }`}
                      placeholder="تکرار رمز عبور جدید"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Lock className="w-5 h-5" />
                  <span>تغییر رمز عبور</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
