# ساختار پروژه kama (Kama_module_v3)

## خلاصه فنی
- نام پکیج: `kama` (بر اساس `package.json`)
- فریمورک: Next.js 16.1.1 (App Router) + React 19 + TypeScript
- UI: Tailwind CSS، framer-motion، recharts، leaflet
- پایگاه داده: PostgreSQL با `pg`
- هوش مصنوعی: OpenAI / Google Gemini / OpenRouter
- ذخیره‌سازی فایل: S3-compatible (Chabokan/MinIO)
- احراز هویت: ایمیل/پسورد، OTP موبایل، کد ملی

## درخت سطح بالا (خلاصه)
```text
.
├─ src/
│  ├─ app/                # صفحات UI و API Routes
│  └─ lib/                # منطق مشترک (DB، Auth، AI، Logging)
├─ database/
│  ├─ migrations/         # SQL migrations
│  └─ seeds/              # داده‌های seed
├─ docs/                  # مستندات پروژه
├─ scripts/               # اسکریپت‌های DB و تست/عیب‌یابی
├─ public/                # تصاویر و فایل‌های استاتیک
├─ fonts/                 # فونت‌ها (Vazirmatn و ...)
├─ .env.example           # نمونه متغیرهای محیطی
├─ next.config.ts         # تنظیمات Next.js
├─ tsconfig.json          # تنظیمات TypeScript
├─ tailwind.config.ts     # تنظیمات Tailwind
└─ package.json
```

## ساختار اپلیکیشن (src/app)

### فایل‌های پایه
- `src/app/layout.tsx`: ریشه اپ، بارگذاری فونت محلی Vazirmatn، ThemeProvider، و SiteChrome.
- `src/app/globals.css`: استایل‌های سراسری.
- `src/app/not-found.tsx`: صفحه 404.
- `src/app/favicon.ico`: آیکون.

### مسیرهای UI (App Router)
مسیرها به صورت فایل‌های `page.tsx` و `layout.tsx` در `src/app` تعریف شده‌اند.

#### عمومی
- `/` → `src/app/page.tsx` (Landing)
- `/dashboard` → `src/app/dashboard/page.tsx`

#### احراز هویت (route group: `(auth)`)
- `/signin` → `src/app/(auth)/signin/page.tsx`
- `/forgot-password` → `src/app/(auth)/forgot-password/page.tsx`
- `/reset-password` → `src/app/(auth)/reset-password/page.tsx`

#### ادمین (`/admin`)
- `/admin/login` → `src/app/admin/login/page.tsx`
- `/admin` → `src/app/admin/page.tsx`
- `/admin/users` → `src/app/admin/users/page.tsx`
- `/admin/users/[schoolId]` → `src/app/admin/users/[schoolId]/page.tsx`
- `/admin/schools` → `src/app/admin/schools/page.tsx`
- `/admin/schools/add` → `src/app/admin/schools/add/page.tsx`
- `/admin/schools/edit/[id]` → `src/app/admin/schools/edit/[id]/page.tsx`
- `/admin/schools/[id]/principals` → `src/app/admin/schools/[id]/principals/page.tsx`
- `/admin/resources` → `src/app/admin/resources/page.tsx`
- `/admin/data-management` → `src/app/admin/data-management/page.tsx`
- `/admin/ai-communication` → `src/app/admin/ai-communication/page.tsx` (+ `layout.tsx`)
- `/admin/performance-analysis` → `src/app/admin/performance-analysis/page.tsx`
- `/admin/settings` → `src/app/admin/settings/page.tsx`

#### داشبورد مدیر/مدرسه (Principal) — `/dashboard/principal`
- ریشه/چیدمان: `src/app/dashboard/principal/layout.tsx`, `page.tsx`
- کلاس‌ها: `classes/`, `classes/add`, `classes/edit`, `classes/[id]`
- دانش‌آموزان: `students/`, `students/add`, `students/edit` + کامپوننت‌های مدیریت دانش‌آموز
- درس‌ها/موضوعات: `lessons/`, `subjects/`
- فعالیت‌ها: `activity-types/`, `activities/`, `bulk-activities/`
- گزارش‌ها: `reports/`, `reports/overview`, `reports/classes`, `reports/students`, `reports/students/[id]`,
  `reports/teachers`, `reports/parents`, `reports/ai`
