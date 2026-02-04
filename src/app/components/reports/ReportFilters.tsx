"use client";

import React, { useState, useEffect, useRef } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface ReportFiltersProps {
  schools?: FilterOption[];
  classes?: FilterOption[];
  subjects?: FilterOption[];
  teachers?: FilterOption[];
  onFilterChange: (filters: {
    schoolId?: string;
    classId?: string;
    subjectId?: string;
    teacherId?: string;
    dateRange?: { start: string; end: string };
  }) => void;
  onExport?: () => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  schools = [],
  classes = [],
  subjects = [],
  teachers = [],
  onFilterChange,
  onExport,
}) => {
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const isInitialMount = useRef(true);

  // Apply filters when they change, but not on initial mount
  useEffect(() => {
    // Skip the first run to prevent calling onFilterChange on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    handleFilterChange();
  }, [
    selectedSchool,
    selectedClass,
    selectedSubject,
    selectedTeacher,
    dateRange,
  ]);

  const handleFilterChange = () => {
    onFilterChange({
      schoolId: selectedSchool || undefined,
      classId: selectedClass || undefined,
      subjectId: selectedSubject || undefined,
      teacherId: selectedTeacher || undefined,
      dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">فیلترها</h3>
        {onExport && (
          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          >
            <span className="ml-2">خروجی گرفتن</span>
            <span>📊</span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {schools.length > 0 && (
          <div>
            <label
              htmlFor="school-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              مدرسه
            </label>
            <select
              id="school-filter"
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">همه مدارس</option>
              {schools.map((school) => (
                <option key={school.value} value={school.value}>
                  {school.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {classes.length > 0 && (
          <div>
            <label
              htmlFor="class-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              کلاس
            </label>
            <select
              id="class-filter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">همه کلاس‌ها</option>
              {classes.map((classItem) => (
                <option key={classItem.value} value={classItem.value}>
                  {classItem.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {subjects.length > 0 && (
          <div>
            <label
              htmlFor="subject-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              درس
            </label>
            <select
              id="subject-filter"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">همه درس‌ها</option>
              {subjects.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {teachers.length > 0 && (
          <div>
            <label
              htmlFor="teacher-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              معلم
            </label>
            <select
              id="teacher-filter"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">همه معلمان</option>
              {teachers.map((teacher) => (
                <option key={teacher.value} value={teacher.value}>
                  {teacher.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            بازه زمانی
          </label>
          <div className="flex space-x-2">
            <input
              type="date"
              aria-label="تاریخ شروع"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="date"
              aria-label="تاریخ پایان"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;