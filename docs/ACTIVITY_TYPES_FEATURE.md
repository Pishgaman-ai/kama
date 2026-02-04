# مدیریت انواع فعالیت (Activity Types Management)

## نمای کلی

این ویژگی به مدیران مدارس امکان می‌دهد انواع فعالیت‌های آموزشی مخصوص مدرسه خود را تعریف و مدیریت کنند. همه فعالیت‌های معلمان و دانش‌آموزان بر اساس این تنظیمات خواهند بود.

## ویژگی‌ها

- ✅ **تعریف انواع فعالیت مخصوص هر مدرسه**: هر مدرسه می‌تواند انواع فعالیت خاص خود را داشته باشد
- ✅ **تنظیمات ارزیابی**: برای هر نوع فعالیت مشخص کنید که چه نوع ارزیابی (کمی/کیفی) نیاز دارد
- ✅ **انواع پیش‌فرض**: سیستم با 7 نوع فعالیت پیش‌فرض برای همه مدارس راه‌اندازی می‌شود
- ✅ **مدیریت کامل CRUD**: افزودن، ویرایش، حذف و غیرفعال‌سازی انواع فعالیت
- ✅ **یکپارچگی با import/export**: فایل‌های Excel از انواع فعالیت پویا استفاده می‌کنند

## انواع فعالیت پیش‌فرض

هنگام راه‌اندازی اولیه، انواع فعالیت زیر برای تمام مدارس تعریف می‌شوند:

1. **آزمون میان‌ترم** (midterm_exam) - نیاز به نمره کمی
2. **آزمون ماهیانه** (monthly_exam) - نیاز به نمره کمی
3. **آزمون هفتگی** (weekly_exam) - نیاز به نمره کمی
4. **آزمون پایان ترم** (final_exam) - نیاز به نمره کمی
5. **فعالیت کلاسی** (class_activity) - نیاز به نمره کمی و کیفی
6. **تکلیف کلاسی** (class_homework) - نیاز به نمره کمی و کیفی
7. **تکلیف منزل** (home_homework) - نیاز به نمره کمی

## ساختار دیتابیس

### جدول activity_types

```sql
CREATE TABLE activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  type_key VARCHAR(100) NOT NULL,
  persian_name VARCHAR(255) NOT NULL,
  requires_quantitative_score BOOLEAN DEFAULT true,
  requires_qualitative_evaluation BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, type_key)
);
```

### فیلدها

- **id**: شناسه یکتای نوع فعالیت
- **school_id**: شناسه مدرسه (هر مدرسه انواع فعالیت مخصوص خود را دارد)
- **type_key**: کلید یکتای نوع فعالیت (مثلاً: `midterm_exam`)
- **persian_name**: نام فارسی نوع فعالیت (مثلاً: "آزمون میان‌ترم")
- **requires_quantitative_score**: آیا این نوع فعالیت نیاز به نمره عددی دارد؟
- **requires_qualitative_evaluation**: آیا این نوع فعالیت نیاز به ارزیابی کیفی (توصیفی) دارد؟
- **is_active**: آیا این نوع فعالیت فعال است؟
- **display_order**: ترتیب نمایش در لیست‌ها
- **created_at / updated_at**: زمان ساخت و بروزرسانی

## راه‌اندازی

### 1. اجرای Migration

ابتدا جدول activity_types را ایجاد کنید:

```bash
node scripts/db/add-activity-types-table.ts
```

### 2. Seed کردن انواع پیش‌فرض

انواع فعالیت پیش‌فرض را برای همه مدارس موجود اضافه کنید:

```bash
node scripts/seed-default-activity-types.ts
```

این اسکریپت:
- همه مدارس موجود را پیدا می‌کند
- 7 نوع فعالیت پیش‌فرض را برای هر مدرسه ایجاد می‌کند
- در صورت وجود قبلی، از آن‌ها رد می‌شود

## استفاده

### برای مدیران مدارس

#### دسترسی به صفحه مدیریت

1. وارد داشبورد مدیر مدرسه شوید
2. از منوی کناری گزینه **"انواع فعالیت"** را انتخاب کنید
3. یا به آدرس `/dashboard/principal/activity-types` بروید