- تحلیل عملکرد: `performance-analysis/`
- ارتباط با AI: `ai-communication/` (+ `layout.tsx`)
- تنظیمات: `settings/`
- ابزارهای ادمینی: `admin-tools/`

#### داشبورد معلم (Teacher) — `/dashboard/teacher`
- ریشه/چیدمان: `src/app/dashboard/teacher/layout.tsx`, `layout-new.tsx`, `page.tsx`
- کلاس‌ها: `classes/`, `classes/[id]`, `classes/[id]/grades`, `classes/[id]/ai-assessment-results`,
  `classes/[id]/activities/[activityId]/ai-correction`
- فعالیت‌ها: `activities/`, `smart-activities/`, `smart-correction/`
- گزارش‌ها: `reports/`, `reports/dashboard`, `reports/class/[id]`,
  `reports/class/[id]/student/[studentId]`, `reports/.../behavioral`
- ارتباط با AI: `ai-communication/` (+ `layout.tsx`)
- منابع: `resources/`
- امتحانات: `exams/`
- تنظیمات: `settings/`

#### داشبورد دانش‌آموز (Student) — `/dashboard/student`
- `page.tsx`, `settings/page.tsx`, `ai-communication/page.tsx`

#### داشبورد والدین (Parent) — `/dashboard/parent`
- ریشه/چیدمان: `layout.tsx`, `page.tsx`
- تنظیمات: `settings/page.tsx`
- ارتباط با AI: `ai-communication/page.tsx` (+ `layout.tsx`)

#### صفحات تست/نمونه
`src/app/test-*` شامل صفحات تست UI مانند:
`test-ai-chat`, `test-dashboard`, `test-login`, `test-persian-datepicker`,
`test-set-password`, `test-principal-dashboard`.

### کامپوننت‌های مشترک UI
- `src/app/components/*`: Navbar, Footer, Hero, Features, CTA, Alert, ThemeToggle, ThemeContext, PersianDatePicker و ...
- `src/app/components/AIChat/*`: پیاده‌سازی چت AI با hooks (useChat, useSpeechRecognition, useChatStorage).
- `src/app/components/reports/*`: اجزای داشبورد گزارش‌ها (ChartComponent, ReportFilters, StatsCard, ...).
- کامپوننت‌های ادمین و پرینسیپال در:
  `src/app/admin/components`, `src/app/admin/users/components`, `src/app/admin/schools/components`,
  `src/app/dashboard/principal/students/components`, `src/app/dashboard/teacher/classes/[id]/components`.

## API Routes (src/app/api)
API ها در قالب `route.ts` پیاده‌سازی شده‌اند.

### احراز هویت
- `/api/auth/signin`, `/api/auth/signout`, `/api/auth/me`
- `/api/auth/forgot-password`, `/api/auth/reset-password`
- `/api/auth/send-otp`, `/api/auth/send-otp-template`, `/api/auth/verify-otp`
- `/api/auth/signin-national-id`

### Admin
- `/api/admin/auth/login`, `/api/admin/auth/me`
- `/api/admin/users`, `/api/admin/users/create`, `/api/admin/users/[id]`, `/api/admin/users/[id]/reset-password`
- `/api/admin/schools`, `/api/admin/schools/[id]`
- `/api/admin/schools/[id]/principals`, `/api/admin/schools/[id]/principals/[principalId]`
- `/api/admin/resources`, `/api/admin/resources/subjects`
- `/api/admin/update-teachers-passwords`
- `/api/admin/run-fk-migration`, `/api/admin/run-password-migration`
- اسکریپت‌های مهاجرتی در مسیر:
  `src/app/api/admin/**/migrations/*`

