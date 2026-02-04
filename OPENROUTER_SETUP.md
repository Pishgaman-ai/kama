# راهنمای دریافت API Key از OpenRouter

## مرحله 1: ثبت‌نام یا ورود
1. به سایت OpenRouter بروید: https://openrouter.ai/
2. روی دکمه "Sign In" کلیک کنید
3. با Google یا GitHub وارد شوید (یا ثبت‌نام کنید)

## مرحله 2: دریافت API Key
1. بعد از ورود، به صفحه Keys بروید: https://openrouter.ai/keys
2. روی دکمه "Create Key" کلیک کنید
3. یک نام برای کلید خود انتخاب کنید (مثلاً: "Kamma Education")
4. روی "Create" کلیک کنید
5. API Key جدید را کپی کنید (فقط یک بار نمایش داده می‌شود!)

## مرحله 3: شارژ حساب (مهم!)
⚠️ **توجه:** OpenRouter برای استفاده نیاز به اعتبار دارد.

1. به صفحه Account بروید: https://openrouter.ai/account
2. روی "Add Credit" کلیک کنید
3. حداقل $5 اعتبار اضافه کنید

## مرحله 4: تنظیم در پروژه
1. فایل `.env.local` را باز کنید
2. خط زیر را پیدا کنید:
   ```
   OPENROUTER_API_KEY="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"
   ```
3. API Key قدیمی را با کلید جدید جایگزین کنید:
   ```
   OPENROUTER_API_KEY="YOUR_NEW_API_KEY_HERE"
   ```
4. فایل را ذخیره کنید

## مرحله 5: ری‌استارت سرور
1. در ترمینال که سرور اجرا شده، `Ctrl + C` را فشار دهید
2. دوباره سرور را اجرا کنید:
   ```bash
   npm run dev
   ```

## مرحله 6: تست
برای اطمینان از درست بودن API Key، این دستور را اجرا کنید:
```bash
node test-openrouter.js
```

اگر پیام "✨ API Key شما معتبر است" را دیدید، همه چیز درست است!

## نکات مهم:
- ✅ حتماً بعد از تغییر `.env.local` سرور را ری‌استارت کنید
- ✅ مطمئن شوید موجودی حساب OpenRouter دارید
- ✅ API Key را در جای امنی نگه دارید
- ❌ هرگز API Key را در GitHub یا جای عمومی قرار ندهید

## لینک‌های مفید:
- OpenRouter Dashboard: https://openrouter.ai/
- API Keys: https://openrouter.ai/keys
- Account & Credits: https://openrouter.ai/account
- مستندات: https://openrouter.ai/docs
