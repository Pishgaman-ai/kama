# EduHelper Documentation - مستندات سیستم آموزشی

مستندات کامل سیستم مدیریت آموزشی EduHelper

---

## 📚 فهرست مستندات

### 🏗️ معماری و ساختار

- [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md) - ساختار کامل دیتابیس
- [CURRICULUM_STRUCTURE.md](./CURRICULUM_STRUCTURE.md) - ساختار برنامه درسی ملی ایران

### 🔐 احراز هویت و امنیت

- [AUTHENTICATION.md](./AUTHENTICATION.md) - سیستم احراز هویت
- [LOGIN_METHODS.md](./LOGIN_METHODS.md) - روش‌های ورود به سیستم
- [راهنمای_ورود.md](./راهنمای_ورود.md) - راهنمای فارسی ورود به سیستم

### 👥 مدیریت کاربران

- [USER_MANAGEMENT.md](./USER_MANAGEMENT.md) - مدیریت کاربران
- [USER_MANAGEMENT_SUMMARY.md](./USER_MANAGEMENT_SUMMARY.md) - خلاصه مدیریت کاربران

### 🎓 مدیریت کلاس‌ها و دروس

- [CLASS_MANAGEMENT.md](./CLASS_MANAGEMENT.md) - مدیریت کلاس‌ها
- [CLASS_GRADES_MANAGEMENT.md](./CLASS_GRADES_MANAGEMENT.md) - مدیریت نمرات کلاس
- [SUBJECT_MANAGEMENT.md](./SUBJECT_MANAGEMENT.md) - مدیریت دروس (قدیمی)
- [lesson.md](./lesson.md) - اطلاعات دروس

### 📊 پنل مدیریت

- [PRINCIPAL_DASHBOARD.md](./PRINCIPAL_DASHBOARD.md) - داشبورد مدیر
- [PRINCIPAL_MANAGEMENT_FIX.md](./PRINCIPAL_MANAGEMENT_FIX.md) - رفع مشکلات مدیریت
- [PRINCIPAL_STATISTICS_FIX.md](./PRINCIPAL_STATISTICS_FIX.md) - رفع مشکلات آمار
- [PRINCIPALS_REFACTOR_SUMMARY.md](./PRINCIPALS_REFACTOR_SUMMARY.md) - خلاصه بازنویسی

### 📝 فعالیت‌های آموزشی

- [EDUCATIONAL_ACTIVITIES.md](./EDUCATIONAL_ACTIVITIES.md) - فعالیت‌های آموزشی
- **[BULK_ACTIVITIES_GUIDE.md](./BULK_ACTIVITIES_GUIDE.md)** - راهنمای مدیریت گروهی فعالیت‌ها ⭐ جدید
- [ACTIVITY_TYPES_FEATURE.md](./ACTIVITY_TYPES_FEATURE.md) - ویژگی انواع فعالیت
- [ACTIVITY_TYPES_SETUP.md](./ACTIVITY_TYPES_SETUP.md) - راه‌اندازی انواع فعالیت
- [ACTIVITY_TYPES_MIGRATION.md](./ACTIVITY_TYPES_MIGRATION.md) - مایگریشن انواع فعالیت

### 🔧 رفع مشکلات و مایگریشن‌ها

- [TEACHER_ASSIGNMENTS_FIX.md](./TEACHER_ASSIGNMENTS_FIX.md) - رفع مشکل تخصیص معلمان
- **[SUBJECTS_TO_LESSONS_MIGRATION.md](./SUBJECTS_TO_LESSONS_MIGRATION.md)** - مایگریشن از subjects به lessons ⭐ جدید

### 📈 گزارشات و تحلیل‌ها

- [REPORTS_AND_ANALYTICS.md](./REPORTS_AND_ANALYTICS.md) - گزارشات و تحلیل‌ها
- [TEACHER_REPORTS_FEATURE.md](./TEACHER_REPORTS_FEATURE.md) - ویژگی گزارشات معلم

### 🤖 هوش مصنوعی

