import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import pool from "@/lib/database";
import moment from "moment-jalaali";

type LanguageModelSource = "cloud" | "local";

const LOCAL_AI_BASE_URL =
  process.env.LOCAL_AI_BASE_URL || "http://127.0.0.1:8080/v1";
const LOCAL_AI_MODEL =
  process.env.LOCAL_AI_MODEL || "openai/gpt-oss-20b";

async function getLanguageModelSourceByUserId(
  userId: string
): Promise<LanguageModelSource> {
  try {
    const result = await pool.query("SELECT profile FROM users WHERE id = $1", [
      userId,
    ]);
    const profile = result.rows[0]?.profile || {};
    return profile.language_model === "local" ? "local" : "cloud";
  } catch (error) {
    console.error("Failed to load language model preference:", error);
    return "cloud";
  }
}

// تابع کمکی برای تطبیق نام دانش‌آموز
function findMatchingStudent(
  searchName: string,
  students: Array<{ id: string; name: string; national_id: string }>
): { id: string; name: string } | null {
  if (!searchName || !students || students.length === 0) {
    return null;
  }

  const normalizedSearch = searchName.trim().toLowerCase();

  // جستجوی دقیق - نام کامل
  let match = students.find(
    (s) => s.name.toLowerCase() === normalizedSearch
  );
  if (match) return { id: match.id, name: match.name };

  // جستجوی با فاصله‌های اضافی
  match = students.find(
    (s) => s.name.toLowerCase().replace(/\s+/g, " ") === normalizedSearch.replace(/\s+/g, " ")
  );
  if (match) return { id: match.id, name: match.name };

  // جستجوی نام یا نام خانوادگی
  const searchParts = normalizedSearch.split(/\s+/);
  match = students.find((s) => {
    const nameParts = s.name.toLowerCase().split(/\s+/);
    // بررسی اینکه هر بخش جستجو در نام باشد
    return searchParts.every((part) => nameParts.some((np) => np.includes(part)));
  });
  if (match) return { id: match.id, name: match.name };

  // جستجوی با شباهت بالا (حداقل 70% مشترک)
  const bestMatch = students
    .map((s) => {
      const nameLower = s.name.toLowerCase();
      const matchCount = searchParts.filter((part) =>
        nameLower.includes(part)
      ).length;
      const similarity = matchCount / searchParts.length;
      return { student: s, similarity };
    })
    .filter((item) => item.similarity >= 0.7)
    .sort((a, b) => b.similarity - a.similarity)[0];

  if (bestMatch) {
    return { id: bestMatch.student.id, name: bestMatch.student.name };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "دسترسی محدود به معلمان" },
        { status: 403 }
      );
    }

    const { text, languageModel } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Input text is required." },
        { status: 400 }
      );
    }

    const modelSource =
      languageModel === "local" || languageModel === "cloud"
        ? languageModel
        : await getLanguageModelSourceByUserId(user.id);
    const openai =
      modelSource === "local"
        ? new OpenAI({
            apiKey: process.env.LOCAL_AI_API_KEY || "local-ai",
            baseURL: LOCAL_AI_BASE_URL,
          })
        : new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });

    // مرحله 1: استخراج اطلاعات پایه با OpenAI

    // محاسبه تاریخ و روز شمسی فعلی
    const now = moment();
    const persianDate = now.format('jYYYY/jMM/jDD');
    const gregorianDate = now.format('YYYY-MM-DD');

    // نقشه روزهای هفته به فارسی
    const dayNames: { [key: number]: string } = {
      0: 'یکشنبه',
      1: 'دوشنبه',
      2: 'سه‌شنبه',
      3: 'چهارشنبه',
      4: 'پنجشنبه',
      5: 'جمعه',
      6: 'شنبه'
    };

    const dayOfWeek = now.day(); // 0 = Sunday, 6 = Saturday
    const persianDay = dayNames[dayOfWeek];

    const systemPrompt = `شما یک دستیار هوشمند برای استخراج اطلاعات فعالیت‌های دانش‌آموزی هستید.

اطلاعات تاریخ فعلی:
- امروز: ${persianDay} ${persianDate} (میلادی: ${gregorianDate})

از متن ورودی فارسی معلم، فقط اطلاعات زیر را استخراج کنید:

1. student_name: نام و نام خانوادگی دانش‌آموز (یا فقط یکی از آنها)
2. activity_type: نوع فعالیت (یکی از موارد زیر):
   - midterm_exam: آزمون میان‌ترم
   - final_exam: آزمون پایان ترم
   - monthly_exam: آزمون ماهیانه
   - weekly_exam: آزمون هفتگی
   - class_activity: فعالیت کلاسی
   - class_homework: تکلیف کلاسی
   - home_homework: تکلیف منزل
3. quantitative_score: نمره عددی (بین 0 تا 20)
4. qualitative_evaluation: ارزیابی کیفی و توضیحی (اختیاری)
5. subject_name: نام درس (اختیاری - اگر ذکر شده باشد)
6. activity_title: عنوان فعالیت (اختیاری)
7. activity_date: تاریخ فعالیت به فرمت YYYY-MM-DD (میلادی)
   - اگر "امروز" گفته شد: ${gregorianDate}
   - اگر "دیروز" گفته شد: تاریخ یک روز قبل را محاسبه کن
   - اگر "X روز پیش/قبل" گفته شد: تاریخ X روز قبل را محاسبه کن
   - اگر "هفته گذشته/پیش" گفته شد: تاریخ 7 روز قبل را محاسبه کن
   - اگر "ماه گذشته/پیش" گفته شد: تاریخ 30 روز قبل را محاسبه کن
   - اگر تاریخ شمسی مشخص گفته شد (مثل 1403/10/13): آن را به میلادی تبدیل کن
   - اگر فقط روز هفته گفته شد (مثل "یکشنبه"): نزدیک‌ترین روز یکشنبه گذشته را پیدا کن
   - اگر هیچ تاریخی ذکر نشد: null

توجه:
- فقط اطلاعاتی که در متن موجود است را استخراج کنید
- برای موارد اختیاری که وجود ندارد، null بگذارید
- تاریخ را حتماً به فرمت YYYY-MM-DD میلادی برگردانید

فقط JSON برگردانید، بدون توضیح اضافی.`;

    const completion = await openai.chat.completions.create({
      model: modelSource === "local" ? LOCAL_AI_MODEL : "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
      response_format:
        modelSource === "local"
          ? { type: "text" }
          : { type: "json_object" },
    });

    const extractedData = JSON.parse(
      completion.choices[0].message.content || "{}"
    );

    // اعتبارسنجی داده‌های استخراج شده
    const validActivityTypes = [
      "midterm_exam",
      "final_exam",
      "monthly_exam",
      "weekly_exam",
      "class_activity",
      "class_homework",
      "home_homework",
    ];

    if (
      extractedData.activity_type &&
      !validActivityTypes.includes(extractedData.activity_type)
    ) {
      extractedData.activity_type = null;
    }

    // اعتبارسنجی نمره
    if (extractedData.quantitative_score) {
      const score = parseFloat(extractedData.quantitative_score);
      if (isNaN(score) || score < 0 || score > 20) {
        extractedData.quantitative_score = null;
      } else {
        extractedData.quantitative_score = score;
      }
    }

    // مرحله 2: دریافت school_id معلم از پایگاه داده
    const teacherSchoolResult = await pool.query(
      "SELECT school_id FROM users WHERE id = $1",
      [user.id]
    );

    if (teacherSchoolResult.rows.length === 0) {
      return NextResponse.json(
        { error: "اطلاعات معلم یافت نشد" },
        { status: 404 }
      );
    }

    const schoolId = teacherSchoolResult.rows[0].school_id;

    // مرحله 3: دریافت لیست دانش‌آموزان این معلم از پایگاه داده
    // این query دانش‌آموزانی را برمی‌گرداند که معلم با آن‌ها کار می‌کند
    // هم از طریق teacher_assignments و هم از طریق class_memberships
    const teacherStudentsQuery = `
      SELECT DISTINCT
        u.id,
        u.name,
        u.national_id,
        c.id as class_id,
        c.name as class_name,
        c.grade_level,
        ta.subject_id,
        COALESCE(l.title, ta.subject, c.subject) as subject_name
      FROM users u
      INNER JOIN class_memberships cm_student ON u.id = cm_student.user_id AND cm_student.role = 'student'
      INNER JOIN classes c ON cm_student.class_id = c.id
      LEFT JOIN teacher_assignments ta ON ta.class_id = c.id AND ta.teacher_id = $1 AND ta.removed_at IS NULL
      LEFT JOIN lessons l ON ta.subject_id = l.id
      WHERE u.role = 'student'
        AND u.school_id = $2
        AND u.is_active = true
        AND EXISTS (
          SELECT 1 FROM class_memberships cm_teacher
          WHERE cm_teacher.class_id = c.id
            AND cm_teacher.user_id = $1
            AND cm_teacher.role = 'teacher'
          UNION
          SELECT 1 FROM teacher_assignments ta2
          WHERE ta2.class_id = c.id
            AND ta2.teacher_id = $1
            AND ta2.removed_at IS NULL
        )
      ORDER BY u.name
    `;

    const teacherStudentsResult = await pool.query(teacherStudentsQuery, [
      user.id,
      schoolId,
    ]);
    const teacherStudents = teacherStudentsResult.rows;

    if (!teacherStudents || teacherStudents.length === 0) {
      return NextResponse.json(
        {
          error: "هیچ دانش‌آموزی برای این معلم یافت نشد",
          hint: "ابتدا باید کلاس‌ها و دانش‌آموزان را به معلم اختصاص دهید",
        },
        { status: 404 }
      );
    }

    // مرحله 3: یافتن دانش‌آموز مطابق با نام استخراج شده
    const uniqueStudents = Array.from(
      new Map(
        teacherStudents.map((s: any) => [s.id, { id: s.id, name: s.name, national_id: s.national_id }])
      ).values()
    );

    const matchedStudent = findMatchingStudent(
      extractedData.student_name,
      uniqueStudents as Array<{ id: string; name: string; national_id: string }>
    );

    if (!matchedStudent) {
      return NextResponse.json(
        {
          error: "دانش‌آموزی با این نام در لیست شما یافت نشد",
          hint: `نام وارد شده: "${extractedData.student_name}". لطفاً نام را بررسی کنید یا از لیست دانش‌آموزان خود انتخاب کنید.`,
          extractedName: extractedData.student_name,
          availableStudents: uniqueStudents.slice(0, 10).map((s: any) => s.name),
        },
        { status: 404 }
      );
    }

    // مرحله 4: استخراج اطلاعات کامل دانش‌آموز (کلاس‌ها و دروس)
    const studentClasses = teacherStudents.filter(
      (s: any) => s.id === matchedStudent.id
    );

    // اگر نام درس در متن ذکر نشده، از اولین درس معلم با این دانش‌آموز استفاده کن
    let selectedClass = studentClasses[0];
    let selectedSubject = {
      id: studentClasses[0].subject_id,
      name: studentClasses[0].subject_name,
    };

    // اگر نام درس در متن ذکر شده، سعی کن آن را پیدا کنی
    if (extractedData.subject_name) {
      const subjectMatch = studentClasses.find((sc: any) =>
        sc.subject_name?.toLowerCase().includes(extractedData.subject_name.toLowerCase())
      );
      if (subjectMatch) {
        selectedClass = subjectMatch;
        selectedSubject = {
          id: subjectMatch.subject_id,
          name: subjectMatch.subject_name,
        };
      }
    }

    // مرحله 5: تعیین مقادیر پیش‌فرض برای فیلدهای اجباری

    // نقشه ترجمه انواع فعالیت به فارسی
    const activityTypeNames: { [key: string]: string } = {
      midterm_exam: "آزمون میان‌ترم",
      final_exam: "آزمون پایان ترم",
      monthly_exam: "آزمون ماهیانه",
      weekly_exam: "آزمون هفتگی",
      class_activity: "فعالیت کلاسی",
      class_homework: "تکلیف کلاسی",
      home_homework: "تکلیف منزل",
    };

    // اگر عنوان فعالیت وجود ندارد، از نام فارسی نوع فعالیت استفاده کن
    const activityTitle = extractedData.activity_title ||
                          activityTypeNames[extractedData.activity_type] ||
                          "فعالیت";

    // اگر ارزیابی کیفی وجود ندارد، "ندارد" قرار بده
    const qualitativeEvaluation = extractedData.qualitative_evaluation || "ندارد";

    // تاریخ پیش‌فرض امروز
    const activityDate = extractedData.activity_date || gregorianDate;

    // مرحله 6: ساخت پاسخ نهایی با اطلاعات کامل
    const responseData = {
      // اطلاعات دانش‌آموز
      student_id: matchedStudent.id,
      student_name: matchedStudent.name,

      // اطلاعات کلاس و پایه
      class_id: selectedClass.class_id,
      class_name: selectedClass.class_name,
      grade_level: selectedClass.grade_level,

      // اطلاعات درس
      subject_id: selectedSubject.id,
      subject_name: selectedSubject.name,

      // اطلاعات فعالیت (از AI با مقادیر پیش‌فرض)
      activity_type: extractedData.activity_type,
      activity_title: activityTitle,
      activity_date: activityDate,
      quantitative_score: extractedData.quantitative_score || null,
      qualitative_evaluation: qualitativeEvaluation,

      // اطلاعات اضافی برای کمک به UI
      all_classes: studentClasses.map((sc: any) => ({
        class_id: sc.class_id,
        class_name: sc.class_name,
        grade_level: sc.grade_level,
        subject_id: sc.subject_id,
        subject_name: sc.subject_name,
      })),
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: `اطلاعات دانش‌آموز "${matchedStudent.name}" با موفقیت استخراج شد`,
    });
  } catch (error) {
    console.error("AI Extract Activity API error:", error);
    return NextResponse.json(
      { error: "خطا در استخراج اطلاعات", details: String(error) },
      { status: 500 }
    );
  }
}





