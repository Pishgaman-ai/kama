# 🤖 kama Multi-Role AI Agent Implementation Prompt

------------------------------------------------------------------------

# 📌 PURPOSE

## English

You are a **Senior Software Architect + Staff Engineer** with full
access to the kama repository.

Your mission is to design and implement a **Multi-Stakeholder AI Agent
(Principal, Teacher, Student, Parent)**.

The agent must work inside the web dashboard.

It must also work through Telegram and Bale messengers.

It must use existing APIs and database structure.

It must not break any existing functionality.

It must be implemented incrementally using feature flags.

It must fully respect multi-tenant school isolation using school_id
scoping.

------------------------------------------------------------------------

## فارسی

تو یک **معمار ارشد نرم‌افزار و مهندس سطح Staff** هستی که به مخزن kama
دسترسی کامل داری.

ماموریت تو طراحی و پیاده‌سازی یک **ایجنت هوشمند چندذینفع (مدیر، معلم،
دانش‌آموز، ولی)** است.

ایجنت باید داخل داشبورد وب کار کند.

همچنین باید از طریق پیام‌رسان‌های Telegram و Bale فعال باشد.

باید از APIها و ساختار دیتابیس موجود استفاده کند.

نباید هیچ اختلالی در عملکرد فعلی سیستم ایجاد کند.

باید به صورت مرحله‌ای و با Feature Flag پیاده‌سازی شود.

باید جداسازی چندمدرسه‌ای بر اساس school_id را کاملاً رعایت کند.

------------------------------------------------------------------------

# 🔒 NON-NEGOTIABLE RULES

## English

No breaking changes are allowed.

The Agent must not execute raw SQL directly.

All operations must enforce school_id scoping.

Every write action must pass through a Policy Engine.

All new features must be behind feature flags.

The implementation must be rollback-safe.

All intents and tool calls must be logged safely.

------------------------------------------------------------------------

## فارسی

هیچ تغییر مخربی مجاز نیست.

ایجنت نباید مستقیماً SQL خام اجرا کند.

همه عملیات باید با محدودیت school_id انجام شوند.

هر عملیات نوشتنی باید از Policy Engine عبور کند.

همه قابلیت‌های جدید باید پشت Feature Flag باشند.

امکان بازگشت کامل تغییرات باید وجود داشته باشد.

همه Intentها و Tool Callها باید به صورت امن لاگ شوند.

------------------------------------------------------------------------

# 🧠 PHASE 1 --- SYSTEM ANALYSIS

## English

Generate a document titled Agent Readiness Report.

Map existing API endpoints by role.

Review RBAC implementation.

Identify multi-tenant enforcement points.

Analyze AI components and messenger integrations.

Identify security and data risks.

Do not modify any code in this phase.

------------------------------------------------------------------------

## فارسی

سندی با عنوان Agent Readiness Report تولید کن.

APIهای موجود را به تفکیک نقش استخراج کن.

پیاده‌سازی RBAC را بررسی کن.

نقاط اعمال school_id را شناسایی کن.

اجزای AI و ساختار پیام‌رسان‌ها را تحلیل کن.

ریسک‌های امنیتی و احتمال نشت داده را مشخص کن.

در این مرحله هیچ تغییری در کد ایجاد نکن.

------------------------------------------------------------------------

# 🏗 PHASE 2 --- ARCHITECTURE DESIGN

## English

Design the Agent architecture within the current codebase.

Implement Agent Gateway layer.

Implement Policy and Permissions Engine.

Implement Orchestrator (Intent → Plan → Tool Calls).

Implement Tool Layer as wrapper over existing APIs.

------------------------------------------------------------------------

## فارسی

معماری ایجنت را داخل ساختار فعلی پروژه طراحی کن.

لایه Agent Gateway را پیاده‌سازی کن.

Policy و Permissions Engine را پیاده‌سازی کن.

Orchestrator شامل تشخیص نیت، برنامه اجرا و فراخوانی ابزار را طراحی کن.

لایه ابزارها را به عنوان wrapper روی APIهای موجود ایجاد کن.

------------------------------------------------------------------------

# 🧩 AgentContext Structure

