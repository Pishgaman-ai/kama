# 🧪 Principal AI Assistant - Testing Guide

This guide shows you how to test the Principal AI Assistant at your ngrok deployment.

**Deployment URL**: `https://c6c6-86-106-158-103.ngrok-free.app`

---

## 📋 Quick Start - Choose Your Method

### Method 1: Browser Console (⭐ RECOMMENDED - Easiest)

1. **Open the Principal Assistant page**:
   ```
   https://c6c6-86-106-158-103.ngrok-free.app/dashboard/principal/principal-assistant
   ```

2. **Log in as a principal user**

3. **Open Developer Tools**: Press `F12` or `Ctrl+Shift+I`

4. **Go to Console tab**

5. **Copy the entire contents** of `test-browser-console.js`

6. **Paste into console** and press Enter

7. **Run a test**:
   ```javascript
   // Test class performance
   testClassQuery('نهم الف')

   // Test student performance
   testStudentQuery('علی احمدی', 'ریاضی')

   // Run all tests
   runQuickTests()
   ```

**✅ Pros**: No setup, automatic authentication, colored output
**❌ Cons**: Must be logged in to browser

---

### Method 2: Node.js Script (Best for Automation)

1. **Get your session cookie** (see "Getting Your Session Cookie" below)

2. **Run the test script**:
   ```bash
   # With session cookie
   SESSION_COOKIE="your-cookie-value" node test-ai-assistant-class.js

   # Or with dev user ID (if in development mode)
   DEV_USER_ID="principal-user-id" node test-ai-assistant-class.js
   ```

**✅ Pros**: Can automate, detailed logging, CI/CD ready
**❌ Cons**: Requires Node.js, needs session cookie

---

### Method 3: cURL (Quick One-Off Tests)

```bash
# Test class query
curl -X POST https://c6c6-86-106-158-103.ngrok-free.app/api/principal/ai-assistant \
  -H "Content-Type: application/json" \
  -H "Cookie: user_session=YOUR_SESSION_COOKIE" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "عملکرد کلاس نهم الف چطور است؟"
      }
    ]
  }'
```

**✅ Pros**: Quick, no dependencies
**❌ Cons**: Harder to read streaming output

---

## 🔑 Getting Your Session Cookie

### Option A: From Browser DevTools

1. **Open your deployed site** and log in as principal

2. **Open DevTools** (F12)

3. **Go to Application tab** (Chrome) or **Storage tab** (Firefox)

4. **Find Cookies** in left sidebar

5. **Click your domain** (`c6c6-86-106-158-103.ngrok-free.app`)

6. **Find `user_session` cookie**

7. **Copy the Value** (long string like `eyJhbGciOi...`)

### Option B: From Browser Console

1. **Open DevTools Console**

2. **Run this command**:
   ```javascript
   document.cookie.split('; ').find(c => c.startsWith('user_session=')).split('=')[1]
   ```

3. **Copy the output**

---

## 🎯 Test Cases

### Class Performance Queries

These test the **class-level analytics** feature:

```javascript
// Test 1: Basic class query
testClassQuery('نهم الف')

// Expected: Class KPIs, subject summaries, recent activities

// Test 2: Class with section
testClassQuery('دهم-ب')

// Expected: Specific section performance data

// Test 3: Multiple matches (requires disambiguation)
testClassQuery('هفتم')

// Expected: List of matching classes, asks for clarification
```

**What to verify**:
- ✅ Response includes class information header
- ✅ Shows student count, teacher count, activity count
- ✅ Displays subject-wise breakdown with teacher names
- ✅ Shows recent activities table
- ✅ Includes AI-generated summary at the end
- ✅ No hallucinated data (numbers match database)

---

### Student Performance Queries

These test the **student-level analytics** feature:

```javascript
// Test 1: Student with specific subject
testStudentQuery('علی احمدی', 'ریاضی')

// Expected: Student's math activities, grades, performance

// Test 2: Student all subjects
testStudentQuery('محمد رضایی')

// Expected: Summary across all subjects

// Test 3: Student with partial name
testStudentQuery('احمدی')

// Expected: List of matching students if multiple found
```

**What to verify**:
- ✅ Student identity header (name, grade, class)
- ✅ Performance summary table (total activities, average score)
- ✅ Recent activities table with dates and scores
- ✅ Subject summaries if "همه دروس" requested
- ✅ AI narrative based on actual data
- ✅ No fabricated scores or dates

---

## 🔍 What to Look For

### ✅ Success Indicators

