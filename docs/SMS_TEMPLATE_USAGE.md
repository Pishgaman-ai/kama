# آموزش استفاده از قالب‌های پیامک در کاما

این مستندات نحوه استفاده از قالب‌های پیامک (SMS Templates) در سامانه کاما را توضیح می‌دهد.

## مقدمه

سامانه کاما از قالب‌های پیامک برای ارسال پیام‌های استاندارد از جمله کد تایید ورود به کاربران پشتیبانی می‌کند. این قابلیت به ویژه برای ارسال پیامک با قالب‌های از پیش تعریف شده در سرویس‌دهندگان پیامک مانند کاوه‌نگار مفید است.

## قالب‌های موجود

در حال حاضر قالب زیر تعریف شده است:

### amoozyar-login

این قالب برای ارسال کد تایید ورود به کاربران استفاده می‌شود.

متغیرهای مورد نیاز:

- `code`: کد تایید 6 رقمی

## نحوه استفاده

### در سمت سرور (API)

برای ارسال کد تایید با استفاده از قالب، می‌توانید از تابع `sendOTP` در ماژول [smsService.ts](../src/lib/smsService.ts) استفاده کنید:

```typescript
import { sendOTP } from "@/lib/smsService";

// ارسال کد تایید با قالب amoozyar-login
const result = await sendOTP(phoneNumber, otpCode, "amoozyar-login");
```

همچنین می‌توانید از API endpoint جدید `/api/auth/send-otp-template` استفاده کنید:

```javascript
// درخواست به API
const response = await fetch("/api/auth/send-otp-template", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    phone: "09123456789",
    template: "amoozyar-login",
  }),
});
```

### در سمت کلاینت (Frontend)

در صفحه ورود ([signin/page.tsx](<../src/app/(auth)/signin/page.tsx>))، ارسال کد تایید با قالب به صورت خودکار انجام می‌شود.

## اضافه کردن قالب جدید

برای اضافه کردن قالب جدید:

1. در فایل [smsService.ts](../src/lib/smsService.ts) در بخش `smsTemplates` یک entry جدید اضافه کنید:

```typescript
export const smsTemplates = {
  // ... قالب‌های موجود ...

  // قالب جدید
  yourNewTemplate: (param1: string, param2: string) => ({
    template: "your-template-name",
    tokens: {
      param1: param1,
      param2: param2,
    },
  }),
};
```

2. در صورت نیاز، تابع `sendOTP` را به‌روزرسانی کنید تا با قالب جدید کار کند.

## تست قالب‌ها

برای تست قالب‌ها می‌توانید از endpoint `/api/auth/test-template` استفاده کنید:

```javascript
const response = await fetch("/api/auth/test-template", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ phone: "09123456789" }),
});
```

## پشتیبانی از سرویس‌دهندگان مختلف

در حال حاضر فقط سرویس‌دهنده کاوه‌نگار از قالب‌ها پشتیبانی می‌کند. برای سایر سرویس‌دهندگان از پیامک متنی استاندارد استفاده می‌شود.

## رفع مشکلات

در صورت بروز خطا در ارسال پیامک با قالب:

1. بررسی کنید که نام قالب در سرویس‌دهنده پیامک به درستی تعریف شده باشد
2. مطمئن شوید که تمام متغیرهای مورد نیاز قالب ارسال می‌شوند
3. بررسی کنید که تنظیمات سرویس‌دهنده پیامک (API key و غیره) به درستی انجام شده باشد
