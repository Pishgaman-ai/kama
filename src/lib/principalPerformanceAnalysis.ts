export type PerformanceAnalysisGranularity = "day" | "week";

export interface PerformanceAnalysisFilters {
  academicYear: string | null;
  dateRange: {
    start: string;
    end: string;
  };
  gradeLevel: string[] | null;
  classId: string[] | null;
  lessonId: string[] | null;
}

export interface PerformanceAnalysisFilterOptions {
  academicYears: string[];
  gradeLevels: string[];
  classes: Array<{
    id: string;
    name: string;
    gradeLevel: string | null;
    section: string | null;
    academicYear: string | null;
  }>;
  lessons: Array<{
    id: string;
    title: string;
    gradeLevel: string | null;
  }>;
}

export interface KpiDelta {
  value: number;
  percent: number | null;
  direction: "up" | "down" | "neutral";
}

export interface KpiBreakdownItem {
  label: string;
  value: number;
}

export interface PerformanceKpiCard {
  id: string;
  title: string;
  value: number;
  format: "number" | "percent";
  delta: KpiDelta;
  description: string;
  breakdown?: KpiBreakdownItem[];
}

export interface LearningActivityTrendPoint {
  date: string;
  educationalActivities: number;
  averageActivityScore: number | null;
  examSubmissions: number;
  gradeRecords: number;
}

export interface ClassComparisonItem {
  classId: string;
  className: string;
  gradeLevel: string | null;
  averageScore: number | null;
  activityVolume: number;
  assessmentCoverage: number | null;
}

export interface TeacherEngagementRow {
  teacherId: string;
  teacherName: string;
  classesCount: number;
  activitiesCount: number;
  averageScore: number | null;
  lastActivityDate: string | null;
}

export interface StudentAttentionRow {
  studentId: string;
  studentName: string;
  className: string | null;
  metricValue: number | null;
  metricLabel: string;
  lastActivityDate?: string | null;
}

export interface AiUsageMetrics {
  requestCount: number;
  successRate: number;
  errorRate: number;
  averageResponseTimeMs: number | null;
  modelDistribution: Array<{
    model: string;
    count: number;
  }>;
}

export interface ActionHealthItem {
  id: string;
  title: string;
  description: string;
  count: number;
  actionUrl: string;
  severity: "info" | "attention" | "warning" | "danger";
}

export interface PrincipalPerformanceAnalysisResponse {
  filters: {
    options: PerformanceAnalysisFilterOptions;
    defaults: PerformanceAnalysisFilters;
    current: PerformanceAnalysisFilters;
  };
  kpis: {
    cards: PerformanceKpiCard[];
  };
  trends: {
    learningActivityTrend: LearningActivityTrendPoint[];
    classComparison: ClassComparisonItem[];
  };
  insights: {
    teachers: TeacherEngagementRow[];
    students: {
      academicDecline: StudentAttentionRow[];
      lowEngagement: StudentAttentionRow[];
      behavioralRisk: StudentAttentionRow[];
    };
    aiUsage: AiUsageMetrics;
  };
  actions: {
    items: ActionHealthItem[];
  };
  meta: {
    cacheKey: string;
    generatedAt: string;
    granularity: PerformanceAnalysisGranularity;
  };
}
