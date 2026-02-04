# بهبودهای Performance سیستم

## خلاصه تغییرات

این مستند تغییرات اعمال شده برای بهبود performance سیستم را توضیح می‌دهد.

## مشکلات قبلی

### 1. **N+1 Query Problem**
قبل از بهینه‌سازی، APIها به صورت زیر کار می‌کردند:

#### `/api/principal/classes` (قبل):
- 1 query برای دریافت لیست کلاس‌ها
- N query برای دریافت teacher assignments هر کلاس
- **مجموع**: 1 + N queries

#### `/api/principal/students` (قبل):
- 1 query برای دریافت لیست دانش‌آموزان
- N query برای دریافت والدین هر دانش‌آموز
- N query برای دریافت کلاس‌های هر دانش‌آموز
- **مجموع**: 1 + 2N queries

با 89 دانش‌آموز: **179 queries!** ⚠️

### 2. **Missing Database Indexes**
جداول بدون index مناسب، جستجو و join کند بودند.

---

## راه‌حل‌های پیاده‌سازی شده

### ✅ 1. حذف N+1 Query Problem

#### `/api/principal/classes` (بعد):
```sql
-- Query 1: دریافت همه کلاس‌ها
SELECT c.id, c.name, ... FROM classes c ...

-- Query 2: دریافت همه teacher assignments یکجا
SELECT ta.class_id, ta.teacher_id, ...
FROM teacher_assignments ta
WHERE ta.class_id = ANY($1) -- استفاده از ANY برای چند class_id
```
**مجموع**: فقط 2 queries برای همه کلاس‌ها! ⚡

#### `/api/principal/students` (بعد):
```sql
-- Query 1: دریافت همه دانش‌آموزان
SELECT s.id, s.name, ... FROM users s ...

-- Query 2: دریافت همه والدین یکجا
SELECT p.id, psr.student_id, ...
FROM users p
JOIN parent_student_relations psr ON p.id = psr.parent_id
WHERE psr.student_id = ANY($1) -- استفاده از ANY برای چند student_id

-- Query 3: دریافت همه کلاس‌ها یکجا
SELECT c.id, cm.user_id as student_id, ...
FROM classes c
JOIN class_memberships cm ON c.id = cm.class_id
WHERE cm.user_id = ANY($1) -- استفاده از ANY برای چند student_id
```
**مجموع**: فقط 3 queries برای همه دانش‌آموزان! ⚡

### ✅ 2. اضافه کردن Database Indexes

Indexهای اضافه شده:

```sql
-- Users table
CREATE INDEX idx_users_school_id_role ON users(school_id, role);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);

-- Class memberships
CREATE INDEX idx_class_memberships_class_id ON class_memberships(class_id);
CREATE INDEX idx_class_memberships_user_id ON class_memberships(user_id);

-- Teacher assignments
CREATE INDEX idx_teacher_assignments_class_id ON teacher_assignments(class_id);
CREATE INDEX idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);

-- Parent-student relations
CREATE INDEX idx_parent_student_relations_student_id ON parent_student_relations(student_id);
```

---

## نحوه اعمال تغییرات

### 1. اجرای Migration برای Indexes

```bash
node scripts/run-performance-migration.js
```

این دستور:
- تمام indexهای لازم را ایجاد می‌کند
- جداول را ANALYZE می‌کند
- اطلاعات indexها را نمایش می‌دهد

### 2. تست Performance

بعد از اعمال تغییرات، performance را تست کنید:

```bash
npm run dev
```

سپس:
1. به صفحه کلاس‌ها بروید: `/dashboard/principal/classes`
2. Console را باز کنید (F12)
3. Network tab را بررسی کنید

---

## نتایج مورد انتظار

### قبل از بهینه‌سازی:
```
GET /api/principal/classes      200 in 5544ms  ❌
GET /api/principal/teachers      200 in 4737ms  ❌
GET /api/principal/students      200 in 8000ms+ ❌ (تخمینی)
```

### بعد از بهینه‌سازی:
```
GET /api/principal/classes      200 in <500ms   ✅
GET /api/principal/teachers      200 in <800ms   ✅
GET /api/principal/students      200 in <1000ms  ✅
```

**بهبود**: **80-90% کاهش زمان!** 🚀

---

## توضیحات تکنیکی

### چرا N+1 Query مشکل است؟

```javascript
// ❌ بد: N+1 queries
for (const student of students) {
  const parents = await getParents(student.id);  // 1 query per student
  const classes = await getClasses(student.id);  // 1 query per student
}
// 89 students × 2 = 178 queries!

// ✅ خوب: فقط 2 queries
const allParents = await getParentsForStudents(studentIds);  // 1 query
const allClasses = await getClassesForStudents(studentIds);  // 1 query
// فقط 2 queries!
```

### چرا Indexes مهم هستند؟

```sql
-- بدون Index: Full Table Scan O(n)
SELECT * FROM users WHERE school_id = '123' AND role = 'student';
-- باید همه 10000 سطر را اسکن کند

-- با Index: B-tree Lookup O(log n)
SELECT * FROM users WHERE school_id = '123' AND role = 'student';
-- فقط سطرهای مرتبط را پیدا می‌کند
```

---

## فایل‌های تغییر یافته

1. `/src/app/api/principal/classes/route.ts` - حذف N+1 problem
2. `/src/app/api/principal/students/route.ts` - حذف N+1 problem
3. `/database/migrations/add_performance_indexes.sql` - Migration indexes
4. `/scripts/run-performance-migration.js` - اسکریپت اجرای migration

---

## نکات مهم

⚠️ **هشدار**: قبل از اجرا در production، حتماً:
1. یک backup از دیتابیس بگیرید
2. در محیط development تست کنید
3. زمان‌بندی مناسب برای maintenance انتخاب کنید

✅ **نکته**: ایجاد index روی جداول بزرگ ممکن است چند دقیقه طول بکشد.

---

## پشتیبانی

در صورت بروز مشکل:
1. لاگ‌های database را بررسی کنید
2. `EXPLAIN ANALYZE` را روی queryهای کند اجرا کنید
3. از `pg_stat_statements` برای مانیتورینگ استفاده کنید
