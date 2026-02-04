"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/app/components/ThemeContext";
import { Plus, Upload } from "lucide-react";
import StudentFilters from "./components/StudentFilters";
import ViewStudentModal from "./components/ViewStudentModal";
import BulkStudentManagementModal from "./components/BulkStudentManagementModal";
import DeleteGradeModal from "./components/DeleteGradeModal";
import { useRouter } from "next/navigation";
import StudentTreeView from "./components/StudentTreeView";

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

export default function StudentsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewingStudent, setIsViewingStudent] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isBulkManagementOpen, setIsBulkManagementOpen] = useState(false);
  const [isDeleteGradeModalOpen, setIsDeleteGradeModalOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<{
    gradeLevel: string;
    studentCount: number;
    parentCount: number;
  } | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/principal/students");
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      } else {
        setError("بارگذاری لیست دانش‌آموزان با مشکل مواجه شد");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("آیا از حذف این دانش‌آموز اطمینان دارید؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/principal/students/${studentId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await fetchStudents();
        setSuccess("دانش‌آموز با موفقیت حذف شد");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "خطا در حذف دانش‌آموز");
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      setError("خطا در ارتباط با سرور");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteGrade = (
    gradeLevel: string,
    studentCount: number,
    parentCount: number
  ) => {
    setGradeToDelete({ gradeLevel, studentCount, parentCount });
    setIsDeleteGradeModalOpen(true);
  };

  const confirmDeleteGrade = async (gradeLevel: string) => {
    try {
      const response = await fetch("/api/principal/students/delete-grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gradeLevel }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await fetchStudents();
        setSuccess(result.message || "پایه با موفقیت حذف شد");
        setIsDeleteGradeModalOpen(false);
        setGradeToDelete(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "خطا در حذف پایه");
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting grade:", error);
      setError("خطا در ارتباط با سرور");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleViewStudent = (student: Student) => {
    setCurrentStudent(student);
    setIsViewingStudent(true);
  };

  const handleEditStudent = (student: Student) => {
    router.push(`/dashboard/principal/students/edit?id=${student.id}`);
  };

  const closeAllModals = () => {
    setIsViewingStudent(false);
    setIsBulkManagementOpen(false);
    setIsDeleteGradeModalOpen(false);
    setCurrentStudent(null);
    setGradeToDelete(null);
  };

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            مدیریت دانش‌آموزان
          </h1>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            لیست تمام دانش‌آموزان مدرسه
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setIsBulkManagementOpen(true)}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium text-sm sm:text-base whitespace-nowrap"
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            دانش‌آموزان دسته‌جمعی
          </button>

          <button
            onClick={() => router.push("/dashboard/principal/students/add")}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium text-sm sm:text-base whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            دانش‌آموز جدید
          </button>
        </div>
      </div>

      {/* Filters - Removed grade filter as requested */}
      <div className="mb-6">
        <StudentFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          students={students}
        />
      </div>

      {/* Messages */}
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

      {success && (
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

      {/* Students Tree View */}
      {isLoading ? (
        <div
          className={`rounded-xl border p-8 ${
            theme === "dark"
              ? "bg-slate-900/50 border-slate-800/50"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex flex-col items-center justify-center w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span
              className={`mt-3 ${
                theme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              در حال بارگذاری...
            </span>
          </div>
        </div>
      ) : (
        <StudentTreeView
          students={students}
          searchTerm={searchTerm}
          onViewStudent={handleViewStudent}
          onDeleteStudent={handleDeleteStudent}
          onEditStudent={handleEditStudent}
          onDeleteGrade={handleDeleteGrade}
        />
      )}

      {/* Modals */}
      {isViewingStudent && (
        <ViewStudentModal
          isOpen={isViewingStudent}
          onClose={closeAllModals}
          student={currentStudent}
          onEditStudent={(student) => {
            closeAllModals();
            handleEditStudent(student);
          }}
        />
      )}

      {isBulkManagementOpen && (
        <BulkStudentManagementModal
          isOpen={isBulkManagementOpen}
          onClose={closeAllModals}
          onUploadSuccess={fetchStudents}
        />
      )}

      {isDeleteGradeModalOpen && gradeToDelete && (
        <DeleteGradeModal
          isOpen={isDeleteGradeModalOpen}
          onClose={closeAllModals}
          gradeLevel={gradeToDelete.gradeLevel}
          studentCount={gradeToDelete.studentCount}
          parentCount={gradeToDelete.parentCount}
          onConfirm={confirmDeleteGrade}
        />
      )}
    </div>
  );
}
