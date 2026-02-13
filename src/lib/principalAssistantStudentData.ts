import type { PoolClient } from "pg";
import pool from "@/lib/database";

const STATEMENT_TIMEOUT_MS = 5000;
const DEFAULT_SEARCH_LIMIT = 10;
const MAX_SEARCH_LIMIT = 20;
const SUBJECT_CACHE_TTL_MS = 5 * 60 * 1000;
const subjectCache = new Map<string, { expiresAt: number; subjects: string[] }>();
// Note: Use lessons.title as primary source (subjects table is deprecated)
const NORMALIZED_SUBJECT_SQL =
  "regexp_replace(translate(COALESCE(l.title, ''), 'يك', 'یک'), '\\s+', ' ', 'g')";

export interface StudentClassInfo {
  id: string;
  name: string;
  grade_level: string | null;
  section: string | null;
}

export interface StudentSearchResult {
  id: string;
  name: string;
  grade_level: string;
  classes: StudentClassInfo[];
}

export interface ClassSearchResult {
  id: string;
  name: string;
  grade_level: string | null;
  section: string | null;
  academic_year: string | null;
}

export interface StudentIdentity {
  id: string;
  name: string;
  national_id: string;
  grade_level: string;
  classes: StudentClassInfo[];
}

export interface StudentActivity {
  activity_title: string;
  activity_type: string;
  activity_date: string | null;
  quantitative_score: number | null;
  qualitative_evaluation: string | null;
  subject_name: string | null;
  class_name: string | null;
}

export interface StudentActivitiesResult {
  student: StudentIdentity;
  activities: StudentActivity[];
  summary: {
    total_activities: number;
    average_score: number | null;
    last_activity_date: string | null;
  };
  subject_summaries?: Array<{
    subject: string | null;
    activity_count: number;
    average_score: number | null;
    last_activity_date: string | null;
  }>;
}

export interface StudentSummary {
  student: {
    id: string;
    name: string;
    grade_level: string;
    profile_picture_url?: string | null;
    national_id?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  classes: StudentClassInfo[];
  examStats: {
    overall_average: number | null;
    total_exams: number;
    lowest_score: number | null;
    highest_score: number | null;
  };
  subjectAverages: Array<{
    subject: string | null;
    average_score: number | null;
    exam_count: number;
  }>;
  recentExamGrades: Array<{
    exam_title: string | null;
    subject: string | null;
    percentage: number | null;
    total_score: number | null;
    max_score: number | null;
    created_at: string | null;
  }>;
  recentActivities: Array<{
    activity_title: string;
    activity_type: string;
    activity_date: string | null;
    quantitative_score: number | null;
    qualitative_evaluation: string | null;
    subject: string | null;
    class_name: string | null;
  }>;
}

export interface ClassPerformanceResult {
  classInfo: {
    id: string;
    name: string;
    grade_level: string | null;
    section: string | null;
    academic_year: string | null;
  };
  summary: {
    student_count: number;
    teacher_count: number;
    activities_count: number;
    average_activity_score: number | null;
    average_grade_percent: number | null;
    exams_count: number;
    published_exams_count: number;
    active_exams_count: number;
    last_activity_date: string | null;
  };
  subject_summaries: Array<{
    subject: string | null;
    activity_count: number;
    average_score: number | null;
    students_covered: number;
    teacher_name: string | null;
  }>;
  recent_activities: Array<{
    activity_date: string | null;
    activity_type: string;
    activity_title: string;
    subject_name: string | null;
    average_score: number | null;
    records_count: number;
    students_count: number;
  }>;
}

async function withReadOnlyClient<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    await client.query(
      `SET LOCAL statement_timeout = '${STATEMENT_TIMEOUT_MS}'`
    );
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback errors
    }
    throw error;
  } finally {
    client.release();
  }
}

function normalizeLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) return DEFAULT_SEARCH_LIMIT;
  return Math.max(1, Math.min(MAX_SEARCH_LIMIT, Math.floor(limit)));
}