- [AI_INTEGRATION.md](./AI_INTEGRATION.md) - یکپارچه‌سازی هوش مصنوعی
- **[PRINCIPAL_ASSISTANT_IMPROVEMENTS.md](./PRINCIPAL_ASSISTANT_IMPROVEMENTS.md)** - بهبودهای دستیار مدیر و جلوگیری از توهم ⭐ جدید
- [AI_SERVICE_IMPLEMENTATION_SUMMARY.md](./AI_SERVICE_IMPLEMENTATION_SUMMARY.md) - خلاصه پیاده‌سازی سرویس AI
- [AI_SERVICE_INTEGRATION_GUIDE.md](./AI_SERVICE_INTEGRATION_GUIDE.md) - راهنمای یکپارچه‌سازی
- [AI_ASSESSMENT_SERVICE_INTEGRATION.md](./AI_ASSESSMENT_SERVICE_INTEGRATION.md) - یکپارچه‌سازی ارزیابی AI
- [AI_GRADING_FEATURE.md](./AI_GRADING_FEATURE.md) - ویژگی نمره‌دهی AI
- [AI_GRADING_SERVICE_INTEGRATION.md](./AI_GRADING_SERVICE_INTEGRATION.md) - یکپارچه‌سازی سرویس نمره‌دهی
- [AI_CHAT_FEATURE.md](./AI_CHAT_FEATURE.md) - ویژگی چت هوشمند

### 📚 منابع آموزشی

- [RESOURCES_MANAGEMENT.md](./RESOURCES_MANAGEMENT.md) - مدیریت منابع

### 🔨 پیاده‌سازی و توسعه

- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - خلاصه پیاده‌سازی
- [DATA_MANAGEMENT_GUIDE.md](./DATA_MANAGEMENT_GUIDE.md) - راهنمای مدیریت داده
- [TESTING.md](./TESTING.md) - تست‌ها

### 📧 ارتباطات

- [EMAIL_SETUP.md](./EMAIL_SETUP.md) - تنظیمات ایمیل
- [SMS_TEMPLATE_USAGE.md](./SMS_TEMPLATE_USAGE.md) - استفاده از قالب پیامک

---

## 🚀 شروع سریع

### نصب و راه‌اندازی

```bash
# نصب وابستگی‌ها
npm install

# اجرای سرور توسعه
npm run dev

# اجرای در محیط لوکال
npm run dev:local
```

