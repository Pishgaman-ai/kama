"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Edit,
  BookOpen,
  ArrowLeft,
  Users,
  GraduationCap,
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

export default function AddClassPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [classForm, setClassForm] = useState<ClassForm>({
    name: "",
    grade_level: "",
    section: "",
    academic_year: getCurrentPersianYearRange(),
    description: "",
  });

  // Function to get current Persian year range (e.g., "1403-1404")
  function getCurrentPersianYearRange(): string {
    // For now, we'll use a simple approach to get the current Persian year
    // In a real implementation, you might want to use a proper Persian calendar library
    const currentYear = new Date().getFullYear();
    // Approximate conversion to Persian calendar year
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

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeLevelSubjects, setGradeLevelSubjects] = useState<Subject[]>([]);
  const [gradeLevels, setGradeLevels] = useState<{
    elementary: Array<{ value: string; label: string; lessonCount: number }>;
    middleSchool: Array<{ value: string; label: string; lessonCount: number }>;
    highSchool: Array<{ value: string; label: string; lessonCount: number }>;
  }>({ elementary: [], middleSchool: [], highSchool: [] });
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<
    { teacher_id: string; subject_id: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [newSubjectForm, setNewSubjectForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
    fetchGradeLevels();
  }, []);

  // Load subjects when grade level changes
  useEffect(() => {
    if (classForm.grade_level) {
      loadSubjectsForGradeLevel(classForm.grade_level);
    }
  }, [classForm.grade_level, subjects]);

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

  const fetchGradeLevels = async () => {
    try {
      const response = await fetch("/api/principal/grade-levels");
      if (response.ok) {
        const data = await response.json();
        setGradeLevels(data.gradeLevels || { elementary: [], middleSchool: [], highSchool: [] });
      }
    } catch (error) {
      console.error("Error fetching grade levels:", error);
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

        // Remove any potential duplicates by ID
        const uniqueSubjects = schoolSubjects.filter(
          (subject, index, self) =>
            index === self.findIndex((s) => s.id === subject.id)
        );

        setSubjects(uniqueSubjects);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const loadSubjectsForGradeLevel = async (gradeLevel: string) => {
    try {
      // First, sync curriculum lessons to ensure they exist in database
      const syncResponse = await fetch("/api/principal/sync-curriculum-lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade_level: gradeLevel }),
      });

      if (!syncResponse.ok) {
        console.error("Failed to sync curriculum lessons");
      }

      // Then fetch subjects again to get the updated list
      const schoolSubjectsResponse = await fetch("/api/principal/subjects");

      if (schoolSubjectsResponse.ok) {
        const schoolData = await schoolSubjectsResponse.json();
        const schoolSubjects: Subject[] = Object.values(
          schoolData.subjects || {}
        ).flat() as Subject[];

        const uniqueSubjects = schoolSubjects.filter(
          (subject, index, self) =>
            index === self.findIndex((s) => s.id === subject.id)
        );

        setSubjects(uniqueSubjects);

        // Filter subjects for the selected grade level
        const filtered = uniqueSubjects.filter(s => s.grade_level === gradeLevel);
        setGradeLevelSubjects(filtered);

        // Preserve existing teacher assignments when updating
        setTeacherAssignments(prev => {
          // Create a map of existing assignments
          const existingMap = new Map(prev.map(a => [a.subject_id, a.teacher_id]));

          // Create assignments for filtered subjects, preserving existing teacher_ids
          return filtered.map(subject => ({
            teacher_id: existingMap.get(subject.id) || "",
            subject_id: subject.id
          }));
        });
      }
    } catch (error) {
      console.error("Error loading subjects for grade level:", error);
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
    setTeacherAssignments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsAddingClass(true);

    if (!classForm.name || !classForm.grade_level) {
      setError("نام کلاس و پایه تحصیلی الزامی است");
      setIsAddingClass(false);
      return;
    }

    // Validate teacher assignments
    for (const assignment of teacherAssignments) {
      if (!assignment.teacher_id || !assignment.subject_id) {
        setError("لطفاً تمام اطلاعات معلمان و دروس را کامل کنید");
        setIsAddingClass(false);
        return;
      }
    }

    // Check for duplicate teacher-subject assignments
    const uniqueAssignments = new Set(
      teacherAssignments.map((a) => `${a.teacher_id}-${a.subject_id}`)
    );
    if (uniqueAssignments.size !== teacherAssignments.length) {
      setError("هر معلم فقط می‌تواند یک بار برای هر درس انتخاب شود");
      setIsAddingClass(false);
      return;
    }

    try {
      // Extract custom subjects with full information
      const customSubjects = subjects
        .filter((subject) => subject.id.startsWith("custom-"))
        .map((subject) => ({
          name: subject.name,
          code: subject.code,
          description: subject.description,
        }));

      const response = await fetch("/api/principal/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...classForm,
          teacher_assignments: teacherAssignments,
          selected_subjects: selectedSubjects,
          custom_subjects: customSubjects, // Send custom subjects with full information
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("کلاس با موفقیت ایجاد شد");

        // Redirect to classes list after success with a longer delay
        setTimeout(() => {
          router.push("/dashboard/principal/classes");
        }, 3000); // 3 seconds delay instead of 2 seconds
      } else {
        setError(data.error || "خطا در ایجاد کلاس");
      }
    } catch (error) {
      console.error("Error adding class:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsAddingClass(false);
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
    setSelectedSubjects([]);
  };

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
        // Fetch updated subjects list to include the new custom subject
        await fetchSubjects();

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
    // Filter by grade level
    if (classForm.grade_level && subject.grade_level !== classForm.grade_level) {
      return false;
    }

    // Exclude subjects that are already assigned
    const isAlreadyAssigned = teacherAssignments.some(
      (assignment) => assignment.subject_id === subject.id
    );

    return !isAlreadyAssigned;
  });

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
                افزودن کلاس جدید
              </h1>
              <p
                className={
                  theme === "dark"
                    ? "text-slate-400 mt-1"
                    : "text-slate-600 mt-1"
                }
              >
                لطفاً اطلاعات کلاس و معلمان مربوطه را وارد کنید
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
                    {gradeLevels.elementary.length > 0 && (
                      <optgroup label="دوره ابتدایی">
                        {gradeLevels.elementary.map((grade) => (
                          <option key={grade.value} value={grade.value}>
                            {grade.label} ({grade.lessonCount} درس)
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {gradeLevels.middleSchool.length > 0 && (
                      <optgroup label="دوره متوسطه اول">
                        {gradeLevels.middleSchool.map((grade) => (
                          <option key={grade.value} value={grade.value}>
                            {grade.label} ({grade.lessonCount} درس)
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {gradeLevels.highSchool.length > 0 && (
                      <optgroup label="دوره متوسطه دوم">
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
                      تخصیص معلمان به دروس
                    </h2>
                    <p className="text-pink-100 text-sm">
                      برای هر درس، معلم مربوطه را انتخاب کنید
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {classForm.grade_level ? (
                gradeLevelSubjects.length > 0 ? (
                  <div className="space-y-3">
                    {gradeLevelSubjects.map((subject, index) => {
                      const assignment = teacherAssignments.find(a => a.subject_id === subject.id);
                      return (
                        <div
                          key={subject.id}
                          className={`p-4 rounded-lg border ${
                            theme === "dark"
                              ? "bg-slate-700/50 border-slate-600"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  theme === "dark"
                                    ? "bg-slate-600"
                                    : "bg-blue-100"
                                }`}
                              >
                                <BookOpen
                                  className={`w-5 h-5 ${
                                    theme === "dark"
                                      ? "text-blue-400"
                                      : "text-blue-600"
                                  }`}
                                />
                              </div>
                            </div>

                            <div className="flex-1">
                              <h4
                                className={`font-medium ${
                                  theme === "dark"
                                    ? "text-white"
                                    : "text-gray-900"
                                }`}
                              >
                                {subject.name}
                              </h4>
                              {subject.description && (
                                <p
                                  className={`text-xs mt-1 ${
                                    theme === "dark"
                                      ? "text-slate-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {subject.description}
                                </p>
                              )}
                            </div>

                            <div className="flex-shrink-0 w-64">
                              <label className="block text-xs text-slate-400 mb-1">
                                انتخاب معلم
                              </label>
                              <select
                                value={assignment?.teacher_id || ""}
                                onChange={(e) => {
                                  const assignmentIndex = teacherAssignments.findIndex(a => a.subject_id === subject.id);
                                  if (assignmentIndex !== -1) {
                                    handleTeacherAssignmentChange(
                                      assignmentIndex,
                                      "teacher_id",
                                      e.target.value
                                    );
                                  }
                                }}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                  theme === "dark"
                                    ? "border-slate-600 bg-slate-700 text-white"
                                    : "border-gray-300 bg-white text-gray-900"
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className={`text-center py-8 rounded-lg border-2 border-dashed ${
                      theme === "dark" ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <BookOpen
                      className={`w-12 h-12 mx-auto mb-3 ${
                        theme === "dark" ? "text-slate-600" : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                      }`}
                    >
                      هیچ درسی برای این پایه/رشته تعریف نشده است
                    </p>
                    <p
                      className={`text-xs mt-2 ${
                        theme === "dark" ? "text-slate-500" : "text-gray-500"
                      }`}
                    >
                      لطفاً ابتدا در بخش "درس‌ها" دروس مورد نیاز را ایجاد کنید
                    </p>
                  </div>
                )
              ) : (
                <div
                  className={`text-center py-8 rounded-lg border-2 border-dashed ${
                    theme === "dark" ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <GraduationCap
                    className={`w-12 h-12 mx-auto mb-3 ${
                      theme === "dark" ? "text-slate-600" : "text-gray-400"
                    }`}
                  />
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    لطفاً ابتدا پایه تحصیلی و رشته را انتخاب کنید
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      theme === "dark" ? "text-slate-500" : "text-gray-500"
                    }`}
                  >
                    پس از انتخاب، دروس مربوطه به صورت خودکار نمایش داده می‌شود
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
              انصراف
            </button>
            <button
              type="submit"
              disabled={isAddingClass}
              className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                isAddingClass
                  ? "bg-slate-400 text-slate-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isAddingClass ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  در حال افزودن...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  افزودن کلاس
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
