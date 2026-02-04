# راهنمای Migration و نصب ویژگی مدیریت انواع فعالیت

## وضعیت فعلی

**⚠️ مهم:** برنامه در حال حاضر بدون migration هم کار می‌کند!

اگر جدول `activity_types` وجود نداشته باشد:
- سیستم به صورت خودکار از انواع فعالیت پیش‌فرض (hardcoded) استفاده می‌کند
- هیچ خطایی رخ نمی‌دهد
- همه قابلیت‌های قبلی برنامه به درستی کار می‌کنند

## نصب و فعال‌سازی ویژگی جدید

برای فعال‌سازی قابلیت مدیریت انواع فعالیت توسط مدیران، باید 2 مرحله را انجام دهید:

### روش 1: استفاده از SQL مستقیم (توصیه می‌شود)

#### مرحله 1: اجرای Migration

```sql
-- اجرا در PostgreSQL
\i database/migrations/001_create_activity_types_table.sql
```

یا با psql از command line:

```bash
psql -U your_username -d your_database -f database/migrations/001_create_activity_types_table.sql
```

#### مرحله 2: Seed کردن داده‌های پیش‌فرض

```sql
-- اجرا در PostgreSQL
\i database/seeds/001_seed_default_activity_types.sql
```

یا با psql از command line:

```bash
psql -U your_username -d your_database -f database/seeds/001_seed_default_activity_types.sql
```

### روش 2: استفاده از Node Scripts

#### پیش‌نیاز: کامپایل TypeScript به JavaScript

```bash
# کامپایل migration script
npx tsc scripts/db/add-activity-types-table.ts --outDir scripts/db --module commonjs

# کامپایل seed script
npx tsc scripts/seed-default-activity-types.ts --outDir scripts --module commonjs
```

#### مرحله 1: اجرای Migration

```bash
node scripts/db/add-activity-types-table.js
```

#### مرحله 2: Seed کردن داده‌های پیش‌فرض

```bash
node scripts/seed-default-activity-types.js
```

### روش 3: اجرای دستی با pgAdmin یا ابزار مشابه

1. باز کردن فایل `database/migrations/001_create_activity_types_table.sql`
2. Copy کردن محتوا
3. Paste و اجرا در Query Tool
4. تکرار برای `database/seeds/001_seed_default_activity_types.sql`

## تأیید نصب موفق

بعد از اجرای migration و seed، بررسی کنید:

```sql
-- بررسی وجود جدول
SELECT COUNT(*) FROM activity_types;

-- نمایش نمونه داده‌ها
SELECT school_id, type_key, persian_name FROM activity_types LIMIT 10;

-- خلاصه تعداد انواع فعالیت به تفکیک مدرسه
SELECT
  s.name as school_name,
  COUNT(at.id) as activity_types_count
FROM schools s
LEFT JOIN activity_types at ON s.id = at.school_id
GROUP BY s.id, s.name
ORDER BY s.name;
```

خروجی مورد انتظار:
- هر مدرسه باید 7 نوع فعالیت داشته باشد
- مجموع رکوردها = تعداد مدارس × 7

## استفاده بعد از نصب

### برای مدیران مدارس

1. ورود به داشبورد مدیر
2. کلیک روی "انواع فعالیت" در منوی کناری
3. مدیریت انواع فعالیت:
   - مشاهده لیست
   - افزودن نوع جدید
   - ویرایش
   - غیرفعال/حذف

### برای معلمان

- هیچ تغییری لازم نیست
- انواع فعالیت به صورت خودکار از دیتابیس بارگذاری می‌شوند
- در صورت عدم وجود جدول، از انواع پیش‌فرض استفاده می‌شود

## انواع فعالیت پیش‌فرض

7 نوع فعالیتی که برای همه مدارس تعریف می‌شود:

| type_key | persian_name | نمره کمی | ارزیابی کیفی |
|----------|--------------|----------|--------------|
| midterm_exam | آزمون میان‌ترم | ✅ | ❌ |
| monthly_exam | آزمون ماهیانه | ✅ | ❌ |
| weekly_exam | آزمون هفتگی | ✅ | ❌ |
| final_exam | آزمون پایان ترم | ✅ | ❌ |
| class_activity | فعالیت کلاسی | ✅ | ✅ |
| class_homework | تکلیف کلاسی | ✅ | ✅ |
| home_homework | تکلیف منزل | ✅ | ❌ |

## ساختار جدول

```sql
CREATE TABLE activity_types (
  id UUID PRIMARY KEY,
  school_id UUID NOT NULL,              -- Foreign key to schools
  type_key VARCHAR(100) NOT NULL,       -- Unique key (e.g., midterm_exam)
  persian_name VARCHAR(255) NOT NULL,   -- Display name (e.g., آزمون میان‌ترم)
  requires_quantitative_score BOOLEAN,  -- Needs numerical score?
  requires_qualitative_evaluation BOOLEAN, -- Needs text evaluation?
  is_active BOOLEAN,                    -- Is active?
  display_order INTEGER,                -- Display order
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE (school_id, type_key)          -- Each school has unique type_keys
);
```

