/**
 * نمونه‌های استفاده از سرویس هوش مصنوعی
 * این فایل شامل مثال‌هایی برای استفاده از توابع مختلف aiService است
 */

import {
  sendQueryToAI,
  sendQueryToTeacherAI,
  sendQueryToStudentAI,
  sendQueryToParentAI,
  sendQueryToPrincipalAI,
  sendQueryToAIGrading,
} from "./aiService";

// ============================================
// مثال 1: ارسال پرسش ساده از طریق معلم
// ============================================
async function example1_SimpleTeacherQuery() {
  const query = "چگونه می‌توانم انگیزه دانش‌آموزان را افزایش دهم؟";
  const nationalId = "1234567890";

  const result = await sendQueryToTeacherAI(query, nationalId);

  if (result.success) {
    console.log("پاسخ هوش مصنوعی:", result.response);
  } else {
    console.error("خطا:", result.error);
  }
}

// ============================================
// مثال 2: ارسال پرسش از طریق دانش‌آموز
// ============================================
async function example2_SimpleStudentQuery() {
  const query = "روش‌های مؤثر حل مسائل ریاضی چیست؟";
  const nationalId = "0987654321";

  const result = await sendQueryToStudentAI(query, nationalId);

  if (result.success) {
    console.log("پاسخ:", result.response);
  } else {
    console.error("خطا:", result.error);
  }
}

// ============================================
// مثال 3: استفاده عمومی با مشخص کردن نقش
// ============================================
async function example3_GenericQuery() {
  const query = "بهترین استراتژی‌های ارتباط با والدین چیست؟";
  const nationalId = "1122334455";
  const role = "teacher"; // می‌تواند: teacher, student, parent, principal, grading

  const result = await sendQueryToAI(query, nationalId, role);

  if (result.success) {
    console.log("پاسخ:", result.response);
  } else {
    console.error("خطا:", result.error);
  }
}

// ============================================
// مثال 4: ارسال درخواست برای والد
// ============================================
async function example4_ParentQuery() {
  const query = "چگونه می‌توانم در یادگیری ریاضی فرزندم کمک کنم؟";
  const nationalId = "5544332211";

  const result = await sendQueryToParentAI(query, nationalId);

  if (result.success) {
    console.log("پاسخ برای والد:", result.response);
  } else {
    console.error("خطا:", result.error);
  }
}

// ============================================
// مثال 5: ارسال درخواست برای مدیر
// ============================================
async function example5_PrincipalQuery() {
  const query = "چگونه می‌توانم عملکرد معلمان را به‌طور مؤثر ارزیابی کنم؟";
  const nationalId = "9988776655";

  const result = await sendQueryToPrincipalAI(query, nationalId);

  if (result.success) {
    console.log("پاسخ برای مدیر:", result.response);
  } else {
    console.error("خطا:", result.error);
  }
}

// ============================================
// مثال 6: تصحیح خودکار تکالیف
// ============================================
async function example6_GradingRequest() {
  const activityData = {
    activity_id: "act_12345",
    activity_title: "تمرین ریاضی - فصل 3",
    question_file_url: "https://example.com/questions/math_ch3.pdf",
    answer_file_url: "https://example.com/answers/student_123_ans.pdf",
    teacher_instruction: `
      لطفاً پاسخ‌های دانش‌آموز را بررسی و موارد زیر را ارائه دهید:
      1. نمره از 20
      2. نقاط قوت
      3. نقاط ضعف
      4. پیشنهادات برای بهبود
    `,
  };

  const teacherNationalId = "1234567890";

  const result = await sendQueryToAIGrading(activityData, teacherNationalId);

  if (result.success) {
    console.log("نتیجه تصحیح:", result.response);
  } else {
    console.error("خطا در تصحیح:", result.error);
  }
}

// ============================================
// مثال 7: مدیریت خطاها
// ============================================
async function example7_ErrorHandling() {
  const query = "چگونه زمان را مدیریت کنم؟";
  const nationalId = "1234567890";

  try {
    const result = await sendQueryToStudentAI(query, nationalId);

    if (result.success) {
      // پاسخ موفق
      console.log("پاسخ دریافت شد:", result.response);
    } else {
      // خطا از سمت AI Service
      console.error("خطا از سرویس AI:", result.error);

      // می‌توانید بر اساس نوع خطا اقدام کنید
      if (result.error?.includes("محدودیت")) {
        console.log("لطفاً چند دقیقه دیگر امتحان کنید");
      } else if (result.error?.includes("احراز هویت")) {
        console.log("مشکل در تنظیمات API Key");
      }
    }
  } catch (error) {
    // خطاهای غیرمنتظره
    console.error("خطای غیرمنتظره:", error);
  }
}

// ============================================
// مثال 8: استفاده در API Route
// ============================================
/**
 * نمونه استفاده در یک API Route
 */
/*
import { NextRequest, NextResponse } from "next/server";
import { sendQueryToAI } from "@/lib/aiService";

export async function POST(request: NextRequest) {
  try {
    const { query, nationalId, role } = await request.json();

    const result = await sendQueryToAI(query, nationalId, role);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.response
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "خطا در پردازش درخواست"
    }, { status: 500 });
  }
}
*/

// ============================================
// مثال 9: استفاده در کامپوننت React
// ============================================
/**
 * نمونه استفاده در React Component
 */
/*
import { useState } from 'react';

function ChatComponent({ userRole, nationalId }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }]
        })
      });

      const data = await res.json();

      if (data.success) {
        setResponse(data.message);
      } else {
        setResponse('خطا: ' + data.error);
      }
    } catch (error) {
      setResponse('خطا در ارسال درخواست');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="پرسش خود را بنویسید..."
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'در حال ارسال...' : 'ارسال'}
      </button>
      {response && <div>{response}</div>}
    </div>
  );
}
*/

// Export examples for documentation purposes
export {
  example1_SimpleTeacherQuery,
  example2_SimpleStudentQuery,
  example3_GenericQuery,
  example4_ParentQuery,
  example5_PrincipalQuery,
  example6_GradingRequest,
  example7_ErrorHandling,
};
