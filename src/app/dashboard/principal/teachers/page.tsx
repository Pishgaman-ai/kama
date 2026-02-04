"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import {
  Plus,
  Users,
  Search,
  Phone,
  Mail,
  User,
  Hash,
  X,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Edit,
  Trash2,
  Download,
  FileSpreadsheet,
  Upload,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  phone: string;
  email?: string;
  national_id?: string;
  subjects?: string[];
  classes_count: number;
  students_count: number;
  created_at: string;
  is_active: boolean;
}

interface Subject {
  id: string;
  name: string;
}

export default function TeachersPage() {
  const { theme } = useTheme();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [isEditingTeacher, setIsEditingTeacher] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const [teacherToDeactivate, setTeacherToDeactivate] = useState<{
    id: string;
    name: string;
    is_active: boolean;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Reset password state
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [teacherToReset, setTeacherToReset] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Teacher form state
  const [teacherForm, setTeacherForm] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    national_id: "",
    subjects: [] as string[],
    password: "",
    is_active: true,
  });

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/principal/teachers");
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
      } else {
        setError(
          "مشکلی در دریافت لیست معلمان رخ داده است. لطفاً مجدداً تلاش کنید."
        );
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setError("خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/principal/subjects");
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!teacherForm.name || !teacherForm.phone) {
      setError("نام و شماره همراه اجباری است");
      return;
    }

    // Validate phone number
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(teacherForm.phone)) {
      setError("شماره همراه نامعتبر است");
      return;
    }

    // If email is provided, validate it
    if (teacherForm.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(teacherForm.email)) {
        setError("ایمیل نامعتبر است");
        return;
      }
    }

    // Password is required if email is provided and we're adding a new teacher
    if (!isEditingTeacher && teacherForm.email && !teacherForm.password) {
      setError("در صورت وارد کردن ایمیل، رمز عبور اجباری است");
      return;
    }

    setIsAddingTeacher(true);

    try {
      const url = "/api/principal/teachers";
      const method = isEditingTeacher ? "PUT" : "POST";

      const requestBody = isEditingTeacher
        ? {
            id: teacherForm.id,
            name: teacherForm.name,
            phone: teacherForm.phone,
            email: teacherForm.email,
            national_id: teacherForm.national_id,
            subjects: teacherForm.subjects,
            is_active: teacherForm.is_active,
          }
        : teacherForm;

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          isEditingTeacher
            ? "اطلاعات معلم با موفقیت به‌روزرسانی شد"
            : "معلم با موفقیت اضافه شد"
        );

        // Reset form
        setTeacherForm({
          id: "",
          name: "",
          phone: "",
          email: "",
          national_id: "",
          subjects: [],
          password: "",
          is_active: true,
        });

        setTimeout(() => {
          setIsDialogOpen(false);
          setSuccess(null);
        }, 2000);

        fetchTeachers(); // Refresh the list
      } else {
        setError(
          data.error ||
            (isEditingTeacher
              ? "خطا در به‌روزرسانی اطلاعات معلم. لطفاً مجدداً تلاش کنید."
              : "خطا در افزودن معلم. لطفاً مجدداً تلاش کنید.")
        );
      }
    } catch (error) {
      console.error("Error saving teacher:", error);
      setError("خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.");
    } finally {
      setIsAddingTeacher(false);
    }
  };

  const handleExportTeachers = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch("/api/principal/teachers/export");

      if (response.ok) {
        // Get the blob from response
        const blob = await response.blob();

        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = "لیست_معلمان.xlsx";
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = decodeURIComponent(filenameMatch[1]);
          }
        }

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setSuccess("فایل اکسل با موفقیت دانلود شد");
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.error || "خطا در خروجی گرفتن از لیست معلمان");
      }
    } catch (error) {
      console.error("Error exporting teachers:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportTeachers = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/principal/teachers/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data);
        setShowImportDialog(true);
        fetchTeachers(); // Refresh the list
      } else {
        setError(data.error || "خطا در import فایل اکسل");
      }
    } catch (error) {
      console.error("Error importing teachers:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setTeacherForm({
      id: teacher.id,
      name: teacher.name,
      phone: teacher.phone,
      email: teacher.email || "",
      national_id: teacher.national_id || "",
      subjects: teacher.subjects || [],
      password: "",
      is_active: teacher.is_active,
    });
    setIsEditingTeacher(true);
    setIsDialogOpen(true);
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/principal/teachers?id=${teacherToDelete}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("معلم با موفقیت حذف شد");
        setTeacherToDelete(null);
        fetchTeachers(); // Refresh the list

        setTimeout(() => {
          setSuccess(null);
        }, 2000);
      } else {
        setError(data.error || "خطا در حذف معلم. لطفاً مجدداً تلاش کنید.");
      }
    } catch (error) {
      console.error("Error deleting teacher:", error);
      setError("خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeactivateTeacher = async () => {
    if (!teacherToDeactivate) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/principal/teachers`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: teacherToDeactivate.id,
          is_active: !teacherToDeactivate.is_active,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          data.message ||
            (teacherToDeactivate.is_active
              ? "معلم با موفقیت غیرفعال شد"
              : "معلم با موفقیت فعال شد")
        );
        setTeacherToDeactivate(null);
        fetchTeachers(); // Refresh the list

        setTimeout(() => {
          setSuccess(null);
        }, 2000);
      } else {
        setError(
          data.error || "خطا در به‌روزرسانی وضعیت معلم. لطفاً مجدداً تلاش کنید."
        );
      }
    } catch (error) {
      console.error("Error updating teacher status:", error);
      setError("خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    if (checked) {
      setTeacherForm({
        ...teacherForm,
        subjects: [...teacherForm.subjects, subjectId],
      });
    } else {
      setTeacherForm({
        ...teacherForm,
        subjects: teacherForm.subjects.filter((id) => id !== subjectId),
      });
    }
  };

  const openAddTeacherDialog = () => {
    setTeacherForm({
      id: "",
      name: "",
      phone: "",
      email: "",
      national_id: "",
      subjects: [],
      password: "",
      is_active: true,
    });
    setIsEditingTeacher(false);
    setIsDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!teacherToReset) return;

    // Validation
    if (!newPassword || newPassword.length < 4) {
      setError("رمز عبور باید حداقل 4 کاراکتر باشد");
      return;
    }

    setIsResettingPassword(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/principal/teachers/${teacherToReset.id}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newPassword }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || "رمز عبور با موفقیت تغییر یافت");
        setShowResetPasswordDialog(false);
        setTeacherToReset(null);
        setNewPassword("");
        setShowPassword(false);

        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(data.error || "خطا در تغییر رمز عبور");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    // Filter by search term
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.phone.includes(searchTerm) ||
      (teacher.email &&
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter by active status if needed
    const matchesActiveStatus = showInactive || teacher.is_active;

    return matchesSearch && matchesActiveStatus;
  });

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            مدیریت معلمان
          </h1>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            لیست تمام معلمان مدرسه
          </p>
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
              placeholder="جستجو در معلمان..."
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
            onClick={() => setShowInactive(!showInactive)}
            className={`px-4 py-3 rounded-xl font-medium transition-all ${
              showInactive
                ? "bg-blue-600 text-white"
                : theme === "dark"
                ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {showInactive ? "نمایش همه" : "فقط فعال‌ها"}
          </button>

          <label
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium text-sm sm:text-base whitespace-nowrap cursor-pointer ${
              isImporting
                ? "bg-gray-400 cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            }`}
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                در حال بارگذاری...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                ورود از اکسل
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportTeachers}
                  disabled={isImporting}
                  className="hidden"
                />
              </>
            )}
          </label>

          <button
            onClick={handleExportTeachers}
            disabled={isExporting || teachers.length === 0}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium text-sm sm:text-base whitespace-nowrap ${
              isExporting || teachers.length === 0
                ? "bg-gray-400 cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
            }`}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                در حال آماده‌سازی...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
                خروجی اکسل
              </>
            )}
          </button>

          <button
            onClick={openAddTeacherDialog}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium text-sm sm:text-base whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            معلم جدید
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && !teacherToDelete && (
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

      {/* Success Message */}
      {success && !teacherToDelete && (
        <div
          className={`p-4 rounded-xl mb-6 ${
            theme === "dark"
              ? "bg-green-500/10 border border-green-500/20"
              : "bg-green-50 border border-green-200"
          }`}
        >
          <p
            className={`text-sm ${
              theme === "dark" ? "text-green-400" : "text-green-600"
            }`}
          >
            {success}
          </p>
        </div>
      )}

      {/* Teachers List */}
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
                  دروس
                </th>
                <th
                  className={`text-right p-4 font-medium ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  کلاس‌ها/دانش‌آموزان
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
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span
                        className={`mt-3 ${
                          theme === "dark" ? "text-slate-400" : "text-gray-500"
                        }`}
                      >
                        در حال بارگذاری...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8">
                    <GraduationCap
                      className={`w-16 h-16 mx-auto mb-4 ${
                        theme === "dark" ? "text-slate-600" : "text-gray-400"
                      }`}
                    />
                    <h3
                      className={`text-xl font-semibold mb-2 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {searchTerm ? "معلمی یافت نشد" : "هنوز معلمی ندارید"}
                    </h3>
                    <p
                      className={`text-sm mb-6 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      {searchTerm
                        ? "جستجوی دیگری امتحان کنید"
                        : "اولین معلم خود را اضافه کنید"}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={openAddTeacherDialog}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        افزودن اولین معلم
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className={`border-b ${
                      theme === "dark"
                        ? "border-slate-700 hover:bg-slate-800/50"
                        : "border-gray-200 hover:bg-gray-50"
                    } ${!teacher.is_active ? "opacity-70" : ""}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            theme === "dark" ? "bg-slate-700" : "bg-gray-100"
                          }`}
                        >
                          <GraduationCap
                            className={`w-5 h-5 ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <span
                          className={`font-medium ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {teacher.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {teacher.phone}
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {teacher.email || "-"}
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {teacher.subjects && teacher.subjects.length > 0
                        ? teacher.subjects.join(", ")
                        : "-"}
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {teacher.classes_count} کلاس، {teacher.students_count}{" "}
                      دانش‌آموز
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          teacher.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {teacher.is_active ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTeacher(teacher);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-slate-700 text-slate-400"
                              : "hover:bg-gray-100 text-gray-500"
                          }`}
                          title="ویرایش"
                          aria-label="ویرایش"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTeacherToReset({
                              id: teacher.id,
                              name: teacher.name,
                            });
                            setShowResetPasswordDialog(true);
                            setNewPassword("");
                            setShowPassword(false);
                            setError(null);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-yellow-500/20 text-yellow-400"
                              : "hover:bg-yellow-50 text-yellow-600"
                          }`}
                          title="تغییر رمز عبور"
                          aria-label="تغییر رمز عبور"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTeacherToDeactivate({
                              id: teacher.id,
                              name: teacher.name,
                              is_active: teacher.is_active,
                            });
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            teacher.is_active
                              ? theme === "dark"
                                ? "hover:bg-red-500/20 text-red-400"
                                : "hover:bg-red-50 text-red-500"
                              : theme === "dark"
                              ? "hover:bg-green-500/20 text-green-400"
                              : "hover:bg-green-50 text-green-500"
                          }`}
                          title={
                            teacher.is_active ? "غیرفعال کردن" : "فعال کردن"
                          }
                          aria-label={
                            teacher.is_active ? "غیرفعال کردن" : "فعال کردن"
                          }
                        >
                          {teacher.is_active ? (
                            <Trash2 className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setTeacherToDelete(teacher.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-red-500/20 text-red-400"
                              : "hover:bg-red-50 text-red-500"
                          }`}
                          title="حذف کامل"
                          aria-label="حذف کامل"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deactivate Confirmation Modal */}
      {teacherToDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setTeacherToDeactivate(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {teacherToDeactivate.is_active
                    ? "تأیید غیرفعال کردن معلم"
                    : "تأیید فعال کردن معلم"}
                </h3>
                <button
                  onClick={() => setTeacherToDeactivate(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="بستن"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {teacherToDeactivate.is_active
                  ? `آیا از غیرفعال کردن معلم "${teacherToDeactivate.name}" اطمینان دارید؟ معلم دیگر نمی‌تواند وارد سیستم شود.`
                  : `آیا از فعال کردن معلم "${teacherToDeactivate.name}" اطمینان دارید؟ معلم می‌تواند دوباره وارد سیستم شود.`}
              </p>

              {error && teacherToDeactivate && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {success && teacherToDeactivate && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-4">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {success}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setTeacherToDeactivate(null)}
                  disabled={isDeleting}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-slate-700 text-white hover:bg-slate-600"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  انصراف
                </button>
                <button
                  onClick={handleDeactivateTeacher}
                  disabled={isDeleting}
                  className={`px-4 py-2 rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                    teacherToDeactivate.is_active
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {teacherToDeactivate.is_active
                        ? "در حال غیرفعال کردن..."
                        : "در حال فعال کردن..."}
                    </>
                  ) : teacherToDeactivate.is_active ? (
                    "غیرفعال کردن"
                  ) : (
                    "فعال کردن"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setTeacherToDelete(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  تأیید حذف کامل معلم
                </h3>
                <button
                  onClick={() => setTeacherToDelete(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="بستن"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-6">
                آیا از حذف کامل این معلم اطمینان دارید؟ تمام اطلاعات معلم به طور
                دائمی از سیستم حذف خواهد شد و این عملیات غیرقابل بازگشت است.
              </p>

              {error && teacherToDelete && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {success && teacherToDelete && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-4">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {success}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setTeacherToDelete(null)}
                  disabled={isDeleting}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-slate-700 text-white hover:bg-slate-600"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  انصراف
                </button>
                <button
                  onClick={handleDeleteTeacher}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      در حال حذف...
                    </>
                  ) : (
                    "حذف کامل معلم"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Teacher Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDialogOpen(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 m-4">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isEditingTeacher
                    ? "ویرایش اطلاعات معلم"
                    : "افزودن معلم جدید"}
                </h2>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="بستن"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {isEditingTeacher
                  ? "ویرایش اطلاعات معلم"
                  : "اطلاعات معلم را وارد کنید"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Error/Success Messages */}
              {error && !teacherToDelete && (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {success && !teacherToDelete && (
                <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {success}
                    </p>
                  </div>
                </div>
              )}

              {/* Teacher Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  اطلاعات معلم
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      نام و نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      value={teacherForm.name}
                      onChange={(e) =>
                        setTeacherForm({ ...teacherForm, name: e.target.value })
                      }
                      placeholder="نام کامل معلم"
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      شماره همراه *
                    </label>
                    <input
                      type="text"
                      value={teacherForm.phone}
                      onChange={(e) =>
                        setTeacherForm({
                          ...teacherForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="09123456789"
                      maxLength={11}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      کد ملی (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={teacherForm.national_id || ""}
                      onChange={(e) =>
                        setTeacherForm({
                          ...teacherForm,
                          national_id: e.target.value,
                        })
                      }
                      placeholder="1234567890"
                      maxLength={10}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      ایمیل (اختیاری)
                    </label>
                    <input
                      type="email"
                      value={teacherForm.email}
                      onChange={(e) =>
                        setTeacherForm({
                          ...teacherForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="teacher@example.com"
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {!isEditingTeacher && teacherForm.email && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      رمز عبور *
                    </label>
                    <input
                      type="password"
                      value={teacherForm.password}
                      onChange={(e) =>
                        setTeacherForm({
                          ...teacherForm,
                          password: e.target.value,
                        })
                      }
                      placeholder="رمز عبور معلم"
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}

                {/* Active Status Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-100 dark:bg-slate-700">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      وضعیت فعال بودن معلم
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      معلم فعال می‌تواند وارد سیستم شود
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={teacherForm.is_active}
                      onChange={(e) =>
                        setTeacherForm({
                          ...teacherForm,
                          is_active: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                      aria-label="وضعیت فعال بودن معلم"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Subjects Selection */}
              {subjects.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    دروس تدریسی (اختیاری)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {subjects.map((subject) => (
                      <label
                        key={subject.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={teacherForm.subjects.includes(subject.id)}
                          onChange={(e) =>
                            handleSubjectChange(subject.id, e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {subject.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-slate-700 text-white hover:bg-slate-600"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isAddingTeacher}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAddingTeacher ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isEditingTeacher
                        ? "در حال به‌روزرسانی..."
                        : "در حال افزودن..."}
                    </>
                  ) : isEditingTeacher ? (
                    "به‌روزرسانی اطلاعات"
                  ) : (
                    "افزودن معلم"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Result Dialog */}
      {showImportDialog && importResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
              theme === "dark" ? "bg-slate-800" : "bg-white"
            }`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  نتیجه ورود اطلاعات از اکسل
                </h2>
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <X
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div
                  className={`p-4 rounded-xl ${
                    theme === "dark"
                      ? "bg-blue-500/10 border border-blue-500/20"
                      : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      theme === "dark" ? "text-blue-400" : "text-blue-600"
                    }`}
                  >
                    {importResult.summary.total}
                  </div>
                  <div
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    کل ردیف‌ها
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    theme === "dark"
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-green-50 border border-green-200"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {importResult.summary.added}
                  </div>
                  <div
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    افزوده شده
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    theme === "dark"
                      ? "bg-yellow-500/10 border border-yellow-500/20"
                      : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      theme === "dark" ? "text-yellow-400" : "text-yellow-600"
                    }`}
                  >
                    {importResult.summary.updated}
                  </div>
                  <div
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    به‌روزرسانی شده
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    theme === "dark"
                      ? "bg-red-500/10 border border-red-500/20"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      theme === "dark" ? "text-red-400" : "text-red-600"
                    }`}
                  >
                    {importResult.summary.skipped}
                  </div>
                  <div
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    رد شده
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {importResult.summary.added > 0 ||
              importResult.summary.updated > 0 ? (
                <div
                  className={`p-4 rounded-xl mb-4 ${
                    theme === "dark"
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-green-50 border border-green-200"
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
                      {importResult.message}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Errors */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div
                  className={`p-4 rounded-xl mb-4 ${
                    theme === "dark"
                      ? "bg-red-500/10 border border-red-500/20"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle
                      className={`w-5 h-5 mt-0.5 ${
                        theme === "dark" ? "text-red-400" : "text-red-600"
                      }`}
                    />
                    <p
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-red-400" : "text-red-600"
                      }`}
                    >
                      خطاهای رخ داده:
                    </p>
                  </div>
                  <div className="space-y-1 pr-8">
                    {importResult.errors.map((error: string, index: number) => (
                      <div
                        key={index}
                        className={`text-sm ${
                          theme === "dark" ? "text-red-300" : "text-red-700"
                        }`}
                      >
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results Details */}
              {importResult.results && importResult.results.length > 0 && (
                <div>
                  <h3
                    className={`text-lg font-semibold mb-3 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    جزئیات تغییرات:
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {importResult.results.map((result: any, index: number) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          theme === "dark"
                            ? "bg-slate-700/50"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className={`font-medium ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {result.name}
                            </div>
                            <div
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-slate-400"
                                  : "text-gray-600"
                              }`}
                            >
                              {result.phone} {result.email && `• ${result.email}`}
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              result.action === "added"
                                ? theme === "dark"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-green-100 text-green-700"
                                : theme === "dark"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {result.action === "added" ? "جدید" : "به‌روزرسانی"}
                          </span>
                        </div>
                        {result.defaultPassword && (
                          <div
                            className={`mt-2 text-xs ${
                              theme === "dark"
                                ? "text-slate-500"
                                : "text-gray-500"
                            }`}
                          >
                            رمز پیش‌فرض: {result.defaultPassword}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Dialog */}
      {showResetPasswordDialog && teacherToReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-2xl shadow-2xl max-w-md w-full ${
              theme === "dark" ? "bg-slate-800" : "bg-white"
            }`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  تغییر رمز عبور
                </h2>
                <button
                  onClick={() => {
                    setShowResetPasswordDialog(false);
                    setTeacherToReset(null);
                    setNewPassword("");
                    setShowPassword(false);
                    setError(null);
                  }}
                  className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                  disabled={isResettingPassword}
                >
                  <X
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  />
                </button>
              </div>

              {/* Teacher Info */}
              <div
                className={`mb-6 p-4 rounded-xl ${
                  theme === "dark"
                    ? "bg-yellow-500/10 border border-yellow-500/20"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <div
                  className={`text-sm mb-1 ${
                    theme === "dark" ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  معلم:
                </div>
                <div
                  className={`text-lg font-semibold ${
                    theme === "dark" ? "text-yellow-400" : "text-yellow-700"
                  }`}
                >
                  {teacherToReset.name}
                </div>
              </div>

              {/* Password Input */}
              <div className="mb-6">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  رمز عبور جدید
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="حداقل 4 کاراکتر"
                    autoComplete="new-password"
                    autoFocus
                    className={`w-full px-4 py-3 rounded-xl border transition-all pr-12 ${
                      theme === "dark"
                        ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-yellow-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500"
                    } focus:ring-2 focus:ring-yellow-500/20 outline-none`}
                    disabled={isResettingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
                      theme === "dark"
                        ? "hover:bg-slate-600 text-slate-400"
                        : "hover:bg-gray-100 text-gray-500"
                    }`}
                    disabled={isResettingPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div
                  className={`mt-2 text-xs ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  رمز عبور باید حداقل 4 کاراکتر باشد
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-500">{error}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowResetPasswordDialog(false);
                    setTeacherToReset(null);
                    setNewPassword("");
                    setShowPassword(false);
                    setError(null);
                  }}
                  className={`flex-1 px-6 py-3 rounded-xl transition-all ${
                    theme === "dark"
                      ? "bg-slate-700 hover:bg-slate-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                  disabled={isResettingPassword}
                >
                  انصراف
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={isResettingPassword || !newPassword}
                  className={`flex-1 px-6 py-3 rounded-xl transition-all ${
                    isResettingPassword || !newPassword
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg text-white"
                  }`}
                >
                  {isResettingPassword ? "در حال تغییر..." : "تغییر رمز عبور"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
