"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { X, AlertCircle, CheckCircle2, Edit, User } from "lucide-react";

interface Parent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

interface StudentClass {
  id: string;
  name: string;
  grade_level: string;
  section: string;
}

interface Student {
  id: string;
  name: string;
  national_id: string;
  email?: string;
  phone?: string;
  grade_level?: string;
  classes: StudentClass[];
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

export default function EditStudentModal({
  isOpen,
  onClose,
  student,
  onSubmit,
  error,
  success,
  isAddingStudent,
}: {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSubmit: (formData: FormData) => void;
  error: string | null;
  success: string | null;
  isAddingStudent: boolean;
}) {
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

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);

  // Initialize form when student changes
  useEffect(() => {
    if (student) {
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
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!student) return;

    // Create form data to handle file upload
    const formData = new FormData();
    formData.append(
      "student",
      JSON.stringify({
        name: studentForm.name,
        national_id: studentForm.national_id,
        email: studentForm.email,
        grade_level: studentForm.grade_level,
      })
    );

    if (profilePicture) {
      formData.append("profile_picture", profilePicture);
    }

    onSubmit(formData);
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

  const resetForm = () => {
    if (student) {
      setStudentForm({
        name: student.name,
        national_id: student.national_id,
        email: student.email || "",
        grade_level: student.grade_level || "",
        parent1_name: "",
        parent1_phone: "",
        parent1_email: "",
        parent1_relationship: "father",
        parent2_name: "",
        parent2_phone: "",
        parent2_email: "",
        parent2_relationship: "mother",
      });
    }
    setProfilePicture(null);
    setProfilePicturePreview(null);
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          onClose();
          resetForm();
        }}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 m-4">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              ویرایش دانش‌آموز
            </h2>
            <button
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="بستن"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            اطلاعات دانش‌آموز و والدین را ویرایش کنید
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  {success}
                </p>
              </div>
            </div>
          )}

          {/* Student Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              اطلاعات دانش‌آموز
            </h3>

            {/* Profile Picture Upload */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div
                    className={`w-24 h-24 rounded-full overflow-hidden border-2 ${
                      theme === "dark" ? "border-slate-600" : "border-gray-300"
                    }`}
                  >
                    {profilePicturePreview ? (
                      <img
                        src={profilePicturePreview}
                        alt="پیش‌نمایش عکس پروفایل"
                        className="w-full h-full object-cover"
                      />
                    ) : student?.profile_picture_url ? (
                      <img
                        src={student.profile_picture_url}
                        alt={`عکس پروفایل ${student.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center ${
                          theme === "dark" ? "bg-slate-700" : "bg-gray-100"
                        }`}
                      >
                        <User
                          className={`w-8 h-8 ${
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-gray-500"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="profile-picture"
                    className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                      theme === "dark"
                        ? "bg-slate-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    aria-label="ویرایش عکس پروفایل"
                  >
                    <Edit className="w-4 h-4" />
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
                  className={`text-xs mt-2 ${
                    theme === "dark" ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  عکس پروفایل
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  نام و نام خانوادگی *
                </label>
                <input
                  type="text"
                  value={studentForm.name}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, name: e.target.value })
                  }
                  placeholder="نام کامل دانش‌آموز"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  کد ملی *
                </label>
                <input
                  type="text"
                  value={studentForm.national_id}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      national_id: e.target.value,
                    })
                  }
                  placeholder="0123456789"
                  maxLength={10}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  ایمیل (اختیاری)
                </label>
                <input
                  type="email"
                  value={studentForm.email}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="student@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  پایه تحصیلی *
                </label>
                <select
                  value={studentForm.grade_level}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      grade_level: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="انتخاب پایه تحصیلی"
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

          {/* Parent 1 Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              اطلاعات والد اول *
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  نام و نام خانوادگی
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
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  شماره همراه
                </label>
                <input
                  type="text"
                  value={studentForm.parent1_phone}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      parent1_phone: e.target.value,
                    })
                  }
                  placeholder="09123456789"
                  maxLength={11}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  ایمیل (اختیاری)
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
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  نسبت
                </label>
                <select
                  value={studentForm.parent1_relationship}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      parent1_relationship: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="رابطه والد اول"
                >
                  <option value="father">پدر</option>
                  <option value="mother">مادر</option>
                  <option value="guardian">سرپرست</option>
                </select>
              </div>
            </div>
          </div>

          {/* Parent 2 Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              اطلاعات والد دوم (اختیاری)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
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
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  شماره همراه
                </label>
                <input
                  type="text"
                  value={studentForm.parent2_phone}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      parent2_phone: e.target.value,
                    })
                  }
                  placeholder="09123456789"
                  maxLength={11}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  ایمیل (اختیاری)
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
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  نسبت
                </label>
                <select
                  value={studentForm.parent2_relationship}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      parent2_relationship: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="رابطه والد دوم"
                >
                  <option value="mother">مادر</option>
                  <option value="father">پدر</option>
                  <option value="guardian">سرپرست</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
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
              disabled={isAddingStudent}
              className={`px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium flex items-center gap-2 ${
                isAddingStudent
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
              }`}
            >
              {isAddingStudent ? "در حال افزودن..." : "افزودن دانش‌آموز"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
