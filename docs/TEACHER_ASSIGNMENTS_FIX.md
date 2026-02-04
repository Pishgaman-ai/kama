# رفع مشکل نمایش کلاس‌های معلمان (Teacher Assignments Fix)

## شرح مشکل

هنگامی که معلمان به حساب کاربری خود وارد می‌شدند، لیست کلاس‌های آنها خالی بود و نمی‌توانستند فعالیت ثبت کنند.

### علت مشکل

1. **API `/api/teacher/classes` از جدول `teacher_assignments` استفاده می‌کرد**
2. **بسیاری از معلمان در جدول `teacher_assignments` رکورد نداشتند**
3. **معلمان فقط در جدول `class_memberships` ثبت شده بودند**
4. **حتی بعد از ایجاد رکوردهای `teacher_assignments`، مشکل ادامه داشت زیرا**:
   - فیلد `subject_id` در تمام رکوردهای جدید `NULL` بود
   - API از `JOIN subjects` استفاده می‌کرد (نه `LEFT JOIN`)
   - این باعث می‌شد که هیچ داده‌ای برنمی‌گشت

## راه‌حل پیاده‌سازی شده

### 1. Scripts تشخیصی و رفع مشکل

#### `scripts/check-teacher-assignments.js`
Script بررسی وضعیت تخصیص معلمان به کلاس‌ها:

```bash
node scripts/check-teacher-assignments.js
```

**خروجی**:
- لیست تمام معلمان
- تعداد assignments فعال هر معلم
- لیست معلمانی که هیچ assignment فعالی ندارند

#### `scripts/sync-teacher-assignments.js`
Script همگام‌سازی `teacher_assignments` با `class_memberships`:

```bash
node scripts/sync-teacher-assignments.js
```

**عملکرد**:
- تمام معلمان موجود در `class_memberships` را پیدا می‌کند
- برای معلمانی که در `teacher_assignments` رکورد ندارند، رکورد جدید ایجاد می‌کند
- 39 رکورد جدید ایجاد کرد
- از 18 معلم بدون assignment به 4 معلم کاهش یافت

#### `scripts/debug-teacher-classes.js`
Script تشخیص دقیق مشکل:

```bash
node scripts/debug-teacher-classes.js
```

**خروجی**:
- بررسی دقیق داده‌های هر معلم
- شبیه‌سازی کوئری API
- تشخیص اینکه چرا API داده برنمی‌گرداند
- **کشف کرد که `subject_id = NULL` علت اصلی مشکل است**

### 2. تغییرات API

#### قبل از تغییر (مشکل‌دار):
```sql
FROM teacher_assignments ta
JOIN subjects s ON ta.subject_id = s.id  -- ❌ اگر subject_id = NULL باشد، هیچ نتیجه‌ای برنمی‌گردد
JOIN classes c ON ta.class_id = c.id
```

#### بعد از تغییر (اصلاح شده):
```sql
FROM teacher_assignments ta
JOIN classes c ON ta.class_id = c.id
LEFT JOIN subjects s ON ta.subject_id = s.id  -- ✅ حتی اگر subject_id = NULL باشد، کلاس را برمی‌گرداند
```

**استفاده از COALESCE برای نام درس**:
```sql
COALESCE(s.name, ta.subject, c.subject, c.name) as subject_name
```

این کد به ترتیب اولویت:
1. اگر در جدول `subjects` یافت شد، نام درس از آنجا
2. اگر نه، از فیلد `subject` در `teacher_assignments`
3. اگر نه، از فیلد `subject` در `classes`
4. اگر هیچکدام، نام کلاس را به عنوان نام درس استفاده می‌کند

**اصلاح بررسی دسترسی در Students API**:

در API `/api/teacher/classes/[id]/students`، بررسی دسترسی فقط از `teacher_assignments` استفاده می‌کرد. این باعث می‌شد که معلمانی که فقط در `class_memberships` هستند، نتوانند دانش‌آموزان را ببینند.

```sql
-- قبل (مشکل‌دار):
SELECT COUNT(*) FROM teacher_assignments
WHERE teacher_id = $1 AND class_id = $2 AND removed_at IS NULL

-- بعد (اصلاح شده):
SELECT COUNT(*) FROM (
  SELECT teacher_id FROM teacher_assignments
  WHERE teacher_id = $1 AND class_id = $2 AND removed_at IS NULL
  UNION
  SELECT user_id as teacher_id FROM class_memberships
  WHERE user_id = $1 AND class_id = $2 AND role = 'teacher'
) as access
```

