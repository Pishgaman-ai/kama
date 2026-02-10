"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  UserCircle,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  ArrowRight,
  Phone,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Users,
  Crown,
  MessageCircle,
} from "lucide-react";
import { useTheme } from "@/app/components/ThemeContext";

interface Principal {
  id: string;
  school_id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  is_active: boolean;
  profile?: {
    telegram_chat_id?: string;
    bale_chat_id?: string;
    [key: string]: unknown;
  };
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

interface School {
  id: string;
  name: string;
}

interface PrincipalFormData {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  telegram_chat_id?: string;
  bale_chat_id?: string;
  is_active: boolean;
  profile_picture?: File | null;
}

export default function SchoolPrincipalsPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;

  const [school, setSchool] = useState<School | null>(null);
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPrincipal, setSelectedPrincipal] = useState<Principal | null>(
    null
  );
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<PrincipalFormData>({
    name: "",
    phone: "",
    email: "",
    password: "",
    telegram_chat_id: "",
    bale_chat_id: "",
    is_active: true,
    profile_picture: null,
  });
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);

  // Add this function to handle profile picture changes
  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        setFormError("فایل انتخاب شده باید یک تصویر باشد");
        return;
      }

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setFormError("حجم فایل نباید بیشتر از 2 مگابایت باشد");
        return;
      }

      // Set preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Set file for upload
      setFormData((prev) => ({ ...prev, profile_picture: file }));
    } else {
      setProfilePicturePreview(null);
      setFormData((prev) => ({ ...prev, profile_picture: null }));
    }
  };

  useEffect(() => {
    if (schoolId) fetchPrincipals();
  }, [schoolId]);

  const fetchPrincipals = async () => {
    try {
      const response = await fetch(`/api/admin/schools/${schoolId}/principals`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSchool(result.data.school);
          setPrincipals(result.data.principals);
          setError(null);
        } else {
          setError("خطا در بارگیری مدیران");
        }
      } else {
        setError("خطا در بارگیری مدیران");
      }
    } catch (error) {
      console.error("Error fetching principals:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrincipal = async () => {
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (!formData.name.trim()) {
        setFormError("نام مدیر الزامی است");
        setFormLoading(false);
        return;
      }

      if (!formData.phone.trim()) {
        setFormError("شماره همراه الزامی است");
        setFormLoading(false);
        return;
      }

      // Create FormData object to handle file uploads
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name.trim());
      formDataObj.append("phone", formData.phone.trim());
      if (formData.email?.trim()) {
        formDataObj.append("email", formData.email.trim());
      }
      formDataObj.append("telegram_chat_id", formData.telegram_chat_id || "");
      formDataObj.append("bale_chat_id", formData.bale_chat_id || "");
      if (formData.password?.trim()) {
        formDataObj.append("password", formData.password.trim());
      }
      if (formData.profile_picture) {
        formDataObj.append("profile_picture", formData.profile_picture);
      }

      const response = await fetch(
        `/api/admin/schools/${schoolId}/principals`,
        {
          method: "POST",
          body: formDataObj,
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        // Update success message for simplified user-only approach
        setFormSuccess(`مدیر "${formData.name}" با موفقیت ایجاد شد!
حساب کاربری برای ورود به سیستم آماده است.`);
        setFormData({
          name: "",
          phone: "",
          email: "",
          password: "",
          telegram_chat_id: "",
          bale_chat_id: "",
          is_active: true,
          profile_picture: null,
        });
        setProfilePicturePreview(null);
        await fetchPrincipals();
        setTimeout(() => {
          setShowCreateModal(false);
          setFormSuccess(null);
        }, 3000); // Increased timeout to 3 seconds to give time to read the message
      } else {
        setFormError(result.error || "خطا در افزودن مدیر");
      }
    } catch (error) {
      console.error("Error creating principal:", error);
      setFormError("خطا در ارتباط با سرور");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditPrincipal = async () => {
    if (!selectedPrincipal) return;

    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (!formData.name.trim()) {
        setFormError("نام مدیر الزامی است");
        setFormLoading(false);
        return;
      }

      if (!formData.phone.trim()) {
        setFormError("شماره همراه الزامی است");
        setFormLoading(false);
        return;
      }

      // Create FormData object to handle file uploads
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name.trim());
      formDataObj.append("phone", formData.phone.trim());
      formDataObj.append("email", formData.email?.trim() || "");
      formDataObj.append("telegram_chat_id", formData.telegram_chat_id || "");
      formDataObj.append("bale_chat_id", formData.bale_chat_id || "");
      formDataObj.append("is_active", formData.is_active.toString());
      if (formData.profile_picture) {
        formDataObj.append("profile_picture", formData.profile_picture);
      }

      const response = await fetch(
        `/api/admin/schools/${schoolId}/principals/${selectedPrincipal.id}`,
        {
          method: "PUT",
          body: formDataObj,
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setFormSuccess(`اطلاعات "${formData.name}" با موفقیت به‌روزرسانی شد!`);
        await fetchPrincipals();
        setTimeout(() => {
          setShowEditModal(false);
          setSelectedPrincipal(null);
          setFormSuccess(null);
        }, 2000);
      } else {
        setFormError(result.error || "خطا در به‌روزرسانی مدیر");
      }
    } catch (error) {
      console.error("Error updating principal:", error);
      setFormError("خطا در ارتباط با سرور");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePrincipal = async () => {
    if (!selectedPrincipal) return;

    setFormLoading(true);

    try {
      const response = await fetch(
        `/api/admin/schools/${schoolId}/principals/${selectedPrincipal.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        await fetchPrincipals();
        setShowDeleteModal(false);
        setSelectedPrincipal(null);
      } else {
        setFormError(result.error || "خطا در حذف مدیر");
      }
    } catch (error) {
      console.error("Error deleting principal:", error);
      setFormError("خطا در ارتباط با سرور");
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (principal: Principal) => {
    setSelectedPrincipal(principal);
    setFormData({
      name: principal.name,
      phone: principal.phone,
      email: principal.email || "",
      password: "",
      telegram_chat_id: principal.profile?.telegram_chat_id || "",
      bale_chat_id: principal.profile?.bale_chat_id || "",
      is_active: principal.is_active,
      profile_picture: null,
    });
    setProfilePicturePreview(principal.profile_picture_url || null);
    setFormError(null);
    setFormSuccess(null);
    setShowEditModal(true);
  };

  const openDeleteModal = (principal: Principal) => {
    setSelectedPrincipal(principal);
    setShowDeleteModal(true);
  };

  const filteredPrincipals = principals.filter(
    (principal) =>
      principal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      principal.phone.includes(searchTerm) ||
      (principal.email &&
        principal.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.push("/admin/schools")}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "hover:bg-slate-800 text-slate-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
              title="بازگشت"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1
                className={`text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                مدیریت مدیران
              </h1>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-500"
                }`}
              >
                {school?.name || "..."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                theme === "dark" ? "text-slate-400" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder="جستجو در مدیران..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-4 pr-11 py-3 rounded-xl border outline-none focus:ring-2 transition-all ${
                theme === "dark"
                  ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500/50"
                  : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
              }`}
            />
          </div>

          <button
            onClick={() => {
              setFormData({
                name: "",
                phone: "",
                email: "",
                password: "",
                telegram_chat_id: "",
                bale_chat_id: "",
                is_active: true,
              });
              setFormError(null);
              setFormSuccess(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium text-sm sm:text-base whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            مدیر جدید
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          className={`p-4 rounded-xl mb-6 ${
            theme === "dark"
              ? "bg-red-500/10 border border-red-500/20"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <p
            className={`text-sm ${
              theme === "dark" ? "text-red-400" : "text-red-600"
            }`}
          >
            {error}
          </p>
        </div>
      )}

      {/* Principals Table */}
      {filteredPrincipals.length === 0 ? (
        <div
          className={`text-center py-16 rounded-2xl border-2 border-dashed ${
            theme === "dark" ? "border-slate-700" : "border-gray-300"
          }`}
        >
          <UserCircle
            className={`w-16 h-16 mx-auto mb-4 ${
              theme === "dark" ? "text-slate-600" : "text-gray-400"
            }`}
          />
          <h3
            className={`text-xl font-semibold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {searchTerm ? "مدیری یافت نشد" : "هنوز مدیری ندارید"}
          </h3>
          <p
            className={`text-sm mb-6 ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            {searchTerm
              ? "جستجوی دیگری امتحان کنید"
              : "اولین مدیر خود را اضافه کنید"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => {
                setFormData({
                  name: "",
                  phone: "",
                  email: "",
                  password: "",
                  telegram_chat_id: "",
                  bale_chat_id: "",
                  is_active: true,
                });
                setFormError(null);
                setFormSuccess(null);
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              افزودن اولین مدیر
            </button>
          )}
        </div>
      ) : (
        <div
          className={`rounded-xl border ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`border-b ${
                    theme === "dark" ? "border-slate-700" : "border-gray-200"
                  }`}
                >
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    نام و نام خانوادگی
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    شماره همراه
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    ایمیل
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    تاریخ ایجاد
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    وضعیت
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPrincipals.map((principal) => (
                  <tr
                    key={principal.id}
                    className={`border-b ${
                      theme === "dark"
                        ? "border-slate-700/50"
                        : "border-gray-100"
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {principal.profile_picture_url ? (
                          <img
                            src={principal.profile_picture_url}
                            alt={`${principal.name} پروفایل`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {principal.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span
                          className={`font-medium ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {principal.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-600"
                      }`}
                      dir="ltr"
                    >
                      {principal.phone}
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-600"
                      }`}
                      dir="ltr"
                    >
                      {principal.email || "ایمیل ثبت نشده"}
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-300" : "text-gray-600"
                      }`}
                    >
                      {principal.created_at}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-lg text-sm ${
                          principal.is_active
                            ? theme === "dark"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-green-50 text-green-600"
                            : theme === "dark"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {principal.is_active ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(principal)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-blue-500/20 text-blue-400"
                              : "hover:bg-blue-100 text-blue-600"
                          }`}
                          aria-label="ویرایش مدیر"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(principal)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-red-500/20 text-red-400"
                              : "hover:bg-red-100 text-red-600"
                          }`}
                          aria-label="حذف مدیر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Principal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div
            className={`relative w-full max-w-md rounded-2xl p-6 ${
              theme === "dark"
                ? "bg-slate-900 border border-slate-800"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                افزودن مدیر جدید
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    name: "",
                    phone: "",
                    email: "",
                    password: "",
                    telegram_chat_id: "",
                    bale_chat_id: "",
                    is_active: true,
                  });
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Profile Picture Upload */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  تصویر پروفایل (اختیاری)
                </label>
                <div className="flex items-start gap-4">
                  {/* Profile Picture Preview */}
                  <div className="flex-shrink-0">
                    {profilePicturePreview ? (
                      <img
                        src={profilePicturePreview}
                        alt="پیش‌نمایش تصویر پروفایل"
                        className="w-16 h-16 rounded-full object-cover border"
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center ${
                          theme === "dark"
                            ? "border-slate-600 bg-slate-800"
                            : "border-gray-300 bg-gray-100"
                        }`}
                      >
                        <UserCircle
                          className={`w-8 h-8 ${
                            theme === "dark"
                              ? "text-slate-500"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-1">
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
                            theme === "dark"
                              ? "text-slate-500"
                              : "text-gray-400"
                          }`}
                        />
                        <p
                          className={`text-sm font-medium ${
                            theme === "dark"
                              ? "text-slate-300"
                              : "text-gray-600"
                          }`}
                        >
                          انتخاب تصویر
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            theme === "dark"
                              ? "text-slate-500"
                              : "text-gray-500"
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
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  نام و نام خانوادگی *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="مثال: دکتر علی رضایی"
                  className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700/50 text-white focus:ring-blue-500/50"
                      : "bg-white border-gray-200 text-gray-900 focus:ring-blue-500/20"
                  }`}
                  required
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  شماره همراه *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 11) {
                      setFormData((prev) => ({ ...prev, phone: value }));
                    }
                  }}
                  placeholder="09123456789"
                  maxLength={11}
                  className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700/50 text-white focus:ring-blue-500/50"
                      : "bg-white border-gray-200 text-gray-900 focus:ring-blue-500/20"
                  }`}
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  ایمیل (اختیاری)
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="example@school.ir"
                  className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700/50 text-white focus:ring-blue-500/50"
                      : "bg-white border-gray-200 text-gray-900 focus:ring-blue-500/20"
                  }`}
                  dir="ltr"
                />
                <p
                  className={`text-xs mt-1 ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  برای ورود با ایمیل به جای شماره همراه
                </p>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  چت آیدی تلگرام (اختیاری)
                </label>
                <div className="relative">
                  <MessageCircle
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-400"
                    }`}
                  />
                  <input
                    type="text"
                    value={formData.telegram_chat_id || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        telegram_chat_id: e.target.value,
                      }))
                    }
                    placeholder="@telegram_id"
                    className={`w-full pr-10 pl-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700/50 text-white focus:ring-blue-500/50"
                        : "bg-white border-gray-200 text-gray-900 focus:ring-blue-500/20"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  چت آیدی بله (اختیاری)
                </label>
                <div className="relative">
                  <MessageCircle
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-400"
                    }`}
                  />
                  <input
                    type="text"
                    value={formData.bale_chat_id || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bale_chat_id: e.target.value,
                      }))
                    }
                    placeholder="@bale_id"
                    className={`w-full pr-10 pl-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700/50 text-white focus:ring-blue-500/50"
                        : "bg-white border-gray-200 text-gray-900 focus:ring-blue-500/20"
                    }`}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  رمز عبور (اختیاری)
                </label>
                <input
                  type="password"
                  value={formData.password || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="رمز عبور برای ورود با ایمیل"
                  className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700/50 text-white focus:ring-blue-500/50"
                      : "bg-white border-gray-200 text-gray-900 focus:ring-blue-500/20"
                  }`}
                />
                <p
                  className={`text-xs mt-1 ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  اگر رمز عبور تنظیم نشود، مدیر فقط می‌تواند با کد تایید وارد
                  شود
                </p>
              </div>
            </div>

            {/* Error/Success Messages */}
            {formError && (
              <div
                className={`mt-4 p-4 rounded-lg border ${
                  theme === "dark"
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className={`w-5 h-5 mt-0.5 ${
                      theme === "dark" ? "text-red-400" : "text-red-600"
                    }`}
                  />
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-red-400" : "text-red-600"
                    }`}
                  >
                    {formError}
                  </p>
                </div>
              </div>
            )}

            {formSuccess && (
              <div
                className={`mt-4 p-4 rounded-lg border ${
                  theme === "dark"
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className={`w-5 h-5 mt-0.5 ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}
                  />
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {formSuccess}
                  </p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    name: "",
                    phone: "",
                    email: "",
                    password: "",
                    telegram_chat_id: "",
                    bale_chat_id: "",
                    is_active: true,
                  });
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "bg-slate-800 text-slate-400 hover:text-white"
                    : "bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleCreatePrincipal}
                disabled={formLoading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? "در حال ایجاد..." : "ایجاد مدیر"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Similar enhanced modals for Edit and Delete... */}
      {/* I'll add them in the next part to keep response length manageable */}

      {/* Edit Principal Modal */}
      {showEditModal && selectedPrincipal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          <div
            className={`relative w-full max-w-md rounded-2xl p-6 ${
              theme === "dark"
                ? "bg-slate-900 border border-slate-800"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                ویرایش مدیر
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedPrincipal(null);
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  تصویر پروفایل (اختیاری)
                </label>
                <div className="flex items-start gap-4">
                  {/* Profile Picture Preview */}
                  <div className="flex-shrink-0">
                    {profilePicturePreview ? (
                      <img
                        src={profilePicturePreview}
                        alt="پیش‌نمایش تصویر پروفایل"
                        className="w-16 h-16 rounded-full object-cover border"
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center ${
                          theme === "dark"
                            ? "border-slate-600 bg-slate-800"
                            : "border-gray-300 bg-gray-100"
                        }`}
                      >
                        <UserCircle
                          className={`w-8 h-8 ${
                            theme === "dark"
                              ? "text-slate-500"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-1">
                    <div
                      className={`relative rounded-lg border-2 border-dashed ${
                        theme === "dark"
                          ? "border-slate-600 hover:border-slate-500"
                          : "border-gray-300 hover:border-gray-400"
                      } transition-colors`}
                    >
                      <input
                        type="file"
                        id="profile-picture-edit"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="انتخاب تصویر پروفایل"
                      />
                      <div className="py-3 px-4 text-center">
                        <Plus
                          className={`w-5 h-5 mx-auto mb-1 ${
                            theme === "dark"
                              ? "text-slate-500"
                              : "text-gray-400"
                          }`}
                        />
                        <p
                          className={`text-sm font-medium ${
                            theme === "dark"
                              ? "text-slate-300"
                              : "text-gray-600"
                          }`}
                        >
                          انتخاب تصویر
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            theme === "dark"
                              ? "text-slate-500"
                              : "text-gray-500"
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
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  نام و نام خانوادگی *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="مثال: دکتر علی رضایی"
                  className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700/50 text-white focus:ring-blue-500/50"
                      : "bg-white border-gray-200 text-gray-900 focus:ring-blue-500/20"
                  }`}
                  required
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  شماره همراه *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 11) {
                      setFormData((prev) => ({ ...prev, phone: value }));
                    }
                  }}
                  placeholder="09123456789"
                  maxLength={11}
                  className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700/50 text-white focus:ring-blue-500/50"
                      : "bg-white border-gray-200 text-gray-900 focus:ring-blue-500/20"
                  }`}
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  ایمیل (اختیاری)
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="example@school.ir"
                  className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-700/50 text-white focus:ring-blue-500/50"
                      : "bg-white border-gray-200 text-gray-900 focus:ring-blue-500/20"
                  }`}
                  dir="ltr"
                />
                <p
                  className={`text-xs mt-1 ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  برای ورود با ایمیل به جای شماره همراه
                </p>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  چت آیدی تلگرام (اختیاری)
                </label>
                <div className="relative">
                  <MessageCircle
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-400"
                    }`}
                  />
                  <input
                    type="text"
                    value={formData.telegram_chat_id || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        telegram_chat_id: e.target.value,
                      }))
                    }
                    placeholder="@telegram_id"
                    className={`w-full pr-10 pl-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700/50 text-white focus:ring-blue-500/50"
                        : "bg-white border-gray-200 text-gray-900 focus:ring-blue-500/20"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  چت آیدی بله (اختیاری)
                </label>
                <div className="relative">
                  <MessageCircle
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-400"
                    }`}
                  />
                  <input
                    type="text"
                    value={formData.bale_chat_id || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bale_chat_id: e.target.value,
                      }))
                    }
                    placeholder="@bale_id"
                    className={`w-full pr-10 pl-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border-slate-700/50 text-white focus:ring-blue-500/50"
                        : "bg-white border-gray-200 text-gray-900 focus:ring-blue-500/20"
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label
                  htmlFor="edit_is_active"
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  وضعیت فعال
                </label>
              </div>
            </div>

            {/* Error/Success Messages */}
            {formError && (
              <div
                className={`mt-4 p-4 rounded-lg border ${
                  theme === "dark"
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className={`w-5 h-5 mt-0.5 ${
                      theme === "dark" ? "text-red-400" : "text-red-600"
                    }`}
                  />
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-red-400" : "text-red-600"
                    }`}
                  >
                    {formError}
                  </p>
                </div>
              </div>
            )}

            {formSuccess && (
              <div
                className={`mt-4 p-4 rounded-lg border ${
                  theme === "dark"
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className={`w-5 h-5 mt-0.5 ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}
                  />
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {formSuccess}
                  </p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedPrincipal(null);
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "bg-slate-800 text-slate-400 hover:text-white"
                    : "bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleEditPrincipal}
                disabled={formLoading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteModal && selectedPrincipal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div
            className={`relative w-full max-w-md rounded-2xl p-6 ${
              theme === "dark"
                ? "bg-slate-900 border border-slate-800"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="text-center">
              <div
                className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  theme === "dark" ? "bg-red-500/20" : "bg-red-100"
                }`}
              >
                <AlertCircle
                  className={`w-6 h-6 ${
                    theme === "dark" ? "text-red-400" : "text-red-600"
                  }`}
                />
              </div>
              <h3
                className={`text-lg font-bold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                حذف مدیر
              </h3>
              <p
                className={`text-sm mb-4 ${
                  theme === "dark" ? "text-slate-400" : "text-gray-600"
                }`}
              >
                آیا از حذف “{selectedPrincipal.name}” اطمینان دارید؟ این عملیات
                غیرقابل برگشت است.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={formLoading}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors disabled:opacity-50 ${
                  theme === "dark"
                    ? "bg-slate-800 text-slate-400 hover:text-white"
                    : "bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              >
                انصراف
              </button>
              <button
                onClick={handleDeletePrincipal}
                disabled={formLoading}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? "در حال حذف..." : "حذف مدیر"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
