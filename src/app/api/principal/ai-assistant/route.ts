import { NextRequest, NextResponse } from "next/server";
import { performance } from "node:perf_hooks";
import { ChatOpenAI } from "@langchain/openai";
import OpenAI from "openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import logger from "@/lib/logger";
import { getUserById } from "@/lib/auth";
import { getRolePromptConfig } from "@/lib/aiPrompts";
import {
  getStudentActivitiesForPrincipal,
  getStudentIdentityForPrincipal,
  getSubjectNamesForPrincipal,
  searchStudentsForPrincipal,
} from "@/lib/principalAssistantStudentData";

type LanguageModelSource = "cloud" | "local";

const LOCAL_AI_BASE_URL =
  process.env.LOCAL_AI_BASE_URL || "http://127.0.0.1:8080/v1";
const LOCAL_AI_MODEL =
  process.env.LOCAL_AI_MODEL || "openai/gpt-oss-20b";
const DEFAULT_FAST_MODEL = "gpt-4o-mini";
const DEFAULT_NARRATIVE_TIMEOUT_MS = 30000; // 30 seconds
const DEFAULT_MODEL_TIMEOUT_MS = 60000; // 60 seconds
const DEFAULT_ENABLE_NARRATIVE = true;

function resolveModel(modelSource: LanguageModelSource, fallbackModel: string) {
  return modelSource === "local" ? LOCAL_AI_MODEL : fallbackModel;
}

function createTextStream(text: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

function readNumberEnv(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function isTruthyEnv(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return value !== "0" && value.toLowerCase() !== "false";
}

function getLatestUserMessage(messages: Array<{ role: string; content: string }>) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") {
      return messages[i].content || "";
    }
  }
  return "";
}

function normalizeText(text: string) {
  return text
    .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
    .replace(/\u200c/g, " ")
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

function isStudentQuestion(text: string) {
  const normalized = normalizeText(text);
  if (/دانش\s*آموز/i.test(normalized)) return true;

  const hasStudentIntent =
    /(وضعیت|عملکرد|فعالیت|نمره|درس|دروس|پیشرفت)/i.test(normalized);
  const hasLessonContext = /(?:در|توی|تو)\s+درس/i.test(normalized);
  const hasNameLikePattern = /^[\p{L}\s]{3,60}$/u.test(
    normalized.replace(/[؟?]/g, "")
  );

  return hasStudentIntent && (hasLessonContext || hasNameLikePattern);
}

function extractStudentName(text: string) {
  const normalized = normalizeText(text);
  const patterns = [
    /دانش\s*آموز(?:ان)?\s+(.+?)(?=\s+(?:در|توی|تو|چه|چطور|چگونه|کی|کج|برای|از|را|همه|تمام)\s|$)/i,
    /^(.+?)(?=\s+(?:در|توی|تو)\s+درس\s+)/i,
    /وضعیت\s+(.+?)(?=\s+(?:در|توی|تو)\s+درس\s+)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1]
        .replace(/[^\p{L}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!cleaned) continue;
      const parts = cleaned.split(" ");
      const trimmed =
        parts.length > 4 ? parts.slice(0, 4).join(" ") : cleaned;
      return trimmed || null;
    }
  }

  return null;
}

function wantsAllSubjects(text: string) {
  const normalized = normalizeText(text);
  return /همه\s*(?:دروس|درس(?:‌|\\s*)ها|درس)/i.test(normalized);
}

