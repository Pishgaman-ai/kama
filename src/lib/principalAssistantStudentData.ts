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
