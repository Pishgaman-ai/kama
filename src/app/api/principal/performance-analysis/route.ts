import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import pool from "@/lib/database";
import logger from "@/lib/logger";
import type {
  PrincipalPerformanceAnalysisResponse,
  PerformanceAnalysisGranularity,
} from "@/lib/principalPerformanceAnalysis";

interface ClassFilterInput {
  schoolId: string;
  academicYear: string | null;
  gradeLevel: string[] | null;
  classId: string[] | null;
}

const DEFAULT_RANGE_DAYS = 30;

const addParam = (params: unknown[], value: unknown) => {
  params.push(value);
  return `$${params.length}`;
};

const buildClassFilter = ({
  schoolId,
  academicYear,
  gradeLevel,
  classId,
}: ClassFilterInput) => {
  const params: unknown[] = [schoolId];
  const filters: string[] = ["c.school_id = $1"];

  if (academicYear) {
    filters.push(`c.academic_year = $${params.length + 1}`);
    params.push(academicYear);
  }
  if (gradeLevel && gradeLevel.length > 0) {
    filters.push(`c.grade_level = ANY($${params.length + 1})`);
    params.push(gradeLevel);
  }
  if (classId && classId.length > 0) {
    filters.push(`c.id = ANY($${params.length + 1})`);
    params.push(classId);
  }

  return { where: filters.join(" AND "), params };
};

