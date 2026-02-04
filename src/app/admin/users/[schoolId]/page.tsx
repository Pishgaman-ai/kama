"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Search,
  Eye,
  Edit3,
  Filter,
  School,
  Phone,
  Mail,
  IdCard,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useTheme } from "@/app/components/ThemeContext";
import UserEditModal from "../components/UserEditModal";

interface User {
  id: string;
  school_id: string;
  school_name: string;
  name: string;
  email?: string;
  phone?: string;
  national_id?: string;
  role: "student" | "teacher" | "parent" | "principal" | "school_admin";
  is_active: boolean;
  created_at: string;
  last_login?: string;
  password?: string;
}

export default function SchoolUsersPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const schoolId = params.schoolId as string;

  const [school, setSchool] = useState<{ id: string; name: string } | null>(
    null
  );
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const usersPerPage = 10;

  useEffect(() => {
    fetchSchool();
    fetchUsers();
  }, [schoolId, currentPage, selectedRole]);

  const fetchSchool = async () => {
    try {
      const response = await fetch(`/api/admin/schools/${schoolId}`);
      const result = await response.json();

      if (result.success) {
        setSchool(result.data.school);
      }
    } catch (err) {
      console.error("Error fetching school:", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole !== "all" && { role: selectedRole }),
        schoolId: schoolId,
      });

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setUsers(result.data.users);
        setTotalPages(result.data.pagination.pages);
      } else {
        setError(result.error || "خطا در بارگیری کاربران");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "student":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "teacher":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "parent":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "principal":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "school_admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchUsers();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRole("all");
    setCurrentPage(1);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowEditModal(true);
  };

  const handleSaveUser = async (
    user: Omit<User, "school_name" | "created_at">
  ) => {
    try {
      const url = user.id
        ? `/api/admin/users/${user.id}`
        : `/api/admin/users/create`;

      const method = user.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      const result = await response.json();

      if (result.success) {
        setShowEditModal(false);
        fetchUsers(); // Refresh the user list
      } else {
        // Handle error
        console.error("Error saving user:", result.error);
      }
    } catch (err) {
      console.error("Error saving user:", err);
    }
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

  return (
    <div className="p-4 sm:p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className={`p-2 rounded-lg transition-colors ${
            theme === "dark"
              ? "hover:bg-slate-800 text-slate-400"
              : "hover:bg-gray-100 text-gray-500"
          }`}
          aria-label="بازگشت"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <h1
          className={`text-2xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          کاربران مدرسه {school?.name}
        </h1>
        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium whitespace-nowrap shadow-sm mr-auto"
        >
          <Plus className="w-5 h-5" />
          <span>کاربر جدید</span>
        </button>
      </div>

      {/* Filters */}
      <div
        className={`rounded-2xl p-5 ${
          theme === "dark"
            ? "bg-slate-800/50 border border-slate-700/50"
            : "bg-white border border-gray-200"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو بر اساس نام، ایمیل، تلفن یا کد ملی..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pr-10 pl-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                theme === "dark"
                  ? "bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-blue-500/50 focus:border-blue-500/50"
                  : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500"
              }`}
            />
          </div>

          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              aria-label="فیلتر بر اساس نقش"
              className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                theme === "dark"
                  ? "bg-slate-700/50 border-slate-600 text-white focus:ring-blue-500/50 focus:border-blue-500/50"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              }`}
            >
              <option value="all">همه نقش‌ها</option>
              <option value="student">دانش‌آموز</option>
              <option value="teacher">معلم</option>
              <option value="parent">اولیا</option>
              <option value="principal">مدیر مدرسه</option>
              <option value="school_admin">مدیر سیستم</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
            >
              پاک کردن فیلترها
            </button>
            <button
              onClick={handleFilterChange}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              اعمال فیلترها
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className={`rounded-2xl p-4 border ${
            theme === "dark"
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          {error}
        </div>
      )}

      {/* Users Table */}
      {users.length === 0 ? (
        <div
          className={`text-center py-16 rounded-2xl border ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h3
            className={`text-xl font-semibold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {searchTerm || selectedRole !== "all"
              ? "کاربری یافت نشد"
              : "هنوز کاربری ندارید"}
          </h3>
          <p
            className={`mb-6 ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            {searchTerm || selectedRole !== "all"
              ? "جستجوی دیگری امتحان کنید"
              : "اولین کاربر را اضافه کنید"}
          </p>
          <button
            onClick={handleAddUser}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            افزودن اولین کاربر
          </button>
        </div>
      ) : (
        <div
          className={`rounded-2xl border overflow-hidden ${
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
                    theme === "dark" ? "border-slate-800" : "border-gray-200"
                  }`}
                >
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    کاربر
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    تماس
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    اطلاعات ورود
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    نقش
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
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b ${
                      theme === "dark"
                        ? "border-slate-800/50 hover:bg-slate-800/30"
                        : "border-gray-100 hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4
                            className={`font-medium ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {user.name}
                          </h4>
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-slate-400"
                                : "text-gray-500"
                            }`}
                          >
                            ایجاد شده:{" "}
                            {new Date(user.created_at).toLocaleDateString(
                              "fa-IR"
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-500" />
                            <span
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-slate-300"
                                  : "text-gray-700"
                              }`}
                            >
                              {user.phone}
                            </span>
                          </div>
                        )}
                        {user.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-500" />
                            <span
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-slate-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {user.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <IdCard className="w-4 h-4 text-slate-500" />
                          <span
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-gray-700"
                            }`}
                          >
                            {user.national_id || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-slate-400"
                                  : "text-gray-500"
                              }`}
                            >
                              رمز عبور:
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(user.id)}
                              className={`p-1 rounded ${
                                theme === "dark"
                                  ? "hover:bg-slate-700"
                                  : "hover:bg-gray-200"
                              }`}
                              aria-label="نمایش رمز عبور"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                          <span
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-gray-700"
                            }`}
                          >
                            {showPassword[user.id] ? "123456" : "••••••"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {user.is_active ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-green-400"
                                  : "text-green-600"
                              }`}
                            >
                              فعال
                            </span>
                          </>
                        ) : (
                          <>
                            <X className="w-5 h-5 text-red-500" />
                            <span
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-red-400"
                                  : "text-red-600"
                              }`}
                            >
                              غیرفعال
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                              : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                          }`}
                          title="ویرایش کاربر"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className={`px-4 py-3 flex items-center justify-between border-t ${
                theme === "dark"
                  ? "border-slate-800 bg-slate-800/30"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div
                className={`text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-gray-700"
                }`}
              >
                نمایش {(currentPage - 1) * usersPerPage + 1} تا{" "}
                {Math.min(currentPage * usersPerPage, users.length)} از{" "}
                {users.length} کاربر
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  title="صفحه قبلی"
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : theme === "dark"
                      ? "text-slate-400 hover:text-white hover:bg-slate-700"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === currentPage
                            ? theme === "dark"
                              ? "bg-blue-500 text-white"
                              : "bg-blue-500 text-white"
                            : theme === "dark"
                            ? "text-slate-300 hover:bg-slate-700"
                            : "text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  title="صفحه بعدی"
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : theme === "dark"
                      ? "text-slate-400 hover:text-white hover:bg-slate-700"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Edit Modal */}
      {showEditModal && (
        <UserEditModal
          user={selectedUser}
          schools={school ? [school] : []}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}
