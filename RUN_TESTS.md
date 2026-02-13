# 🚀 Quick Test - Principal AI Assistant

## ⚡ Fastest Way to Test (30 seconds)

### 1. Open Browser
Navigate to:
```
https://c6c6-86-106-158-103.ngrok-free.app/dashboard/principal/principal-assistant
```

### 2. Log In
Use principal credentials

### 3. Open Console
Press `F12` → Go to "Console" tab

### 4. Run Test
Copy this one-liner into console:

```javascript
fetch('/api/principal/ai-assistant', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({messages:[{role:'user',content:'عملکرد کلاس نهم الف چطور است؟'}]})
}).then(r => r.body.getReader()).then(async reader => {
  let result = '';
  while(true) {
    const {done, value} = await reader.read();
    if(done) break;
    result += new TextDecoder().decode(value);
  }
  console.log('✅ Response:\n' + result);
});
```

**Expected**: You should see a response with:
- Class information (نام کلاس، پایه، بخش)
- KPI table (تعداد دانش‌آموزان، میانگین نمرات)
- Subject summaries (عملکرد درس‌ها)
- Recent activities (فعالیت‌های اخیر)

---

## 🧪 Full Test Suite (5 minutes)

### Step 1: Load Test Functions
1. Open `test-browser-console.js`
2. Copy entire file
3. Paste into browser console
4. Press Enter

### Step 2: Run Tests
```javascript
// Test class performance
await testClassQuery('نهم الف')

// Test student performance
await testStudentQuery('علی احمدی', 'ریاضی')

// Run all tests
await runQuickTests()
```

---

## 📱 Test Via UI (No Console)

### Option A: Use the Chat Interface
1. Go to Principal Assistant page
2. Type in chat: "عملکرد کلاس نهم الف چطور است؟"
3. Send message
4. Watch response stream in

### Option B: Use Messenger Bot
1. Send message in Bale/Telegram to your bot
2. Text: "عملکرد کلاس نهم الف"
3. Bot should respond with formatted data

---

## 🔧 Test From Command Line

### Prerequisites
```bash
# You need Node.js installed
node --version  # Should show v16 or higher
```

### Run Test Script
```bash
# Get your session cookie from browser (see TESTING_GUIDE.md)

# Then run:
SESSION_COOKIE="your-cookie-value" node test-ai-assistant-class.js
```

**Or for development mode:**
```bash
DEV_USER_ID="your-principal-user-id" node test-ai-assistant-class.js
```

---

## ✅ What Success Looks Like

### Class Query Response Should Include:

```markdown
## مشخصات کلاس
| مشخصه | مقدار |
| --- | --- |
| نام کلاس | نهم الف |
| پایه | پایه ۹ |
| بخش | الف |
| سال تحصیلی | ۱۴۰۳-۱۴۰۴ |

## شاخص‌های کلیدی عملکرد کلاس
| شاخص کلیدی | مقدار |
| --- | --- |
| تعداد دانش‌آموزان کلاس | ۳۵ |
| تعداد معلمان کلاس | ۸ |
| تعداد رکوردهای فعالیت آموزشی | ۲۴۵ |
| میانگین نمره فعالیت‌ها | ۱۶.۷۵ |
...

## جمع‌بندی تحلیلی
بر اساس داده‌های ثبت شده، کلاس نهم الف با ۳۵ دانش‌آموز...
```

### Student Query Response Should Include:

```markdown
## مشخصات دانش‌آموز
| مشخصه | مقدار |
| --- | --- |
| نام و نام خانوادگی | علی احمدی |
| مقطع تحصیلی | نهم |
| نام کلاس | نهم الف |

## خلاصه عملکرد
| شاخص | مقدار |
| --- | --- |
| تعداد فعالیت‌ها | ۱۵ |
| میانگین نمرات | ۱۷.۲۰ |
| تاریخ آخرین فعالیت | ۱۴۰۳/۱۱/۲۰ |

## آخرین فعالیت‌ها
...

## توضیح تکمیلی
بر اساس میانگین ۱۷.۲۰، عملکرد در حد عالی است...
```

---

## ❌ Common Issues

### Issue: 401 Unauthorized
**Solution**:
- Make sure you're logged in
- Cookie might have expired - log in again
- In dev mode, set `DEV_USER_ID` environment variable

### Issue: "کلاس یافت نشد"
**Solution**:
- Check database for available classes
- Try exact class name from database
- Ensure school_id matches

### Issue: Slow response (> 10s)
**Solution**:
- Check database query performance
- Increase timeout in `.env`:
  ```
  PRINCIPAL_ASSISTANT_MODEL_TIMEOUT_MS=120000
  ```
- Check AI API latency

### Issue: Response cuts off mid-sentence
**Solution**:
- This is the timeout issue mentioned in PRINCIPAL_ASSISTANT_REVIEW.md
- Known issue: AbortController doesn't actually cancel stream
- Increase `PRINCIPAL_ASSISTANT_NARRATIVE_TIMEOUT_MS=60000`

---

## 📊 Quick Checklist

After running tests, verify:

- [ ] Response received (status 200)
- [ ] Persian text displays correctly
- [ ] Tables formatted with | separators
- [ ] Numbers in Persian digits (۱۲۳ not 123)
- [ ] Dates in Shamsi format (۱۴۰۳/۱۱/۲۳)
- [ ] Contains class/student header
- [ ] Contains KPI/summary table
- [ ] Contains activities table
- [ ] Contains AI narrative at end
- [ ] No error messages ("خطا")
- [ ] No timeout warnings
- [ ] Response complete (not truncated)
- [ ] Duration < 5 seconds

---

## 🎯 Next Steps

If tests pass:
1. ✅ System is working correctly
2. Deploy to production
3. Monitor performance metrics
4. Gather user feedback

If tests fail:
1. Check TESTING_GUIDE.md for detailed debugging
2. Review PRINCIPAL_ASSISTANT_REVIEW.md for known issues
3. Check server logs for `[PrincipalAI]` entries
4. Verify database has test data

---

**Need Help?** See `TESTING_GUIDE.md` for comprehensive troubleshooting.