function extractSubjectName(text: string) {
  const normalized = normalizeText(text);
  const patterns = [
    /درس\s+(.+?)(?=\s+(?:چه|چطور|چگونه|چند|در|توی|تو|و|است|هست|برای|\\?|؟|$))/i,
    /در\s+درس\s+(.+?)(?=\s+(?:چه|چطور|چگونه|چند|است|هست|برای|\\?|؟|$))/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function resolveSubjectFromList(
  question: string,
  extracted: string | null,
  subjects: string[]
) {
  const normalizedQuestion = normalizeText(question);
  const normalizedExtracted = extracted ? normalizeText(extracted) : "";
  let bestMatch: string | null = null;

  for (const subject of subjects) {
    const normalizedSubject = normalizeText(subject);
    const matchesQuestion = normalizedQuestion.includes(normalizedSubject);
    const matchesExtracted =
      normalizedExtracted && normalizedSubject.includes(normalizedExtracted);

    if (matchesQuestion || matchesExtracted) {
      if (
        !bestMatch ||
        normalizeText(subject).length > normalizeText(bestMatch).length
      ) {
        bestMatch = subject;
      }
    }
  }

  return bestMatch || extracted;
}

function toPersianDigits(input: string) {
  return input.replace(/\d/g, (d) => String.fromCharCode(d.charCodeAt(0) + 1728));
}

function toShamsiDate(gregorianDate: string | null): string {
  if (!gregorianDate) return "—";

  try {
    // Parse date: YYYY-MM-DD format
    const [year, month, day] = gregorianDate.split('-').map(Number);

    // Simple Gregorian to Jalali conversion
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const gy = year - 1600;
    const gm = month - 1;
    const gd = day - 1;

    let g_day_no = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);

    for (let i = 0; i < gm; ++i) g_day_no += g_d_m[i];
    if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0))) g_day_no++;
    g_day_no += gd;

    let j_day_no = g_day_no - 79;
    const j_np = Math.floor(j_day_no / 12053);
    j_day_no = j_day_no % 12053;

    let jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
    j_day_no %= 1461;

    if (j_day_no >= 366) {
      jy += Math.floor((j_day_no - 1) / 365);
      j_day_no = (j_day_no - 1) % 365;
    }

    let jm, jd;
    if (j_day_no < 186) {
      jm = 1 + Math.floor(j_day_no / 31);
      jd = 1 + (j_day_no % 31);
    } else {
      jm = 7 + Math.floor((j_day_no - 186) / 30);
      jd = 1 + ((j_day_no - 186) % 30);
    }

    const shamsiYear = String(jy).padStart(4, '0');
    const shamsiMonth = String(jm).padStart(2, '0');
    const shamsiDay = String(jd).padStart(2, '0');

    return toPersianDigits(`${shamsiYear}/${shamsiMonth}/${shamsiDay}`);
  } catch (error) {
    return gregorianDate;
  }
}

function getActivityTypeFarsi(type: string): string {
  const activityTypes: Record<string, string> = {
    // Homework & Assignments
    'homework': 'تکلیف',
    'assignment': 'تکلیف',
    'daily_homework': 'تکلیف روزانه',

    // Exams
    'exam': 'آزمون',
    'final_exam': 'آزمون پایان ترم',
    'midterm_exam': 'آزمون میان ترم',
    'monthly_exam': 'آزمون ماهانه',
    'quiz': 'آزمونک',
    'oral_exam': 'آزمون شفاهی',
    'written_exam': 'آزمون کتبی',

    // Projects & Presentations
    'project': 'پروژه',
    'presentation': 'ارائه',
    'research': 'تحقیق',
    'group_project': 'پروژه گروهی',

    // Classwork
    'classwork': 'تمرین کلاسی',
    'class_activity': 'فعالیت کلاسی',
    'class_participation': 'مشارکت کلاسی',
    'participation': 'مشارکت',
    'activity': 'فعالیت',

    // Other
    'other': 'سایر',
    'attendance': 'حضور و غیاب',
    'behavior': 'رفتار'
  };

  return activityTypes[type] || type;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return toShamsiDate(value);
}

function buildSummaryTable(summary: {
  total_activities: number;
  average_score: number | null;
  last_activity_date: string | null;
}) {
  const avg =
    summary.average_score === null
      ? "—"
      : toPersianDigits(summary.average_score.toFixed(2));
  const total = toPersianDigits(String(summary.total_activities));
  const lastDate = formatDate(summary.last_activity_date);

  return [
    "| شاخص | مقدار |",
    "| --- | --- |",
    `| تعداد فعالیت‌ها | ${total} |`,
    `| میانگین نمرات | ${avg} |`,
    `| تاریخ آخرین فعالیت | ${lastDate} |`,
  ].join("\n");
}