export async function searchStudentsForPrincipal(params: {
  schoolId: string;
  name: string;
  gradeLevel?: string;
  className?: string;
  limit?: number;
}): Promise<StudentSearchResult[]> {
  const { schoolId, name, gradeLevel, className } = params;
  const limit = normalizeLimit(params.limit);
  const normalizedName = name
    .replace(/\u200c/g, " ")
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedName) {
    return [];
  }

  return withReadOnlyClient(async (client) => {
    const normalizedSql =
      "regexp_replace(translate(replace(u.name, chr(8204), ' '), 'يك', 'یک'), '\\s+', ' ', 'g')";
    const queryParams: Array<string | number> = [schoolId, `%${normalizedName}%`];
    const conditions: string[] = [
      "u.school_id = $1",
      "u.role = 'student'",
      `${normalizedSql} ILIKE $2`,
    ];

    const nameParts = normalizedName
      .split(" ")
      .map((part) => part.trim())
      .filter((part) => part.length >= 2);

    for (const part of nameParts) {
      queryParams.push(`%${part}%`);
      const idx = queryParams.length;
      conditions.push(`${normalizedSql} ILIKE $${idx}`);
    }

    if (gradeLevel) {
      queryParams.push(gradeLevel);
      const idx = queryParams.length;
      conditions.push(
        `(u.profile->>'grade_level' = $${idx} OR c.grade_level = $${idx})`
      );
    }

    if (className) {
      queryParams.push(`%${className.trim()}%`);
      const idx = queryParams.length;
      conditions.push(`c.name ILIKE $${idx}`);
    }

    queryParams.push(limit);
    const limitIdx = queryParams.length;

    const result = await client.query(
      `
      SELECT
        u.id,
        u.name,
        COALESCE(u.profile->>'grade_level', '') AS grade_level,
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', c.id,
              'name', c.name,
              'grade_level', c.grade_level,
              'section', c.section
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'::jsonb
        ) AS classes
      FROM users u
      LEFT JOIN class_memberships cm ON u.id = cm.user_id AND cm.role = 'student'
      LEFT JOIN classes c ON cm.class_id = c.id
      WHERE ${conditions.join(" AND ")}
      GROUP BY u.id, u.name, u.profile
      ORDER BY u.name
      LIMIT $${limitIdx}
      `,
      queryParams
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      grade_level: row.grade_level || "",
      classes: Array.isArray(row.classes) ? row.classes : [],
    }));
  });
}

export async function searchClassesForPrincipal(params: {
  schoolId: string;
  name: string;
  gradeLevel?: string;
  academicYear?: string;
  limit?: number;
}): Promise<ClassSearchResult[]> {
  const { schoolId, name, gradeLevel, academicYear } = params;
  const limit = normalizeLimit(params.limit);
  const normalizedName = name
    .replace(/\u200c/g, " ")
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedName) return [];

  return withReadOnlyClient(async (client) => {
    const queryParams: Array<string | number> = [schoolId, `%${normalizedName}%`];
    const conditions: string[] = [
      "c.school_id = $1",
      "(c.name ILIKE $2 OR CONCAT_WS(' ', c.name, c.section, c.grade_level) ILIKE $2)",
    ];

    if (gradeLevel) {
      queryParams.push(gradeLevel);
      conditions.push(`c.grade_level = $${queryParams.length}`);
    }

    if (academicYear) {
      queryParams.push(academicYear);
      conditions.push(`c.academic_year = $${queryParams.length}`);
    }

    const nameParts = normalizedName
      .split(" ")
      .map((part) => part.trim())
      .filter((part) => part.length >= 2);

    for (const part of nameParts) {
      queryParams.push(`%${part}%`);
      conditions.push(
        `(c.name ILIKE $${queryParams.length} OR CONCAT_WS(' ', c.name, c.section, c.grade_level) ILIKE $${queryParams.length})`
      );
    }

    queryParams.push(limit);

    const result = await client.query(
      `
      SELECT
        c.id,
        c.name,
        c.grade_level,
        c.section,
        c.academic_year
      FROM classes c
      WHERE ${conditions.join(" AND ")}
      ORDER BY c.name
      LIMIT $${queryParams.length}
      `,
      queryParams
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      grade_level: row.grade_level ?? null,
      section: row.section ?? null,
      academic_year: row.academic_year ?? null,
    }));
  });
}