حالا هر دو جدول را بررسی می‌کند، بنابراین تمام معلمان می‌توانند دانش‌آموزان کلاس‌های خود را ببینند.

### 3. فایل‌های تغییر یافته

**API Endpoints**:
- ✅ `src/app/api/teacher/classes/route.ts` - اصلاح کوئری با LEFT JOIN و CASE WHEN
- ✅ `src/app/api/teacher/classes/[id]/students/route.ts` - اصلاح access check با UNION
- ✅ `src/app/api/teacher/subjects/route.ts` - API جدید برای لیست دروس مدرسه
- ✅ `src/app/api/teacher/activity-types/route.ts` - API برای دریافت نوع فعالیت‌های مدرسه

**صفحات Frontend**:
- ✅ `src/app/dashboard/teacher/activities/page.tsx` - استفاده از API جدید subjects و activity-types
- ✅ `src/app/dashboard/teacher/smart-activities/page.tsx` - استفاده از API جدید subjects و activity-types

**Scripts**:
- ✅ `scripts/check-teacher-assignments.js` - ایجاد شد
- ✅ `scripts/sync-teacher-assignments.js` - ایجاد شد
- ✅ `scripts/debug-teacher-classes.js` - ایجاد شد
- ✅ `scripts/auto-assign-subjects.js` - ایجاد شد
- ✅ `scripts/check-specific-teacher.js` - ایجاد شد

**مستندات**:
- ✅ `docs/TEACHER_ASSIGNMENTS_FIX.md` - این فایل

### 4. رفع مشکل نمایش نام کلاس به جای نام درس

**مشکل**:
وقتی `subject_id = NULL` بود، API از `COALESCE` استفاده می‌کرد و در نهایت به `c.name` (نام کلاس) می‌رسید. این باعث می‌شد که در dropdown "درس"، نام کلاس نمایش داده شود.

**راه‌حل**:
1. **Script `auto-assign-subjects.js`**: سعی می‌کند به طور خودکار کلاس‌ها را با دروس موجود match کند
   - 17 assignment را با موفقیت match کرد
   - برای بقیه، نام کلاس را در فیلد `subject` قرار داد

2. **بهبود منطق API با `CASE WHEN`**:
```sql
CASE
  WHEN s.name IS NOT NULL THEN s.name
  WHEN ta.subject IS NOT NULL AND ta.subject != c.name THEN ta.subject
  WHEN c.subject IS NOT NULL AND c.subject != c.name THEN c.subject
  ELSE CONCAT(c.name, ' (چند درسی)')
END as subject_name
```

این منطق:
- اگر نام درس در subjects table باشد → از آن استفاده می‌کند
- اگر نام درس در assignment متفاوت از نام کلاس باشد → از آن استفاده می‌کند
- در غیر این صورت → نام کلاس + لیبل "(چند درسی)" را نمایش می‌دهد

**Scripts اضافی**:
- `scripts/auto-assign-subjects.js` - Match خودکار کلاس‌ها با دروس
- `scripts/check-specific-teacher.js` - Debug دقیق یک معلم خاص

### 5. رفع مشکل نمایش دروس در فرم ثبت فعالیت

**مشکل**:
در صفحات ثبت فعالیت (`/dashboard/teacher/activities` و `/dashboard/teacher/smart-activities`)، بعد از انتخاب کلاس، در dropdown "درس"، به جای نام دروس واقعی، عناوینی مثل "ب (چند درسی)" نمایش داده می‌شد.

**علت**:
این صفحات از API `/api/teacher/classes` استفاده می‌کردند که `subject_name` را با CASE WHEN و لیبل "(چند درسی)" برمی‌گرداند. این API برای هر کلاس فقط یک "موضوع" برمی‌گرداند، در حالی که یک کلاس ممکن است چند درس مختلف داشته باشد.

**راه‌حل**:
1. **API جدید `/api/teacher/subjects`**: لیست تمام دروس مدرسه را برمی‌گرداند
2. **اصلاح `fetchSubjects` در صفحات ثبت فعالیت**: از API جدید استفاده می‌کنند