### Principal
- `/api/principal/dashboard`
- مدیریت معلم‌ها: `/api/principal/teachers`, `/api/principal/teachers/[id]/reset-password`,
  `/api/principal/teachers/import`, `/api/principal/teachers/export`
- مدیریت دانش‌آموزان: `/api/principal/students`, `/api/principal/students/[id]`,
  `/api/principal/students/bulk-upload`, `/api/principal/students/delete-grade`
- مدیریت والدین: `/api/principal/parents`, `/api/principal/parents/[id]`
- کلاس‌ها: `/api/principal/classes`, `/api/principal/classes/[id]`,
  `/api/principal/classes/[id]/students`, `/api/principal/classes/[id]/students/remove`
- درس‌ها/موضوعات: `/api/principal/lessons`, `/api/principal/lessons/[id]`,
  `/api/principal/subjects`, `/api/principal/subjects/[id]`
- فعالیت‌ها: `/api/principal/activities`, `/api/principal/activities/template`,
  `/api/principal/activities/import`, `/api/principal/activities/export`,
  `/api/principal/activities/custom-template`
- نوع فعالیت: `/api/principal/activity-types`, `/api/principal/activity-types/[id]`
- گزارش‌ها: `/api/principal/reports/overview`, `/api/principal/reports/classes`,
  `/api/principal/reports/students`, `/api/principal/reports/students/[id]`,
  `/api/principal/reports/teachers`, `/api/principal/reports/parents`, `/api/principal/reports/ai`
- تنظیمات: `/api/principal/settings/profile`, `/api/principal/settings/change-password`
- دروس درسی ملی: `/api/principal/curriculum-lessons`, `/api/principal/sync-curriculum-lessons`

### Teacher
- `/api/teacher/dashboard`
- کلاس‌ها و دانش‌آموزان: `/api/teacher/classes`, `/api/teacher/classes/[id]`,
  `/api/teacher/classes/[id]/students`, `/api/teacher/classes/[id]/students/[studentId]`,
  `/api/teacher/classes/[id]/grades`
- فعالیت‌ها: `/api/teacher/activities`, `/api/teacher/activities/[id]`,
  `/api/teacher/activities/import`, `/api/teacher/activities/export`,
  `/api/teacher/activities/template`,
  `/api/teacher/classes/[id]/activities`, `/api/teacher/classes/[id]/activities/[activityId]`,
  `/api/teacher/classes/[id]/activities/bulk-upload`
- فعالیت‌های آموزشی: `/api/teacher/educational-activities`, `/api/teacher/educational-activities/[id]/upload-files`,
  `/api/teacher/educational-activities/[id]/delete-files`, `/api/teacher/educational-activities/[id]/send-to-ai`,
  `/api/teacher/educational-activities/[id]/ai-results`
- AI: `/api/teacher/ai-extract-activity`, `/api/teacher/ai-image-correction`,
  `/api/teacher/classes/[id]/ai-assessment-results`
- گزارش‌ها: `/api/teacher/reports`, `/api/teacher/reports/dashboard`,
  `/api/teacher/reports/student/[studentId]/behavioral`,
  `/api/teacher/reports/student/[studentId]/class/[classId]/teacher`,
  `/api/teacher/reports/student/[studentId]/class/[classId]/ai`
- سایر: `/api/teacher/subjects`, `/api/teacher/resources`, `/api/teacher/activity-types`
- تنظیمات: `/api/teacher/settings/profile`, `/api/teacher/settings/change-password`

### Parent/Student
- Parent: `/api/parent/dashboard`, `/api/parent/settings/profile`, `/api/parent/settings/change-password`
- Student: `/api/student/dashboard`, `/api/student/settings/profile`, `/api/student/settings/change-password`

