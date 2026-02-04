"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { useTheme } from "../../../../components/ThemeContext";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Edit,
  User,
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Users,
  UserCircle,
} from "lucide-react";
import { convertPersianToEnglishDigits } from "@/lib/utils";

interface Parent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

interface Student {
  id: string;
  name: string;
  national_id: string;
  email?: string;
  phone?: string;
  grade_level?: string;
  classes: { id: string; name: string; grade_level: string; section: string }[];
  created_at: string;
  parents: Parent[];
  profile_picture_url?: string;
}

interface StudentForm {
  name: string;
  national_id: string;
  email: string;
  grade_level: string;
  parent1_name: string;
  parent1_phone: string;
  parent1_email: string;
  parent1_relationship: string;
  parent2_name: string;
  parent2_phone: string;
  parent2_email: string;
  parent2_relationship: string;
}

export default function EditStudentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");
  const { theme } = useTheme();
  const [studentForm, setStudentForm] = useState<StudentForm>({
    name: "",
    national_id: "",
    email: "",
    grade_level: "",
    parent1_name: "",
    parent1_phone: "",
    parent1_email: "",
    parent1_relationship: "father",
    parent2_name: "",
    parent2_phone: "",
    parent2_email: "",
    parent2_relationship: "mother",
  });

  // Store parent IDs to pass them when updating
  const [parentIds, setParentIds] = useState<{
    parent1Id?: string;
    parent2Id?: string;
  }>({});

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const [existingProfilePicture, setExistingProfilePicture] = useState<
    string | null
  >(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);

  const bgClass =
    theme === "dark"
      ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50";

  const cardClass =
    theme === "dark"
      ? "bg-slate-800 border-slate-700"
      : "bg-white border-slate-200";

  const inputClass = (focused: boolean) =>
    theme === "dark"
      ? "border-slate-600 bg-slate-700 text-white placeholder:text-slate-400"
      : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400";

  const labelClass = theme === "dark" ? "text-slate-300" : "text-slate-700";

  // Fetch student data when component mounts
  useEffect(() => {
    if (studentId) {
      fetchStudentData(studentId);
    } else {
      setError("شناسه دانش‌آموز مشخص نشده است");
      setIsLoading(false);
    }
  }, [studentId]);

  const fetchStudentData = async (id: string) => {
    try {
      const response = await fetch(`/api/principal/students/${id}`);
      if (response.ok) {
        const data = await response.json();
        const student: Student = data.student;

        // Set form data with existing student information
        setStudentForm({
          name: student.name,
          national_id: student.national_id,
          email: student.email || "",
          grade_level: student.grade_level || "",
          parent1_name: student.parents[0]?.name || "",
          parent1_phone: student.parents[0]?.phone || "",
          parent1_email: student.parents[0]?.email || "",
          parent1_relationship: student.parents[0]?.relationship || "father",
          parent2_name: student.parents[1]?.name || "",
          parent2_phone: student.parents[1]?.phone || "",
          parent2_email: student.parents[1]?.email || "",
          parent2_relationship: student.parents[1]?.relationship || "mother",
        });

        // Store parent IDs
        setParentIds({
          parent1Id: student.parents[0]?.id,
          parent2Id: student.parents[1]?.id,
        });

        // Set existing profile picture if available
        if (student.profile_picture_url) {
          setExistingProfilePicture(student.profile_picture_url);
        }
      } else {
        setError("خطا در بارگذاری اطلاعات دانش‌آموز");
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
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

    if (!studentId) {
      setError("شناسه دانش‌آموز مشخص نشده است");
      return;
    }

    // Convert Persian digits to English digits
    const nationalId = convertPersianToEnglishDigits(studentForm.national_id);
    const parent1Phone = convertPersianToEnglishDigits(
      studentForm.parent1_phone
    );
    const parent2Phone = convertPersianToEnglishDigits(
      studentForm.parent2_phone
    );

    // Validation
    if (!studentForm.name || !nationalId || !studentForm.grade_level) {
      setError("لطفاً فیلدهای اجباری را پر کنید");
      return;
    }

    if (!studentForm.parent1_name || !parent1Phone) {
      setError("اطلاعات حداقل یکی از والدین ضروری است");
      return;
    }

    // Validate national ID (should be 10 digits)
    if (!/^\d{10}$/.test(nationalId)) {
      setError("کد ملی باید ۱۰ رقم باشد");
      return;
    }

    // Validate phone numbers
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(parent1Phone)) {
      setError("شماره همراه والد اول نامعتبر است");
      return;
    }

    // If parent2 phone is provided, parent2 name must also be provided
    if (parent2Phone && !studentForm.parent2_name) {
      setError("نام والد دوم را وارد کنید");
      return;
    }

    if (parent2Phone && !phoneRegex.test(parent2Phone)) {
      setError("شماره همراه والد دوم نامعتبر است");
      return;
    }

    setIsUpdatingStudent(true);

    try {
      // Create form data to handle file upload
      const formData = new FormData();

      // Add student data
      const studentData = {
        name: studentForm.name,
        national_id: nationalId,
        email: studentForm.email,
        grade_level: studentForm.grade_level,
      };

      // Add parent data
      const parentsData = [];

      // Parent 1 (always required)
      parentsData.push({
        id: parentIds.parent1Id,
        name: studentForm.parent1_name,
        phone: parent1Phone,
        email: studentForm.parent1_email,
        relationship: studentForm.parent1_relationship,
      });

      // Parent 2 (optional)
      if (studentForm.parent2_name || parent2Phone) {
        parentsData.push({
          id: parentIds.parent2Id,
          name: studentForm.parent2_name,
          phone: parent2Phone,
          email: studentForm.parent2_email,
          relationship: studentForm.parent2_relationship,
        });
      }

      formData.append("student", JSON.stringify(studentData));
      formData.append("parents", JSON.stringify(parentsData));

      // Update the form state with converted digits
      setStudentForm({
        ...studentForm,
        national_id: nationalId,
        parent1_phone: parent1Phone,
        parent2_phone: parent2Phone,
      });

      if (profilePicture) {
        formData.append("profile_picture", profilePicture);
      }

      const response = await fetch(`/api/principal/students/${studentId}`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess("اطلاعات دانش‌آموز با موفقیت به‌روزرسانی شد");

        // Redirect to students list after success
        setTimeout(() => {
          router.push("/dashboard/principal/students");
        }, 2000);
      } else {
        setError(data.error || "خطا در به‌روزرسانی اطلاعات دانش‌آموز");
        setIsUpdatingStudent(false);
      }
    } catch (error) {
      console.error("Error updating student:", error);
      setError("خطا در ارتباط با سرور");
      setIsUpdatingStudent(false);
    }
  };

  const resetForm = () => {
    // Reset to original data
    if (studentId) {
      fetchStudentData(studentId);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${bgClass}`} dir="rtl">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push("/dashboard/principal/students")}
              className={`group flex items-center gap-2 px-4 py-2 transition-all hover:gap-3 ${
                theme === "dark"
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium">بازگشت به لیست دانش‌آموزان</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1
                className={`text-3xl font-bold ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                ویرایش دانش‌آموز
              </h1>
              <p
                className={
                  theme === "dark"
                    ? "text-slate-400 mt-1"
                    : "text-slate-600 mt-1"
                }
              >
                در حال بارگذاری اطلاعات دانش‌آموز...
              </p>
            </div>
          </div>

          <div
            className={`${cardClass} rounded-2xl shadow-xl border overflow-hidden mt-8`}
          >
            <div className="p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass}`} dir="rtl">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push("/dashboard/principal/students")}
              className={`group flex items-center gap-2 px-4 py-2 transition-all hover:gap-3 ${
                theme === "dark"
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium">بازگشت به لیست دانش‌آموزان</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1
                className={`text-3xl font-bold ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                ویرایش دانش‌آموز
              </h1>
              <p
                className={
                  theme === "dark"
                    ? "text-slate-400 mt-1"
                    : "text-slate-600 mt-1"
                }
              >
                اطلاعات دانش‌آموز و والدین را به‌روزرسانی کنید
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div
              className={`${
                theme === "dark"
                  ? "bg-red-900/20 border-red-700"
                  : "bg-red-50 border-red-500"
              } border-r-4 p-4 rounded-lg shadow-sm animate-in slide-in-from-top-2`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${
                    theme === "dark" ? "bg-red-900/30" : "bg-red-100"
                  } flex items-center justify-center flex-shrink-0`}
                >
                  <AlertCircle
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-red-400" : "text-red-600"
                    }`}
                  />
                </div>
                <div className="flex-1 pt-1">
                  <h3
                    className={`font-semibold mb-1 ${
                      theme === "dark" ? "text-red-200" : "text-red-900"
                    }`}
                  >
                    خطا
                  </h3>
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-red-300" : "text-red-700"
                    }`}
                  >
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div
              className={`${
                theme === "dark"
                  ? "bg-green-900/20 border-green-700"
                  : "bg-green-50 border-green-500"
              } border-r-4 p-4 rounded-lg shadow-sm animate-in slide-in-from-top-2`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${
                    theme === "dark" ? "bg-green-900/30" : "bg-green-100"
                  } flex items-center justify-center flex-shrink-0`}
                >
                  <CheckCircle2
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}
                  />
                </div>
                <div className="flex-1 pt-1">
                  <h3
                    className={`font-semibold mb-1 ${
                      theme === "dark" ? "text-green-200" : "text-green-900"
                    }`}
                  >
                    موفقیت
                  </h3>
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-green-300" : "text-green-700"
                    }`}
                  >
                    {success}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Student Information Card */}
          <div
            className={`${cardClass} rounded-2xl shadow-xl border overflow-hidden`}
          >
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    اطلاعات دانش‌آموز
                  </h2>
                  <p className="text-blue-100 text-sm">اطلاعات شخصی و تحصیلی</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Picture */}
              <div className="flex justify-center">
                <div className="relative">
                  <div
                    className={`w-32 h-32 rounded-2xl overflow-hidden border-4 ${
                      theme === "dark" ? "border-slate-700" : "border-slate-100"
                    } shadow-lg`}
                  >
                    {profilePicturePreview ? (
                      <img
                        src={profilePicturePreview}
                        alt="پیش‌نمایش عکس پروفایل"
                        className="w-full h-full object-cover"
                      />
                    ) : existingProfilePicture ? (
                      <img
                        src={existingProfilePicture}
                        alt="عکس پروفایل فعلی"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center ${
                          theme === "dark"
                            ? "bg-gradient-to-br from-slate-700 to-slate-600"
                            : "bg-gradient-to-br from-slate-100 to-slate-200"
                        }`}
                      >
                        <User
                          className={`w-12 h-12 ${
                            theme === "dark"
                              ? "text-slate-500"
                              : "text-slate-400"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="profile-picture"
                    className="absolute -bottom-2 -right-2 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl hover:scale-110 transition-all"
                  >
                    <Edit className="w-5 h-5 text-white" />
                  </label>
                  <input
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <User className="w-4 h-4 text-blue-500" />
                    نام و نام خانوادگی
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentForm.name}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, name: e.target.value })
                    }
                    placeholder="نام کامل دانش‌آموز"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-blue-500 transition-all`}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <span className="text-sm">🆔</span>
                    کد ملی
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentForm.national_id}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        national_id: convertPersianToEnglishDigits(
                          e.target.value
                        ),
                      })
                    }
                    placeholder="0123456789"
                    maxLength={10}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-blue-500 transition-all`}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <Mail className="w-4 h-4 text-blue-500" />
                    ایمیل
                  </label>
                  <input
                    type="email"
                    value={studentForm.email}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, email: e.target.value })
                    }
                    placeholder="student@example.com"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-blue-500 transition-all`}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <GraduationCap className="w-4 h-4 text-blue-500" />
                    پایه تحصیلی
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={studentForm.grade_level}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        grade_level: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-blue-500 transition-all`}
                    required
                  >
                    <option value="">انتخاب پایه</option>
                    <option value="اول">اول</option>
                    <option value="دوم">دوم</option>
                    <option value="سوم">سوم</option>
                    <option value="چهارم">چهارم</option>
                    <option value="پنجم">پنجم</option>
                    <option value="ششم">ششم</option>
                    <option value="هفتم">هفتم</option>
                    <option value="هشتم">هشتم</option>
                    <option value="نهم">نهم</option>
                    <option value="دهم">دهم</option>
                    <option value="یازدهم">یازدهم</option>
                    <option value="دوازدهم">دوازدهم</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Parent 1 Information Card */}
          <div
            className={`${cardClass} rounded-2xl shadow-xl border overflow-hidden`}
          >
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">والد اول</h2>
                  <p className="text-purple-100 text-sm">
                    اطلاعات تماس و شناسایی
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <User className="w-4 h-4 text-violet-500" />
                    نام و نام خانوادگی
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentForm.parent1_name}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        parent1_name: e.target.value,
                      })
                    }
                    placeholder="نام کامل والد"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-violet-500 transition-all`}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <Phone className="w-4 h-4 text-violet-500" />
                    شماره همراه
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={studentForm.parent1_phone}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        parent1_phone: convertPersianToEnglishDigits(
                          e.target.value
                        ),
                      })
                    }
                    placeholder="09123456789"
                    maxLength={11}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-violet-500 transition-all`}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <Mail className="w-4 h-4 text-violet-500" />
                    ایمیل
                  </label>
                  <input
                    type="email"
                    value={studentForm.parent1_email}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        parent1_email: e.target.value,
                      })
                    }
                    placeholder="parent@example.com"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-violet-500 transition-all`}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <UserCircle className="w-4 h-4 text-violet-500" />
                    رابطه با دانش‌آموز
                  </label>
                  <select
                    value={studentForm.parent1_relationship}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        parent1_relationship: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-violet-500 transition-all`}
                  >
                    <option value="father">پدر</option>
                    <option value="mother">مادر</option>
                    <option value="guardian">نگهدار</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Parent 2 Information Card */}
          <div
            className={`${cardClass} rounded-2xl shadow-xl border overflow-hidden`}
          >
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">والد دوم</h2>
                  <p className="text-pink-100 text-sm">اطلاعات اختیاری</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <User className="w-4 h-4 text-pink-500" />
                    نام و نام خانوادگی
                  </label>
                  <input
                    type="text"
                    value={studentForm.parent2_name}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        parent2_name: e.target.value,
                      })
                    }
                    placeholder="نام کامل والد"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-pink-500 transition-all`}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <Phone className="w-4 h-4 text-pink-500" />
                    شماره همراه
                  </label>
                  <input
                    type="tel"
                    value={studentForm.parent2_phone}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        parent2_phone: convertPersianToEnglishDigits(
                          e.target.value
                        ),
                      })
                    }
                    placeholder="09123456789"
                    maxLength={11}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-pink-500 transition-all`}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <Mail className="w-4 h-4 text-pink-500" />
                    ایمیل
                  </label>
                  <input
                    type="email"
                    value={studentForm.parent2_email}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        parent2_email: e.target.value,
                      })
                    }
                    placeholder="parent@example.com"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-pink-500 transition-all`}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <UserCircle className="w-4 h-4 text-pink-500" />
                    رابطه با دانش‌آموز
                  </label>
                  <select
                    value={studentForm.parent2_relationship}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        parent2_relationship: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-pink-500 transition-all`}
                  >
                    <option value="father">پدر</option>
                    <option value="mother">مادر</option>
                    <option value="guardian">نگهدار</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className={`px-8 py-4 rounded-xl font-semibold border-2 transition-all shadow-sm hover:shadow ${
                theme === "dark"
                  ? "text-slate-300 bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                  : "text-slate-700 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              بازنشانی
            </button>
            <button
              type="submit"
              disabled={isUpdatingStudent}
              className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                isUpdatingStudent
                  ? "bg-slate-400 text-slate-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isUpdatingStudent ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  در حال به‌روزرسانی...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  به‌روزرسانی اطلاعات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