``` ts
interface AgentContext {
  school_id: string
  user_id: string
  roles: string[]
  channel: 'web' | 'telegram' | 'bale'
  permissions_scope?: {
    classes?: string[]
    lessons?: string[]
    students?: string[]
  }
  locale: string
  conversation_state?: any
}
```

------------------------------------------------------------------------

# 🚩 PHASE 3 --- FEATURE FLAGS

## English

Add AGENT_ENABLED flag.

Add AGENT_WRITE_ACTIONS_ENABLED flag.

Add AGENT_TELEGRAM_ENABLED flag.

Add AGENT_BALE_ENABLED flag.

All flags must default to FALSE.

------------------------------------------------------------------------

## فارسی

فلگ AGENT_ENABLED اضافه شود.

فلگ AGENT_WRITE_ACTIONS_ENABLED اضافه شود.

فلگ AGENT_TELEGRAM_ENABLED اضافه شود.

فلگ AGENT_BALE_ENABLED اضافه شود.

همه فلگ‌ها به صورت پیش‌فرض غیرفعال باشند.

------------------------------------------------------------------------

# 🚀 PHASE 4 --- SAFE IMPLEMENTATION

## English

Create POST /api/agent/chat endpoint.

Authenticate user and build AgentContext.

Implement Policy Engine MVP.

Add read-only Tools first.

Implement Orchestrator with slot filling.

Integrate with Telegram and Bale webhooks.

Enable write actions only after stability.

------------------------------------------------------------------------

## فارسی

مسیر POST /api/agent/chat ایجاد شود.

کاربر احراز هویت شود و AgentContext ساخته شود.

نسخه اولیه Policy Engine پیاده‌سازی شود.

ابتدا ابزارهای فقط خواندنی اضافه شوند.

Orchestrator با تکمیل پارامترها پیاده‌سازی شود.

با وبهوک‌های Telegram و Bale یکپارچه شود.

عملیات نوشتنی فقط پس از پایداری فعال شود.

------------------------------------------------------------------------

# 🔐 SECURITY REQUIREMENTS

## English

Prevent cross-tenant data leakage.

Validate teacher assignments before write.

Validate class memberships.

Prevent prompt injection.

Never expose internal schema details.

------------------------------------------------------------------------

## فارسی

از نشت داده بین مدارس جلوگیری شود.

قبل از ثبت داده، انتساب معلم بررسی شود.

عضویت دانش‌آموز در کلاس بررسی شود.

از حملات Prompt Injection جلوگیری شود.

ساختار داخلی دیتابیس افشا نشود.

------------------------------------------------------------------------

# 📊 OBSERVABILITY

## English

Log trace_id for each request.

Log intent and tool calls.

Log execution duration.

Log success or failure safely.

------------------------------------------------------------------------

## فارسی

برای هر درخواست trace_id ثبت شود.

Intent و Tool Callها ثبت شوند.

مدت زمان اجرا ثبت شود.

موفقیت یا خطا به صورت امن ثبت شود.

------------------------------------------------------------------------

# 🧪 ACCEPTANCE CRITERIA

## English

With feature flags OFF zero behavior change must occur.

Each role sees only authorized data.

Multi-tenant isolation must be enforced.

Read-only MVP must be stable.

Write actions must require confirmation.

------------------------------------------------------------------------

## فارسی

با فلگ‌های خاموش هیچ تغییری در رفتار سیستم نباید رخ دهد.

هر نقش فقط داده مجاز خود را مشاهده کند.

جداسازی چندمدرسه‌ای باید کاملاً اعمال شود.

نسخه فقط خواندنی باید پایدار باشد.

عملیات نوشتنی باید نیازمند تأیید باشند.

------------------------------------------------------------------------

# 🎯 FINAL OBJECTIVE

## English

Build a safe policy-driven multi-role AI Agent layer.

Do not disrupt existing modules.

Align with documented database and architecture.

------------------------------------------------------------------------

## فارسی

یک لایه ایجنت چندنقشی مبتنی بر سیاست و ایمن ایجاد کن.

به ماژول‌های فعلی آسیبی وارد نشود.

با ساختار دیتابیس و معماری مستندشده هماهنگ باشد.

------------------------------------------------------------------------

Generated on: 2026-02-13T03:28:12.659320 UTC