```typescript
// Before (مشکل‌دار):
const response = await fetch("/api/teacher/classes");
const classSubjects = data.data.subjects.filter(s => s.class_id === classId);

// After (اصلاح شده):
const response = await fetch("/api/teacher/subjects");
const allSubjects = data.subjects; // All school subjects
```

حالا معلمان می‌توانند:
- هر درسی از مدرسه را برای هر کلاسی انتخاب کنند
- دروس واقعی (مثلاً ریاضی، علوم، فارسی) را ببینند
- نه عناوین کلاس (مثلاً "ب - نهم")

### 6. رفع مشکل نمایش نوع فعالیت به جای درس در فرم ثبت فعالیت

**مشکل**:
در صفحه `/dashboard/teacher/activities`، بعد از انتخاب کلاس، در dropdown "درس"، به جای نام دروس واقعی (ریاضی، علوم)، نوع فعالیت‌ها (آزمون ماهیانه، تکلیف کلاسی) نمایش داده می‌شد.

**علت**:
صفحه `activities/page.tsx` از آرایه hardcoded برای `activityTypes` استفاده می‌کرد و هنگام رفع مشکل قبلی (بخش 5)، فقط صفحه `smart-activities/page.tsx` اصلاح شد ولی `activities/page.tsx` فراموش شد.

**تفاوت قبل و بعد**:

```typescript
// قبل (مشکل‌دار):
const activityTypes = [
  { id: "midterm_exam", name: "آزمون میان‌ترم" },
  { id: "monthly_exam", name: "آزمون ماهیانه" },
  // ... hardcoded array
];

// بعد (اصلاح شده):
const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);

const fetchActivityTypes = async () => {
  const response = await fetch("/api/teacher/activity-types");
  if (response.ok) {
    const data = await response.json();
    setActivityTypes(data.activityTypes || []);
  }
};

// در useEffect:
await fetchActivityTypes();
```

**راه‌حل**:
1. تبدیل `activityTypes` از const به state variable
2. افزودن تابع `fetchActivityTypes()` برای دریافت از API
3. فراخوانی `fetchActivityTypes()` در useEffect هنگام بارگذاری صفحه
4. افزودن interface `ActivityType` با فیلدهای لازم

**نتیجه**:
- dropdown "درس" حالا دروس واقعی را نمایش می‌دهد (از `/api/teacher/subjects`)
- dropdown "نوع فعالیت" نوع فعالیت‌های تعریف شده توسط مدیر را نمایش می‌دهد (از `/api/teacher/activity-types`)
- هر dropdown به API صحیح خود متصل است

### 7. رفع مشکل نمایش تمام دروس به جای دروس کلاس خاص

**مشکل نهایی**:
بعد از رفع مشکلات قبلی، dropdown "درس" همچنان تمام دروس مدرسه را نشان می‌داد، نه فقط دروسی که آن معلم در آن کلاس خاص تدریس می‌کند.

**تحلیل ریشه‌ای**:
1. در دیتابیس، جدول `teacher_assignments` مشخص می‌کند که هر معلم در هر کلاس چه درسی تدریس می‌کند
2. برای هر رکورد `teacher_assignments` باید `subject_id` مشخص باشد
3. API `/api/teacher/subjects` تمام دروس مدرسه را برمی‌گرداند، نه دروس خاص کلاس

**راه‌حل پیاده‌سازی شده**:

**1. اصلاح API `/api/teacher/subjects`**:
- حالا `class_id` را به عنوان query parameter می‌پذیرد
- اگر `class_id` داده شود، فقط دروسی را برمی‌گرداند که معلم در آن کلاس تدریس می‌کند
- اگر `subject_id` برای معلم NULL باشد (تنظیم نشده)، به fallback می‌رود و تمام دروس مدرسه را نشان می‌دهد

```typescript
// API endpoint: /api/teacher/subjects?class_id=xxx
if (classId) {
  // Get only subjects this teacher teaches in this class
  SELECT DISTINCT s.*
  FROM teacher_assignments ta
  JOIN subjects s ON ta.subject_id = s.id
  WHERE ta.teacher_id = $1 AND ta.class_id = $2

  // Fallback if no subjects found
  if (result.length === 0) {
    // Return all school subjects
  }
}
```