export async function getStudentSummaryForPrincipal(params: {
  schoolId: string;
  studentId: string;
  includeSensitive?: boolean;
}): Promise<StudentSummary | null> {
  const { schoolId, studentId, includeSensitive } = params;

  return withReadOnlyClient(async (client) => {
    const studentResult = await client.query(
      `
      SELECT
        id,
        name,
        national_id,
        email,
        phone,
        profile_picture_url,
        COALESCE(profile->>'grade_level', '') AS grade_level
      FROM users
      WHERE id = $1 AND school_id = $2 AND role = 'student'
      `,
      [studentId, schoolId]
    );

    if (studentResult.rows.length === 0) {
      return null;
    }

    const studentRow = studentResult.rows[0];

    const classesResult = await client.query(
      `
      SELECT
        c.id,
        c.name,
        c.grade_level,
        c.section
      FROM classes c
      JOIN class_memberships cm ON c.id = cm.class_id
      WHERE cm.user_id = $1 AND cm.role = 'student'
      ORDER BY c.grade_level, c.section, c.name
      `,
      [studentId]
    );

    const examStatsResult = await client.query(
      `
      SELECT
        AVG(percentage) AS overall_average,
        COUNT(*) AS total_exams,
        MIN(percentage) AS lowest_score,
        MAX(percentage) AS highest_score
      FROM exam_grades
      WHERE student_id = $1 AND percentage IS NOT NULL
      `,
      [studentId]
    );

    const subjectAveragesResult = await client.query(
      `
      SELECT
        l.title AS subject,
        AVG(eg.percentage) AS average_score,
        COUNT(*) AS exam_count
      FROM exam_grades eg
      JOIN exams e ON eg.exam_id = e.id
      LEFT JOIN lessons l ON e.subject_id = l.id
      WHERE eg.student_id = $1 AND eg.percentage IS NOT NULL
      GROUP BY l.title
      ORDER BY average_score DESC
      `,
      [studentId]
    );

    const recentExamGradesResult = await client.query(
      `
      SELECT
        e.title AS exam_title,
        l.title AS subject,
        eg.percentage,
        eg.total_score,
        eg.max_score,
        eg.created_at
      FROM exam_grades eg
      JOIN exams e ON eg.exam_id = e.id
      LEFT JOIN lessons l ON e.subject_id = l.id
      WHERE eg.student_id = $1
      ORDER BY eg.created_at DESC NULLS LAST
      LIMIT 5
      `,
      [studentId]
    );

    const recentActivitiesResult = await client.query(
      `
      SELECT
        ea.activity_title,
        ea.activity_type,
        ea.activity_date,
        ea.quantitative_score,
        ea.qualitative_evaluation,
        l.title AS subject,
        c.name AS class_name
      FROM educational_activities ea
      LEFT JOIN lessons l ON ea.subject_id = l.id
      LEFT JOIN classes c ON ea.class_id = c.id
      WHERE ea.student_id = $1
      ORDER BY ea.activity_date DESC NULLS LAST, ea.created_at DESC NULLS LAST
      LIMIT 5
      `,
      [studentId]
    );

    const student = {
      id: studentRow.id,
      name: studentRow.name,
      grade_level: studentRow.grade_level || "",
      profile_picture_url: studentRow.profile_picture_url,
      national_id: includeSensitive ? studentRow.national_id : null,
      email: includeSensitive ? studentRow.email : null,
      phone: includeSensitive ? studentRow.phone : null,
    };

    return {
      student,
      classes: classesResult.rows,
      examStats: {
        overall_average: examStatsResult.rows[0]?.overall_average ?? null,
        total_exams: parseInt(examStatsResult.rows[0]?.total_exams || "0", 10),
        lowest_score: examStatsResult.rows[0]?.lowest_score ?? null,
        highest_score: examStatsResult.rows[0]?.highest_score ?? null,
      },
      subjectAverages: subjectAveragesResult.rows.map((row) => ({
        subject: row.subject,
        average_score: row.average_score,
        exam_count: parseInt(row.exam_count || "0", 10),
      })),
      recentExamGrades: recentExamGradesResult.rows.map((row) => ({
        exam_title: row.exam_title,
        subject: row.subject,
        percentage: row.percentage,
        total_score: row.total_score,
        max_score: row.max_score,
        created_at: row.created_at
          ? new Date(row.created_at).toISOString()
          : null,
      })),
      recentActivities: recentActivitiesResult.rows.map((row) => ({
        activity_title: row.activity_title,
        activity_type: row.activity_type,
        activity_date: row.activity_date
          ? new Date(row.activity_date).toISOString().split("T")[0]
          : null,
        quantitative_score: row.quantitative_score,
        qualitative_evaluation: row.qualitative_evaluation,
        subject: row.subject,
        class_name: row.class_name,
      })),
    };
  });
}