#### افزودن نوع فعالیت جدید

1. روی دکمه **"افزودن نوع فعالیت جدید"** کلیک کنید
2. اطلاعات زیر را وارد کنید:
   - **کلید نوع فعالیت**: شناسه انگلیسی (مثلاً: `photo_activity`)
   - **نام فارسی**: نام نمایشی (مثلاً: "فعالیت عکس")
   - **ترتیب نمایش**: عدد برای ترتیب در لیست
   - **نیاز به نمره کمی**: آیا باید نمره عددی داشته باشد؟
   - **نیاز به ارزیابی کیفی**: آیا باید توضیحات توصیفی داشته باشد؟
3. روی دکمه **"افزودن"** کلیک کنید

#### ویرایش نوع فعالیت

1. روی آیکون مداد (✏️) کنار نوع فعالیت کلیک کنید
2. تغییرات مورد نظر را اعمال کنید
3. روی **"ذخیره تغییرات"** کلیک کنید

#### حذف یا غیرفعال‌سازی

- **حذف**: اگر نوع فعالیت در هیچ فعالیتی استفاده نشده، می‌توانید آن را حذف کنید
- **غیرفعال‌سازی**: اگر در فعالیت‌ها استفاده شده، فقط می‌توانید آن را غیرفعال کنید

### برای معلمان

معلمان به صورت خودکار انواع فعالیت تعریف شده توسط مدیر مدرسه را می‌بینند:

1. هنگام ثبت فعالیت جدید، لیست انواع فعالیت از دیتابیس بارگذاری می‌شود
2. بسته به نوع فعالیت انتخاب شده، فیلدهای مربوطه نمایش داده می‌شوند:
   - اگر نیاز به نمره کمی داشته باشد → فیلد نمره عددی نمایش داده می‌شود
   - اگر نیاز به ارزیابی کیفی داشته باشد → فیلد توضیحات توصیفی نمایش داده می‌شود

## API Endpoints

### مدیران مدارس (Principal)

#### دریافت همه انواع فعالیت
```http
GET /api/principal/activity-types
Authorization: Bearer {token}
```

**پاسخ:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "school_id": "uuid",
      "type_key": "midterm_exam",
      "persian_name": "آزمون میان‌ترم",
      "requires_quantitative_score": true,
      "requires_qualitative_evaluation": false,
      "is_active": true,
      "display_order": 1,
      "created_at": "2025-12-29T...",
      "updated_at": "2025-12-29T..."
    }
  ]
}
```

#### ایجاد نوع فعالیت جدید
```http
POST /api/principal/activity-types
Authorization: Bearer {token}
Content-Type: application/json

