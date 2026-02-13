# دیاگرام کامل پاسخ‌دهی دستیار مدیر

این سند بر اساس مرور کدها و مستندات زیر تهیه شده است:
- `CLAUDE.md`
- `docs/PRINCIPAL_ASSISTANT_IMPROVEMENTS.md`
- `src/app/dashboard/principal/principal-assistant/page.tsx`
- `src/app/components/AIChat/ChatContainer.tsx`
- `src/app/components/AIChat/hooks/useChat.ts`
- `src/app/api/principal/ai-assistant/route.ts`
- `src/lib/principalAssistantStudentData.ts`
- `src/lib/messengerPrincipalAssistant.ts`

## 1) دیاگرام کلان جریان پاسخ‌دهی

```mermaid
flowchart TD
    A[کاربر مدیر در صفحه principal-assistant] --> B[GET /api/auth/me]
    B -->|ناموفق| B1[ریدایرکت به /signin]
    B -->|نقش غیر principal| B2[ریدایرکت به /dashboard]
    B -->|موفق| C[ChatContainer با apiPath=/api/principal/ai-assistant]

    C --> D[ارسال پیام با useChat.sendMessage]
    D --> E[POST /api/principal/ai-assistant + messages]

    E --> F{اعتبارسنجی API}
    F -->|session/user invalid| F1[401/403/404]
    F -->|valid principal| G[تشخیص نوع سوال]

    G -->|سوال دانش آموزی| H[استخراج نام دانش آموز و درس]
    G -->|سوال عمومی| Z[generalModel.stream]

    H --> I[searchStudentsForPrincipal]
    I -->|۰ نتیجه| I1[پیام: دانش آموز یافت نشد]
    I -->|بیش از ۱| I2[پیام: تعیین پایه/کلاس]
    I -->|۱ نتیجه| J[getStudentIdentityForPrincipal]

    J -->|national_id ندارد| J1[پیام: ثبت کد ملی]
    J -->|ok| K{همه دروس؟}
    K -->|خیر| L[getSubjectNamesForPrincipal + resolveSubject]
    L -->|درس نامشخص| L1[پیام: انتخاب دقیق درس + لیست دروس]
    L -->|ok| M[getStudentActivitiesForPrincipal]
    K -->|بله| M[getStudentActivitiesForPrincipal]

    M -->|بدون فعالیت| M1[پیام: فعالیتی ثبت نشده]
    M -->|با فعالیت| N[ساخت جداول: مشخصات/خلاصه/فعالیت ها]
    N --> O[narrativeModel.stream با قوانین Anti-Hallucination]
    O --> P[Stream پاسخ نهایی به فرانت]

    Z --> P
    P --> Q[به‌روزرسانی لحظه‌ای پیام دستیار در UI]
```

## 2) دیاگرام توالی دقیق برای سوال دانش‌آموزی

```mermaid
sequenceDiagram
    participant U as کاربر (مدیر)
    participant FE as Frontend (useChat)
    participant API as /api/principal/ai-assistant
    participant DB as principalAssistantStudentData
    participant LLM as OpenAI/Local Model

    U->>FE: ارسال پیام (مثلا وضعیت علی احمدی در ریاضی)
    FE->>API: POST messages
    API->>API: احراز هویت + نقش principal
    API->>API: isStudentQuestion + extractStudentName/extractSubjectName
    API->>LLM: runStudentFunctionCall (استخراج دقیق student_name/subject_name)
    LLM-->>API: student_name, subject_name

    API->>DB: searchStudentsForPrincipal
    DB-->>API: لیست کاندیدا

    alt چند کاندیدا یا عدم یافتن
      API-->>FE: پیام راهنما برای اصلاح نام/پایه/کلاس
    else یک کاندیدا
      API->>DB: getStudentIdentityForPrincipal
      DB-->>API: هویت + national_id
      API->>DB: getSubjectNamesForPrincipal (در حالت تک‌درس)
      DB-->>API: لیست دروس
      API->>DB: getStudentActivitiesForPrincipal
      DB-->>API: summary + activities (+ subject_summaries)
      API->>API: buildSummaryTable/buildActivitiesTable
      API-->>FE: ارسال Prefix جداول (استریم)
      API->>LLM: narrativeModel.stream + DATABASE FACTS + assistantRules
      LLM-->>API: تحلیل کوتاه فقط مبتنی بر داده
      API-->>FE: ادامه استریم پاسخ
    end

    FE->>FE: updateMessageContent به‌صورت chunk-by-chunk
    FE-->>U: نمایش پاسخ نهایی
```