export async function getStudentIdentityForPrincipal(params: {
  schoolId: string;
  studentId: string;
}): Promise<StudentIdentity | null> {
  const { schoolId, studentId } = params;

  return withReadOnlyClient(async (client) => {
    const studentResult = await client.query(
      `
      SELECT
        u.id,
        u.name,
        u.national_id,
        COALESCE(u.profile->>'grade_level', '') AS grade_level
      FROM users u
      WHERE u.id = $1 AND u.school_id = $2 AND u.role = 'student'
      `,
      [studentId, schoolId]
    );

    if (studentResult.rows.length === 0) {
      return null;
    }

    const classesResult = await client.query(
      `
      SELECT
        c.id,
        c.name,
        c.grade_level,
        c.section
      FROM classes c
      JOIN class_memberships cm ON c.id = cm.class_id
      WHERE cm.user_id = $1 AND cm.role = 'student'
      ORDER BY c.grade_level, c.section, c.name
      `,
      [studentId]
    );

    const studentRow = studentResult.rows[0];
    if (!studentRow.national_id) {
      return null;
    }

    return {
      id: studentRow.id,
      name: studentRow.name,
      national_id: studentRow.national_id,
      grade_level: studentRow.grade_level || "",
      classes: classesResult.rows,
    };
  });
}

export async function getStudentActivitiesForPrincipal(params: {
  schoolId: string;
  nationalId: string;
  subjectName?: string;
  limit?: number;
  includeSubjectSummaries?: boolean;
}): Promise<StudentActivitiesResult | null> {
  const { schoolId, nationalId, subjectName, includeSubjectSummaries } = params;
  const limit = Math.max(1, Math.min(20, Math.floor(params.limit || 20)));
  const normalizedSubject = subjectName
    ?.replace(/\u200c/g, " ")
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/\s+/g, " ")
    .trim();

  return withReadOnlyClient(async (client) => {
    const studentResult = await client.query(
      `
      SELECT
        u.id,
        u.name,
        u.national_id,
        COALESCE(u.profile->>'grade_level', '') AS grade_level,
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', c.id,
              'name', c.name,
              'grade_level', c.grade_level,
              'section', c.section
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'::jsonb
        ) AS classes
      FROM users u
      LEFT JOIN class_memberships cm ON u.id = cm.user_id AND cm.role = 'student'
      LEFT JOIN classes c ON cm.class_id = c.id
      WHERE u.school_id = $1 AND u.role = 'student' AND u.national_id = $2
      GROUP BY u.id, u.name, u.national_id, u.profile
      `,
      [schoolId, nationalId]
    );

    if (studentResult.rows.length === 0) {
      return null;
    }

    const studentRow = studentResult.rows[0];
    const classes = Array.isArray(studentRow.classes) ? studentRow.classes : [];

    const studentId = studentRow.id;
    const queryParams: Array<string | number> = [studentId];
    const conditions: string[] = ["ea.student_id = $1"];

    if (normalizedSubject) {
      queryParams.push(`%${normalizedSubject}%`);
      const idx = queryParams.length;
      conditions.push(`${NORMALIZED_SUBJECT_SQL} ILIKE $${idx}`);
    }

    queryParams.push(limit);
    const limitIdx = queryParams.length;

    const activitiesResult = await client.query(
      `
      SELECT
        ea.activity_title,
        ea.activity_type,
        ea.activity_date,
        ea.quantitative_score,
        ea.qualitative_evaluation,
        l.title AS subject_name,
        c.name AS class_name,
        c.grade_level AS class_grade_level,
        c.section AS class_section
      FROM educational_activities ea
      LEFT JOIN lessons l ON ea.subject_id = l.id
      LEFT JOIN classes c ON ea.class_id = c.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY ea.activity_date DESC NULLS LAST, ea.created_at DESC NULLS LAST
      LIMIT $${limitIdx}
      `,
      queryParams
    );

    const summaryResult = await client.query(
      `
      SELECT
        COUNT(*) AS total_activities,
        AVG(ea.quantitative_score) FILTER (WHERE ea.quantitative_score IS NOT NULL) AS average_score,
        MAX(ea.activity_date) AS last_activity_date
      FROM educational_activities ea
      LEFT JOIN lessons l ON ea.subject_id = l.id
      WHERE ${conditions.join(" AND ")}
      `,
      queryParams.slice(0, queryParams.length - 1)
    );

    let subjectSummaries:
      | Array<{
          subject: string | null;
          activity_count: number;
          average_score: number | null;
          last_activity_date: string | null;
        }>
      | undefined;

    if (includeSubjectSummaries) {
      const summaryBySubjectResult = await client.query(
        `
        SELECT
          l.title AS subject,
          COUNT(*) AS activity_count,
          AVG(ea.quantitative_score) FILTER (WHERE ea.quantitative_score IS NOT NULL) AS average_score,
          MAX(ea.activity_date) AS last_activity_date
        FROM educational_activities ea
        LEFT JOIN lessons l ON ea.subject_id = l.id
        WHERE ea.student_id = $1
        GROUP BY l.title
        ORDER BY activity_count DESC
        `,
        [studentId]
      );

      subjectSummaries = summaryBySubjectResult.rows.map((row) => ({
        subject: row.subject,
        activity_count: parseInt(row.activity_count || "0", 10),
        average_score:
          row.average_score === null || row.average_score === undefined
            ? null
            : Number(row.average_score),
        last_activity_date: row.last_activity_date
          ? new Date(row.last_activity_date).toISOString().split("T")[0]
          : null,
      }));
    }

    const activities: StudentActivity[] = activitiesResult.rows.map((row) => ({
      activity_title: row.activity_title,
      activity_type: row.activity_type,
      activity_date: row.activity_date
        ? new Date(row.activity_date).toISOString().split("T")[0]
        : null,
      quantitative_score: row.quantitative_score,
      qualitative_evaluation: row.qualitative_evaluation,
      subject_name: row.subject_name,
      class_name: row.class_name,
    }));

    return {
      student: {
        id: studentRow.id,
        name: studentRow.name,
        national_id: studentRow.national_id,
        grade_level: studentRow.grade_level || "",
        classes,
      },
      activities,
      summary: {
        total_activities: parseInt(
          summaryResult.rows[0]?.total_activities || "0",
          10
        ),
        average_score:
          summaryResult.rows[0]?.average_score === null ||
          summaryResult.rows[0]?.average_score === undefined
            ? null
            : Number(summaryResult.rows[0].average_score),
        last_activity_date: summaryResult.rows[0]?.last_activity_date
          ? new Date(summaryResult.rows[0].last_activity_date)
              .toISOString()
              .split("T")[0]
          : null,
      },
      subject_summaries: subjectSummaries,
    };
  });
}

