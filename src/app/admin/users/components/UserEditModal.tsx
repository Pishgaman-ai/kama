"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  IdCard,
  Shield,
  Key,
  Building,
  Save,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react";
import { useTheme } from "@/app/components/ThemeContext";

interface User {
  id: string;
  school_id: string;
  name: string;
  email?: string;
  phone?: string;
  national_id?: string;
  role: "student" | "teacher" | "parent" | "principal" | "school_admin";
  is_active: boolean;
  password?: string;
  profile_picture_url?: string;
}

interface School {
  id: string;
  name: string;
}

interface UserEditModalProps {
  user: User | null;
  schools: School[];
  onClose: () => void;
  onSave: (
    user: Omit<User, "school_name" | "created_at">,
    profilePictureFile?: File | null
  ) => void;
}

export default function UserEditModal({
  user,
  schools,
  onClose,
  onSave,
}: UserEditModalProps) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<User>({
    id: "",
    school_id: "",
    name: "",
    email: "",
    phone: "",
    national_id: "",
    role: "student",
    is_active: true,
    password: "",
    profile_picture_url: "",
  });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let checked: boolean | undefined;

    // Type guard for checkbox
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      checked = checkbox.checked;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError("نام کاربر الزامی است");
        setLoading(false);
        return;
      }

      // Create a new object with all form data
      const userData = {
        ...formData,
      };

      // Call the onSave callback with the profile picture file
      onSave(userData, profilePictureFile);
    } catch (err) {
      setError("خطا در ذخیره اطلاعات کاربر");
      console.error("Error saving user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      // Handle file upload here (e.g., upload to server, convert to base64, etc.)
      console.log(file);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "student":
        return "دانش‌آموز";
      case "teacher":
        return "معلم";
      case "parent":
        return "اولیا";
      case "principal":
        return "مدیر مدرسه";
      case "school_admin":
        return "مدیر سیستم";
      default:
        return role;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${
          theme === "dark"
            ? "bg-slate-900/95 border-slate-800"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
            theme === "dark"
              ? "bg-slate-900/90 border-slate-800"
              : "bg-white border-gray-200"
          }`}
        >
          <h2
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {user ? "ویرایش کاربر" : "افزودن کاربر جدید"}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800 text-slate-400"
                : "hover:bg-gray-100 text-gray-500"
            }`}
            aria-label="بستن"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {error && (
              <div
                className={`rounded-xl p-4 border ${
                  theme === "dark"
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-red-50 border-red-200 text-red-600"
                }`}
              >
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Picture */}
              <div className="md:col-span-2">
                <div className="flex flex-col items-center">
                  <div
                    className={`relative rounded-lg border-2 border-dashed ${
                      theme === "dark"
                        ? "border-slate-600 hover:border-slate-500"
                        : "border-gray-300 hover:border-gray-400"
                    } transition-colors`}
                  >
                    <input
                      type="file"
                      id="profile-picture"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="انتخاب تصویر پروفایل"
                    />
                    <div className="py-3 px-4 text-center">
                      <Plus
                        className={`w-5 h-5 mx-auto mb-1 ${
                          theme === "dark" ? "text-slate-500" : "text-gray-400"
                        }`}
                      />
                      <p
                        className={`text-sm font-medium ${
                          theme === "dark" ? "text-slate-300" : "text-gray-600"
                        }`}
                      >
                        انتخاب تصویر
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          theme === "dark" ? "text-slate-500" : "text-gray-500"
                        }`}
                      >
                        JPG, PNG تا حداکثر 2MB
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-xs mt-2 ${
                      theme === "dark" ? "text-slate-500" : "text-gray-500"
                    }`}
                  >
                    تصویر پروفایل (اختیاری)
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="md:col-span-2">
                <label
                  htmlFor="name"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  نام و نام خانوادگی
                </label>
                <div className="relative">
                  <User
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-400"
                    }`}
                  />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full pr-10 pl-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="نام و نام خانوادگی"
                  />
                </div>
              </div>

              {/* Email */}
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
                  <Mail
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-400"
                    }`}
                  />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    className={`w-full pr-10 pl-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="ایمیل"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  شماره همراه
                </label>
                <div className="relative">
                  <Phone
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-400"
                    }`}
                  />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    className={`w-full pr-10 pl-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="شماره همراه"
                  />
                </div>
              </div>

              {/* National ID */}
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
                  <IdCard
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-400"
                    }`}
                  />
                  <input
                    type="text"
                    id="national_id"
                    name="national_id"
                    value={formData.national_id || ""}
                    onChange={handleChange}
                    className={`w-full pr-10 pl-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="کد ملی"
                  />
                </div>
              </div>

              {/* School */}
              <div>
                <label
                  htmlFor="school_id"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  مدرسه
                </label>
                <div className="relative">
                  <Building
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-400"
                    }`}
                  />
                  <select
                    id="school_id"
                    name="school_id"
                    value={formData.school_id}
                    onChange={handleChange}
                    className={`w-full pr-10 pl-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700 text-white focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  >
                    <option value="">انتخاب مدرسه</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="role"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  نقش
                </label>
                <div className="relative">
                  <Shield
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-400"
                    }`}
                  />
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`w-full pr-10 pl-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700 text-white focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  >
                    <option value="student">دانش‌آموز</option>
                    <option value="teacher">معلم</option>
                    <option value="parent">اولیا</option>
                    <option value="principal">مدیر مدرسه</option>
                    <option value="school_admin">مدیر سیستم</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="md:col-span-2">
                <label
                  htmlFor="password"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  رمز عبور
                </label>
                <div className="relative">
                  <Key
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-400"
                    }`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password || ""}
                    onChange={handleChange}
                    className={`w-full pr-10 pl-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                        : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="رمز عبور"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                      theme === "dark"
                        ? "text-slate-400 hover:text-white hover:bg-slate-700"
                        : "text-gray-400 hover:text-gray-700 hover:bg-gray-200"
                    }`}
                    aria-label={
                      showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p
                  className={`text-xs mt-1 ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  {user
                    ? "در صورت تمایل به تغییر رمز عبور، مقدار جدید را وارد کنید"
                    : "رمز عبور برای ورود به سیستم"}
                </p>
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className={`w-5 h-5 rounded focus:ring-2 ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700 text-blue-500 focus:ring-blue-500/50"
                        : "border-gray-300 text-blue-500 focus:ring-blue-500"
                    }`}
                  />
                  <label
                    htmlFor="is_active"
                    className={`mr-2 block text-sm font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    حساب کاربری فعال باشد
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className={`sticky bottom-0 z-10 flex items-center justify-end gap-3 p-6 border-t ${
              theme === "dark"
                ? "bg-slate-900/90 border-slate-800"
                : "bg-white border-gray-200"
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                theme === "dark"
                  ? "bg-slate-800 hover:bg-slate-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                loading
                  ? "opacity-70 cursor-not-allowed"
                  : theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <Save className="w-5 h-5" />
              <span>{user ? "ذخیره تغییرات" : "افزودن کاربر"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