1. **Fast Response** (< 5 seconds for initial data)
2. **Proper Persian formatting** (no broken characters)
3. **Tables rendered correctly** (markdown pipes `|`)
4. **Shamsi dates** (۱۴۰۳/۱۱/۲۳ format)
5. **Persian digits** (۱۲۳ instead of 123)
6. **Section headers** (##) for organization
7. **AI narrative at end** (2-4 bullet points)

### ⚠️ Warning Signs

1. **Timeout message**: "(جمع‌بندی تکمیلی به دلیل محدودیت زمان تولید نشد)"
   - **Meaning**: AI narrative generation took > 30 seconds
   - **Action**: Check `PRINCIPAL_ASSISTANT_NARRATIVE_TIMEOUT_MS` env var

2. **Not found messages**: "دانش‌آموزی با این نام پیدا نشد"
   - **Meaning**: No student/class matched the query
   - **Action**: Try exact name or check database

3. **Multiple matches**: "چند دانش‌آموز با این نام پیدا شد"
   - **Meaning**: Ambiguous query
   - **Action**: Provide more specific name/class/grade

### ❌ Error Indicators

1. **401 Unauthorized**: Authentication failed
   - **Fix**: Check session cookie or dev user ID

2. **500 Internal Server Error**: Server-side error
   - **Fix**: Check server logs, verify database connection

3. **Empty response**: No data returned
   - **Fix**: Check network logs, verify endpoint is running

---

## 📊 Performance Benchmarks

Expected response times (from ngrok to complete):

| Query Type | Initial Response | Full Response | Notes |
|------------|------------------|---------------|-------|
| Class Performance | < 2s | < 5s | Includes DB queries + AI narrative |
| Student (one subject) | < 1.5s | < 4s | Simpler query, faster |
| Student (all subjects) | < 2s | < 5s | More data to fetch |
| General question | < 1s | < 3s | No DB queries |

**If slower than this**:
1. Check database query performance (`[PrincipalAI]` logs)
2. Check AI model latency (cloud vs local)
3. Check network latency (ngrok overhead ~100-300ms)

---

## 🐛 Debugging Tips

### Enable Verbose Logging

Add this to your `.env`:
```bash
# Enable detailed logging
LOG_LEVEL=debug

# Extend timeouts for debugging
PRINCIPAL_ASSISTANT_NARRATIVE_TIMEOUT_MS=60000
PRINCIPAL_ASSISTANT_MODEL_TIMEOUT_MS=120000

# Disable narrative to test data fetching only
PRINCIPAL_ASSISTANT_ENABLE_NARRATIVE=false
```

### Check Server Logs

Look for these log patterns:
```
[PrincipalAI] step {"requestId":"abc123", "step":"auth_checked", "elapsed_ms":45}
[PrincipalAI] step {"step":"intent_detection", "is_student_like":true, "is_class_like":false}
[PrincipalAI] step {"step":"student_search_completed", "candidates":1, "duration_ms":234}
[PrincipalAI] step {"step":"student_activities_loaded", "total_activities":15}
[PrincipalAI] class_stream_completed {"total_ms":4567, "db_ms":1234, "model_stream_ms":2890}
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "غیر مجاز" (Unauthorized) | No valid session | Log in again or check cookie |
| "کاربر یافت نشد" | Invalid user ID | Verify user exists in database |
| "فعالیتی ثبت نشده" | No data for student/class | Add test data to database |
| Slow response | Database query timeout | Check indexes, optimize queries |
| Incomplete response | AI timeout | Increase `NARRATIVE_TIMEOUT_MS` |
| "کلید API تنظیم نشده" | Missing OpenAI key | Set `OPENAI_API_KEY` in `.env` |

---

## 📝 Example Test Session

Here's a complete test session in browser console:

```javascript
// 1. Load test functions
// (Paste test-browser-console.js contents)

// 2. Test class query
console.log('🧪 Testing class query...');
await testClassQuery('نهم الف');

// Expected output:
// ✅ Status 200
// ✅ Contains "## مشخصات کلاس"
// ✅ Contains "## شاخص‌های کلیدی عملکرد"
// ✅ Contains tables with | separators
// ✅ Contains Persian digits (۱۲۳)
// ✅ Duration < 5000ms

// 3. Test student query
console.log('🧪 Testing student query...');
await testStudentQuery('علی احمدی', 'ریاضی');

// Expected output:
// ✅ Status 200
// ✅ Contains "## مشخصات دانش‌آموز"
// ✅ Contains "## خلاصه عملکرد"
// ✅ Contains activity table
// ✅ Contains AI narrative (2-4 points)
// ✅ No hallucinated data

// 4. Check response quality
// Look at console output:
// - Tables properly formatted?
// - Persian text readable?
// - Numbers in Persian digits?
// - No error messages?
// - Response complete (not truncated)?
```

---

## 🚀 Advanced Testing

### Load Testing

Test multiple concurrent requests:

```bash
# Install artillery
npm install -g artillery

# Create artillery config (artillery.yml)
cat > artillery.yml << EOF
config:
  target: 'https://c6c6-86-106-158-103.ngrok-free.app'
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: 'Class Query'
    flow:
      - post:
          url: '/api/principal/ai-assistant'
          headers:
            Content-Type: 'application/json'
            Cookie: 'user_session=YOUR_COOKIE'
          json:
            messages:
              - role: 'user'
                content: 'عملکرد کلاس نهم الف چطور است؟'
EOF

# Run load test
artillery run artillery.yml
```

### Integration Testing

Test the full flow including messenger bots:

```bash
# Test Bale webhook
curl -X POST https://c6c6-86-106-158-103.ngrok-free.app/api/webhook/bale \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "chat": {"id": 123456789},
      "text": "عملکرد کلاس نهم الف چطور است؟",
      "from": {"id": 123456789}
    }
  }'

# Check logs for messenger processing
```

---

## 📈 Success Metrics

After testing, verify these metrics:

- [ ] **Response Time**: 95th percentile < 5 seconds
- [ ] **Success Rate**: > 99% (no 5xx errors)
- [ ] **Data Accuracy**: 100% (no hallucinated data)
- [ ] **Persian Support**: 100% (all text readable)
- [ ] **Intent Detection**: > 95% (correct student vs class)
- [ ] **Disambiguation**: Works when multiple matches
- [ ] **Error Handling**: Graceful degradation on failures
- [ ] **Timeout Handling**: Completes within limits
- [ ] **Messenger Integration**: Works via Bale/Telegram

---

## 🆘 Need Help?

1. **Check server logs**: Look for `[PrincipalAI]` entries
2. **Review PRINCIPAL_ASSISTANT_REVIEW.md**: Detailed code analysis
3. **Check CLAUDE.md**: Architecture documentation
4. **Test with simpler queries**: Isolate the issue
5. **Verify database**: Ensure test data exists

---

**Last Updated**: 2026-02-11
**Version**: 1.0