export async function getClassPerformanceForPrincipal(params: {
  schoolId: string;
  classId: string;
  recentLimit?: number;
}): Promise<ClassPerformanceResult | null> {
  const { schoolId, classId } = params;
  const recentLimit = Math.max(5, Math.min(30, Math.floor(params.recentLimit || 10)));

  return withReadOnlyClient(async (client) => {
    const classResult = await client.query(
      `
      SELECT id, name, grade_level, section, academic_year
      FROM classes
      WHERE id = $1 AND school_id = $2
      LIMIT 1
      `,
      [classId, schoolId]
    );

    if (classResult.rows.length === 0) {
      return null;
    }

    const classInfo = classResult.rows[0];

    const [membersResult, activitiesSummaryResult, gradesSummaryResult, examsSummaryResult, subjectSummaryResult, recentActivitiesResult] =
      await Promise.all([
        client.query(
          `
          SELECT
            COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.role = 'student') AS student_count,
            COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.role = 'teacher') AS teacher_count
          FROM class_memberships cm
          WHERE cm.class_id = $1
          `,
          [classId]
        ),
        client.query(
          `
          SELECT
            COUNT(*) AS activities_count,
            AVG(ea.quantitative_score) FILTER (WHERE ea.quantitative_score IS NOT NULL) AS average_activity_score,
            MAX(ea.activity_date) AS last_activity_date
          FROM educational_activities ea
          JOIN classes c ON c.id = ea.class_id
          WHERE ea.class_id = $1 AND c.school_id = $2
          `,
          [classId, schoolId]
        ),
        client.query(
          `
          SELECT
            AVG(COALESCE(cg.percentage, (cg.grade_value / NULLIF(cg.max_score, 0)) * 100)) AS average_grade_percent
          FROM class_grades cg
          JOIN classes c ON c.id = cg.class_id
          WHERE cg.class_id = $1 AND c.school_id = $2
          `,
          [classId, schoolId]
        ),
        client.query(
          `
          SELECT
            COUNT(*) AS exams_count,
            COUNT(*) FILTER (WHERE e.status = 'published') AS published_exams_count,
            COUNT(*) FILTER (WHERE e.status = 'active') AS active_exams_count
          FROM exams e
          JOIN classes c ON c.id = e.class_id
          WHERE e.class_id = $1 AND c.school_id = $2
          `,
          [classId, schoolId]
        ),
        client.query(
          `
          WITH subject_base AS (
            SELECT
              l.title AS subject,
              COUNT(*) AS activity_count,
              AVG(ea.quantitative_score) FILTER (WHERE ea.quantitative_score IS NOT NULL) AS average_score,
              COUNT(DISTINCT ea.student_id) AS students_covered
            FROM educational_activities ea
            LEFT JOIN lessons l ON ea.subject_id = l.id
            JOIN classes c ON c.id = ea.class_id
            WHERE ea.class_id = $1 AND c.school_id = $2
            GROUP BY l.title
          ),
          subject_teacher_ranked AS (
            SELECT
              l.title AS subject,
              u.name AS teacher_name,
              ROW_NUMBER() OVER (
                PARTITION BY l.title
                ORDER BY COUNT(*) DESC, MAX(ea.activity_date) DESC NULLS LAST
              ) AS rn
            FROM educational_activities ea
            LEFT JOIN lessons l ON ea.subject_id = l.id
            LEFT JOIN users u ON u.id = ea.teacher_id
            JOIN classes c ON c.id = ea.class_id
            WHERE ea.class_id = $1
              AND c.school_id = $2
              AND u.role = 'teacher'
            GROUP BY l.title, u.name
          )
          SELECT
            sb.subject,
            sb.activity_count,
            sb.average_score,
            sb.students_covered,
            str.teacher_name
          FROM subject_base sb
          LEFT JOIN subject_teacher_ranked str
            ON str.rn = 1
            AND str.subject IS NOT DISTINCT FROM sb.subject
          ORDER BY sb.activity_count DESC
          LIMIT 10
          `,
          [classId, schoolId]
        ),
        client.query(
          `
          SELECT
            ea.activity_date,
            ea.activity_type,
            ea.activity_title,
            l.title AS subject_name,
            AVG(ea.quantitative_score) FILTER (WHERE ea.quantitative_score IS NOT NULL) AS average_score,
            COUNT(*) AS records_count,
            COUNT(DISTINCT ea.student_id) AS students_count
          FROM educational_activities ea
          LEFT JOIN lessons l ON ea.subject_id = l.id
          JOIN classes c ON c.id = ea.class_id
          WHERE ea.class_id = $1 AND c.school_id = $2
          GROUP BY ea.activity_date, ea.activity_type, ea.activity_title, l.title
          ORDER BY ea.activity_date DESC NULLS LAST
          LIMIT $3
          `,
          [classId, schoolId, recentLimit]
        ),
      ]);

    return {
      classInfo: {
        id: classInfo.id,
        name: classInfo.name,
        grade_level: classInfo.grade_level ?? null,
        section: classInfo.section ?? null,
        academic_year: classInfo.academic_year ?? null,
      },
      summary: {
        student_count: parseInt(membersResult.rows[0]?.student_count || "0", 10),
        teacher_count: parseInt(membersResult.rows[0]?.teacher_count || "0", 10),
        activities_count: parseInt(
          activitiesSummaryResult.rows[0]?.activities_count || "0",
          10
        ),
        average_activity_score:
          activitiesSummaryResult.rows[0]?.average_activity_score === null ||
          activitiesSummaryResult.rows[0]?.average_activity_score === undefined
            ? null
            : Number(activitiesSummaryResult.rows[0].average_activity_score),
        average_grade_percent:
          gradesSummaryResult.rows[0]?.average_grade_percent === null ||
          gradesSummaryResult.rows[0]?.average_grade_percent === undefined
            ? null
            : Number(gradesSummaryResult.rows[0].average_grade_percent),
        exams_count: parseInt(examsSummaryResult.rows[0]?.exams_count || "0", 10),
        published_exams_count: parseInt(
          examsSummaryResult.rows[0]?.published_exams_count || "0",
          10
        ),
        active_exams_count: parseInt(
          examsSummaryResult.rows[0]?.active_exams_count || "0",
          10
        ),
        last_activity_date: activitiesSummaryResult.rows[0]?.last_activity_date
          ? new Date(activitiesSummaryResult.rows[0].last_activity_date)
              .toISOString()
              .split("T")[0]
          : null,
      },
      subject_summaries: subjectSummaryResult.rows.map((row) => ({
        subject: row.subject ?? null,
        activity_count: parseInt(row.activity_count || "0", 10),
        average_score:
          row.average_score === null || row.average_score === undefined
            ? null
            : Number(row.average_score),
        students_covered: parseInt(row.students_covered || "0", 10),
        teacher_name: row.teacher_name ?? null,
      })),
      recent_activities: recentActivitiesResult.rows.map((row) => ({
        activity_date: row.activity_date
          ? new Date(row.activity_date).toISOString().split("T")[0]
          : null,
        activity_type: row.activity_type,
        activity_title: row.activity_title,
        subject_name: row.subject_name ?? null,
        average_score:
          row.average_score === null || row.average_score === undefined
            ? null
            : Number(row.average_score),
        records_count: parseInt(row.records_count || "0", 10),
        students_count: parseInt(row.students_count || "0", 10),
      })),
    };
  });
}

