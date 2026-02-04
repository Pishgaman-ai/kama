# راهنمای تنظیم پروژه با .env.production

## تغییرات انجام شده

✅ پروژه حالا برای خواندن API Keys از فایل `.env.production` تنظیم شده است.

## مراحل راه‌اندازی:

### مرحله 1: تنظیم API Keys در .env.production

فایل `.env.production` را باز کنید و OpenRouter API Key را تنظیم کنید:

```env
# OpenRouter API Key (برای استفاده از مدل‌های مختلف هوش مصنوعی)
# برای دریافت API Key به https://openrouter.ai/keys مراجعه کنید
OPENROUTER_API_KEY="YOUR_OPENROUTER_API_KEY_HERE"
```

### مرحله 2: دریافت API Key از OpenRouter

1. به https://openrouter.ai/keys بروید
2. وارد شوید یا ثبت‌نام کنید
3. یک API Key جدید بسازید
4. حساب خود را شارژ کنید: https://openrouter.ai/account (حداقل $5)
5. API Key را در `.env.production` قرار دهید

### مرحله 3: اجرای برنامه

**برای اجرا با .env.production:**
```bash
npm run dev
```

**برای اجرا با .env.local (اگر نیاز باشد):**
```bash
npm run dev:local
```

### مرحله 4: تست API Key

برای اطمینان از صحت API Key:
```bash
node test-openrouter.js
```

اگر پیام "✨ API Key شما معتبر است" را دیدید، همه چیز آماده است!

## نکات مهم:

- ✅ دستور `npm run dev` حالا از `.env.production` استفاده می‌کند
- ✅ دستور `npm run dev:local` از `.env.local` استفاده می‌کند (در صورت نیاز)
- ✅ اسکریپت تست هم از `.env.production` می‌خواند
- ✅ از پکیج `cross-env` برای سازگاری با Windows استفاده شده است

## فایل‌های مهم:

- `.env.production` - تنظیمات اصلی (API Keys اینجا قرار می‌گیرد)
- `.env.local` - تنظیمات محلی (اختیاری)
- `test-openrouter.js` - اسکریپت تست API
- `package.json` - اسکریپت‌های npm به‌روز شده

## خطایابی:

اگر با خطای "User not found" مواجه شدید:
1. API Key را در `.env.production` بررسی کنید
2. مطمئن شوید حساب OpenRouter شارژ شده است
3. سرور را ری‌استارت کنید (`Ctrl+C` و سپس `npm run dev`)
4. اسکریپت تست را اجرا کنید: `node test-openrouter.js`

## مدل استفاده شده:

برنامه از مدل `google/gemini-3-pro-preview` در OpenRouter برای تصحیح اوراق استفاده می‌کند.