function buildSubjectSummaryTable(subjects?: Array<{
  subject: string | null;
  activity_count: number;
  average_score: number | null;
  last_activity_date: string | null;
}>) {
  if (!subjects || subjects.length === 0) return "";
  const rows = subjects.map((item) => {
    const subject = item.subject || "نامشخص";
    const count = toPersianDigits(String(item.activity_count));
    const avg =
      item.average_score === null
        ? "—"
        : toPersianDigits(item.average_score.toFixed(2));
    const lastDate = formatDate(item.last_activity_date);
    return `| ${subject} | ${count} | ${avg} | ${lastDate} |`;
  });

  return [
    "| درس | تعداد فعالیت | میانگین نمره | آخرین فعالیت |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function buildActivitiesTable(activities: Array<{
  activity_date: string | null;
  activity_type: string;
  activity_title: string;
  quantitative_score: number | null;
  qualitative_evaluation: string | null;
  class_name: string | null;
}>) {
  if (!activities.length) return "";
  const rows = activities.map((activity) => {
    const date = formatDate(activity.activity_date);
    const activityType = getActivityTypeFarsi(activity.activity_type);
    const score =
      activity.quantitative_score === null
        ? "—"
        : toPersianDigits(String(activity.quantitative_score));
    const qualitative = activity.qualitative_evaluation
      ? activity.qualitative_evaluation
      : "—";
    const className = activity.class_name || "—";
    return `| ${date} | ${activityType} | ${activity.activity_title} | ${score} | ${qualitative} | ${className} |`;
  });

  return [
    "| تاریخ | نوع | عنوان | نمره | ارزیابی کیفی | کلاس |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function buildStudentInfoHeader(student: {
  name: string;
  grade_level: string | null;
  class_name?: string | null;
}) {
  const gradeLevelMap: Record<string, string> = {
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
    '12': 'دوازدهم'
  };

  const gradeLabel = student.grade_level
    ? gradeLevelMap[student.grade_level] || `پایه ${toPersianDigits(student.grade_level)}`
    : "نامشخص";

  const className = student.class_name || "نامشخص";

  return [
    "## مشخصات دانش‌آموز",
    "| مشخصه | مقدار |",
    "| --- | --- |",
    `| نام و نام خانوادگی | ${student.name} |`,
    `| مقطع تحصیلی | ${gradeLabel} |`,
    `| نام کلاس | ${className} |`,
    ""
  ].join("\n");
}

function buildStudentListMessage(
  students: Array<{ name: string; grade_level: string; classes: any[] }>
) {
  return students
    .slice(0, 5)
    .map((student, index) => {
      const cls = Array.isArray(student.classes) && student.classes.length > 0
        ? ` (${student.classes
            .map((cc: any) => cc.name)
            .filter(Boolean)
            .join("، ")})`
        : "";
      const grade = student.grade_level
        ? `پایه ${student.grade_level}`
        : "پایه نامشخص";
      return `${index + 1}. ${student.name} - ${grade}${cls}`;
    })
    .join("\n");
}

function resolveSubjectByInput(subjectInput: string, subjects: string[]) {
  const normalizedInput = normalizeText(subjectInput);
  if (!normalizedInput) return null;

  let bestMatch: string | null = null;
  for (const subject of subjects) {
    const normalizedSubject = normalizeText(subject);
    const exactMatch = normalizedSubject === normalizedInput;
    const containsMatch =
      normalizedSubject.includes(normalizedInput) ||
      normalizedInput.includes(normalizedSubject);
    if (!exactMatch && !containsMatch) continue;

    if (!bestMatch) {
      bestMatch = subject;
      continue;
    }

    if (normalizeText(subject).length > normalizeText(bestMatch).length) {
      bestMatch = subject;
    }
  }

  return bestMatch;
}

