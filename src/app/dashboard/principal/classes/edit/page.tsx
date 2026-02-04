"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Edit,
  BookOpen,
  ArrowLeft,
  Users,
  GraduationCap,
  Save,
  Plus,
  X,
} from "lucide-react";
import { useTheme } from "@/app/components/ThemeContext";

interface ClassForm {
  name: string;
  grade_level: string;
  section: string;
  academic_year: string;
  description: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  grade_level: string;
}

// Add this interface for custom subject with delete capability
interface CustomSubject extends Subject {
  isCustom?: boolean;
}

interface TeacherAssignment {
  teacher_id: string;
  subject_id: string;
}

export default function EditClassPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("id");
  const { theme } = useTheme();
  const [classForm, setClassForm] = useState<ClassForm>({
    name: "",
    grade_level: "",
    section: "",
    academic_year: "",
    description: "",
  });

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<
    TeacherAssignment[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingClass, setIsUpdatingClass] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [newSubjectForm, setNewSubjectForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  // Add state for grade levels
  const [gradeLevels, setGradeLevels] = useState<{
    elementary: Array<{ value: string; label: string; lessonCount: number }>;
    middleSchool: Array<{ value: string; label: string; lessonCount: number }>;
    highSchool: Array<{ value: string; label: string; lessonCount: number }>;
  }>({ elementary: [], middleSchool: [], highSchool: [] });

  // Add state for curriculum lessons (standard lessons for selected grade)
  const [curriculumLessons, setCurriculumLessons] = useState<string[]>([]);

  // Add state for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  useEffect(() => {
    if (classId) {
      fetchGradeLevels();
      fetchClassData();
      fetchTeachers();
      fetchSubjects();
    } else {
      // Show error message instead of immediately redirecting
      setError("شناسه کلاس مشخص نشده است");
      setIsLoading(false);
    }
  }, [classId, router]);

  const fetchGradeLevels = async () => {
    try {
      const response = await fetch("/api/principal/grade-levels");
      if (response.ok) {
        const data = await response.json();
        setGradeLevels(data.gradeLevels);
      }
    } catch (error) {
      console.error("Error fetching grade levels:", error);
    }
  };

  const fetchCurriculumLessons = async (gradeLevel: string) => {
    if (!gradeLevel) {
      setCurriculumLessons([]);
      return;
    }

    try {
      // First, sync curriculum lessons to ensure they exist in database
      await fetch("/api/principal/sync-curriculum-lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade_level: gradeLevel }),
      });

      // Then fetch subjects again to get the updated list
      await fetchSubjects();
    } catch (error) {
      console.error("Error fetching curriculum lessons:", error);
    }
  };

  const fetchClassData = async () => {
    try {
      const response = await fetch(`/api/principal/classes/${classId}`);
      if (response.ok) {
        const data = await response.json();
        const classData = data.class;

        const gradeLevel = classData.grade_level || "";

        setClassForm({
          name: classData.name || "",
          grade_level: gradeLevel,
          section: classData.section || "",
          academic_year: classData.academic_year || "",
          description: classData.description || "",
        });

        // Fetch curriculum lessons for this grade level
        if (gradeLevel) {
          fetchCurriculumLessons(gradeLevel);
        }

        // Set selected subjects
        if (classData.subjects) {
          setSelectedSubjects(classData.subjects.map((s: Subject) => s.id));
        }

        // Set teacher assignments
        if (classData.teacher_assignments) {
          setTeacherAssignments(
            classData.teacher_assignments.map((ta: TeacherAssignment) => ({
              teacher_id: ta.teacher_id,
              subject_id: ta.subject_id,
            }))
          );
        }
      } else {
        setError("خطا در دریافت اطلاعات کلاس");
        // Don't redirect immediately, let the user see the error
      }
    } catch (error) {
      console.error("Error fetching class data:", error);
      setError("خطا در ارتباط با سرور");
      // Don't redirect immediately, let the user see the error
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
      // Fetch only lessons from the school (from lessons table)
      const schoolSubjectsResponse = await fetch("/api/principal/subjects");

      if (schoolSubjectsResponse.ok) {
        const schoolData = await schoolSubjectsResponse.json();
        // Flatten the subjectsByGrade object to get all subjects in a single array
        const schoolSubjects: Subject[] = Object.values(
          schoolData.subjects || {}
        ).flat() as Subject[];

        // Remove any potential duplicates by ID and ensure unique objects
        const uniqueSubjects = schoolSubjects
          .filter(
            (subject, index, self) =>
              index === self.findIndex((s) => s.id === subject.id)
          )
          .map((subject) => ({ ...subject })); // Create new objects to avoid reference issues

        setSubjects(uniqueSubjects);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const handleAddTeacherAssignment = () => {
    setTeacherAssignments([
      ...teacherAssignments,
      { teacher_id: "", subject_id: "" },
    ]);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsUpdatingClass(true);

    if (!classForm.name || !classForm.grade_level) {
      setError("نام کلاس و پایه تحصیلی الزامی است");
      setIsUpdatingClass(false);
      return;
    }

    // Validate teacher assignments
    for (const assignment of teacherAssignments) {
      if (!assignment.teacher_id || !assignment.subject_id) {
        setError("لطفاً تمام اطلاعات معلمان و دروس را کامل کنید");
        setIsUpdatingClass(false);
        return;
      }
    }

    // Check for duplicate teacher-subject assignments
    const uniqueAssignments = new Set(
      teacherAssignments.map((a) => `${a.teacher_id}-${a.subject_id}`)
    );
    if (uniqueAssignments.size !== teacherAssignments.length) {
      setError("هر معلم فقط می‌تواند یک بار برای هر درس انتخاب شود");
      setIsUpdatingClass(false);
      return;
    }

    try {
      // Prepare custom subjects data - send the actual subject names
      const customSubjectsData = [];

      // For each selected subject, check if it's a custom subject
      for (const subjectId of selectedSubjects) {
        // Find the subject in our subjects array
        const subject = subjects.find((s) => s.id === subjectId);
        if (subject) {
          // If it's a custom subject (starts with "custom-"), add it to our custom subjects data
          if (subjectId.startsWith("custom-")) {
            customSubjectsData.push({
              name: subject.name,
              code: subject.code,
              description: subject.description,
            });
          }
        }
      }

      const response = await fetch(`/api/principal/classes/${classId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...classForm,
          teacher_assignments: teacherAssignments,
          selected_subjects: selectedSubjects,
          custom_subjects: customSubjectsData, // Send custom subjects with full information
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("کلاس با موفقیت بروزرسانی شد");

        // Redirect to classes list after success with a longer delay
        setTimeout(() => {
          router.push("/dashboard/principal/classes");
        }, 3000); // 3 seconds delay instead of 2 seconds
      } else {
        setError(data.error || "خطا در بروزرسانی کلاس");
      }
    } catch (error) {
      console.error("Error updating class:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsUpdatingClass(false);
    }
  };

  const resetForm = () => {
    setClassForm({
      name: "",
      grade_level: "",
      section: "",
      academic_year: "",
      description: "",
    });
    setTeacherAssignments([]);
    setSelectedSubjects([]);
  };

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

  const handleAddCustomSubject = async () => {
    if (!newSubjectForm.name.trim()) {
      alert("نام درس الزامی است");
      return;
    }

    try {
      // Create the custom subject through the API so it's saved in the database
      const response = await fetch("/api/principal/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubjectForm.name,
          code: newSubjectForm.code || "",
          description: newSubjectForm.description || "",
          grade_level: classForm.grade_level || "",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the subjects list with the new subject that has the real ID
        const newSubject = {
          ...data.subject,
          isCustom: true,
          description: newSubjectForm.description || "",
          grade_level: classForm.grade_level || "",
        };

        setSubjects([...subjects, newSubject]);

        // Select this subject
        setSelectedSubjects([...selectedSubjects, data.subject.id]);

        // Reset form and close modal
        setNewSubjectForm({ name: "", code: "", description: "" });
        setIsAddSubjectModalOpen(false);
      } else {
        alert(data.error || "خطا در ایجاد درس دلخواه");
      }
    } catch (error) {
      console.error("Error creating custom subject:", error);
      alert("خطا در ارتباط با سرور");
    }
  };

  const resetNewSubjectForm = () => {
    setNewSubjectForm({ name: "", code: "", description: "" });
  };

  // Filter subjects based on selected grade level and exclude already assigned subjects
  const filteredSubjects = subjects.filter((subject) => {
    // Filter by grade level - include subjects with grade_level matching the class OR subjects with grade_level "همه"
    if (classForm.grade_level && subject.grade_level && subject.grade_level !== 'همه' && subject.grade_level !== classForm.grade_level) {
      return false;
    }

    // Exclude subjects that are already assigned
    const isAlreadyAssigned = teacherAssignments.some(
      (assignment) => assignment.subject_id === subject.id
    );

    return !isAlreadyAssigned;
  });

  if (isLoading) {
    return (
      <div
        className={`min-h-screen ${bgClass} flex items-center justify-center`}
        dir="rtl"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={theme === "dark" ? "text-slate-400" : "text-slate-600"}>
            در حال بارگذاری اطلاعات کلاس...
          </p>
        </div>
      </div>
    );
  }

  // Show error message if classId is not provided
  if (!classId) {
    return (
      <div
        className={`min-h-screen ${bgClass} flex items-center justify-center`}
        dir="rtl"
      >
        <div className="text-center max-w-md p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2
            className={`text-xl font-bold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            خطا در بارگذاری کلاس
          </h2>
          <p
            className={`mb-6 ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            شناسه کلاس مشخص نشده است. لطفاً از طریق لیست کلاس‌ها اقدام کنید.
          </p>
          <button
            onClick={() => router.push("/dashboard/principal/classes")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            بازگشت به لیست کلاس‌ها
          </button>
        </div>
      </div>
    );
  }

  // Show error message if there was an error loading the class
  if (error && !classForm.name) {
    return (
      <div
        className={`min-h-screen ${bgClass} flex items-center justify-center`}
        dir="rtl"
      >
        <div className="text-center max-w-md p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2
            className={`text-xl font-bold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            خطا در بارگذاری کلاس
          </h2>
          <p
            className={`mb-6 ${
              theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            {error}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setIsLoading(true);
                setError(null);
                fetchClassData();
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              تلاش مجدد
            </button>
            <button
              onClick={() => router.push("/dashboard/principal/classes")}
              className="px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            >
              بازگشت به لیست کلاس‌ها
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add function to handle subject deletion
  const handleDeleteSubject = async (subject: Subject) => {
    try {
      const response = await fetch(`/api/principal/subjects/${subject.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        // Remove the subject from the local state
        setSubjects(subjects.filter((s) => s.id !== subject.id));

        // If this subject was selected, remove it from selected subjects
        if (selectedSubjects.includes(subject.id)) {
          setSelectedSubjects(
            selectedSubjects.filter((id) => id !== subject.id)
          );
        }

        // Close the delete modal
        setIsDeleteModalOpen(false);
        setSubjectToDelete(null);

        // Show success message
        setSuccess("درس با موفقیت حذف شد");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "خطا در حذف درس");
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      setError("خطا در ارتباط با سرور");
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div className={`min-h-screen ${bgClass}`} dir="rtl">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header with Theme Toggle */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push("/dashboard/principal/classes")}
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
                ویرایش کلاس
              </h1>
              <p
                className={
                  theme === "dark"
                    ? "text-slate-400 mt-1"
                    : "text-slate-600 mt-1"
                }
              >
                اطلاعات کلاس و معلمان مربوطه را ویرایش کنید
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Class Information Card */}
          <div
            className={`${cardClass} rounded-2xl shadow-xl border overflow-hidden`}
          >
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">اطلاعات کلاس</h2>
                  <p className="text-blue-100 text-sm">اطلاعات اصلی کلاس</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    نام کلاس
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={classForm.name}
                    onChange={(e) =>
                      setClassForm({ ...classForm, name: e.target.value })
                    }
                    placeholder="مثال: ریاضی ۱"
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
                    <GraduationCap className="w-4 h-4 text-blue-500" />
                    پایه تحصیلی
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classForm.grade_level}
                    onChange={(e) =>
                      setClassForm({
                        ...classForm,
                        grade_level: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-blue-500 transition-all`}
                    required
                    title="انتخاب پایه تحصیلی"
                  >
                    <option value="">انتخاب پایه و رشته</option>

                    {/* ابتدایی */}
                    {gradeLevels.elementary.length > 0 && (
                      <optgroup label="ابتدایی">
                        {gradeLevels.elementary.map((grade) => (
                          <option key={grade.value} value={grade.value}>
                            {grade.label} ({grade.lessonCount} درس)
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {/* متوسطه اول */}
                    {gradeLevels.middleSchool.length > 0 && (
                      <optgroup label="متوسطه اول">
                        {gradeLevels.middleSchool.map((grade) => (
                          <option key={grade.value} value={grade.value}>
                            {grade.label} ({grade.lessonCount} درس)
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {/* متوسطه دوم */}
                    {gradeLevels.highSchool.length > 0 && (
                      <optgroup label="متوسطه دوم">
                        {gradeLevels.highSchool.map((grade) => (
                          <option key={grade.value} value={grade.value}>
                            {grade.label} ({grade.lessonCount} درس)
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <Users className="w-4 h-4 text-blue-500" />
                    شعبه
                  </label>
                  <input
                    type="text"
                    value={classForm.section}
                    onChange={(e) =>
                      setClassForm({ ...classForm, section: e.target.value })
                    }
                    placeholder="مثال: الف"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-blue-500 transition-all`}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                  >
                    <span className="text-sm">📅</span>
                    سال تحصیلی
                  </label>
                  <select
                    value={classForm.academic_year}
                    onChange={(e) =>
                      setClassForm({
                        ...classForm,
                        academic_year: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                      false
                    )} focus:outline-none focus:border-blue-500 transition-all`}
                    title="انتخاب سال تحصیلی"
                  >
                    <option value="">انتخاب سال تحصیلی</option>
                    {generatePersianYearOptions().map((yearRange) => (
                      <option key={yearRange} value={yearRange}>
                        {yearRange}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className={`flex items-center gap-2 text-sm font-semibold ${labelClass}`}
                >
                  <span className="text-sm">📝</span>
                  توضیحات
                </label>
                <textarea
                  value={classForm.description}
                  onChange={(e) =>
                    setClassForm({
                      ...classForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="توضیحات کلاس..."
                  className={`w-full px-4 py-3 rounded-xl border-2 ${inputClass(
                    false
                  )} focus:outline-none focus:border-blue-500 transition-all`}
                />
              </div>
            </div>
          </div>

          {/* Teacher Assignments Card */}
          <div
            className={`${cardClass} rounded-2xl shadow-xl border overflow-hidden`}
          >
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      تخصیص معلمان
                    </h2>
                    <p className="text-pink-100 text-sm">
                      معلمان و دروس مربوطه را انتخاب کنید
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddTeacherAssignment}
                  className="flex items-center gap-1 text-sm px-3 py-1 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  افزودن معلم
                </button>
              </div>
            </div>

            <div className="p-6">
              {classForm.grade_level ? (
                <div className="space-y-4">
                  {teacherAssignments.map((assignment, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                        <div className="space-y-2">
                          <label className="block text-xs text-slate-400">
                            معلم
                          </label>
                          <select
                            value={assignment.teacher_id || ""}
                            onChange={(e) =>
                              handleTeacherAssignmentChange(
                                index,
                                "teacher_id",
                                e.target.value
                              )
                            }
                            className={`w-full px-3 py-2 rounded-lg border ${
                              theme === "dark"
                                ? "border-slate-600 bg-slate-700 text-white"
                                : "border-gray-300 bg-gray-50 text-gray-900"
                            } text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            title="انتخاب معلم"
                          >
                            <option value="">انتخاب معلم</option>
                            {teachers.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs text-slate-400">
                            درس
                          </label>
                          <select
                            value={assignment.subject_id || ""}
                            onChange={(e) =>
                              handleTeacherAssignmentChange(
                                index,
                                "subject_id",
                                e.target.value
                              )
                            }
                            className={`w-full px-3 py-2 rounded-lg border ${
                              theme === "dark"
                                ? "border-slate-600 bg-slate-700 text-white"
                                : "border-gray-300 bg-gray-50 text-gray-900"
                            } text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            title="انتخاب درس"
                          >
                            <option value="">انتخاب درس</option>
                            {subjects
                              .filter((subject) => {
                                // Filter by grade level - include subjects with grade_level matching the class OR subjects with grade_level "همه"
                                if (classForm.grade_level && subject.grade_level && subject.grade_level !== 'همه' && subject.grade_level !== classForm.grade_level) {
                                  return false;
                                }

                                // Show current assignment's subject or unassigned subjects
                                if (assignment.subject_id === subject.id) {
                                  return true;
                                }

                                // Exclude subjects assigned to other assignments
                                const isAssignedElsewhere = teacherAssignments.some(
                                  (ta, i) => i !== index && ta.subject_id === subject.id
                                );

                                return !isAssignedElsewhere;
                              })
                              .map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                  {subject.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveTeacherAssignment(index)}
                        className="mt-7 p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        aria-label="حذف تخصیص معلم"
                      >
                        <svg
                          className="w-5 h-5 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
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
                    لطفاً ابتدا پایه تحصیلی کلاس را انتخاب کنید تا لیست دروس
                    مربوطه نمایش داده شود
                  </p>
                </div>
              )}
            </div>
          </div>

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
              disabled={isUpdatingClass}
              className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                isUpdatingClass
                  ? "bg-slate-400 text-slate-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isUpdatingClass ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  در حال بروزرسانی...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  بروزرسانی کلاس
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