## Rollback (در صورت نیاز)

اگر می‌خواهید تغییرات را برگردانید:

```sql
-- حذف جدول activity_types
DROP TABLE IF EXISTS activity_types CASCADE;

-- حذف function
DROP FUNCTION IF EXISTS update_activity_types_updated_at CASCADE;
```

**نکته:** بعد از rollback، برنامه به صورت خودکار از انواع پیش‌فرض hardcoded استفاده می‌کند.

## عیب‌یابی

### خطا: relation "activity_types" does not exist

**راه‌حل:** Migration هنوز اجرا نشده. برنامه از انواع پیش‌فرض استفاده می‌کند. برای فعال‌سازی ویژگی جدید، migration را اجرا کنید.

### خطا: duplicate key value violates unique constraint

**راه‌حل:** انواع فعالیت قبلاً برای این مدرسه ایجاد شده‌اند. این خطا طبیعی است و می‌توانید نادیده بگیرید.

### لیست خالی در صفحه مدیریت

**بررسی:**
1. آیا migration اجرا شده؟
2. آیا seed اجرا شده؟
3. آیا user به school_id اختصاص داده شده؟

```sql
-- بررسی اختصاص user به مدرسه
SELECT id, name, email, school_id FROM users WHERE role = 'principal';

-- بررسی وجود activity types برای مدرسه خاص
SELECT * FROM activity_types WHERE school_id = 'YOUR_SCHOOL_ID';
```

## مدارس جدید

برای مدارس جدید که بعد از seed اضافه می‌شوند:

### گزینه 1: اجرای مجدد seed

```bash
psql -U your_username -d your_database -f database/seeds/001_seed_default_activity_types.sql
```

seed script از `ON CONFLICT DO NOTHING` استفاده می‌کند، پس برای مدارس قدیمی تکراری ایجاد نمی‌کند.

### گزینه 2: اضافه کردن دستی

```sql
-- جایگزین کردن YOUR_SCHOOL_ID با UUID مدرسه جدید
INSERT INTO activity_types (school_id, type_key, persian_name, requires_quantitative_score, requires_qualitative_evaluation, display_order, is_active)
VALUES
  ('YOUR_SCHOOL_ID', 'midterm_exam', 'آزمون میان‌ترم', true, false, 1, true),
  ('YOUR_SCHOOL_ID', 'monthly_exam', 'آزمون ماهیانه', true, false, 2, true),
  ('YOUR_SCHOOL_ID', 'weekly_exam', 'آزمون هفتگی', true, false, 3, true),
  ('YOUR_SCHOOL_ID', 'final_exam', 'آزمون پایان ترم', true, false, 4, true),
  ('YOUR_SCHOOL_ID', 'class_activity', 'فعالیت کلاسی', true, true, 5, true),
  ('YOUR_SCHOOL_ID', 'class_homework', 'تکلیف کلاسی', true, true, 6, true),
  ('YOUR_SCHOOL_ID', 'home_homework', 'تکلیف منزل', true, false, 7, true);
```

### گزینه 3: Trigger خودکار (پیشرفته)

می‌توانید یک trigger بنویسید که هر بار مدرسه جدید ایجاد شد، انواع پیش‌فرض را اضافه کند:

```sql
CREATE OR REPLACE FUNCTION auto_create_default_activity_types()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_types (school_id, type_key, persian_name, requires_quantitative_score, requires_qualitative_evaluation, display_order, is_active)
  VALUES
    (NEW.id, 'midterm_exam', 'آزمون میان‌ترم', true, false, 1, true),
    (NEW.id, 'monthly_exam', 'آزمون ماهیانه', true, false, 2, true),
    (NEW.id, 'weekly_exam', 'آزمون هفتگی', true, false, 3, true),
    (NEW.id, 'final_exam', 'آزمون پایان ترم', true, false, 4, true),
    (NEW.id, 'class_activity', 'فعالیت کلاسی', true, true, 5, true),
    (NEW.id, 'class_homework', 'تکلیف کلاسی', true, true, 6, true),
    (NEW.id, 'home_homework', 'تکلیف منزل', true, false, 7, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_activity_types
AFTER INSERT ON schools
FOR EACH ROW
EXECUTE FUNCTION auto_create_default_activity_types();
```

## پشتیبانی

برای مشکلات یا سوالات:
- مراجعه به [ACTIVITY_TYPES_FEATURE.md](ACTIVITY_TYPES_FEATURE.md) برای مستندات کامل
- مراجعه به [ACTIVITY_TYPES_SETUP.md](ACTIVITY_TYPES_SETUP.md) برای راهنمای سریع

---

**نسخه:** 1.0.0
**تاریخ:** 29 دی 1404
**وضعیت:** آماده برای Production (با/بدون migration)