### سایر/زیرساخت
- AI Chat: `/api/ai-chat`, `/api/ai-chat/test-connection`
- نتایج ارزیابی: `/api/ai/assessment-results`
- فایل/تصویر: `/api/image` (پراکسی برای S3)
- دیتابیس: `/api/init-database`, `/api/migrate-database`, `/api/clear-data`
- تست‌ها: `/api/test-simple`, `/api/test-logging`, `/api/test-email`, `/api/test-ai-service`
- سایر: `/api/subjects`, `/api/schools/[id]`, `/api/create-sample-principals`, `/api/set-principal-password`, `/api/debug-dashboard`

## کتابخانه‌ها (src/lib)
- `database.ts`: اتصال DB، ساخت اسکیمای پایه، seed نمونه، و fixTeacherClassMemberships.
- `auth.ts` / `auth_updated.ts`: احراز هویت (ایمیل/کدملی/OTP)، ریست رمز.
- `aiService.ts`: ارتباط با OpenAI و نقش‌ها؛ استریم و غیر‌استریم.
- `aiPrompts.ts`: پرامپت‌ها و تنظیمات مدل بر اساس نقش.
- `smsService.ts`: ارسال OTP با provider های مختلف.
- `emailService.ts`: ارسال ایمیل ریست رمز.
- `fileUpload.ts`: آپلود/حذف فایل روی S3-compatible و ساخت URL پراکسی.
- `logger.ts`: لاگینگ حرفه‌ای و ذخیره در جدول `logs`.
- `reports.ts`: کوئری‌های آماری برای داشبوردها.
- `exportUtils.ts`: خروجی CSV/JSON.
- `passwordEncryption.ts`: رمزنگاری اولیه برای ذخیره رمزها (initial_password).
- `utils.ts`: توابع عمومی (digits, profile image).
- `aiService.example.ts`: نمونه/مرجع.

## پایگاه داده (PostgreSQL)

### محل تعریف/مهاجرت‌ها
- `src/lib/database.ts`: تعریف اسکیمای اصلی و تریگرها.
- `database/migrations/*.sql`: مهاجرت‌های SQL (activity_types, lessons, indexes, initial_password, FK updates).
- `database/seeds/*.sql`: داده‌های اولیه (activity_types پیش‌فرض).
- `scripts/db/*`: مهاجرت‌ها و جدول‌های اضافی (resources، ai_question_results، assessments و ...).
- `src/app/api/admin/**/migrations/*`: مهاجرت‌های اجرایی برای ستون‌های جدید.

### افزونه‌ها و Enum ها
- Extensions: `uuid-ossp`, `pgcrypto`
- Enums:
  - `user_role`: `school_admin`, `principal`, `teacher`, `student`, `parent`
  - `exam_status`: `draft`, `published`, `active`, `ended`, `archived`
  - `question_type`: `mcq`, `descriptive`, `true_false`, `short_answer`
  - `answer_status`: `submitted`, `ai_graded`, `teacher_reviewed`, `finalized`

### جداول (Schema خلاصه)
#### هسته‌ای
- `schools`: `id`, `name`, `address`, `postal_code`, `phone`, `email`, `established_year`,
  `grade_level`, `region`, `gender_type`, `latitude`, `longitude`, `logo_url`, `created_at`, `updated_at`.
- `users`: `id`, `school_id`, `email`, `password_hash`, `phone`, `name`, `national_id`, `role`,
  `profile`(jsonb), `is_active`, `last_login`, `created_at`, `updated_at`,
  `initial_password`, `profile_picture_url`.

#### ساختار آموزشی
- `classes`: `id`, `school_id`, `name`, `grade_level`, `section`, `academic_year`, `description`,
  `subject`, `created_at`, `updated_at`.
- `class_memberships`: `id`, `class_id`, `user_id`, `role` (`teacher`/`student`),
  `joined_at`, `UNIQUE(class_id, user_id)`.
- `parent_student_relations`: `id`, `parent_id`, `student_id`, `relationship`, `created_at`,
  `UNIQUE(parent_id, student_id)`.
- `lessons`: `id`, `school_id`, `title`, `description`, `grade_level`,
  `created_by`, `created_at`, `updated_at`, `UNIQUE(school_id, title, grade_level)`.
