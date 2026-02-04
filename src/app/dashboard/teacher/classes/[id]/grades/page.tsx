"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import { ArrowRight, Save, Plus } from "lucide-react";

interface Student {
  student_id: string;
  student_name: string;
  national_id: string;
}

interface Grade {
  id?: string;
  student_id: string;
  subject_name: string;
  grade_value: number | null;
  max_score: number;
  percentage: number | null;
  grade_letter: string | null;
  term: string | null;
  description: string | null;
  student_name: string;
  national_id: string;
}

interface ClassData {
  class_name: string;
  grade_level: string;
}

export default function ClassGradesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { theme } = useTheme();
  const router = useRouter();
  const [classId, setClassId] = useState<string>("");
  const [newSubject, setNewSubject] = useState("");
  const [newTerm, setNewTerm] = useState("");

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setClassId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (classId) {
      fetchClassGrades();
    }
  }, [classId]);

  const fetchClassGrades = useCallback(async () => {
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/grades`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setClassData(result.data.class);
          setStudents(result.data.students);
          setGrades(result.data.grades);
          setSubjects(result.data.subjects);
          setTerms(result.data.terms);
          setError(null);
        } else {
          setError("خطا در بارگیری نمرات کلاس");
        }
      } else {
        setError("خطا در بارگیری نمرات کلاس");
      }
    } catch (error) {
      console.error("Error fetching class grades:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const handleGradeChange = (
    studentId: string,
    subject: string,
    term: string | null,
    value: string
  ) => {
    const numericValue = value === "" ? null : parseFloat(value);

    setGrades((prevGrades) => {
      const existingGradeIndex = prevGrades.findIndex(
        (grade) =>
          grade.student_id === studentId &&
          grade.subject_name === subject &&
          grade.term === term
      );

      if (existingGradeIndex !== -1) {
        // Update existing grade
        const updatedGrades = [...prevGrades];
        const maxScore = updatedGrades[existingGradeIndex].max_score;

        let percentage = null;
        let letterGrade = null;

        if (numericValue !== null) {
          percentage = Math.min(
            100,
            Math.max(0, (numericValue / maxScore) * 100)
          );

          if (percentage >= 90) letterGrade = "A";
          else if (percentage >= 80) letterGrade = "B";
          else if (percentage >= 70) letterGrade = "C";
          else if (percentage >= 60) letterGrade = "D";
          else letterGrade = "F";
        }

        updatedGrades[existingGradeIndex] = {
          ...updatedGrades[existingGradeIndex],
          grade_value: numericValue,
          percentage,
          grade_letter: letterGrade,
        };

        return updatedGrades;
      } else {
        // Create new grade entry
        const student = students.find((s) => s.student_id === studentId);
        if (!student) return prevGrades;

        const maxScore = 100;
        let percentage = null;
        let letterGrade = null;

        if (numericValue !== null) {
          percentage = Math.min(
            100,
            Math.max(0, (numericValue / maxScore) * 100)
          );

          if (percentage >= 90) letterGrade = "A";
          else if (percentage >= 80) letterGrade = "B";
          else if (percentage >= 70) letterGrade = "C";
          else if (percentage >= 60) letterGrade = "D";
          else letterGrade = "F";
        }

        return [
          ...prevGrades,
          {
            student_id: studentId,
            subject_name: subject,
            grade_value: numericValue,
            max_score: maxScore,
            percentage,
            grade_letter: letterGrade,
            term: term,
            description: null,
            student_name: student.student_name,
            national_id: student.national_id,
          },
        ];
      }
    });
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      // Prepare grades data for submission
      const gradesToSave = grades.filter((grade) => grade.grade_value !== null);

      const response = await fetch(`/api/teacher/classes/${classId}/grades`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ grades: gradesToSave }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess("نمرات با موفقیت ذخیره شد");
        // Refresh the data
        fetchClassGrades();
      } else {
        setError(result.message || "خطا در ذخیره نمرات");
      }
    } catch (error) {
      console.error("Error saving grades:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  };

  const addSubject = () => {
    if (newSubject && !subjects.includes(newSubject)) {
      setSubjects([...subjects, newSubject]);
      setNewSubject("");
    }
  };

  const addTerm = () => {
    if (newTerm && !terms.includes(newTerm)) {
      setTerms([...terms, newTerm]);
      setNewTerm("");
    }
  };

  const getGradeForStudent = (
    studentId: string,
    subject: string,
    term: string | null
  ) => {
    return grades.find(
      (grade) =>
        grade.student_id === studentId &&
        grade.subject_name === subject &&
        grade.term === term
    );
  };

  const getLetterGradeColor = (letterGrade: string | null) => {
    if (!letterGrade)
      return theme === "dark" ? "text-slate-400" : "text-gray-500";

    switch (letterGrade) {
      case "A":
        return "text-green-500";
      case "B":
        return "text-blue-500";
      case "C":
        return "text-yellow-500";
      case "D":
        return "text-orange-500";
      case "F":
        return "text-red-500";
      default:
        return theme === "dark" ? "text-slate-400" : "text-gray-500";
    }
  };

  const getGradeColor = (percentage: number | null) => {
    if (percentage === null)
      return theme === "dark" ? "text-slate-400" : "text-gray-500";

    if (percentage >= 90) return "text-green-500";
    if (percentage >= 80) return "text-blue-500";
    if (percentage >= 70) return "text-yellow-500";
    if (percentage >= 60) return "text-orange-500";
    return "text-red-500";
  };

  const formatPercentage = (
    percentage: number | string | null | undefined
  ): string => {
    if (percentage === null || percentage === undefined) return "0.0";
    const num =
      typeof percentage === "number" ? percentage : parseFloat(percentage);
    return isNaN(num) ? "0.0" : num.toFixed(1);
  };

  const getNumericPercentage = (
    percentage: number | string | null | undefined
  ): number => {
    if (percentage === null || percentage === undefined) return 0;
    return typeof percentage === "number"
      ? percentage
      : parseFloat(percentage) || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            در حال بارگذاری...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-6" dir="rtl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            aria-label="بازگشت"
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            }`}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            خطا در بارگیری نمرات
          </h1>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            theme === "dark"
              ? "bg-red-500/10 border-red-500/20"
              : "bg-red-50 border-red-200"
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
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            aria-label="بازگشت"
            className={`p-2 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            }`}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1
              className={`text-xl sm:text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              نمرات کلاس: {classData?.class_name}
            </h1>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-slate-400" : "text-gray-500"
              }`}
            >
              پایه {classData?.grade_level}
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveGrades}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "در حال ذخیره..." : "ذخیره نمرات"}
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div
          className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
            theme === "dark"
              ? "bg-green-500/10 border border-green-500/20"
              : "bg-green-50 border border-green-200"
          }`}
        >
          <div
            className={`text-sm ${
              theme === "dark" ? "text-green-400" : "text-green-600"
            }`}
          >
            {success}
          </div>
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

      {/* Subjects and Terms Management */}
      <div
        className={`rounded-xl border p-4 mb-6 ${
          theme === "dark"
            ? "bg-slate-900/50 border-slate-800/50"
            : "bg-white border-gray-200"
        }`}
      >
        <h2
          className={`font-medium mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          مدیریت دروس و ترم‌ها
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Add Subject */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              افزودن درس جدید
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="نام درس"
                className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                  theme === "dark"
                    ? "bg-slate-800/50 border-slate-700/50 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                }`}
                aria-label="نام درس جدید"
              />
              <button
                onClick={addSubject}
                aria-label="افزودن درس"
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add Term */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              افزودن ترم جدید
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="نام ترم"
                className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                  theme === "dark"
                    ? "bg-slate-800/50 border-slate-700/50 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                }`}
                aria-label="نام ترم جدید"
              />
              <button
                onClick={addTerm}
                aria-label="افزودن ترم"
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div
        className={`rounded-xl border ${
          theme === "dark"
            ? "bg-slate-900/50 border-slate-800/50"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-slate-800">
          <h2
            className={`font-medium ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            نمرات دانش‌آموزان
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead
              className={
                theme === "dark"
                  ? "bg-slate-800/50 text-slate-400"
                  : "bg-gray-50 text-gray-500"
              }
            >
              <tr>
                <th className="text-right py-3 px-4 text-xs font-medium">
                  دانش‌آموز
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium">
                  کد ملی
                </th>
                {subjects.map((subject) => (
                  <th
                    key={subject}
                    colSpan={terms.length || 1}
                    className="text-center py-3 px-4 text-xs font-medium border-l border-gray-200 dark:border-slate-700"
                  >
                    {subject}
                  </th>
                ))}
              </tr>
              {terms.length > 0 && (
                <tr>
                  <th colSpan={2}></th>
                  {subjects.map((subject) =>
                    terms.map((term) => (
                      <th
                        key={`${subject}-${term}`}
                        className="text-center py-2 px-4 text-xs font-medium border-l border-gray-200 dark:border-slate-700"
                      >
                        {term}
                      </th>
                    ))
                  )}
                </tr>
              )}
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.student_id}
                  className={
                    theme === "dark"
                      ? "border-b border-slate-800/50 hover:bg-slate-800/30"
                      : "border-b border-gray-100 hover:bg-gray-50"
                  }
                >
                  <td
                    className={`py-3 px-4 text-sm ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {student.student_name}
                  </td>
                  <td
                    className={`py-3 px-4 text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    {student.national_id}
                  </td>
                  {subjects.map((subject) =>
                    terms.length > 0 ? (
                      terms.map((term) => {
                        const grade = getGradeForStudent(
                          student.student_id,
                          subject,
                          term
                        );
                        return (
                          <td
                            key={`${student.student_id}-${subject}-${term}`}
                            className="py-3 px-4 border-l border-gray-200 dark:border-slate-700"
                          >
                            <div className="flex flex-col items-end">
                              <label
                                htmlFor={`grade-${student.student_id}-${subject}-${term}`}
                                className="sr-only"
                              >
                                نمره {student.student_name} در درس {subject}{" "}
                                {term ? `ترم ${term}` : ""}
                              </label>
                              <input
                                id={`grade-${student.student_id}-${subject}-${term}`}
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={
                                  grade?.grade_value === null
                                    ? ""
                                    : grade?.grade_value || ""
                                }
                                onChange={(e) =>
                                  handleGradeChange(
                                    student.student_id,
                                    subject,
                                    term,
                                    e.target.value
                                  )
                                }
                                className={`w-20 px-2 py-1 rounded border text-sm text-center ${
                                  theme === "dark"
                                    ? "bg-slate-800/50 border-slate-700/50 text-white"
                                    : "bg-white border-gray-200 text-gray-900"
                                }`}
                                aria-label={`نمره ${
                                  student.student_name
                                } در درس ${subject} ${
                                  term ? `ترم ${term}` : ""
                                }`}
                              />
                              {grade?.percentage !== null && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`text-xs font-medium ${getGradeColor(
                                      getNumericPercentage(grade?.percentage)
                                    )}`}
                                  >
                                    {formatPercentage(grade?.percentage)}%
                                  </span>
                                  <span
                                    className={`text-xs font-medium ${getLetterGradeColor(
                                      grade?.grade_letter || null
                                    )}`}
                                  >
                                    {grade?.grade_letter}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })
                    ) : (
                      // If no terms, show a single column per subject
                      <td
                        key={`${student.student_id}-${subject}`}
                        className="py-3 px-4 border-l border-gray-200 dark:border-slate-700"
                      >
                        <div className="flex flex-col items-end">
                          <label
                            htmlFor={`grade-${student.student_id}-${subject}`}
                            className="sr-only"
                          >
                            نمره {student.student_name} در درس {subject}
                          </label>
                          <input
                            id={`grade-${student.student_id}-${subject}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={
                              getGradeForStudent(
                                student.student_id,
                                subject,
                                null
                              )?.grade_value === null
                                ? ""
                                : getGradeForStudent(
                                    student.student_id,
                                    subject,
                                    null
                                  )?.grade_value || ""
                            }
                            onChange={(e) =>
                              handleGradeChange(
                                student.student_id,
                                subject,
                                null,
                                e.target.value
                              )
                            }
                            className={`w-20 px-2 py-1 rounded border text-sm text-center ${
                              theme === "dark"
                                ? "bg-slate-800/50 border-slate-700/50 text-white"
                                : "bg-white border-gray-200 text-gray-900"
                            }`}
                            aria-label={`نمره ${student.student_name} در درس ${subject}`}
                          />
                          {getGradeForStudent(student.student_id, subject, null)
                            ?.percentage !== null && (
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-xs font-medium ${getGradeColor(
                                  getNumericPercentage(
                                    getGradeForStudent(
                                      student.student_id,
                                      subject,
                                      null
                                    )?.percentage
                                  )
                                )}`}
                              >
                                {formatPercentage(
                                  getGradeForStudent(
                                    student.student_id,
                                    subject,
                                    null
                                  )?.percentage
                                )}
                                %
                              </span>
                              <span
                                className={`text-xs font-medium ${getLetterGradeColor(
                                  getGradeForStudent(
                                    student.student_id,
                                    subject,
                                    null
                                  )?.grade_letter || null
                                )}`}
                              >
                                {
                                  getGradeForStudent(
                                    student.student_id,
                                    subject,
                                    null
                                  )?.grade_letter
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