/**
 * Validates if a student exists and is enrolled in a specific class
 * Useful for ensuring data integrity before querying activities
 */
export async function validateStudentInClass(params: {
  schoolId: string;
  studentId: string;
  classId?: string;
}): Promise<boolean> {
  const { schoolId, studentId, classId } = params;

  return withReadOnlyClient(async (client) => {
    if (!classId) {
      // Just check if student exists in school
      const result = await client.query(
        `
        SELECT 1 FROM users
        WHERE id = $1 AND school_id = $2 AND role = 'student'
        LIMIT 1
        `,
        [studentId, schoolId]
      );
      return result.rows.length > 0;
    }

    // Check if student is enrolled in specific class
    const result = await client.query(
      `
      SELECT 1 FROM class_memberships cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.user_id = $1
        AND cm.class_id = $2
        AND cm.role = 'student'
        AND u.school_id = $3
      LIMIT 1
      `,
      [studentId, classId, schoolId]
    );
    return result.rows.length > 0;
  });
}

/**
 * Gets list of subjects/lessons that a specific student has activities in
 * More accurate than getting all school subjects
 */
export async function getStudentActiveSubjects(params: {
  schoolId: string;
  studentId: string;
}): Promise<string[]> {
  const { schoolId, studentId } = params;

  return withReadOnlyClient(async (client) => {
    const result = await client.query(
      `
      SELECT DISTINCT l.title
      FROM educational_activities ea
      JOIN lessons l ON ea.subject_id = l.id
      JOIN users u ON ea.student_id = u.id
      WHERE u.id = $1
        AND u.school_id = $2
        AND l.title IS NOT NULL
      ORDER BY l.title
      `,
      [studentId, schoolId]
    );

    return result.rows.map((row) => row.title).filter(Boolean);
  });
}

export async function getSubjectNamesForPrincipal(params: {
  schoolId: string;
}): Promise<string[]> {
  const { schoolId } = params;

  const cached = subjectCache.get(schoolId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.subjects;
  }

  return withReadOnlyClient(async (client) => {
    // Use only lessons table (subjects table is deprecated)
    const result = await client.query(
      `
      SELECT DISTINCT l.title AS subject_name, LENGTH(l.title) AS title_length
      FROM lessons l
      WHERE l.school_id = $1
        AND l.title IS NOT NULL
        AND l.title <> ''
      ORDER BY title_length DESC
      `,
      [schoolId]
    );

    const subjects = result.rows
      .map((row) => row.subject_name)
      .filter(Boolean);
    subjectCache.set(schoolId, {
      expiresAt: Date.now() + SUBJECT_CACHE_TTL_MS,
      subjects,
    });
    return subjects;
  });
}