- `subjects` (Legacy): `id`, `school_id`, `name`, `code`, `description`, `grade_level`, `created_at`,
  `UNIQUE(school_id, name)`.
- `teacher_assignments`: `id`, `class_id`, `teacher_id`, `subject_id`, `subject`,
  `assigned_at`, `removed_at`.
  - نکته: `subject_id` طبق مهاجرت به `lessons.id` اشاره می‌کند (نام ستون قدیمی است).
- `activity_types`: `id`, `school_id`, `type_key`, `persian_name`,
  `requires_quantitative_score`, `requires_qualitative_evaluation`,
  `is_active`, `display_order`, `created_at`, `updated_at`,
  `UNIQUE(school_id, type_key)`.

#### فعالیت‌ها و نمره‌دهی
- `educational_activities`: `id`, `class_id`, `subject_id`, `student_id`, `teacher_id`,
  `activity_type`, `activity_title`, `activity_date`, `quantitative_score`, `qualitative_evaluation`,
  `question_file_url`, `answer_file_url`, `teacher_note`, `status`, `ai_results`, `ai_score`,
  `created_at`, `updated_at`.
  - نکته: در اسناد جدید `subject_id` باید به `lessons.id` اشاره کند.
- `class_grades`: `id`, `class_id`, `student_id`, `teacher_id`, `subject_name`,
  `grade_value`, `max_score`, `percentage`, `grade_letter`, `term`, `description`,
  `created_at`, `updated_at`,
  `UNIQUE(class_id, student_id, subject_name, term)`.

#### آزمون و ارزیابی
- `exams`: `id`, `school_id`, `class_id`, `subject_id`, `teacher_id`, `title`, `description`,
  `instructions`, `duration_minutes`, `total_points`, `starts_at`, `ends_at`,
  `status`, `settings`(jsonb), `created_at`, `updated_at`.
- `questions`: `id`, `exam_id`, `author_id`, `question_order`, `type`, `content`,
  `choices`(jsonb), `correct_answer`(jsonb), `points`, `explanation`,
  `difficulty_level`, `tags`(text[]), `created_at`.
- `answers`: `id`, `exam_id`, `question_id`, `student_id`, `submitted_at`, `answer`(jsonb),
  `ai_score`, `ai_confidence`, `ai_feedback`, `teacher_score`, `final_score`,
  `graded_by`, `graded_at`, `status`, `remarks`, `metadata`(jsonb),
  `UNIQUE(exam_id, question_id, student_id)`.
- `exam_grades`: `id`, `exam_id`, `student_id`, `total_score`, `max_score`,
  `percentage`, `grade_letter`, `is_released`, `computed_at`, `created_at`,
  `UNIQUE(exam_id, student_id)`.

#### ارزیابی‌های مهارتی (Assessment Results)
- `life_skills_assessments`: امتیازهای 1..5 برای مهارت‌های زندگی
  (student_id = national_id، class_id، subject_id، teacher_id، assessment_date و ...).
- `active_life_assessments`: امتیازهای 0..3 برای ابعاد زندگی فعال.
- `growth_development_assessments`: امتیازهای 1..5 برای رشد/توسعه.

#### گزارش‌ها
- `teacher_reports`: `id`, `teacher_id`, `student_id`, `class_id`, `content`, `created_at`, `updated_at`.
- `ai_reports`: `id`, `student_id`, `class_id`, `content`, `analysis_points`(jsonb), `created_at`.
- `behavioral_reports`: `id`, `teacher_id`, `student_id`, `class_id`, `content`, `category`,
  `created_at`, `updated_at`.

#### AI و لاگ‌ها
- `ai_logs`: `id`, `answer_id`, `request_payload`, `response_payload`, `processing_time_ms`,
  `success`, `error_message`, `ai_model_version`, `created_at`.
- `ai_question_results`: `id`, `educational_activity_id`, `question_number`, `question_text`,
  `student_answer`, `score`, `max_score`, `analysis`(jsonb), `created_at`, `updated_at`.