const normalizeDateOnly = (value: string, isEnd: boolean) => {
  const suffix = isEnd ? "T23:59:59.999" : "T00:00:00.000";
  const date = new Date(`${value}${suffix}`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateString = (date: Date) => date.toISOString().split("T")[0];

const computeDelta = (current: number, previous: number): {
  value: number;
  percent: number | null;
  direction: "up" | "down" | "neutral";
} => {
  const value = current - previous;
  const percent =
    previous === 0 ? null : parseFloat(((value / previous) * 100).toFixed(2));
  const direction: "up" | "down" | "neutral" = value === 0 ? "neutral" : value > 0 ? "up" : "down";
  return { value, percent, direction };
};
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined = undefined;

  try {
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      logger.logHttpRequest("warn", "Unauthorized access attempt", {
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "",
        userAgent: request.headers.get("user-agent") || "",
        url: request.url,
        method: request.method,
        statusCode: 401,
        responseTime: Date.now() - startTime,
      });

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user: { id: string; role: string; school_id: string };
    try {
      user = JSON.parse(sessionCookie.value);
      userId = user.id;
    } catch (parseError) {
      logger.error("Session cookie parse error", { error: parseError });
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    if (user.role !== "principal") {
      logger.logHttpRequest("warn", "Access denied - user not principal", {
        userId,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "",
        userAgent: request.headers.get("user-agent") || "",
        url: request.url,
        method: request.method,
        statusCode: 403,
        responseTime: Date.now() - startTime,
      });

      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const academicYearParam = searchParams.get("academic_year");
    const gradeLevelParam = searchParams
      .getAll("grade_level")
      .filter((value) => value.trim() !== "");
    const classIdParam = searchParams
      .getAll("class_id")
      .filter((value) => value.trim() !== "");
    const lessonIdParam = searchParams
      .getAll("lesson_id")
      .filter((value) => value.trim() !== "");
    const startDateParam = searchParams.get("start_date");
    const endDateParam = searchParams.get("end_date");

    const now = new Date();
    const defaultEnd = new Date(now);
    defaultEnd.setHours(23, 59, 59, 999);
    const defaultStart = new Date(defaultEnd);
    defaultStart.setDate(defaultStart.getDate() - (DEFAULT_RANGE_DAYS - 1));
    defaultStart.setHours(0, 0, 0, 0);

    const parsedStart =
      startDateParam ? normalizeDateOnly(startDateParam, false) : null;
    const parsedEnd = endDateParam ? normalizeDateOnly(endDateParam, true) : null;

    const startDate = (parsedStart ?? defaultStart) as Date;
    const endDate = (parsedEnd ?? defaultEnd) as Date;

    const rangeMs = endDate.getTime() - startDate.getTime();
    const previousEnd = new Date(startDate.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - rangeMs);
    const currentWeekEnd = new Date(endDate);
    const currentWeekStart = new Date(endDate);
    currentWeekStart.setDate(currentWeekStart.getDate() - 6);
    currentWeekStart.setHours(0, 0, 0, 0);
    if (currentWeekStart < startDate) {
      currentWeekStart.setTime(startDate.getTime());
    }
    const previousWeekEnd = new Date(currentWeekStart.getTime() - 1);
    const previousWeekStart = new Date(previousWeekEnd);
    previousWeekStart.setDate(previousWeekStart.getDate() - 6);
    previousWeekStart.setHours(0, 0, 0, 0);
    const currentWeekDays = Math.max(
      1,
      Math.ceil(
        (currentWeekEnd.getTime() - currentWeekStart.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    );

    const rangeDays = Math.max(
      1,
      Math.ceil(rangeMs / (1000 * 60 * 60 * 24))
    );
    const granularity: PerformanceAnalysisGranularity =
      rangeDays > 45 ? "week" : "day";

    const client = await pool.connect();

    try {
      const academicYearsResult = await client.query(
        `
        SELECT DISTINCT academic_year
        FROM classes
        WHERE school_id = $1 AND academic_year IS NOT NULL
        ORDER BY academic_year DESC
      `,
        [user.school_id]
      );

      const academicYears = academicYearsResult.rows
        .map((row) => row.academic_year as string)
        .filter(Boolean);

      const defaultAcademicYear = academicYears[0] ?? null;
      const selectedAcademicYear = academicYearParam ?? defaultAcademicYear;

      const gradeLevelsResult = await client.query(
        `
        SELECT DISTINCT grade_level
        FROM classes
        WHERE school_id = $1 AND grade_level IS NOT NULL
        ORDER BY grade_level
      `,
        [user.school_id]
      );

      const gradeLevels = gradeLevelsResult.rows
        .map((row) => row.grade_level as string)
        .filter(Boolean);

      const classFilterForOptions = buildClassFilter({
        schoolId: user.school_id,
        academicYear: selectedAcademicYear,
        gradeLevel: gradeLevelParam,
        classId: null,
      });

      const classesResult = await client.query(
        `
        SELECT id, name, grade_level, section, academic_year
        FROM classes c
        WHERE ${classFilterForOptions.where}
        ORDER BY name
      `,
        classFilterForOptions.params
      );

      const lessonsParams: unknown[] = [user.school_id];
      let lessonsWhere = "school_id = $1";
      if (gradeLevelParam.length > 0) {
        lessonsWhere += ` AND grade_level = ANY(${addParam(
          lessonsParams,
          gradeLevelParam
        )})`;
      }

      const lessonsResult = await client.query(
        `
        SELECT id, title, grade_level
        FROM lessons
        WHERE ${lessonsWhere}
        ORDER BY grade_level, title
      `,
        lessonsParams
      );

      const classFilter = buildClassFilter({
        schoolId: user.school_id,
        academicYear: selectedAcademicYear,
        gradeLevel: gradeLevelParam,
        classId: classIdParam,
      });

      const lessonTitles =
        lessonIdParam.length > 0
          ? (
              await client.query(
                `
                SELECT title
                FROM lessons
                WHERE id = ANY($1) AND school_id = $2
              `,
                [lessonIdParam, user.school_id]
              )
            ).rows.map((row) => row.title as string)
          : [];
      const totalClassesResult = await client.query(
        `
        SELECT COUNT(*) as count
        FROM classes c
        WHERE ${classFilter.where}
      `,
        classFilter.params
      );

      const newClassesParams = [...classFilter.params];
      const newClassesResult = await client.query(
        `
        SELECT COUNT(*) as count
        FROM classes c
        WHERE ${classFilter.where}
          AND c.created_at BETWEEN ${addParam(newClassesParams, startDate)}
          AND ${addParam(newClassesParams, endDate)}
      `,
        newClassesParams
      );

      const previousClassesParams = [...classFilter.params];
      const previousClassesResult = await client.query(
        `
        SELECT COUNT(*) as count
        FROM classes c
        WHERE ${classFilter.where}
          AND c.created_at BETWEEN ${addParam(
            previousClassesParams,
            previousStart
          )} AND ${addParam(previousClassesParams, previousEnd)}
      `,
        previousClassesParams
      );

      const activeStudentsParams = [...classFilter.params];
      const activeStudentsResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT COUNT(DISTINCT u.id) as count
        FROM class_memberships cm
        JOIN filtered_classes fc ON cm.class_id = fc.id
        JOIN users u ON u.id = cm.user_id
        WHERE cm.role = 'student' AND u.is_active = true
      `,
        activeStudentsParams
      );

      const newStudentsParams = [...classFilter.params];
      const newStudentsResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT COUNT(DISTINCT u.id) as count
        FROM class_memberships cm
        JOIN filtered_classes fc ON cm.class_id = fc.id
        JOIN users u ON u.id = cm.user_id
        WHERE cm.role = 'student'
          AND u.is_active = true
          AND cm.joined_at BETWEEN ${addParam(newStudentsParams, startDate)}
          AND ${addParam(newStudentsParams, endDate)}
      `,
        newStudentsParams
      );

      const previousStudentsParams = [...classFilter.params];
      const previousStudentsResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT COUNT(DISTINCT u.id) as count
        FROM class_memberships cm
        JOIN filtered_classes fc ON cm.class_id = fc.id
        JOIN users u ON u.id = cm.user_id
        WHERE cm.role = 'student'
          AND u.is_active = true
          AND cm.joined_at BETWEEN ${addParam(
            previousStudentsParams,
            previousStart
          )} AND ${addParam(previousStudentsParams, previousEnd)}
      `,
        previousStudentsParams
      );

      const activityParams = [...classFilter.params];
      const activityWhere = [
        `ea.activity_date BETWEEN ${addParam(
          activityParams,
          startDate
        )} AND ${addParam(activityParams, endDate)}`,
      ];
      if (lessonIdParam.length > 0) {
        activityWhere.push(
          `ea.subject_id = ANY(${addParam(activityParams, lessonIdParam)})`
        );
      }

      const activitiesResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT COUNT(*) as count
        FROM educational_activities ea
        JOIN filtered_classes fc ON ea.class_id = fc.id
        WHERE ${activityWhere.join(" AND ")}
      `,
        activityParams
      );

      const previousActivityParams = [...classFilter.params];
      const previousActivityWhere = [
        `ea.activity_date BETWEEN ${addParam(
          previousActivityParams,
          previousStart
        )} AND ${addParam(previousActivityParams, previousEnd)}`,
      ];
      if (lessonIdParam.length > 0) {
        previousActivityWhere.push(
          `ea.subject_id = ANY(${addParam(previousActivityParams, lessonIdParam)})`
        );
      }

      const previousActivitiesResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT COUNT(*) as count
        FROM educational_activities ea
        JOIN filtered_classes fc ON ea.class_id = fc.id
        WHERE ${previousActivityWhere.join(" AND ")}
      `,
        previousActivityParams
      );

      const gradesParams = [...classFilter.params];
      const gradesWhere = [
        `cg.created_at BETWEEN ${addParam(gradesParams, startDate)} AND ${addParam(
          gradesParams,
          endDate
        )}`,
      ];
      if (lessonTitles.length > 0) {
        gradesWhere.push(
          `cg.subject_name = ANY(${addParam(gradesParams, lessonTitles)})`
        );
      }

      const averageGradesResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT AVG(COALESCE(cg.percentage, (cg.grade_value / NULLIF(cg.max_score, 0)) * 100)) as average_score
        FROM class_grades cg
        JOIN filtered_classes fc ON cg.class_id = fc.id
        WHERE ${gradesWhere.join(" AND ")}
      `,
        gradesParams
      );

      const previousGradesParams = [...classFilter.params];
      const previousGradesWhere = [
        `cg.created_at BETWEEN ${addParam(
          previousGradesParams,
          previousStart
        )} AND ${addParam(previousGradesParams, previousEnd)}`,
      ];
      if (lessonTitles.length > 0) {
        previousGradesWhere.push(
          `cg.subject_name = ANY(${addParam(previousGradesParams, lessonTitles)})`
        );
      }

      const previousAverageGradesResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT AVG(COALESCE(cg.percentage, (cg.grade_value / NULLIF(cg.max_score, 0)) * 100)) as average_score
        FROM class_grades cg
        JOIN filtered_classes fc ON cg.class_id = fc.id
        WHERE ${previousGradesWhere.join(" AND ")}
      `,
        previousGradesParams
      );

      const examsParams = [...classFilter.params];
      const examsWhere = [
        `e.starts_at <= ${addParam(examsParams, endDate)}`,
        `(e.ends_at IS NULL OR e.ends_at >= ${addParam(examsParams, startDate)})`,
      ];
      if (lessonIdParam.length > 0) {
        examsWhere.push(
          `e.subject_id = ANY(${addParam(examsParams, lessonIdParam)})`
        );
      }

      const examsResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT
          COUNT(*) FILTER (WHERE e.status = 'draft') as draft,
          COUNT(*) FILTER (WHERE e.status = 'published') as published,
          COUNT(*) FILTER (WHERE e.status = 'active') as active,
          COUNT(*) as total
        FROM exams e
        JOIN filtered_classes fc ON e.class_id = fc.id
        WHERE ${examsWhere.join(" AND ")}
      `,
        examsParams
      );

      const previousExamsParams = [...classFilter.params];
      const previousExamsWhere = [
        `e.starts_at <= ${addParam(previousExamsParams, previousEnd)}`,
        `(e.ends_at IS NULL OR e.ends_at >= ${addParam(
          previousExamsParams,
          previousStart
        )})`,
      ];
      if (lessonIdParam.length > 0) {
        previousExamsWhere.push(
          `e.subject_id = ANY(${addParam(previousExamsParams, lessonIdParam)})`
        );
      }

      const previousExamsResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT COUNT(*) as total
        FROM exams e
        JOIN filtered_classes fc ON e.class_id = fc.id
        WHERE ${previousExamsWhere.join(" AND ")}
      `,
        previousExamsParams
      );

      const totalStudents = parseInt(activeStudentsResult.rows[0]?.count || "0");

      const assessmentParams = [...classFilter.params];
      const assessmentWindow = [
        `assessment_date BETWEEN ${addParam(
          assessmentParams,
          startDate
        )} AND ${addParam(assessmentParams, endDate)}`,
      ];
      if (lessonIdParam.length > 0) {
        assessmentWindow.push(
          `subject_id = ANY(${addParam(assessmentParams, lessonIdParam)})`
        );
      }

      const assessmentResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        ),
        assessed_students AS (
          SELECT student_id
          FROM life_skills_assessments lsa
          JOIN filtered_classes fc ON lsa.class_id = fc.id
          WHERE ${assessmentWindow.join(" AND ")}
          UNION
          SELECT student_id
          FROM active_life_assessments ala
          JOIN filtered_classes fc ON ala.class_id = fc.id
          WHERE ${assessmentWindow.join(" AND ")}
          UNION
          SELECT student_id
          FROM growth_development_assessments gda
          JOIN filtered_classes fc ON gda.class_id = fc.id
          WHERE ${assessmentWindow.join(" AND ")}
        )
        SELECT COUNT(DISTINCT student_id) as count
        FROM assessed_students
      `,
        assessmentParams
      );

      const previousAssessmentParams = [...classFilter.params];
      const previousAssessmentWindow = [
        `assessment_date BETWEEN ${addParam(
          previousAssessmentParams,
          previousStart
        )} AND ${addParam(previousAssessmentParams, previousEnd)}`,
      ];
      if (lessonIdParam.length > 0) {
        previousAssessmentWindow.push(
          `subject_id = ANY(${addParam(previousAssessmentParams, lessonIdParam)})`
        );
      }

      const previousAssessmentResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        ),
        assessed_students AS (
          SELECT student_id
          FROM life_skills_assessments lsa
          JOIN filtered_classes fc ON lsa.class_id = fc.id
          WHERE ${previousAssessmentWindow.join(" AND ")}
          UNION
          SELECT student_id
          FROM active_life_assessments ala
          JOIN filtered_classes fc ON ala.class_id = fc.id
          WHERE ${previousAssessmentWindow.join(" AND ")}
          UNION
          SELECT student_id
          FROM growth_development_assessments gda
          JOIN filtered_classes fc ON gda.class_id = fc.id
          WHERE ${previousAssessmentWindow.join(" AND ")}
        )
        SELECT COUNT(DISTINCT student_id) as count
        FROM assessed_students
      `,
        previousAssessmentParams
      );
      const activityTrendParams = [...classFilter.params];
      const activityTrendWhere = [
        `ea.activity_date BETWEEN ${addParam(
          activityTrendParams,
          startDate
        )} AND ${addParam(activityTrendParams, endDate)}`,
      ];
      if (lessonIdParam.length > 0) {
        activityTrendWhere.push(
          `ea.subject_id = ANY(${addParam(activityTrendParams, lessonIdParam)})`
        );
      }

      const activityTrendResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT
          DATE_TRUNC('${granularity}', ea.activity_date)::date as bucket,
          COUNT(*) as count,
          AVG(ea.quantitative_score) as average_score
        FROM educational_activities ea
        JOIN filtered_classes fc ON ea.class_id = fc.id
        WHERE ${activityTrendWhere.join(" AND ")}
        GROUP BY bucket
        ORDER BY bucket
      `,
        activityTrendParams
      );


      const classList = classesResult.rows.map((row) => {
        const gradeLevel = row.grade_level as string | null;
        const section = row.section as string | null;
        const baseName = row.name as string;
        const displayName = gradeLevel
          ? `${gradeLevel}-${section ? section : baseName}`
          : section
          ? `${baseName}-${section}`
          : baseName;
        return {
          id: row.id as string,
          name: displayName,
          gradeLevel,
        };
      });

      const classIds = classList.map((row) => row.id);
      let classComparison: PrincipalPerformanceAnalysisResponse["trends"]["classComparison"] =
        [];

      if (classIds.length > 0) {
        const classActivitiesResult = await client.query(
          `
          SELECT
            class_id,
            COUNT(*) as activity_count,
            AVG(quantitative_score) as average_score
          FROM educational_activities
          WHERE class_id = ANY($1)
            AND activity_date BETWEEN $2 AND $3
            ${lessonIdParam.length > 0 ? "AND subject_id = ANY($4)" : ""}
          GROUP BY class_id
        `,
          lessonIdParam.length > 0
            ? [classIds, startDate, endDate, lessonIdParam]
            : [classIds, startDate, endDate]
        );

        const activityMap = new Map<string, number>();
        const scoreMap = new Map<string, number | null>();
        classActivitiesResult.rows.forEach((row) => {
          activityMap.set(row.class_id, parseInt(row.activity_count || "0"));
          scoreMap.set(
            row.class_id,
            row.average_score !== null ? parseFloat(row.average_score) : null
          );
        });

        classComparison = classList.map((cls) => ({
          classId: cls.id,
          className: cls.name,
          gradeLevel: cls.gradeLevel,
          averageScore: scoreMap.get(cls.id) ?? null,
          activityVolume: activityMap.get(cls.id) ?? 0,
          assessmentCoverage: null,
        }));
      }

      const teacherJoinFilters: string[] = [];
      const teacherJoinParams: unknown[] = [user.school_id];

      teacherJoinFilters.push("c.school_id = $1");
      if (selectedAcademicYear) {
        teacherJoinFilters.push(
          `c.academic_year = ${addParam(
            teacherJoinParams,
            selectedAcademicYear
          )}`
        );
      }
      if (gradeLevelParam.length > 0) {
        teacherJoinFilters.push(
          `c.grade_level = ANY(${addParam(teacherJoinParams, gradeLevelParam)})`
        );
      }
      if (classIdParam.length > 0) {
        teacherJoinFilters.push(
          `c.id = ANY(${addParam(teacherJoinParams, classIdParam)})`
        );
      }
      if (lessonIdParam.length > 0) {
        teacherJoinFilters.push(
          `ta.subject_id = ANY(${addParam(teacherJoinParams, lessonIdParam)})`
        );
      }

      const teacherFiltersApplied =
        Boolean(selectedAcademicYear) ||
        gradeLevelParam.length > 0 ||
        classIdParam.length > 0;

      const teacherStatsResult = await client.query(
        `
        SELECT
          u.id,
          u.name,
          COUNT(DISTINCT ta.class_id) as classes_count,
          COUNT(DISTINCT ea.id) as activities_count,
          AVG(COALESCE(cg.percentage, (cg.grade_value / NULLIF(cg.max_score, 0)) * 100)) as average_score,
          MAX(ea.activity_date) as last_activity_date
        FROM users u
        LEFT JOIN teacher_assignments ta
          ON ta.teacher_id = u.id
          AND ta.removed_at IS NULL
        LEFT JOIN classes c
          ON c.id = ta.class_id
          AND ${teacherJoinFilters.join(" AND ")}
        LEFT JOIN educational_activities ea
          ON ea.teacher_id = u.id
          AND ea.class_id = c.id
          AND ea.activity_date BETWEEN ${addParam(
            teacherJoinParams,
            startDate
          )} AND ${addParam(teacherJoinParams, endDate)}
          ${lessonIdParam.length > 0 ? `AND ea.subject_id = ANY(${addParam(teacherJoinParams, lessonIdParam)})` : ""}
        LEFT JOIN class_grades cg
          ON cg.teacher_id = u.id
          AND cg.class_id = c.id
          AND cg.created_at BETWEEN ${addParam(
            teacherJoinParams,
            startDate
          )} AND ${addParam(teacherJoinParams, endDate)}
          ${lessonTitles.length > 0 ? `AND cg.subject_name = ANY(${addParam(teacherJoinParams, lessonTitles)})` : ""}
        WHERE u.school_id = $1 AND u.role = 'teacher' AND u.is_active = true
        ${teacherFiltersApplied ? "AND c.id IS NOT NULL" : ""}
        GROUP BY u.id, u.name
        ORDER BY activities_count DESC, u.name
      `,
        teacherJoinParams
      );

      const studentAcademicParams = [...classFilter.params];
      const studentAcademicResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        ),
        current_avg AS (
          SELECT ea.student_id,
                 AVG(ea.quantitative_score) as avg_score
          FROM educational_activities ea
          JOIN filtered_classes fc ON ea.class_id = fc.id
          WHERE ea.activity_date BETWEEN ${addParam(
            studentAcademicParams,
            currentWeekStart
          )} AND ${addParam(studentAcademicParams, currentWeekEnd)}
          AND ea.quantitative_score IS NOT NULL
          ${lessonIdParam.length > 0 ? `AND ea.subject_id = ANY(${addParam(studentAcademicParams, lessonIdParam)})` : ""}
          GROUP BY ea.student_id
        ),
        prev_avg AS (
          SELECT ea.student_id,
                 AVG(ea.quantitative_score) as avg_score
          FROM educational_activities ea
          JOIN filtered_classes fc ON ea.class_id = fc.id
          WHERE ea.activity_date BETWEEN ${addParam(
            studentAcademicParams,
            previousWeekStart
          )} AND ${addParam(studentAcademicParams, previousWeekEnd)}
          AND ea.quantitative_score IS NOT NULL
          ${lessonIdParam.length > 0 ? `AND ea.subject_id = ANY(${addParam(studentAcademicParams, lessonIdParam)})` : ""}
          GROUP BY ea.student_id
        )
        SELECT u.id,
               u.name,
               MIN(CASE WHEN c.section IS NOT NULL THEN c.name || '-' || c.section ELSE c.name END) as class_name,
               current_avg.avg_score as current_avg,
               prev_avg.avg_score as previous_avg,
               (current_avg.avg_score - prev_avg.avg_score) as delta
        FROM current_avg
        JOIN prev_avg ON current_avg.student_id = prev_avg.student_id
        JOIN users u ON u.id = current_avg.student_id
        LEFT JOIN class_memberships cm ON cm.user_id = u.id AND cm.role = 'student'
        LEFT JOIN classes c ON c.id = cm.class_id
        WHERE u.is_active = true
        GROUP BY u.id, u.name, current_avg.avg_score, prev_avg.avg_score
        ORDER BY delta ASC
        LIMIT 10
      `,
        studentAcademicParams
      );

      const studentEngagementParams = [...classFilter.params];
      const studentEngagementResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT u.id,
               u.name,
               MIN(CASE WHEN c.section IS NOT NULL THEN c.name || '-' || c.section ELSE c.name END) as class_name,
               COUNT(ea.id) as activity_count,
               MAX(ea.activity_date) as last_activity_date
        FROM users u
        JOIN class_memberships cm ON cm.user_id = u.id AND cm.role = 'student'
        JOIN filtered_classes fc ON cm.class_id = fc.id
        JOIN classes c ON c.id = fc.id
        LEFT JOIN educational_activities ea
          ON ea.student_id = u.id
          AND ea.class_id = fc.id
          AND ea.activity_date BETWEEN ${addParam(
            studentEngagementParams,
            currentWeekStart
          )} AND ${addParam(studentEngagementParams, currentWeekEnd)}
          ${lessonIdParam.length > 0 ? `AND ea.subject_id = ANY(${addParam(studentEngagementParams, lessonIdParam)})` : ""}
        WHERE u.is_active = true
        GROUP BY u.id, u.name
        ORDER BY activity_count ASC
        LIMIT 10
      `,
        studentEngagementParams
      );

      const studentAbsenceParams = [...classFilter.params];
      const studentAbsenceResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        ),
        filtered_students AS (
          SELECT DISTINCT u.id, u.name
          FROM users u
          JOIN class_memberships cm ON cm.user_id = u.id AND cm.role = 'student'
          JOIN filtered_classes fc ON cm.class_id = fc.id
          WHERE u.is_active = true
        ),
        activity_days AS (
          SELECT ea.student_id,
                 COUNT(DISTINCT ea.activity_date) as active_days
          FROM educational_activities ea
          JOIN filtered_classes fc ON ea.class_id = fc.id
          WHERE ea.activity_date BETWEEN ${addParam(
            studentAbsenceParams,
            currentWeekStart
          )} AND ${addParam(studentAbsenceParams, currentWeekEnd)}
          ${lessonIdParam.length > 0 ? `AND ea.subject_id = ANY(${addParam(studentAbsenceParams, lessonIdParam)})` : ""}
          GROUP BY ea.student_id
        )
        SELECT fs.id,
               fs.name,
               MIN(CASE WHEN c.section IS NOT NULL THEN c.name || '-' || c.section ELSE c.name END) as class_name,
               GREATEST(${addParam(studentAbsenceParams, currentWeekDays)} - COALESCE(activity_days.active_days, 0), 0) as absence_count
        FROM filtered_students fs
        LEFT JOIN activity_days ON activity_days.student_id = fs.id
        LEFT JOIN class_memberships cm ON cm.user_id = fs.id AND cm.role = 'student'
        LEFT JOIN classes c ON c.id = cm.class_id
        GROUP BY fs.id, fs.name, activity_days.active_days
        ORDER BY absence_count DESC, fs.name
        LIMIT 10
      `,
        studentAbsenceParams
      );

      const aiUsageParams = [...classFilter.params];
      const aiUsageResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT COUNT(*) as total,
               COUNT(*) FILTER (WHERE al.success = true) as success,
               AVG(al.processing_time_ms) as avg_time
        FROM ai_logs al
        JOIN answers a ON al.answer_id = a.id
        JOIN exams e ON a.exam_id = e.id
        JOIN filtered_classes fc ON e.class_id = fc.id
        WHERE al.created_at BETWEEN ${addParam(
          aiUsageParams,
          startDate
        )} AND ${addParam(aiUsageParams, endDate)}
        ${lessonIdParam.length > 0 ? `AND e.subject_id = ANY(${addParam(aiUsageParams, lessonIdParam)})` : ""}
      `,
        aiUsageParams
      );

      const aiModelParams = [...classFilter.params];
      const aiModelResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT COALESCE(al.ai_model_version, 'Unknown') as model,
               COUNT(*) as count
        FROM ai_logs al
        JOIN answers a ON al.answer_id = a.id
        JOIN exams e ON a.exam_id = e.id
        JOIN filtered_classes fc ON e.class_id = fc.id
        WHERE al.created_at BETWEEN ${addParam(
          aiModelParams,
          startDate
        )} AND ${addParam(aiModelParams, endDate)}
        ${lessonIdParam.length > 0 ? `AND e.subject_id = ANY(${addParam(aiModelParams, lessonIdParam)})` : ""}
        GROUP BY COALESCE(al.ai_model_version, 'Unknown')
        ORDER BY count DESC
      `,
        aiModelParams
      );

      const dataHealthClassParams = [...classFilter.params];
      const classesWithoutTeachersResult = await client.query(
        `
        SELECT COUNT(*) as count
        FROM classes c
        LEFT JOIN teacher_assignments ta
          ON ta.class_id = c.id AND ta.removed_at IS NULL
        WHERE ${classFilter.where}
          AND ta.id IS NULL
      `,
        dataHealthClassParams
      );

      const studentsWithoutParentsParams = [...classFilter.params];
      const studentsWithoutParentsResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT COUNT(DISTINCT u.id) as count
        FROM class_memberships cm
        JOIN filtered_classes fc ON cm.class_id = fc.id
        JOIN users u ON u.id = cm.user_id
        WHERE cm.role = 'student'
          AND u.is_active = true
          AND NOT EXISTS (
            SELECT 1 FROM parent_student_relations psr WHERE psr.student_id = u.id
          )
      `,
        studentsWithoutParentsParams
      );

      const missingFilesParams = [...classFilter.params];
      const missingFilesResult = await client.query(
        `
        WITH filtered_classes AS (
          SELECT id FROM classes c WHERE ${classFilter.where}
        )
        SELECT COUNT(*) as count
        FROM educational_activities ea
        JOIN filtered_classes fc ON ea.class_id = fc.id
        WHERE ea.activity_date BETWEEN ${addParam(
          missingFilesParams,
          startDate
        )} AND ${addParam(missingFilesParams, endDate)}
          AND (ea.question_file_url IS NULL OR ea.answer_file_url IS NULL)
      `,
        missingFilesParams
      );

      const aiErrorParams: unknown[] = [user.school_id, startDate, endDate];
      const aiErrorResult = await client.query(
        `
        SELECT COUNT(*) as count
        FROM logs l
        JOIN users u ON l.user_id = u.id
        WHERE u.school_id = $1
          AND l.timestamp BETWEEN $2 AND $3
          AND l.level = 'error'
          AND (
            l.url ILIKE '%ai%'
            OR l.message ILIKE '%ai%'
          )
      `,
        aiErrorParams
      );

      const authErrorParams: unknown[] = [user.school_id, startDate, endDate];
      const authErrorResult = await client.query(
        `
        SELECT COUNT(*) as count
        FROM logs l
        JOIN users u ON l.user_id = u.id
        WHERE u.school_id = $1
          AND l.timestamp BETWEEN $2 AND $3
          AND l.status_code IN (401, 403)
      `,
        authErrorParams
      );

      const trendMap = new Map<
        string,
        {
          educationalActivities: number;
          averageActivityScore: number | null;
          examSubmissions: number;
          gradeRecords: number;
        }
      >();
      const upsertTrend = (
        date: string,
        update: Partial<{
          educationalActivities: number;
          averageActivityScore: number | null;
          examSubmissions: number;
          gradeRecords: number;
        }>
      ) => {
        const existing = trendMap.get(date) ?? {
          educationalActivities: 0,
          averageActivityScore: null,
          examSubmissions: 0,
          gradeRecords: 0,
        };
        trendMap.set(date, {
          educationalActivities:
            update.educationalActivities ?? existing.educationalActivities,
          averageActivityScore:
            update.averageActivityScore ?? existing.averageActivityScore,
          examSubmissions: update.examSubmissions ?? existing.examSubmissions,
          gradeRecords: update.gradeRecords ?? existing.gradeRecords,
        });
      };

      activityTrendResult.rows.forEach((row) => {
        const dateKey = toDateString(new Date(row.bucket));
        upsertTrend(dateKey, {
          educationalActivities: parseInt(row.count || "0"),
          averageActivityScore:
            row.average_score !== null ? parseFloat(row.average_score) : null,
        });
      });

      const learningActivityTrend = Array.from(trendMap.entries())
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([date, counts]) => ({
          date,
          educationalActivities: counts.educationalActivities,
          averageActivityScore: counts.averageActivityScore,
          examSubmissions: counts.examSubmissions,
          gradeRecords: counts.gradeRecords,
        }));
      const examRow = examsResult.rows[0] || {};
      const previousExamRow = previousExamsResult.rows[0] || {};

      const assessmentCount = parseInt(assessmentResult.rows[0]?.count || "0");
      const previousAssessmentCount = parseInt(
        previousAssessmentResult.rows[0]?.count || "0"
      );

      const averageScoreCurrent = averageGradesResult.rows[0]?.average_score
        ? parseFloat(averageGradesResult.rows[0].average_score)
        : 0;
      const averageScorePrevious = previousAverageGradesResult.rows[0]
        ?.average_score
        ? parseFloat(previousAverageGradesResult.rows[0].average_score)
        : 0;

      const response: PrincipalPerformanceAnalysisResponse = {
        filters: {
          options: {
            academicYears,
            gradeLevels,
            classes: classesResult.rows.map((row) => ({
              id: row.id,
              name: row.name,
              gradeLevel: row.grade_level ?? null,
              section: row.section ?? null,
              academicYear: row.academic_year ?? null,
            })),
            lessons: lessonsResult.rows.map((row) => ({
              id: row.id,
              title: row.title,
              gradeLevel: row.grade_level ?? null,
            })),
          },
          defaults: {
            academicYear: defaultAcademicYear,
            dateRange: {
              start: toDateString(defaultStart),
              end: toDateString(defaultEnd),
            },
            gradeLevel: null,
            classId: null,
            lessonId: null,
          },
          current: {
            academicYear: selectedAcademicYear,
            dateRange: {
              start: toDateString(startDate),
              end: toDateString(endDate),
            },
            gradeLevel: gradeLevelParam.length > 0 ? gradeLevelParam : null,
            classId: classIdParam.length > 0 ? classIdParam : null,
            lessonId: lessonIdParam.length > 0 ? lessonIdParam : null,
          },
        },
        kpis: {
          cards: [
            {
              id: "active-classes",
              title: "Active classes",
              value: parseInt(totalClassesResult.rows[0]?.count || "0"),
              format: "number",
              delta: computeDelta(
                parseInt(newClassesResult.rows[0]?.count || "0"),
                parseInt(previousClassesResult.rows[0]?.count || "0")
              ),
              description: "Total classes for the selected academic year",
            },
            {
              id: "active-students",
              title: "Active students",
              value: totalStudents,
              format: "number",
              delta: computeDelta(
                parseInt(newStudentsResult.rows[0]?.count || "0"),
                parseInt(previousStudentsResult.rows[0]?.count || "0")
              ),
              description: "Students assigned to filtered classes",
            },
            {
              id: "educational-activities",
              title: "Educational activities",
              value: parseInt(activitiesResult.rows[0]?.count || "0"),
              format: "number",
              delta: computeDelta(
                parseInt(activitiesResult.rows[0]?.count || "0"),
                parseInt(previousActivitiesResult.rows[0]?.count || "0")
              ),
              description: "Activities recorded in the selected range",
            },
            {
              id: "average-performance",
              title: "Average academic performance",
              value: parseFloat(averageScoreCurrent.toFixed(2)),
              format: "percent",
              delta: computeDelta(averageScoreCurrent, averageScorePrevious),
              description: "Average grade percentage",
            },
            {
              id: "exam-status",
              title: "Exam status overview",
              value: parseInt(examRow.total || "0"),
              format: "number",
              delta: computeDelta(
                parseInt(examRow.total || "0"),
                parseInt(previousExamRow.total || "0")
              ),
              description: "Total exams in current window",
              breakdown: [
                {
                  label: "Draft",
                  value: parseInt(examRow.draft || "0"),
                },
                {
                  label: "Published",
                  value: parseInt(examRow.published || "0"),
                },
                {
                  label: "Active",
                  value: parseInt(examRow.active || "0"),
                },
              ],
            },
            {
              id: "skill-coverage",
              title: "Skill assessment coverage",
              value:
                totalStudents === 0
                  ? 0
                  : parseFloat(
                      ((assessmentCount / totalStudents) * 100).toFixed(2)
                    ),
              format: "percent",
              delta: computeDelta(
                totalStudents === 0 ? 0 : (assessmentCount / totalStudents) * 100,
                totalStudents === 0
                  ? 0
                  : (previousAssessmentCount / totalStudents) * 100
              ),
              description: "Share of students with at least one assessment",
            },
          ],
        },
        trends: {
          learningActivityTrend,
          classComparison,
        },
        insights: {
          teachers: teacherStatsResult.rows.map((row) => ({
            teacherId: row.id,
            teacherName: row.name,
            classesCount: parseInt(row.classes_count || "0"),
            activitiesCount: parseInt(row.activities_count || "0"),
            averageScore: row.average_score
              ? parseFloat(row.average_score)
              : null,
            lastActivityDate: row.last_activity_date
              ? new Date(row.last_activity_date).toISOString()
              : null,
          })),
          students: {
            academicDecline: studentAcademicResult.rows.map((row) => ({
              studentId: row.id,
              studentName: row.name,
              className: row.class_name ?? null,
              metricValue: row.delta ? parseFloat(row.delta) : null,
              metricLabel: "Average score decline versus previous period",
            })),
            lowEngagement: studentEngagementResult.rows.map((row) => ({
              studentId: row.id,
              studentName: row.name,
              className: row.class_name ?? null,
              metricValue: parseInt(row.activity_count || "0"),
              metricLabel: "Activities logged in range",
              lastActivityDate: row.last_activity_date
                ? new Date(row.last_activity_date).toISOString()
                : null,
            })),
            behavioralRisk: studentAbsenceResult.rows.map((row) => ({
              studentId: row.id,
              studentName: row.name,
              className: row.class_name ?? null,
              metricValue: parseInt(row.absence_count || "0"),
              metricLabel: "Days without activity",
            })),
          },
          aiUsage: {
            requestCount: parseInt(aiUsageResult.rows[0]?.total || "0"),
            successRate: aiUsageResult.rows[0]?.total
              ? parseFloat(
                  (
                    (parseInt(aiUsageResult.rows[0]?.success || "0") /
                      parseInt(aiUsageResult.rows[0]?.total || "1")) *
                    100
                  ).toFixed(2)
                )
              : 0,
            errorRate: aiUsageResult.rows[0]?.total
              ? parseFloat(
                  (
                    ((parseInt(aiUsageResult.rows[0]?.total || "0") -
                      parseInt(aiUsageResult.rows[0]?.success || "0")) /
                      parseInt(aiUsageResult.rows[0]?.total || "1")) *
                    100
                  ).toFixed(2)
                )
              : 0,
            averageResponseTimeMs: aiUsageResult.rows[0]?.avg_time
              ? parseFloat(aiUsageResult.rows[0].avg_time)
              : null,
            modelDistribution: aiModelResult.rows.map((row) => ({
              model: row.model,
              count: parseInt(row.count || "0"),
            })),
          },
        },
        actions: {
          items: [
            {
              id: "classes-without-teachers",
              title: "Classes without teachers",
              description: "Classes missing teacher assignments",
              count: parseInt(
                classesWithoutTeachersResult.rows[0]?.count || "0"
              ),
              actionUrl: "/dashboard/principal/classes",
              severity: "warning",
            },
            {
              id: "students-without-parents",
              title: "Students without parents",
              description: "Students missing parent relations",
              count: parseInt(
                studentsWithoutParentsResult.rows[0]?.count || "0"
              ),
              actionUrl: "/dashboard/principal/students",
              severity: "attention",
            },
            {
              id: "activities-missing-files",
              title: "Activities missing files",
              description: "Activities without question or answer files",
              count: parseInt(missingFilesResult.rows[0]?.count || "0"),
              actionUrl: "/dashboard/principal/bulk-activities",
              severity: "warning",
            },
            {
              id: "ai-errors",
              title: "Repeated AI errors",
              description: "Recurring failures in AI services",
              count: parseInt(aiErrorResult.rows[0]?.count || "0"),
              actionUrl: "/dashboard/principal/reports/ai",
              severity: "danger",
            },
            {
              id: "auth-errors",
              title: "Authentication errors",
              description: "Failed logins or blocked requests",
              count: parseInt(authErrorResult.rows[0]?.count || "0"),
              actionUrl: "/dashboard/principal/admin-tools",
              severity: "info",
            },
          ],
        },
        meta: {
          cacheKey: createHash("sha256")
            .update(
              JSON.stringify({
                academicYear: selectedAcademicYear,
                gradeLevel: gradeLevelParam.length > 0 ? gradeLevelParam : null,
                classId: classIdParam.length > 0 ? classIdParam : null,
                lessonId: lessonIdParam.length > 0 ? lessonIdParam : null,
                startDate: toDateString(startDate),
                endDate: toDateString(endDate),
              })
            )
            .digest("hex"),
          generatedAt: new Date().toISOString(),
          granularity,
        },
      };

      logger.logHttpRequest(
        "info",
        "Principal performance analysis generated",
        {
          userId,
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "",
          userAgent: request.headers.get("user-agent") || "",
          url: request.url,
          method: request.method,
          statusCode: 200,
          responseTime: Date.now() - startTime,
        }
      );

      return NextResponse.json(response);
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Principal performance analysis API error", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    logger.logHttpRequest("error", "Performance analysis API error", {
      userId,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "",
      userAgent: request.headers.get("user-agent") || "",
      url: request.url,
      method: request.method,
      statusCode: 500,
      responseTime: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: "Performance analysis failed" },
      { status: 500 }
    );
  }
}