## 3) منطق تصمیم‌گیری پاسخ

1. ورودی کاربر در UI به `POST /api/principal/ai-assistant` ارسال می‌شود.
2. API ابتدا فقط دسترسی `principal` را می‌پذیرد.
3. اگر سوال دانش‌آموزی تشخیص داده شود:
   - نام دانش‌آموز و نام درس با ترکیب Regex و Function Call استخراج می‌شود.
   - دانش‌آموز در همان `school_id` جستجو می‌شود.
   - ابهام نام با درخواست پایه/کلاس رفع می‌شود.
   - داده‌ها فقط از دیتابیس و به‌صورت `READ ONLY` خوانده می‌شود.
   - پاسخ در دو بخش است:
     - بخش اول: جدول‌های واقعی (مشخصات، خلاصه، فعالیت‌ها)
     - بخش دوم: تحلیل کوتاه مدل زبانی با قوانین ضدتوهم
4. اگر سوال دانش‌آموزی نباشد، پاسخ مستقیم از مدل عمومی (`generalModel.stream`) برمی‌گردد.

## 4) الگوی ضدتوهم در پاسخ

- قواعد `assistantRules` داخل API صراحتا جعل عدد/تاریخ/فعالیت را ممنوع می‌کند.
- در Prompt عبارت‌های `DATABASE FACTS` و `EXACT DATA - DO NOT MODIFY` استفاده شده است.
- مدل روایی (`narrativeModel`) فقط مجاز به تحلیل کوتاه بر اساس داده موجود است.
- اگر داده‌ای وجود نداشته باشد، API پیام صریح «فعالیتی ثبت نشده است» می‌دهد و مدل اجازه پرکردن خلأ با حدس را ندارد.

## 5) خروجی‌های کنترلی مهم

- کاربر غیرمجاز: `401/403`
- دانش‌آموز یافت نشد: پیام اصلاح املای نام
- چند دانش‌آموز همنام: درخواست تعیین پایه/کلاس
- درس نامشخص: نمایش لیست دروس مدرسه
- نبود فعالیت: پیام «فعالیتی ثبت نشده است»
- Timeout مدل: متن fallback برای توقف/عدم تولید توضیح تکمیلی

## 6) نکات فنی تایید شده از مرور کد

- مسیر فرانت درست: `/dashboard/principal/principal-assistant`
- مسیر API اصلی: `/api/principal/ai-assistant`
- خواندن داده دانش‌آموزی در `src/lib/principalAssistantStudentData.ts` با:
  - `BEGIN READ ONLY`
  - `statement_timeout`
  - فیلتر `school_id`
- استریم پاسخ در فرانت با `ReadableStream` و به‌روزرسانی لحظه‌ای پیام دستیار انجام می‌شود.

## 7) قابلیت جدید: تحلیل عملکرد کلاس

در منطق API یک مسیر جدید برای سوالات کلاس اضافه شد:
- تشخیص سوال کلاس با `isClassQuestion`
- استخراج نام کلاس با `extractClassName` + `runClassFunctionCall`
- جستجوی کلاس با `searchClassesForPrincipal`
- استخراج KPIهای آموزشی کلاس با `getClassPerformanceForPrincipal`

شاخص‌های کلیدی خروجی کلاس:
- تعداد دانش‌آموز و معلم کلاس
- تعداد فعالیت‌های آموزشی ثبت‌شده
- میانگین نمره فعالیت‌ها
- میانگین درصد نمرات ثبت‌شده (`class_grades`)
- تعداد آزمون‌ها + تعداد آزمون فعال/منتشرشده
- تاریخ آخرین فعالیت
- خلاصه عملکرد درس‌ها و فعالیت‌های اخیر کلاس

الگوی پاسخ:
1. جدول مشخصات کلاس
2. جدول KPIهای کلاس
3. جدول عملکرد درس‌ها (در صورت وجود)
4. جدول فعالیت‌های اخیر (در صورت وجود)
5. جمع‌بندی تحلیلی کوتاه و داده‌محور (بدون توهم)
