# راهنمای راه‌اندازی قابلیت Export رمز عبور معلمان

## خلاصه
این مستند نحوه راه‌اندازی قابلیت خروجی رمز عبور واقعی معلمان در فایل اکسل را توضیح می‌دهد.

---

## 🔧 مراحل راه‌اندازی

### مرحله 1: تنظیم کلید رمزنگاری

برای امنیت بهتر، یک کلید رمزنگاری قوی تعیین کنید:

1. فایل `.env.local` را باز کنید
2. این خط را اضافه کنید:
```env
PASSWORD_ENCRYPTION_KEY=your-very-secure-32-character-key-here-change-this
```

⚠️ **مهم**:
- کلید باید حداقل 32 کاراکتر باشد
- از کاراکترهای تصادفی و قوی استفاده کنید
- این کلید را هرگز در git commit نکنید
- کلید را در مکانی امن backup کنید

### مرحله 2: اجرای Migration

این migration ستون جدید `initial_password` را به جدول `users` اضافه می‌کند:

```bash
node scripts/run-password-migration.js
```

خروجی موفق:
```
🚀 Starting password column migration...

📊 Adding initial_password column to users table...

✅ Password column migration completed successfully!
```

### مرحله 3: به‌روزرسانی معلمان موجود

برای معلمانی که قبلاً ایجاد شده‌اند، این اسکریپت را اجرا کنید:

```bash
node scripts/update-existing-teachers-passwords.js
```

این اسکریپت:
- همه معلمان بدون `initial_password` را پیدا می‌کند
- شماره همراه آنها را به عنوان رمز پیش‌فرض تعیین می‌کند
- رمز را رمزنگاری کرده و در دیتابیس ذخیره می‌کند

خروجی نمونه:
```
🔄 Starting to update existing teachers with initial passwords...

📋 Found 15 teachers to update:

   ✓ Updated احمد محمدی (ahmad@email.com)
   ✓ Updated زهرا احمدی (09129876543)
   ...

✅ Successfully updated 15 teachers!
```

---

## 🔒 معماری امنیتی

### دو لایه امنیتی:

#### 1. Hash برای Authentication (bcrypt)
```
password → bcrypt.hash() → password_hash (در دیتابیس)
```
- برای ورود به سیستم استفاده می‌شود
- غیرقابل بازگشت (one-way)
- امن برای authentication

#### 2. Encryption برای Recovery (AES-256-CBC)
```
password → AES-256 encrypt → initial_password (در دیتابیس)
```
- فقط برای بازیابی توسط مدیر
- قابل رمزگشایی (two-way)
- استفاده در Excel export

### چرا دو لایه؟

- **bcrypt**: امنیت بالا برای ورود به سیستم
- **AES-256**: امکان بازیابی برای مدیران (در موارد فراموشی رمز)

---

## 📊 نحوه کار با معلمان جدید

از این به بعد، وقتی معلم جدیدی اضافه می‌شود:

### با رمز عبور مشخص:
```javascript
{
  name: "احمد محمدی",
  phone: "09121234567",
  email: "ahmad@email.com",
  password: "MySecurePass123"  // رمز انتخابی مدیر
}
```
→ `initial_password` در دیتابیس: `encrypted("MySecurePass123")`

### بدون رمز عبور:
```javascript
{
  name: "زهرا احمدی",
  phone: "09129876543",
  email: "zahra@email.com"
  // password: undefined
}
```
→ `initial_password` در دیتابیس: `encrypted("09129876543")`
(شماره همراه به عنوان رمز پیش‌فرض)

---

## 📥 نحوه Export

### از UI:
1. به صفحه معلمان بروید: `/dashboard/principal/teachers`
2. روی دکمه "خروجی اکسل" کلیک کنید
3. فایل دانلود می‌شود

### محتوای فایل اکسل:

| نام معلم | شماره همراه | ایمیل | **رمز عبور** | دروس | کلاس‌ها | وضعیت |
|---------|-------------|-------|--------------|------|---------|-------|
| احمد محمدی | 09121234567 | ahmad@email.com | **MySecurePass123** | ریاضی | 3 | فعال |
| زهرا احمدی | 09129876543 | zahra@email.com | **09129876543** | فارسی | 2 | فعال |

---

## 🛠️ فایل‌های تغییر یافته

### 1. Backend (API & Logic):

#### جدید:
- `/src/lib/passwordEncryption.ts` - توابع رمزنگاری/رمزگشایی
- `/src/app/api/principal/teachers/export/route.ts` - API export
- `/database/migrations/add_initial_password_column.sql` - Migration دیتابیس
- `/scripts/run-password-migration.js` - اسکریپت migration
- `/scripts/update-existing-teachers-passwords.js` - اسکریپت به‌روزرسانی

#### ویرایش شده:
- `/src/app/api/principal/teachers/route.ts` - ذخیره initial_password هنگام create

### 2. Frontend (UI):

#### ویرایش شده:
- `/src/app/dashboard/principal/teachers/page.tsx` - دکمه "خروجی اکسل"

### 3. مستندات:
- `/EXCEL_EXPORT_FEATURE.md` - راهنمای کاربر
- `/PASSWORD_EXPORT_SETUP.md` - این فایل (راهنمای راه‌اندازی)

---

## ⚠️ نکات امنیتی مهم

### ✅ انجام دهید:
- کلید رمزنگاری را در `.env.local` تنظیم کنید
- از کلید قوی و تصادفی استفاده کنید
- کلید را backup کنید
- `.env.local` را در `.gitignore` نگه دارید
- فایل اکسل را پس از استفاده حذف کنید
- به معلمان توصیه کنید رمز خود را تغییر دهند

### ❌ انجام ندهید:
- کلید را در git commit نکنید
- فایل اکسل را از طریق ایمیل ارسال نکنید
- فایل را در مکان عمومی ذخیره نکنید
- کلید پیش‌فرض را تغییر ندهید

---

## 🔍 عیب‌یابی

### مشکل: رمز عبور در اکسل "-" نشان می‌دهد

**علت**: معلم قبل از migration ایجاد شده است.

**راه‌حل**:
```bash
node scripts/update-existing-teachers-passwords.js
```

### مشکل: "خطا در بازیابی رمز عبور"

**علت‌های محتمل**:
1. کلید رمزنگاری در `.env.local` تنظیم نشده
2. کلید رمزنگاری تغییر کرده است

**راه‌حل**:
- مطمئن شوید `PASSWORD_ENCRYPTION_KEY` در `.env.local` تنظیم شده
- از همان کلیدی که هنگام ایجاد استفاده کردید، استفاده کنید

### مشکل: معلمان جدید رمز ندارند

**علت**: Migration اجرا نشده است.

**راه‌حل**:
```bash
node scripts/run-password-migration.js
```

---

## 📈 آمار و بهبودهای آینده

### ویژگی‌های پیشنهادی:
- [ ] چرخش خودکار کلید رمزنگاری (Key Rotation)
- [ ] لاگ دسترسی به export (Audit Log)
- [ ] محدودیت تعداد دفعات export
- [ ] رمزگذاری خودکار فایل اکسل
- [ ] ارسال اتوماتیک رمز به ایمیل معلم
- [ ] قابلیت reset password برای معلمان

---

**نسخه**: 2.0
**تاریخ به‌روزرسانی**: 1404/09/05
**توسعه‌دهنده**: Claude AI