{
  "type_key": "photo_activity",
  "persian_name": "فعالیت عکس",
  "requires_quantitative_score": true,
  "requires_qualitative_evaluation": false,
  "display_order": 8
}
```

#### بروزرسانی نوع فعالیت
```http
PUT /api/principal/activity-types/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "persian_name": "فعالیت عکس (بروز شده)",
  "is_active": false
}
```

#### حذف نوع فعالیت
```http
DELETE /api/principal/activity-types/{id}
Authorization: Bearer {token}
```

### معلمان (Teacher)

#### دریافت انواع فعالیت فعال
```http
GET /api/teacher/activity-types
Authorization: Bearer {token}
```

**پاسخ:**
```json
{
  "success": true,
  "data": [
    {
      "id": "midterm_exam",
      "name": "آزمون میان‌ترم",
      "requires_quantitative_score": true,
      "requires_qualitative_evaluation": false
    }
  ]
}
```

## یکپارچگی با Import/Export

### Export (خروجی Excel)

هنگام خروجی گرفتن از فعالیت‌ها:
- نام‌های فارسی انواع فعالیت از دیتابیس بارگذاری می‌شوند
- اگر نوع فعالیت در دیتابیس نباشد، از نام پیش‌فرض استفاده می‌شود

### Import (ورودی Excel)

هنگام وارد کردن فعالیت‌ها از Excel:
- نام‌های فارسی به کلیدهای انگلیسی تبدیل می‌شوند
- مپینگ از دیتابیس بارگذاری می‌شود
- اگر نوع فعالیت در دیتابیس نباشد، از مپینگ پیش‌فرض استفاده می‌شود

## فایل‌های مرتبط

### Database Scripts
- `scripts/db/add-activity-types-table.ts` - Migration برای ایجاد جدول
- `scripts/seed-default-activity-types.ts` - Seed انواع پیش‌فرض

### API Routes
- `src/app/api/principal/activity-types/route.ts` - CRUD برای مدیران
- `src/app/api/principal/activity-types/[id]/route.ts` - عملیات تک‌رکوردی
- `src/app/api/teacher/activity-types/route.ts` - دریافت برای معلمان

### Frontend Pages
- `src/app/dashboard/principal/activity-types/page.tsx` - صفحه مدیریت برای مدیران
- `src/app/dashboard/teacher/classes/[id]/page.tsx` - استفاده در ثبت فعالیت
- `src/app/dashboard/principal/bulk-activities/page.tsx` - استفاده در ثبت گروهی

### Import/Export Routes
- `src/app/api/teacher/activities/export/route.ts` - خروجی Excel معلم
- `src/app/api/teacher/activities/import/route.ts` - ورودی Excel معلم
- `src/app/api/principal/activities/export/route.ts` - خروجی Excel مدیر
- `src/app/api/principal/activities/import/route.ts` - ورودی Excel مدیر

## نکات مهم

### برای توسعه‌دهندگان

1. **Fallback**: همیشه یک fallback به انواع پیش‌فرض در نظر بگیرید
2. **School-specific**: هر مدرسه انواع فعالیت مخصوص خود را دارد
3. **Soft Delete**: از `is_active` برای غیرفعال‌سازی استفاده کنید
4. **Unique Key**: `type_key` باید در هر مدرسه یکتا باشد

### برای مدیران

1. **قبل از حذف**: اگر نوع فعالیت در فعالیت‌ها استفاده شده، آن را غیرفعال کنید
2. **ترتیب نمایش**: از اعداد برای تعیین ترتیب استفاده کنید (1، 2، 3، ...)
3. **کلید انگلیسی**: از حروف کوچک و underscode استفاده کنید (مثلاً: `photo_activity`)

### برای معلمان

1. **بروزرسانی خودکار**: لیست انواع فعالیت به صورت خودکار بروز می‌شود
2. **فیلدهای پویا**: فیلدهای فرم بسته به نوع فعالیت تغییر می‌کنند
3. **Import/Export**: فرمت Excel همیشه با انواع فعالیت فعلی مدرسه سازگار است

## مثال‌های کاربردی

### مثال 1: افزودن نوع فعالیت "پروژه"

```javascript
// درخواست API
POST /api/principal/activity-types
{
  "type_key": "project",
  "persian_name": "پروژه",
  "requires_quantitative_score": true,
  "requires_qualitative_evaluation": true,
  "display_order": 10
}
```

### مثال 2: افزودن نوع فعالیت "فعالیت عکس با هوش مصنوعی"

```javascript
POST /api/principal/activity-types
{
  "type_key": "ai_photo_activity",
  "persian_name": "فعالیت عکس با هوش مصنوعی",
  "requires_quantitative_score": false,
  "requires_qualitative_evaluation": true,
  "display_order": 11
}
```

### مثال 3: غیرفعال‌سازی یک نوع فعالیت

```javascript
PUT /api/principal/activity-types/{id}
{
  "is_active": false
}
```

## پشتیبانی

برای مشکلات یا سوالات:
1. مستندات بالا را بررسی کنید
2. از بخش Issues در GitHub استفاده کنید
3. با تیم توسعه تماس بگیرید

## نسخه‌بندی

- **نسخه 1.0.0** - انتشار اولیه (29 دی 1404)
  - مدیریت کامل CRUD
  - یکپارچگی با import/export
  - UI مدیریتی برای مدیران
  - 7 نوع فعالیت پیش‌فرض
