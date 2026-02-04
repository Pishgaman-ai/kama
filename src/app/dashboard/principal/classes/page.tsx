"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/app/components/ThemeContext";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  BookOpen,
  Users,
  Edit,
  Trash2,
  X,
  UserPlus,
  Loader2, // Add Loader2 icon
  ArrowLeft,
  Check,
} from "lucide-react";

interface Class {
  id: string;
  name: string;
  grade_level: string;
  section: string;
  academic_year: string;
  description: string;
  student_count: number;
  teacher_assignments: TeacherAssignment[];
  created_at: string;
}

interface TeacherAssignment {
  teacher_id: string;
  subject_id: string;
  teacher_name?: string;
  subject_name?: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: Subject[];
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  grade_level: string;
  teacher_count?: number;
  created_at: string;
}

// Add new interface for student
interface Student {
  id: string;
  name: string;
  national_id: string;
  email: string;
  grade_level: string;
  classes: {
    id: string;
    name: string;
    grade_level: string;
    section: string;
  }[];
}

// Update the StudentClass interface to match the API response
interface StudentClass {
  id: string;
  name: string;
  grade_level: string;
  section: string;
}

// Helper function to normalize grade levels
const normalizeGradeLevel = (grade: string): string => {
  const gradeMap: { [key: string]: string } = {
    '1': 'اول',
    '2': 'دوم',
    '3': 'سوم',
    '4': 'چهارم',
    '5': 'پنجم',
    '6': 'ششم',
    '7': 'هفتم',
    '8': 'هشتم',
    '9': 'نهم',
    '10': 'دهم',
    '11': 'یازدهم',
    '12': 'دوازدهم',
  };

  // If it's already in Persian format, return as is
  if (Object.values(gradeMap).includes(grade)) {
    return grade;
  }

  // If it's a number, convert to Persian
  return gradeMap[grade] || grade;
};

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  // Add students state
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Add new state for student assignment dialog
  const [isAssignStudentsDialogOpen, setIsAssignStudentsDialogOpen] =
    useState(false);
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { theme } = useTheme();

  const [classForm, setClassForm] = useState({
    name: "",
    grade_level: "",
    section: "",
    academic_year: new Date().getFullYear().toString(),
    description: "",
  });

  const [teacherAssignments, setTeacherAssignments] = useState<
    { teacher_id: string; subject_id: string }[]
  >([]);

  // Add state for selected subjects from MoE list
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Function to get current Persian year range (e.g., "1403-1404")
  function getCurrentPersianYearRange(): string {
    const currentYear = new Date().getFullYear();
    const persianYear = currentYear - 621;
    return `${persianYear}-${persianYear + 1}`;
  }

  // Function to generate a list of Persian year ranges for the dropdown
  function generatePersianYearOptions(): string[] {
    const currentYear = new Date().getFullYear();
    const currentPersianYear = currentYear - 621;
    const years = [];

    // Generate options for the last 5 years and next 5 years
    for (let i = -5; i <= 5; i++) {
      const year = currentPersianYear + i;
      years.push(`${year}-${year + 1}`);
    }

    return years;
  }

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchSubjects();
    fetchStudents(); // Add fetch students

    // Track the last time we refreshed data to prevent excessive refreshes
    let lastRefreshTime = Date.now();

    // Add event listener to refresh data when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        // Only refresh if it's been more than 30 seconds since last refresh
        if (now - lastRefreshTime > 30000) {
          fetchClasses();
          fetchStudents();
          lastRefreshTime = now;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/principal/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/principal/teachers");
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      // Fetch all subjects from Ministry of Education instead of just school subjects
      const response = await fetch("/api/subjects"); // This will fetch all MoE subjects
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/principal/students");
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match the expected structure and normalize grade levels
        const transformedStudents =
          data.students?.map((student: Student) => ({
            ...student,
            grade_level: normalizeGradeLevel(student.grade_level),
            classes: student.classes || [],
          })) || [];
        setStudents(transformedStudents);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleAddTeacherAssignment = () => {
    setTeacherAssignments([
      ...teacherAssignments,
      { teacher_id: "", subject_id: "" },
    ]);
  };

  // Add function to toggle subject selection
  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subjectId)) {
        return prev.filter((id) => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  const handleRemoveTeacherAssignment = (index: number) => {
    setTeacherAssignments(teacherAssignments.filter((_, i) => i !== index));
  };

  const handleTeacherAssignmentChange = (
    index: number,
    field: "teacher_id" | "subject_id",
    value: string
  ) => {
    const updated = [...teacherAssignments];
    updated[index][field] = value;
    setTeacherAssignments(updated);
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    // Set the class to delete and open the confirmation dialog
    setClassToDelete({ id: classId, name: className });
    setIsDeleteDialogOpen(true);
  };

  // Add function to confirm class deletion
  const confirmDeleteClass = async () => {
    if (!classToDelete) return;

    try {
      const response = await fetch(
        `/api/principal/classes/${classToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setSuccess("کلاس با موفقیت حذف شد");
        fetchClasses();
      } else {
        const data = await response.json();
        setError(data.error || "خطا در حذف کلاس");
      }
    } catch (error) {
      setError("خطا در ارتباط با سرور");
    } finally {
      // Close the dialog and reset the class to delete
      setIsDeleteDialogOpen(false);
      setClassToDelete(null);
    }
  };

  // Add function to cancel class deletion
  const cancelDeleteClass = () => {
    setIsDeleteDialogOpen(false);
    setClassToDelete(null);
  };

  // Add new function to open student assignment dialog
  const openAssignStudentsDialog = async (cls: Class) => {
    setCurrentClass(cls);
    setIsAssignStudentsDialogOpen(true);

    // Fetch students already assigned to this class
    try {
      const response = await fetch(`/api/principal/classes/${cls.id}/students`);
      if (response.ok) {
        const data = await response.json();
        // Pre-select students already assigned to this class
        const assignedStudentIds =
          data.students?.map((student: Student) => student.id) || [];
        setSelectedStudents(assignedStudentIds);
      }
    } catch (error) {
      console.error("Error fetching assigned students:", error);
    }
  };

  const resetForm = () => {
    setClassForm({
      name: "",
      grade_level: "",
      section: "",
      academic_year: new Date().getFullYear().toString(),
      description: "",
    });
    setTeacherAssignments([]);
    setSelectedSubjects([]); // Reset selected subjects
    setCurrentClass(null);
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.grade_level?.includes(searchTerm) ||
      cls.section?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add new state for selected students
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false); // New state for assignment process

  // Add state for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Add new function to assign students to class
  const handleAssignStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsAssigning(true); // Set assigning state to true

    if (!currentClass) {
      setError("خطا در تخصیص دانش‌آموزان");
      setIsAssigning(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/principal/classes/${currentClass.id}/students`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentIds: selectedStudents,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("دانش‌آموزان با موفقیت به کلاس تخصیص داده شدند");
        setIsAssignStudentsDialogOpen(false);
        setSelectedStudents([]);
        fetchClasses();
        fetchStudents();
      } else {
        setError(data.error || "خطا در تخصیص دانش‌آموزان");
      }
    } catch (error) {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsAssigning(false); // Always set assigning state to false when done
    }
  };

  // Add function to toggle student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Add function to toggle all students
  const toggleAllStudents = () => {
    if (!currentClass) return;

    // Get all students in the same grade level as the class who are not already assigned to this class
    const studentsInGrade = students
      .filter(
        (student) =>
          student.grade_level === currentClass.grade_level &&
          !isStudentInCurrentClass(student)
      )
      .map((student) => student.id);

    // If all are selected, deselect all; otherwise select all
    if (
      selectedStudents.filter(
        (id) =>
          students.find((s) => s.id === id)?.grade_level ===
          currentClass.grade_level
      ).length === studentsInGrade.length
    ) {
      // Deselect all students in this grade
      setSelectedStudents(
        selectedStudents.filter((id) => !studentsInGrade.includes(id))
      );
    } else {
      // Select all students in grade (merge with existing selections from other grades if any)
      const otherSelected = selectedStudents.filter(
        (id) =>
          !studentsInGrade.includes(id) ||
          students.find((s) => s.id === id)?.grade_level !==
            currentClass.grade_level
      );
      setSelectedStudents([...otherSelected, ...studentsInGrade]);
    }
  };

  // Update function to check if student is already assigned to this class
  const isStudentInCurrentClass = (student: Student) => {
    if (!currentClass) return false;
    return student.classes.some((cls) => cls.id === currentClass.id);
  };

  // Add function to check if student is assigned to another class
  const isStudentInOtherClass = (student: Student) => {
    if (!currentClass) return false;
    // Check if student is assigned to any class other than the current one
    return student.classes.some((cls) => cls.id !== currentClass.id);
  };

  // A student can be in multiple classes

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6" dir="rtl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              مدیریت کلاس‌ها
            </h1>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              لیست تمام کلاس‌های مدرسه
            </p>
          </div>
        </div>
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
                    نام کلاس
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    پایه تحصیلی
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    شعبه
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    سال تحصیلی
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    تعداد دانش‌آموزان
                  </th>
                  <th
                    className={`text-right p-4 font-medium ${
                      theme === "dark" ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    تعداد معلمان
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
                <tr>
                  <td colSpan={7} className="p-8">
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
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-xl sm:text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            مدیریت کلاس‌ها
          </h1>
          <p
            className={`mt-1 text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            مدیریت کلاس‌های مدرسه و تخصیص معلمان و دانش‌آموزان
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/principal/subjects"
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium text-sm sm:text-base whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            افزودن یا ویرایش دروس دلخواه
          </Link>

          <Link
            href="/dashboard/principal/classes/add"
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium text-sm sm:text-base whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            کلاس جدید
          </Link>
        </div>
      </div>

      {/* Success/Error Messages */}
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

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              theme === "dark" ? "text-slate-400" : "text-gray-400"
            }`}
          />
          <input
            type="text"
            placeholder="جستجو در کلاس‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pr-10 pl-4 py-3 rounded-xl border focus:ring-2 focus:outline-none ${
              theme === "dark"
                ? "bg-slate-800 border-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
                : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            }`}
            aria-label="جستجو در کلاس‌ها"
          />
        </div>
      </div>

      {/* Classes Table */}
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
                  نام کلاس
                </th>
                <th
                  className={`text-right p-4 font-medium ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  پایه تحصیلی
                </th>
                <th
                  className={`text-right p-4 font-medium ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  شعبه
                </th>
                <th
                  className={`text-right p-4 font-medium ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  سال تحصیلی
                </th>
                <th
                  className={`text-right p-4 font-medium ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  تعداد دانش‌آموزان
                </th>
                <th
                  className={`text-right p-4 font-medium ${
                    theme === "dark" ? "text-slate-300" : "text-gray-700"
                  }`}
                >
                  معلمان و دروس
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
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8">
                    <BookOpen
                      className={`w-16 h-16 mx-auto mb-4 ${
                        theme === "dark" ? "text-slate-600" : "text-gray-400"
                      }`}
                    />
                    <h3
                      className={`text-xl font-semibold mb-2 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {searchTerm ? "کلاسی یافت نشد" : "هنوز کلاسی ندارید"}
                    </h3>
                    <p
                      className={`text-sm mb-6 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      {searchTerm
                        ? "جستجوی دیگری امتحان کنید"
                        : "اولین کلاس خود را اضافه کنید"}
                    </p>
                    {!searchTerm && (
                      <Link
                        href="/dashboard/principal/classes/add"
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        افزودن اولین کلاس
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls) => (
                  <tr
                    key={cls.id}
                    className={`border-b ${
                      theme === "dark"
                        ? "border-slate-700 hover:bg-slate-800/50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            theme === "dark" ? "bg-slate-700" : "bg-gray-100"
                          }`}
                        >
                          <BookOpen
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
                          {cls.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {cls.grade_level || "-"}
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {cls.section || "-"}
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {cls.academic_year || "-"}
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{cls.student_count || 0} دانش‌آموز</span>
                      </div>
                    </td>
                    <td
                      className={`p-4 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      {/* Show teacher assignments with subject details */}
                      {cls.teacher_assignments &&
                      cls.teacher_assignments.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span>{cls.teacher_assignments.length} معلم</span>
                          <div className="text-xs mt-1">
                            {cls.teacher_assignments
                              .slice(0, 2)
                              .map((ta, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-1"
                                >
                                  <span className="font-medium">
                                    {ta.teacher_name}
                                  </span>
                                  <span>({ta.subject_name || "بدون درس"})</span>
                                </div>
                              ))}
                            {cls.teacher_assignments.length > 2 && (
                              <span className="text-slate-500">
                                و {cls.teacher_assignments.length - 2} معلم
                                دیگر...
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span>0 معلم</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {/* Add button for assigning students */}
                        <Link
                          href={`/dashboard/principal/classes/${cls.id}`}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-slate-700 text-slate-400"
                              : "hover:bg-gray-100 text-gray-500"
                          }`}
                          title="تخصیص دانش‌آموزان"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/principal/classes/edit?id=${cls.id}`}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-slate-700 text-slate-400"
                              : "hover:bg-gray-100 text-gray-500"
                          }`}
                          title="ویرایش"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClass(cls.id, cls.name)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-red-500/20 text-red-400"
                              : "hover:bg-red-50 text-red-500"
                          }`}
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Assign Students Dialog */}
      {isAssignStudentsDialogOpen && currentClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setIsAssignStudentsDialogOpen(false);
              setCurrentClass(null);
              setSelectedStudents([]);
            }}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 m-4">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  تخصیص دانش‌آموزان به کلاس {currentClass.name}
                </h2>
                <button
                  onClick={() => {
                    setIsAssignStudentsDialogOpen(false);
                    setCurrentClass(null);
                    setSelectedStudents([]);
                  }}
                  className={`group flex items-center gap-2 px-4 py-2 transition-all hover:gap-3 ${
                    theme === "dark"
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  <span className="font-medium">بازگشت به لیست کلاس‌ها</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleAssignStudents} className="p-6 space-y-6">
              {/* Error/Success Messages */}
              {error && (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5">
                      ❌
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5">
                      ✅
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {success}
                    </p>
                  </div>
                </div>
              )}

              {/* Students List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    همه دانش‌آموزان
                  </h3>
                  {students.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllStudents}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg ${
                        theme === "dark"
                          ? "text-slate-400 hover:bg-slate-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      aria-label={
                        selectedStudents.filter(
                          (id) =>
                            students.find((s) => s.id === id)?.grade_level ===
                            currentClass?.grade_level
                        ).length ===
                        students.filter(
                          (s) =>
                            s.grade_level === currentClass?.grade_level &&
                            !isStudentInCurrentClass(s)
                        ).length
                          ? "لغو انتخاب همه"
                          : "انتخاب همه"
                      }
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          selectedStudents.filter(
                            (id) =>
                              students.find((s) => s.id === id)?.grade_level ===
                              currentClass?.grade_level
                          ).length ===
                          students.filter(
                            (s) =>
                              s.grade_level === currentClass?.grade_level &&
                              !isStudentInCurrentClass(s)
                          ).length
                            ? "bg-blue-500 border-blue-500"
                            : theme === "dark"
                            ? "border-slate-600"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedStudents.filter(
                          (id) =>
                            students.find((s) => s.id === id)?.grade_level ===
                            currentClass?.grade_level
                        ).length ===
                          students.filter(
                            (s) =>
                              s.grade_level === currentClass?.grade_level &&
                              !isStudentInCurrentClass(s)
                          ).length && <Check className="w-3 h-3 text-white" />}
                      </div>
                      انتخاب همه
                    </button>
                  )}
                </div>

                {/* Show all students */}
                {students.length === 0 ? (
                  <div
                    className={`text-center py-8 rounded-lg border-2 border-dashed ${
                      theme === "dark" ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      هیچ دانش‌آموزی ثبت نشده است
                    </p>
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
                              theme === "dark"
                                ? "border-slate-700"
                                : "border-gray-200"
                            }`}
                          >
                            <th
                              className={`text-right p-4 font-medium ${
                                theme === "dark"
                                  ? "text-slate-300"
                                  : "text-gray-700"
                              }`}
                            >
                              انتخاب
                            </th>
                            <th
                              className={`text-right p-4 font-medium ${
                                theme === "dark"
                                  ? "text-slate-300"
                                  : "text-gray-700"
                              }`}
                            >
                              نام دانش‌آموز
                            </th>
                            <th
                              className={`text-right p-4 font-medium ${
                                theme === "dark"
                                  ? "text-slate-300"
                                  : "text-gray-700"
                              }`}
                            >
                              کد ملی
                            </th>
                            <th
                              className={`text-right p-4 font-medium ${
                                theme === "dark"
                                  ? "text-slate-300"
                                  : "text-gray-700"
                              }`}
                            >
                              پایه تحصیلی
                            </th>
                            <th
                              className={`text-right p-4 font-medium ${
                                theme === "dark"
                                  ? "text-slate-300"
                                  : "text-gray-700"
                              }`}
                            >
                              کلاس‌های فعلی
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student) => (
                            <tr
                              key={student.id}
                              className={`border-b ${
                                theme === "dark"
                                  ? "border-slate-700 hover:bg-slate-800/50"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <td className="p-4 text-center">
                                {isStudentInCurrentClass(student) ? (
                                  <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm">
                                    تخصیص داده شده
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleStudentSelection(student.id)
                                    }
                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                      selectedStudents.includes(student.id)
                                        ? "bg-blue-500 text-white"
                                        : "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
                                    }`}
                                  >
                                    {selectedStudents.includes(student.id)
                                      ? "لغو انتخاب"
                                      : "انتخاب"}
                                  </button>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      theme === "dark"
                                        ? "bg-slate-700"
                                        : "bg-gray-100"
                                    }`}
                                  >
                                    <Users
                                      className={`w-5 h-5 ${
                                        theme === "dark"
                                          ? "text-slate-300"
                                          : "text-gray-600"
                                      }`}
                                    />
                                  </div>
                                  <span
                                    className={`font-medium ${
                                      theme === "dark"
                                        ? "text-white"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {student.name}
                                  </span>
                                </div>
                              </td>
                              <td
                                className={`p-4 ${
                                  theme === "dark"
                                    ? "text-slate-400"
                                    : "text-gray-600"
                                }`}
                              >
                                {student.national_id}
                              </td>
                              <td
                                className={`p-4 ${
                                  theme === "dark"
                                    ? "text-slate-400"
                                    : "text-gray-600"
                                }`}
                              >
                                {student.grade_level}
                              </td>
                              <td className="p-4">
                                {student.classes &&
                                student.classes.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {student.classes.map((cls) => (
                                      <span
                                        key={cls.id}
                                        className={`text-xs px-2 py-1 rounded-full ${
                                          cls.id === currentClass?.id
                                            ? "bg-green-500/20 text-green-500"
                                            : theme === "dark"
                                            ? "bg-slate-700 text-slate-300"
                                            : "bg-gray-200 text-gray-700"
                                        }`}
                                      >
                                        {cls.name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span
                                    className={`text-xs ${
                                      theme === "dark"
                                        ? "text-slate-500"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    بدون کلاس
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignStudentsDialogOpen(false);
                    setCurrentClass(null);
                    setSelectedStudents([]);
                  }}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-slate-700 text-white hover:bg-slate-600"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  بستن
                </button>
                <button
                  type="submit"
                  disabled={selectedStudents.length === 0 || isAssigning}
                  className={`px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium flex items-center gap-2 ${
                    selectedStudents.length === 0 || isAssigning
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                  }`}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      در حال تخصیص...
                    </>
                  ) : (
                    `ذخیره تغییرات (${selectedStudents.length} انتخاب شده)`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={cancelDeleteClass}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 m-4">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  تأیید حذف کلاس
                </h2>
                <button
                  onClick={cancelDeleteClass}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="بستن"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  آیا از حذف کلاس مطمئن هستید؟
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  کلاس &quot;
                  <span className="font-semibold">{classToDelete.name}</span>
                  &quot; حذف خواهد شد. این عملیات غیر قابل بازگشت است.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={cancelDeleteClass}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteClass}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all font-medium"
                >
                  حذف کلاس
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