async function runStudentFunctionCall(params: {
  model: string;
  apiKey: string;
  baseURL?: string;
  userQuestion: string;
}) {
  const client = new OpenAI({
    apiKey: params.apiKey,
    baseURL: params.baseURL,
  });

  const toolResponse = await client.chat.completions.create({
    model: params.model,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `You are a precise information extractor for an Iranian school management system.
Your task is to extract student name and subject/lesson name from Persian queries.

IMPORTANT RULES:
1. Extract ONLY the full name of the student (first name + last name)
2. Extract ONLY the exact subject/lesson name mentioned by user
3. Do NOT invent or guess names - extract EXACTLY what user wrote
4. If no lesson is mentioned, set subject_name to empty string
5. Common Persian subjects: ریاضی, فارسی, علوم, عربی, انگلیسی, مطالعات اجتماعی, قرآن, etc.

EXAMPLES:
- "وضعیت علی احمدی در ریاضی" → student_name: "علی احمدی", subject_name: "ریاضی"
- "نمرات مریم رضایی در درس علوم" → student_name: "مریم رضایی", subject_name: "علوم"
- "فعالیت های محمد کریمی" → student_name: "محمد کریمی", subject_name: ""
- "عملکرد سارا جعفری در همه دروس" → student_name: "سارا جعفری", subject_name: ""`,
      },
      {
        role: "user",
        content: params.userQuestion,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "get_student_activity_report",
          description:
            "Get detailed activity report for a specific student, optionally filtered by subject/lesson name. Returns activities, scores, and performance summary.",
          parameters: {
            type: "object",
            properties: {
              student_name: {
                type: "string",
                description:
                  "Full name of the student in Persian (e.g., 'علی احمدی', 'مریم رضایی'). Must be exact name as appears in database.",
              },
              subject_name: {
                type: "string",
                description:
                  "Name of the school subject/lesson in Persian (e.g., 'ریاضی', 'علوم', 'فارسی'). Leave empty string if user wants all subjects or didn't specify a subject.",
              },
            },
            required: ["student_name", "subject_name"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: "get_student_activity_report" },
    },
  });

  const toolCall = toolResponse.choices[0]?.message?.tool_calls?.[0];
  if (
    !toolCall ||
    toolCall.type !== "function" ||
    toolCall.function.name !== "get_student_activity_report"
  ) {
    return null;
  }

  try {
    const args = JSON.parse(toolCall.function.arguments || "{}") as {
      student_name?: string;
      subject_name?: string;
    };
    return {
      studentName: (args.student_name || "").trim(),
      subjectName: (args.subject_name || "").trim(),
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestId = Math.random().toString(36).slice(2, 8);
    const requestStart = performance.now();
    const timings: Record<string, number> = {};
    const markTiming = (label: string, start: number) => {
      timings[label] = Math.round(performance.now() - start);
    };
    const logStep = (step: string, extra?: Record<string, unknown>) => {
      console.info("[PrincipalAI] step", {
        requestId,
        step,
        elapsed_ms: Math.round(performance.now() - requestStart),
        ...extra,
      });
    };
    const logTimings = (label: string) => {
      const total = Math.round(performance.now() - requestStart);
      console.info(`[PrincipalAI] ${label}`, {
        requestId,
        total_ms: total,
        ...timings,
      });
    };

    const isDev = process.env.NODE_ENV !== "production";
    const devUserId = isDev ? request.headers.get("x-dev-user-id") : null;
    const responseHeaders = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };

    const authStart = performance.now();
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie && !devUserId) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const userSession = devUserId
      ? { id: devUserId }
      : JSON.parse(sessionCookie!.value);
    const user = await getUserById(userSession.id);
    markTiming("auth_ms", authStart);
    logStep("auth_checked");

    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    if (user.role !== "principal") {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });
    }

    const nationalId = user.national_id;
    if (!nationalId) {
      return NextResponse.json(
        {
          error:
            "برای استفاده از دستیار هوشمند، لطفاً کد ملی خود را در پروفایل کاربری تنظیم کنید",
        },
        { status: 400 }
      );
    }

    const parseStart = performance.now();
    const { messages } = await request.json();
    markTiming("parse_ms", parseStart);
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "پیام یافت نشد" }, { status: 400 });
    }

    const modelSource: LanguageModelSource =
      user.profile?.language_model === "local" ? "local" : "cloud";

    if (modelSource === "cloud" && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "کلید API هوش مصنوعی تنظیم نشده است" },
        { status: 500 }
      );
    }

    if (!user.school_id) {
      return NextResponse.json(
        { error: "شناسه مدرسه برای کاربر تعریف نشده است" },
        { status: 400 }
      );
    }

    const roleConfig = getRolePromptConfig("principal");
    const latestUserMessage = getLatestUserMessage(messages);
    logStep("request_parsed", { has_user_message: Boolean(latestUserMessage) });
    const assistantRules = `
## قوانین پاسخ‌دهی به سوالات درباره دانش‌آموزان

### 1. شناسایی دانش‌آموز
- ابتدا دانش‌آموز را با نام کامل شناسایی کن
- اگر چند دانش‌آموز با نام مشابه پیدا شد، حتماً پایه/کلاس را از کاربر بپرس
- اگر دانش‌آموز پیدا نشد، املای صحیح نام را از کاربر بپرس

### 2. شناسایی درس
- اگر نام درس مشخص نیست، لیست دروس موجود را نشان بده و از کاربر بپرس
- اگر کاربر "همه دروس" خواست، خلاصه کلی ارائه کن
- نام درس باید دقیقاً مطابق با پایگاه داده باشد (lessons table)

### 3. ارائه اطلاعات
**الزامات مهم:**
- **فقط** از داده‌های استخراج شده از پایگاه داده استفاده کن
- **هرگز** اطلاعات را حدس نزن یا از خیال خود اضافه نکن
- اگر داده‌ای وجود ندارد، صادقانه بگو "فعالیتی ثبت نشده است"
- همیشه جداول آماری را همانطور که هست نشان بده، تغییر نده

### 4. ساختار پاسخ
پاسخ باید شامل:
1. **خلاصه عملکرد**: جدول آماری (تعداد فعالیت‌ها، میانگین نمرات، آخرین فعالیت)
2. **جدول فعالیت‌ها**: لیست آخرین فعالیت‌ها با تاریخ، نوع، عنوان، نمره
3. **توضیح تکمیلی**: تحلیل کوتاه و مبتنی بر داده (حداکثر 3 نکته)

### 5. موارد ممنوع (Anti-Hallucination Rules)
❌ **هرگز** نمره‌های جعلی یا غیرواقعی ننویس
❌ **هرگز** تاریخ‌های غیرواقعی اضافه نکن
❌ **هرگز** نام فعالیت یا درسی که در داده نیست ننویس
❌ **هرگز** تحلیل یا نتیجه‌گیری بدون داده ارائه نکن
✅ **همیشه** به داده‌های دریافتی از پایگاه داده وفادار بمان

### 6. مثال پاسخ صحیح
برای سوال "وضعیت علی احمدی در ریاضی":
- ✅ "بر اساس داده‌های ثبت شده، علی احمدی در درس ریاضی..."
- ✅ "طبق جدول، میانگین نمرات: ۱۵.۵"
- ❌ "به نظر می‌رسد علی احمدی در ریاضی خوب است" (بدون داده)
- ❌ "احتمالاً در آزمون بعدی بهتر می‌شود" (حدس)
`;


    const chosenModel =
      modelSource === "local"
        ? LOCAL_AI_MODEL
        : process.env.PRINCIPAL_ASSISTANT_MODEL || DEFAULT_FAST_MODEL;
    const modelConfig = {
      model: chosenModel,
      apiKey:
        modelSource === "local"
          ? process.env.LOCAL_AI_API_KEY || "local-ai"
          : process.env.OPENAI_API_KEY,
      configuration:
        modelSource === "local" ? { baseURL: LOCAL_AI_BASE_URL } : undefined,
    };

    const generalModel = new ChatOpenAI({
      ...modelConfig,
      temperature: roleConfig.temperature,
      maxTokens: Math.min(roleConfig.maxTokens, 800),
    });

    const narrativeModel = new ChatOpenAI({
      ...modelConfig,
      temperature: 0.3,
      maxTokens: 300,
    });

    const narrativeTimeoutMs = readNumberEnv(
      process.env.PRINCIPAL_ASSISTANT_NARRATIVE_TIMEOUT_MS,
      DEFAULT_NARRATIVE_TIMEOUT_MS
    );
    const modelTimeoutMs = readNumberEnv(
      process.env.PRINCIPAL_ASSISTANT_MODEL_TIMEOUT_MS,
      DEFAULT_MODEL_TIMEOUT_MS
    );
    const enableNarrative = isTruthyEnv(
      process.env.PRINCIPAL_ASSISTANT_ENABLE_NARRATIVE,
      DEFAULT_ENABLE_NARRATIVE
    );

    const chatMessages: BaseMessage[] = messages
      .filter((msg: any) => msg.role !== "system")
      .map((msg: any) =>
        msg.role === "assistant"
          ? new AIMessage(msg.content)
          : new HumanMessage(msg.content)
      );

    const userQuestion = latestUserMessage;
    const respondWithText = (text: string, label: string) => {
      logTimings(label);
      return new NextResponse(createTextStream(text), {
        headers: responseHeaders,
      });
    };

    const preExtractedStudentName = userQuestion
      ? extractStudentName(userQuestion)
      : null;
    const hasLessonPhrase = userQuestion
      ? /(?:در|توی|تو)\s+درس/i.test(normalizeText(userQuestion))
      : false;

    if (
      userQuestion &&
      (isStudentQuestion(userQuestion) ||
        Boolean(preExtractedStudentName) ||
        hasLessonPhrase)
    ) {
      logStep("student_question_detected");
      const dbStart = performance.now();
      const functionCallStart = performance.now();
      const functionArgs = await runStudentFunctionCall({
        model: chosenModel,
        apiKey:
          modelSource === "local"
            ? process.env.LOCAL_AI_API_KEY || "local-ai"
            : process.env.OPENAI_API_KEY!,
        baseURL: modelSource === "local" ? LOCAL_AI_BASE_URL : undefined,
        userQuestion,
      });
      markTiming("function_call_ms", functionCallStart);
      logStep("function_call_completed", {
        duration_ms: timings.function_call_ms,
      });

      const studentName = functionArgs?.studentName || "";
      const subjectNameFromFunction = functionArgs?.subjectName || "";
      const fallbackStudentName = preExtractedStudentName || "";
      const fallbackSubjectName = extractSubjectName(userQuestion);
      const resolvedStudentName = fallbackStudentName || studentName;
      logStep("student_name_resolved", {
        from_regex: fallbackStudentName || null,
        from_function: studentName || null,
        final_value: resolvedStudentName || null,
      });

      if (!resolvedStudentName) {
        return respondWithText(
          "برای بررسی وضعیت دانش‌آموز، لطفاً نام و نام خانوادگی او را به‌صورت دقیق بنویسید (در صورت امکان پایه یا کلاس را هم ذکر کنید).",
          "missing_student_name"
        );
      } else {
        logStep("student_search_start");
        const searchStart = performance.now();
        const candidates = await searchStudentsForPrincipal({
          schoolId: user.school_id,
          name: resolvedStudentName,
        });
        markTiming("search_ms", searchStart);
        logStep("student_search_completed", {
          duration_ms: timings.search_ms,
          candidates: candidates.length,
        });

        if (!candidates.length) {
          return respondWithText(
            "دانش‌آموزی با این نام در مدرسه پیدا نشد. لطفاً املای نام، پایه یا کلاس را مشخص کنید.",
            "student_not_found"
          );
        } else if (candidates.length > 1) {
          return respondWithText(
            `چند دانش‌آموز با این نام پیدا شد. لطفاً پایه یا کلاس را مشخص کنید:\n${buildStudentListMessage(
              candidates
            )}`,
            "multiple_students"
          );
        } else {
          const allSubjectsRequested = wantsAllSubjects(userQuestion);
          const identityStart = performance.now();
          const subjectListStart = performance.now();
          logStep("student_identity_start");
          const [identity, subjectNames] = await Promise.all([
            getStudentIdentityForPrincipal({
              schoolId: user.school_id,
              studentId: candidates[0].id,
            }).then((result) => {
              markTiming("identity_ms", identityStart);
              return result;
            }),
            allSubjectsRequested
              ? Promise.resolve([] as string[])
              : getSubjectNamesForPrincipal({
                  schoolId: user.school_id,
                }).then((result) => {
                  markTiming("subject_list_ms", subjectListStart);
                  return result;
                }),
          ]);
          logStep("student_identity_loaded", {
            duration_ms: timings.identity_ms,
          });
          if (!allSubjectsRequested) {
            logStep("subject_list_loaded", {
              duration_ms: timings.subject_list_ms,
              subjects: subjectNames.length,
            });
          }

          if (!identity?.national_id) {
            return respondWithText(
              "برای این دانش‌آموز کد ملی ثبت نشده است. لطفاً ابتدا کد ملی را در پروفایل دانش‌آموز ثبت کنید.",
              "missing_national_id"
            );
          } else {
            const subjectFromQuestion = !allSubjectsRequested
              ? resolveSubjectFromList(
                  userQuestion,
                  fallbackSubjectName,
                  subjectNames
                )
              : null;
            const resolvedSubject =
              !allSubjectsRequested && subjectNameFromFunction
                ? resolveSubjectByInput(subjectNameFromFunction, subjectNames)
                : null;
            const subjectName = allSubjectsRequested
              ? null
              : subjectFromQuestion || resolvedSubject;
            logStep("subject_resolved", {
              from_regex: fallbackSubjectName || null,
              from_function: subjectNameFromFunction || null,
              from_list_regex: subjectFromQuestion || null,
              from_list_function: resolvedSubject || null,
              final_value: subjectName || null,
            });

            if (!allSubjectsRequested && !subjectName) {
              const subjectList =
                subjectNames && subjectNames.length > 0
                  ? `\n\nدروس موجود در مدرسه:\n${subjectNames
                      .slice(0, 10)
                      .map((name) => `- ${name}`)
                      .join("\n")}`
                  : "";
              return respondWithText(
                "نام درس مشخص نیست. لطفاً نام درس را دقیق بفرمایید یا اگر می‌خواهید، بگویید «همه دروس»." +
                  subjectList,
                "missing_subject"
              );
            } else {
              logStep("student_activities_start");
              const activitiesStart = performance.now();
              const activitiesResult = await getStudentActivitiesForPrincipal({
                schoolId: user.school_id,
                nationalId: identity.national_id,
                subjectName: subjectName || undefined,
                limit: 20,
                includeSubjectSummaries: allSubjectsRequested,
              });
              markTiming("activities_ms", activitiesStart);
              markTiming("db_ms", dbStart);
              logStep("student_activities_loaded", {
                duration_ms: timings.activities_ms,
                total_activities: activitiesResult?.summary.total_activities,
              });

              if (
                !activitiesResult ||
                activitiesResult.summary.total_activities === 0
              ) {
                if (subjectName) {
                  const available = await getStudentActivitiesForPrincipal({
                    schoolId: user.school_id,
                    nationalId: identity.national_id,
                    limit: 20,
                    includeSubjectSummaries: true,
                  });
                  const suggestions =
                    available?.subject_summaries &&
                    available.subject_summaries.length > 0
                      ? `\n\nدروس دارای فعالیت برای این دانش‌آموز:\n${available.subject_summaries
                          .map((item) => `- ${item.subject || "نامشخص"}`)
                          .join("\n")}`
                      : "";
                  return respondWithText(
                    `برای درس «${subjectName}» فعالیتی ثبت نشده است.` +
                      suggestions,
                    "no_activities"
                  );
                }
                return respondWithText(
                  "برای این دانش‌آموز هنوز فعالیتی ثبت نشده است.",
                  "no_activities"
                );
              } else {
                // Get class name from first activity if available
                const firstActivity = activitiesResult.activities[0];
                const className = firstActivity?.class_name || null;

                const studentInfoHeader = buildStudentInfoHeader({
                  name: identity.name,
                  grade_level: identity.grade_level,
                  class_name: className,
                });

                const summaryTable = buildSummaryTable(activitiesResult.summary);
                const subjectTable = allSubjectsRequested
                  ? buildSubjectSummaryTable(activitiesResult.subject_summaries)
                  : "";
                const activitiesTable = buildActivitiesTable(
                  activitiesResult.activities
                );
                const dataContext = {
                  student: {
                    id: identity.id,
                    name: identity.name,
                    grade_level: identity.grade_level,
                    class_name: className,
                  },
                  subject: subjectName || "همه دروس",
                  summary: activitiesResult.summary,
                  subject_summaries: activitiesResult.subject_summaries,
                };

                const prefix = [
                  studentInfoHeader,
                  "## خلاصه عملکرد",
                  summaryTable,
                  subjectTable ? "\n## خلاصه همه دروس\n" + subjectTable : "",
                  "\n## آخرین فعالیت‌ها\n" + activitiesTable,
                  "\n## توضیح تکمیلی\n",
                ]
                  .filter(Boolean)
                  .join("\n\n");

                const stream = new ReadableStream({
                  async start(controller) {
                    const encoder = new TextEncoder();
                    controller.enqueue(encoder.encode(prefix));

                    if (!enableNarrative) {
                      logStep("narrative_skipped");
                      logTimings("student_stream_completed_no_narrative");
                      controller.close();
                      return;
                    }

                    logStep("narrative_start", {
                      timeout_ms: narrativeTimeoutMs,
                    });
                    const modelStart = performance.now();
                    const abortController = new AbortController();
                    const timeoutId = setTimeout(() => {
                      abortController.abort();
                    }, narrativeTimeoutMs);
                    let firstChunk = true;
                    try {
                      const modelStream = await narrativeModel.stream(
                        [
                          new SystemMessage(
                            `${roleConfig.systemPrompt}

${assistantRules}

## داده‌های دریافتی از پایگاه داده (DATABASE FACTS)

### اطلاعات دانش‌آموز و درس:
${JSON.stringify(dataContext, null, 2)}

### خلاصه آماری (EXACT DATA - DO NOT MODIFY):
${summaryTable}

${
  subjectTable
    ? `### خلاصه همه دروس (EXACT DATA - DO NOT MODIFY):
${subjectTable}
`
    : ""
}

### آخرین فعالیت‌ها (EXACT DATA - DO NOT MODIFY):
${activitiesTable}

## دستورالعمل پاسخ

**مهم:** جداول بالا قبلاً نمایش داده شده‌اند. وظیفه شما:
1. تحلیل کوتاه و مبتنی بر داده (2-3 نکته)
2. **فقط** از اعداد و اطلاعات جداول بالا استفاده کن
3. **هیچ** عدد یا تاریخی که در جداول نیست ننویس
4. **هیچ** حدس و گمانی ننویس

مثال پاسخ صحیح:
- "با توجه به میانگین ۱۵.۵، عملکرد در حد خوب است"
- "در ۵ فعالیت ثبت شده، بالاترین نمره ۱۸ بوده"

مثال پاسخ غلط (توهم):
- "احتمالاً در جلسه بعد بهتر می‌شود" ❌
- "نمره‌های قبلی او بین ۱۲ تا ۱۶ بوده" (بدون داده) ❌`
                          ),
                          new HumanMessage(userQuestion),
                        ]
                      );

                      for await (const chunk of modelStream) {
                        try {
                          const content =
                            typeof chunk.content === "string"
                              ? chunk.content
                              : Array.isArray(chunk.content)
                              ? chunk.content.join("")
                              : "";
                          if (content) {
                            if (firstChunk) {
                              markTiming("model_first_chunk_ms", modelStart);
                              firstChunk = false;
                            }
                            controller.enqueue(encoder.encode(content));
                          }
                        } catch (chunkError) {
                          console.error("Error processing chunk:", chunkError);
                          // Continue to next chunk even if one fails
                        }
                      }
                      markTiming("model_stream_ms", modelStart);
                      logStep("narrative_completed", {
                        duration_ms: timings.model_stream_ms,
                      });
                    } catch (error) {
                      console.error("Principal AI streaming error:", error);
                      logger.error("Principal AI streaming error:", {
                        error: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined,
                      });
                      if ((error as Error)?.name === "AbortError") {
                        logStep("narrative_timeout");
                        controller.enqueue(
                          encoder.encode(
                            "\n\n(توضیح تکمیلی به دلیل محدودیت زمان تولید نشد.)"
                          )
                        );
                      } else {
                        controller.enqueue(
                          encoder.encode(
                            "\n\n(در حال حاضر امکان تولید توضیح تکمیلی وجود ندارد.)"
                          )
                        );
                      }
                    } finally {
                      clearTimeout(timeoutId);
                      logTimings("student_stream_completed");
                      controller.close();
                    }
                  },
                });

                return new NextResponse(stream, { headers: responseHeaders });
              }
            }
          }
        }
      }
    } else {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const modelStart = performance.now();
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => {
            abortController.abort();
          }, modelTimeoutMs);
          let firstChunk = true;
          try {
            const modelStream = await generalModel.stream(
              [
                new SystemMessage(`${roleConfig.systemPrompt}`),
                ...chatMessages,
              ]
            );
            for await (const chunk of modelStream) {
              const content =
                typeof chunk.content === "string"
                  ? chunk.content
                  : Array.isArray(chunk.content)
                  ? chunk.content.join("")
                  : "";
              if (content) {
                if (firstChunk) {
                  markTiming("model_first_chunk_ms", modelStart);
                  firstChunk = false;
                }
                controller.enqueue(encoder.encode(content));
              }
            }
            markTiming("model_stream_ms", modelStart);
          } catch (error) {
            console.error("Principal AI streaming error:", error);
            if ((error as Error)?.name === "AbortError") {
              controller.enqueue(
                encoder.encode("پاسخ به دلیل محدودیت زمان متوقف شد.")
              );
            } else {
              controller.enqueue(
                encoder.encode(
                  "در تولید پاسخ خطایی رخ داد. لطفاً دوباره تلاش کنید."
                )
              );
            }
          } finally {
            clearTimeout(timeoutId);
            logTimings("non_student_stream_completed");
            controller.close();
          }
        },
      });

      return new NextResponse(stream, { headers: responseHeaders });
    }
  } catch (error: unknown) {
    console.error("Principal AI Assistant API error:", error);
    logger.error("Principal AI Assistant API error:", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "خطا در پردازش درخواست هوش مصنوعی" },
      { status: 500 }
    );
  }
}
