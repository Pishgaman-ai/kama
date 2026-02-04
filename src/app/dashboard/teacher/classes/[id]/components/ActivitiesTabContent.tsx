"use client";

import React from "react";
import { useTheme } from "@/app/components/ThemeContext";
import BulkEducationalActivitiesModal from "./BulkEducationalActivitiesModal";
import StudentActivityList from "./StudentActivityList";
import ActivitiesTabHeader from "./ActivitiesTabHeader";
import { EducationalActivity, ActivityType, ClassDetailsData } from "../types";

interface ActivitiesTabContentProps {
  classData: ClassDetailsData;
  activities: Record<string, EducationalActivity[]>;
  activityTypes: ActivityType[];
  classId: string;
  subjectId: string;
  activitiesLoading: boolean;
  showBulkActivitiesModal: boolean;
  onAddActivity: (studentId?: string, activity?: EducationalActivity) => void;
  onDeleteActivity: (activityId: string) => void;
  onBulkUpload: () => void;
  onCloseBulkUpload: () => void;
  onUploadSuccess: () => void;
  getActivityTypeName: (typeId: string) => string;
  convertToPersianDate: (gregorianDate: string | null) => string;
}

export default function ActivitiesTabContent({
  classData,
  activities,
  activityTypes,
  classId,
  subjectId,
  activitiesLoading,
  showBulkActivitiesModal,
  onAddActivity,
  onDeleteActivity,
  onBulkUpload,
  onCloseBulkUpload,
  onUploadSuccess,
  getActivityTypeName,
  convertToPersianDate,
}: ActivitiesTabContentProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
        theme === "dark"
          ? "bg-slate-900/50 border-slate-800/50"
          : "bg-white border-gray-200"
      }`}
    >
      <ActivitiesTabHeader
        onAddActivity={() => onAddActivity()}
        onBulkUpload={onBulkUpload}
      />

      {activitiesLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <StudentActivityList
          students={classData.students}
          activities={activities}
          activityTypes={activityTypes}
          classId={classId}
          subjectId={subjectId}
          onAddActivity={onAddActivity}
          onDeleteActivity={onDeleteActivity}
          getActivityTypeName={getActivityTypeName}
          convertToPersianDate={convertToPersianDate}
        />
      )}

      {/* Bulk Activities Modal */}
      {showBulkActivitiesModal && classId && subjectId && (
        <BulkEducationalActivitiesModal
          isOpen={showBulkActivitiesModal}
          onClose={onCloseBulkUpload}
          onUploadSuccess={onUploadSuccess}
          classId={classId}
          subjectId={subjectId}
        />
      )}
    </div>
  );
}