سرور روی [http://localhost:3000](http://localhost:3000) اجرا می‌شود.

### دیتابیس

```bash
# بررسی تخصیص معلمان
node scripts/check-teacher-assignments.js

# همگام‌سازی تخصیص معلمان
node scripts/sync-teacher-assignments.js

# مایگریشن از subjects به lessons
node scripts/sync-subjects-to-lessons.js

# ایجاد دروس برنامه درسی ملی
node scripts/seed-iran-curriculum-lessons.js
```

---

## 📖 راهنمای استفاده

### برای توسعه‌دهندگان

1. **شروع**: [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md) را بخوانید
2. **احراز هویت**: [AUTHENTICATION.md](./AUTHENTICATION.md) را مطالعه کنید
3. **API ها**: مستندات مرتبط با هر feature را ببینید

### برای مدیران سیستم

1. **راه‌اندازی**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
2. **مدیریت کاربران**: [USER_MANAGEMENT.md](./USER_MANAGEMENT.md)
3. **رفع مشکلات**: [TEACHER_ASSIGNMENTS_FIX.md](./TEACHER_ASSIGNMENTS_FIX.md)

### برای مدیران مدارس

1. **داشبورد**: [PRINCIPAL_DASHBOARD.md](./PRINCIPAL_DASHBOARD.md)
2. **مدیریت کلاس**: [CLASS_MANAGEMENT.md](./CLASS_MANAGEMENT.md)
3. **مدیریت گروهی فعالیت‌ها**: [BULK_ACTIVITIES_GUIDE.md](./BULK_ACTIVITIES_GUIDE.md) 🔥
4. **دروس**: [CURRICULUM_STRUCTURE.md](./CURRICULUM_STRUCTURE.md)

---

## ⚡ تغییرات اخیر

### نسخه 10.2 - بهمن ۱۴۰۴ 🆕

#### ✅ سیستم مدیریت گروهی فعالیت‌ها (Bulk Activities)
- قابلیت import/export فعالیت‌ها از/به Excel
- تولید الگوهای سفارشی با فیلتر پایه، کلاس و درس
- اعتبارسنجی کامل داده‌ها (دانش‌آموز، معلم، کلاس، درس)
- گزارش‌دهی جامع خطاها و نتایج
- پشتیبانی از عملیات insert و update
- نمایش آمار و تحلیل فعالیت‌ها
- مستندات: **[BULK_ACTIVITIES_GUIDE.md](./BULK_ACTIVITIES_GUIDE.md)** 🔥

#### 📊 بروزرسانی مستندات دیتابیس
- افزودن بخش جامع "Bulk Activities Management"
- توضیحات تکمیلی جداول مرتبط
- دیاگرام‌های روابط و جریان داده
- مثال‌های کاربردی و کوئری‌های SQL
- مستندات: [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md)

#### 🤖 بهبودهای دستیار هوش مصنوعی مدیر
- اصلاح کوئری‌ها به جدول `lessons` (حذف کامل `subjects`)
- بهبود Function Call برای استخراج دقیق نام دانش‌آموز و درس
- افزودن قوانین Anti-Hallucination جامع
- بهبود Narrative Generation Prompt
- اضافه کردن توابع validation: `validateStudentInClass`, `getStudentActiveSubjects`
- مستندات: **[PRINCIPAL_ASSISTANT_IMPROVEMENTS.md](./PRINCIPAL_ASSISTANT_IMPROVEMENTS.md)** 🔥

### نسخه 10.1 - آذر ۱۴۰۴

#### ✅ مایگریشن کامل از subjects به lessons
- تمام سیستم به استفاده از جدول `lessons` منتقل شد
- 49 فعالیت و 1 تخصیص معلم به‌روزرسانی شد
- Foreign Key Constraint ها تغییر یافتند
- مستندات: [SUBJECTS_TO_LESSONS_MIGRATION.md](./SUBJECTS_TO_LESSONS_MIGRATION.md)

#### ✅ رفع مشکل تخصیص معلمان
- رفع مشکل لیست خالی کلاس‌ها برای معلمان
- رفع مشکل نمایش دروس در فرم ثبت فعالیت
- اضافه شدن فیلتر بر اساس تخصیص معلم-کلاس-درس
- مستندات: [TEACHER_ASSIGNMENTS_FIX.md](./TEACHER_ASSIGNMENTS_FIX.md)

#### ✅ انواع فعالیت‌های آموزشی
- قابلیت تعریف انواع فعالیت توسط مدیر
- پشتیبانی از فعالیت‌های کمی و کیفی
- مستندات: [ACTIVITY_TYPES_FEATURE.md](./ACTIVITY_TYPES_FEATURE.md)

---

## 🛠️ فناوری‌های استفاده شده

- **Framework**: Next.js 16.1.1
- **Database**: PostgreSQL
- **Language**: TypeScript
- **UI**: React, Tailwind CSS
- **Authentication**: Session-based with cookies

---

## 📞 پشتیبانی

برای گزارش مشکلات یا پیشنهادات:
- مستندات را مطالعه کنید
- Scripts تشخیصی را اجرا کنید
- به تیم توسعه مراجعه کنید

---

## 📝 یادداشت‌های مهم

### تغییرات ساختاری مهم

1. **جدول lessons به جای subjects**: تمام FK ها به `lessons` اشاره می‌کنند
2. **grade_level = "همه"**: برای دروس قابل استفاده در تمام پایه‌ها
3. **teacher_assignments.subject_id**: به رغم نام، به `lessons.id` اشاره می‌کند

### Scripts مفید

```bash
# بررسی وضعیت فعالیت‌ها
node scripts/check-activities-subject-ids.js

# بررسی تطابق subjects و lessons
node scripts/check-subjects-lessons-relationship.js

# بررسی schema جداول
node scripts/check-educational-activities-schema.js
node scripts/check-lessons-schema.js
```

---

**تاریخ به‌روزرسانی**: ۱۴۰۴/۱۱/۱۷ (February 6, 2026)
**نسخه**: 10.2
**وضعیت**: Production Ready ✅

### 🎯 ویژگی‌های برجسته نسخه فعلی

1. **مدیریت گروهی فعالیت‌ها**: ورود و خروجی اکسل با اعتبارسنجی کامل
2. **162 درس برنامه درسی ملی**: پوشش کامل دوره ابتدایی، متوسطه اول و دوم
3. **سیستم هوش مصنوعی**: نمره‌دهی و چت هوشمند
4. **پنل تحلیلی مدیران**: آمار و نمودارهای جامع
5. **چند روش احراز هویت**: ایمیل، موبایل، کد ملی