- `logs`: `id`, `timestamp`, `level`, `message`, `meta`(jsonb),
  `user_id`, `ip_address`, `user_agent`, `url`, `method`, `status_code`, `response_time`, `created_at`.

#### ارتباطات و امنیت
- `notifications`: `id`, `user_id`, `title`, `message`, `type`, `data`(jsonb), `is_read`, `created_at`.
- `password_reset_tokens`: `id`, `user_id`, `token`, `expires_at`, `used`, `created_at`.
- `otp_tokens`: `id`, `phone`, `otp_code`, `expires_at`, `verified`, `attempts`, `created_at`.

#### منابع آموزشی
- `resources`: `id`, `title`, `file_url`, `file_name`, `file_size`, `file_type`,
  `grade_level`, `subject`, `description`, `school_id`,
  `uploaded_by` (nullable), `visibility_level`, `created_at`, `updated_at`.

#### مشاهدات فردی
- `individual_observations`: `id`(serial), `student_id`(national_id), `subject_id`,
  `title`, `description`, `observation_date`, `teacher_id`(national_id),
  `class_id`, `created_at`, `updated_at`.

### تریگرها و ایندکس‌ها (نمونه)
- تریگر `updated_at` برای: `schools`, `users`, `classes`, `exams`, `teacher_reports`,
  `behavioral_reports`, `educational_activities`, `resources`, `ai_question_results`, `activity_types`.
- ایندکس‌های مهم در `database/migrations/add_performance_indexes.sql` برای:
  `users`, `classes`, `class_memberships`, `teacher_assignments`, `parent_student_relations`, `subjects`.

### یادداشت‌های کلیدی
- مهاجرت `subjects` → `lessons` انجام شده؛ برخی ستون‌ها هنوز با نام `subject_id` باقی مانده‌اند.
- جدول `subjects` عملاً Legacy است اما هنوز در برخی اسکریپت‌ها/جداول استفاده می‌شود.

## اسکریپت‌ها و ابزارها
### ریشه پروژه
- `check-user.js`, `create-admin.js`, `create-system-admin.js`, `seed-data.js`
- `test-openrouter.js` (تست اتصال به OpenRouter)

### scripts/
- `scripts/db/*`: ساخت/به‌روزرسانی جداول (resources, ai_question_results, assessments, lessons, activity_types, ...)
- `scripts/tests/*`: تست‌های دستی API/AI
- اسکریپت‌های تخصصی برای همگام‌سازی دروس و معلم‌ها (sync-subjects-to-lessons, sync-teacher-assignments, ...).

## تنظیمات و متغیرهای محیطی (نمونه)
### پایگاه داده
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`
- `DATABASE_URL` (برای برخی اسکریپت‌ها)
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`

### AI
- `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`, `OPENROUTER_API_KEY`

### ایمیل
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `NEXTAUTH_URL` (برای ساخت لینک ریست رمز)

### SMS
- `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER`, `SMS_USERNAME`, `SMS_PASSWORD`

### ذخیره‌سازی فایل
- `AWS_REGION`, `AWS_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `BUCKET_NAME`

### سایر
- `NEXT_PUBLIC_APP_URL`, `LOG_LEVEL`, `PASSWORD_ENCRYPTION_KEY`, `NODE_ENV`

## منابع استاتیک
- `public/`: تصاویر لندینگ و `default-profile-image.jpg`.
- `fonts/`: فونت Vazirmatn (woff2) و نسخه‌های ttf/variable.

## مستندات موجود
مستندات تکمیلی در `docs/` قرار دارند، از جمله:
`DATABASE_STRUCTURE.md`, `AUTHENTICATION.md`, `AI_*`, `SUBJECTS_TO_LESSONS_MIGRATION.md`,
`ACTIVITY_TYPES_*`, `PRINCIPAL_*`, `USER_MANAGEMENT*`, `REPORTS_AND_ANALYTICS.md`.