**2. اصلاح Frontend Pages**:
- تغییر `fetchSubjects(classId)` در `activities/page.tsx`
- تغییر `fetchSubjects(classId)` در `smart-activities/page.tsx`
- حالا `class_id` را به API ارسال می‌کنند

```typescript
// Before:
const response = await fetch("/api/teacher/subjects");

// After:
const response = await fetch(`/api/teacher/subjects?class_id=${classId}`);
```

**نتیجه**:
- ✅ اگر معلم برای آن کلاس subject_id دارد → فقط دروس او نمایش داده می‌شود
- ✅ اگر subject_id تنظیم نشده → تمام دروس مدرسه نمایش داده می‌شود (fallback)
- ✅ معلم می‌تواند برای هر کلاس فقط دروس مجاز خود را ببیند
- ⚠️ **نیاز دارد**: مدیر باید در پنل مدیریت، برای هر معلم در هر کلاس، `subject_id` را تنظیم کند

**Script تشخیصی**:
```bash
node scripts/check-teacher-class-subjects.js
```
این script نشان می‌دهد که هر معلم در هر کلاس چه دروسی دارد و آیا subject_id تنظیم شده یا خیر.

### 8. رفع مشکل اصلی: API پنل مدیریت از جدول اشتباه استفاده می‌کرد

**مشکل اصلی کشف شده**:
بعد از بررسی دقیق، مشخص شد که مشکل ریشه‌ای در API های پنل مدیریت بود:

1. هنگامی که مدیر در پنل کلاس‌ها برای یک کلاس معلم و درس تعیین می‌کرد
2. API سعی می‌کرد `subject_id` را در جدول `lessons` پیدا کند (اشتباه!)
3. چون در جدول `lessons` نبود، هیچ تخصیصی ایجاد نمی‌شد
4. در نتیجه `teacher_assignments` ایجاد نمی‌شد یا با `subject_id = NULL` ایجاد می‌شد

**کد اشتباه** (در POST و PUT):
```javascript
const lessonCheck = await client.query(
  `SELECT id FROM lessons WHERE id = $1 AND school_id = $2`,
  [assignment.subject_id, schoolId]
);
```

**کد صحیح** (تصحیح اولیه):
```javascript
const subjectCheck = await client.query(
  `SELECT id FROM subjects WHERE id = $1 AND school_id = $2`,
  [assignment.subject_id, schoolId]
);
```

**کد نهایی** (بعد از مایگریشن):
```javascript
const lessonCheck = await client.query(
  `SELECT id, title FROM lessons WHERE id = $1 AND school_id = $2`,
  [assignment.subject_id, schoolId]
);
```

**فایل‌های رفع شده**:
- ✅ `src/app/api/principal/classes/route.ts` (POST) - خط 194-196
- ✅ `src/app/api/principal/classes/[id]/route.ts` (PUT) - خط 235-239

**نتیجه**:
- ✅ حالا مدیر می‌تواند معلمان و دروس را به درستی تخصیص دهد
- ✅ تخصیص‌ها با `subject_id` معتبر در دیتابیس ذخیره می‌شوند
- ✅ معلمان فقط دروس مجاز خود را در فرم ثبت فعالیت می‌بینند
- ✅ امنیت تضمین می‌شود: معلم نمی‌تواند برای درس معلم دیگر فعالیت ثبت کند

### 9. مایگریشن کامل از subjects به lessons

**مشکل نهایی**:
بعد از رفع مشکلات بالا، هنگام ثبت فعالیت جدید خطای Foreign Key Constraint رخ می‌داد:

```
error: insert or update on table "educational_activities" violates
foreign key constraint "educational_activities_subject_id_fkey"
```

**علت ریشه‌ای**:
- جدول `educational_activities` دارای FK به جدول `subjects` بود
- اما سیستم از جدول `lessons` برای مدیریت دروس استفاده می‌کرد
- این تناقض باعث خطا می‌شد

**راه‌حل نهایی**: مایگریشن کامل به جدول `lessons`

تمام سیستم به استفاده یکپارچه از جدول `lessons` منتقل شد:

```bash
# اجرای اسکریپت مایگریشن
node scripts/sync-subjects-to-lessons.js
```

**نتایج مایگریشن**:
- ✅ 5 lesson جدید ایجاد شد
- ✅ 49 فعالیت موجود به‌روزرسانی شد
- ✅ 1 تخصیص معلم به‌روزرسانی شد
- ✅ FK constraint به `lessons` تغییر یافت
- ✅ تمام API ها از `lessons` استفاده می‌کنند

**مستندات کامل**: [SUBJECTS_TO_LESSONS_MIGRATION.md](./SUBJECTS_TO_LESSONS_MIGRATION.md)

## نحوه استفاده

### برای رفع مشکل در دیتابیس جدید:

```bash
# 1. بررسی وضعیت فعلی
node scripts/check-teacher-assignments.js

# 2. همگام‌سازی teacher_assignments
node scripts/sync-teacher-assignments.js

# 3. Auto-assign subjects (match کلاس‌ها با دروس)
node scripts/auto-assign-subjects.js

# 4. در صورت نیاز، debug دقیق
node scripts/debug-teacher-classes.js

# 5. بررسی یک معلم خاص
node scripts/check-specific-teacher.js [email]
# مثال: node scripts/check-specific-teacher.js teacher@example.com
```

### برای مطمئن شدن از عملکرد:

1. وارد حساب یک معلم شوید
2. به صفحه "کلاس‌ها" یا "ثبت فعالیت هوشمند" بروید
3. باید لیست کلاس‌ها نمایش داده شود
4. با انتخاب کلاس، لیست دانش‌آموزان باید نمایش داده شود

## نکات فنی

### چرا از LEFT JOIN استفاده کردیم؟

**INNER JOIN (قبلی)**:
- فقط رکوردهایی را برمی‌گرداند که در هر دو جدول وجود دارند
- اگر `subject_id = NULL` باشد، هیچ نتیجه‌ای نمی‌آید

**LEFT JOIN (جدید)**:
- تمام رکوردهای جدول سمت چپ را برمی‌گرداند
- حتی اگر در جدول سمت راست match نباشد
- برای ستون‌های جدول راست، `NULL` برمی‌گرداند

### چرا COALESCE استفاده کردیم?

```sql
COALESCE(value1, value2, value3, ...)
```

- اولین مقدار `NOT NULL` را برمی‌گرداند
- اگر همه `NULL` باشند، `NULL` برمی‌گرداند
- برای fallback به مقادیر جایگزین استفاده می‌شود

## آمار و نتایج

### قبل از رفع مشکل:
- ❌ 18 معلم بدون assignment فعال
- ❌ API برای معلمان داده برنمی‌گرداند
- ❌ لیست کلاس‌ها خالی بود

### بعد از رفع مشکل:
- ✅ 39 رکورد جدید در `teacher_assignments` ایجاد شد
- ✅ 4 معلم بدون assignment (احتمالاً واقعاً کلاس ندارند)
- ✅ API برای تمام معلمان کار می‌کند
- ✅ لیست کلاس‌ها نمایش داده می‌شود

## نگهداری و پیگیری

### اگر مشکل دوباره رخ داد:

1. **ابتدا check کنید**:
   ```bash
   node scripts/check-teacher-assignments.js
   ```

2. **معلمان بدون assignment را شناسایی کنید**

3. **بررسی کنید که آیا در `class_memberships` هستند**

4. **همگام‌سازی کنید**:
   ```bash
   node scripts/sync-teacher-assignments.js
   ```

5. **اگر همچنان مشکل دارد، debug کنید**:
   ```bash
   node scripts/debug-teacher-classes.js
   ```

### برای جلوگیری از مشکلات آینده:

- هنگام افزودن معلم جدید به کلاس، هم در `class_memberships` و هم در `teacher_assignments` رکورد ایجاد کنید
- از API های موجود برای افزودن معلم استفاده کنید که هر دو جدول را به‌روزرسانی می‌کنند
- به طور دوره‌ای script `check-teacher-assignments.js` را اجرا کنید

## مراجع

- کد API: `src/app/api/teacher/classes/route.ts`
- Schema دیتابیس: `src/lib/database.ts`
- اسناد مرتبط: `docs/ACTIVITY_TYPES_FEATURE.md`
