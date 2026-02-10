# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduHelper is a comprehensive educational management system built with Next.js 16, React 19, and PostgreSQL. It provides role-based dashboards for administrators, principals, teachers, students, and parents, with deep AI integration for intelligent features like automated grading, student assessment, and educational assistance.

## Development Commands

### Installation & Setup
```bash
npm install              # Install dependencies
npm run dev             # Start development server (webpack mode, faster for small changes)
npm run dev:turbo       # Start with Turbopack (faster cold starts)
```

### Build & Production
```bash
npm run build           # Build for production with Turbopack
npm start              # Start production server
```

### Code Quality
```bash
npm run lint           # Run ESLint on the project
```

### Database & Data Management
Database migrations are located in `database/migrations/`. The system uses PostgreSQL with connection pooling via the `pg` library.

Useful database and sync scripts:
```bash
node scripts/check-teacher-assignments.js       # Verify teacher-class-subject assignments
node scripts/sync-teacher-assignments.js        # Sync assignments after schema changes
node scripts/sync-subjects-to-lessons.js        # Migrate subjects to lessons table
node scripts/seed-iran-curriculum-lessons.js    # Seed Iranian national curriculum lessons
node scripts/check-activities-subject-ids.js    # Verify activity subject references
```

Initialize database migrations before first development session.

## Architecture Overview

### Application Structure

The application follows a **role-based hierarchical architecture**:

- **App Router Model**: Uses Next.js 16 App Router with file-based routing
- **Role-Based Dashboards**: Separate layout structures for each user role (admin, principal, teacher, student, parent)
- **API Organization**: RESTful API endpoints organized by role at `/api/{role}/{resource}`
- **Server/Client Components**: Leverages Next.js Server Components for database queries and heavy computation; Client Components ("use client") for interactivity

### Directory Structure

```
src/
├── app/
│   ├── (auth)/                    # Authentication routes (signin, forgot-password, reset-password)
│   ├── admin/                     # Admin panel for system management
│   ├── dashboard/
│   │   ├── principal/             # Principal dashboard (school management)
│   │   ├── teacher/               # Teacher dashboard (class & grading)
│   │   ├── student/               # Student dashboard (learning)
│   │   └── parent/                # Parent dashboard (child progress)
│   ├── api/
│   │   ├── auth/                  # Authentication endpoints
│   │   ├── principal/             # Principal-specific operations
│   │   ├── teacher/               # Teacher-specific operations
│   │   ├── student/               # Student endpoints
│   │   ├── parent/                # Parent endpoints
│   │   ├── admin/                 # Admin endpoints
│   │   ├── ai-chat/               # Shared AI chat service
│   │   ├── ai/                    # AI service endpoints
│   │   └── webhook/
│   │       ├── bale/              # Bale messenger bot webhook
│   │       └── telegram/          # Telegram messenger bot webhook
│   ├── components/
│   │   ├── AIChat/                # AI Chat system with hooks and types
│   │   └── reports/               # Report generation components
│   └── layout.tsx                 # Root layout with theme provider
├── types/
│   ├── bale.ts                    # Bale messenger bot API types
│   └── telegram.ts                # Telegram messenger bot API types
└── lib/
    ├── database.ts                # PostgreSQL connection pool & TypeScript types
    ├── auth.ts                    # Authentication logic (signin, OTP, password reset)
    ├── aiService.ts               # AI API communication (OpenAI, Google, local models)
    ├── aiPrompts.ts               # Role-specific AI prompts
    ├── emailService.ts            # SMTP email sending
    ├── fileUpload.ts              # AWS S3 file upload
    ├── exportUtils.ts             # Excel/CSV export utilities
    ├── reports.ts                 # Report generation logic
    ├── baleService.ts             # Bale messenger bot API client
    ├── baleMessageHandler.ts      # Bale messenger message processing logic
    ├── telegramService.ts         # Telegram messenger bot API client
    ├── telegramMessageHandler.ts  # Telegram messenger message processing logic
    └── utils.ts                   # Shared helper functions
```

### Core Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Next.js 16 with App Router |
| **Backend** | Next.js API Routes, Node.js |
| **Database** | PostgreSQL with `pg` library + connection pooling |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 with Persian font (Vazirmatn) |
| **Authentication** | JWT, bcryptjs, OTP (SMS) |
| **AI Services** | OpenAI API, Google Generative AI, LangChain, OpenRouter |
| **Data Export** | ExcelJS, CSV Parser |
| **Email/SMS** | Nodemailer, SMS service |
| **Maps** | Leaflet + React Leaflet |
| **Date/Time** | moment-jalaali (Persian calendar) |
| **Utilities** | Recharts (visualization), Framer Motion (animations), Lucide React (icons) |

## Database Architecture

### Connection Pool
- Uses PostgreSQL connection pooling (max 20 connections)
- Connection pool defined in `lib/database.ts`
- All database operations go through this pool

### Multi-Tenant Design
- **Single central `users` table** with role-based filtering
- **School-based data segregation**: All data entities reference `school_id`
- **JSONB `profile` field**: Flexible metadata storage (language preferences, settings)

### Key Entity Relationships
- **Schools** → Users (one-to-many, all users belong to a school)
- **Schools** → Classes → Subjects
- **Users (Teachers)** → Classes → Activities
- **Users (Students)** → Classes → Grades
- **Parents** → Student relationships for progress tracking

### User Roles & Permissions
| Role | Access Level | Key Tables |
|------|---|---|
| `school_admin` | System-wide | All tables |
| `principal` | School-wide | school_id filtered |
| `teacher` | Class-specific | Assigned classes/activities |
| `student` | Own profile | Own enrollments/grades |
| `parent` | Child profile | Children's data only |

### Critical Schema Notes
⚠️ **Deprecated Table**: The `subjects` table is **deprecated**. All references now use the `lessons` table:
- Foreign keys like `subject_id` now point to `lessons.id` (despite the field name)
- Use `lessons.title` instead of `subjects.name`
- Migration documented in docs/SUBJECTS_TO_LESSONS_MIGRATION.md
- Use provided sync scripts if working with legacy data

**Text Normalization for Persian**: When comparing Persian text in database queries, always normalize:
```sql
regexp_replace(translate(COALESCE(l.title, ''), 'يك', 'یک'), '\s+', ' ', 'g')
```

**Messenger Bot Indexes**: The JSONB `profile` field has GIN indexes for fast user lookups:
- `idx_users_profile_bale_chat_id` - Index on `profile->'bale_chat_id'` for Bale bot webhook
- `idx_users_profile_telegram_chat_id` - Index on `profile->'telegram_chat_id'` for Telegram bot webhook
- These provide O(log n) performance for user identification in messenger integrations
- Created in migration: `database/migrations/add_bale_chat_id_index.sql`

## Key Patterns & Conventions

### API Response Pattern
All API responses follow this structure:
```typescript
{
  success: boolean,
  data?: T,
  message?: string,
  error?: string,
  details?: any
}
```

### Authentication Flow
1. Multiple login methods: Email/Password, Phone/OTP, National ID/Password
2. JWT tokens stored in HTTP-only cookies (7-day expiry)
3. Middleware checks auth on protected routes
4. Role-based authorization on all API endpoints

### AI Integration Pattern
- **Dual Mode**: Cloud (OpenAI) and Local AI model support
- **Streaming Responses**: ReadableStream for real-time responses via `/api/ai-chat`
- **Role-Based Prompts**: Different system prompts for each user role (`lib/aiPrompts.ts`)
- **Fallback Handling**: Graceful degradation with error messages
- **LangChain Usage**: Note that `.stream()` method only accepts message array, not options parameter

### Messenger Bot Integration (Bale & Telegram)
The system supports AI-powered messaging through Bale and Telegram messengers:

**Bale Bot** (`docs/BALE_BOT_INTEGRATION.md`):
- **Files**: `src/types/bale.ts`, `src/lib/baleService.ts`, `src/lib/baleMessageHandler.ts`, `src/app/api/webhook/bale/route.ts`
- **Base URL**: `https://tapi.bale.ai/bot`
- **Profile Fields**: `bale_chat_id`, `bale_api_key`, `bale_bot_id`
- **Webhook**: `POST /api/webhook/bale` - Receives messages from Bale servers
- **Status**: ✅ Production-ready (February 10, 2026)

**Telegram Bot** (`docs/TELEGRAM_BOT_INTEGRATION.md`):
- **Files**: `src/types/telegram.ts`, `src/lib/telegramService.ts`, `src/lib/telegramMessageHandler.ts`, `src/app/api/webhook/telegram/route.ts`
- **Base URL**: `https://api.telegram.org/bot`
- **Profile Fields**: `telegram_chat_id`, `telegram_api_key`, `telegram_bot_id`
- **Webhook**: `POST /api/webhook/telegram` - Receives messages from Telegram servers
- **Status**: ✅ Production-ready (February 10, 2026)

**Shared Architecture**:
- Both use identical message flow (8-step process)
- Both reuse 100% of existing AI infrastructure (`sendChatToOpenAIStream`)
- Both apply role-based prompts automatically (principal/teacher/student/parent)
- Both support message splitting for responses >4096 chars
- Both have GIN indexes on JSONB chat_id fields for O(log n) performance
- Both enforce multi-tenant isolation via `school_id`
- Database schema supports both simultaneously

**Message Flow**:
1. User sends message in messenger → 2. Webhook POST to `/api/webhook/{bale|telegram}` → 3. Identify user by chat_id → 4. Get bot token from principal's profile → 5. Send typing indicator → 6. Process with `sendChatToOpenAIStream()` → 7. Split response if needed → 8. Send back to messenger → 9. Always return 200 OK

**Key Differences**:
| Aspect | Bale | Telegram |
|--------|------|----------|
| **API Base** | `tapi.bale.ai` | `api.telegram.org` |
| **Fields** | `bale_*` | `telegram_*` |
| **Deployment** | 60 minutes (ground-up) | 20 minutes (reused DB/UI) |
| **Status** | First messenger bot | Second (identical pattern) |

**Deployment Checklist**:
- Principal enters bot credentials in Settings → Profile
- Register webhook URL with messenger API (one-time per school)
- Users send first message to establish chat_id (auto-stored)
- Monitor logs for `[Bale Webhook]` or `[Telegram Webhook]` messages
- Verify response time <5 seconds per message

**For Future Messengers** (WhatsApp, Signal, etc.):
Copy the pattern: Create service + handler + webhook route, use existing AI infrastructure.

### Principal AI Assistant - Anti-Hallucination Patterns
The Principal Assistant uses strict prompts to prevent AI hallucination:
1. **Function Call Examples**: Always provide explicit Persian examples:
   ```
   "وضعیت علی احمدی در ریاضی" → student_name: "علی احمدی", subject_name: "ریاضی"
   ```
2. **Prompt Structure**: Use clear sections with **DATABASE FACTS**, **EXACT DATA - DO NOT MODIFY**, and **Anti-Hallucination Rules**
3. **Validation Functions**: Check student enrollment, validate subject references, confirm class membership before using AI
4. **Location**: `src/app/api/principal/ai-assistant/route.ts` and `src/lib/principalAssistantStudentData.ts`

Learn more: docs/PRINCIPAL_ASSISTANT_IMPROVEMENTS.md

### Chat Component System
Located in `src/app/components/AIChat/`:
- `ChatContainer.tsx` - Main component wrapper
- `ChatInput.tsx` - User input interface
- `ChatMessages.tsx` - Message display
- `ChatSidebar.tsx` - Conversation history
- `hooks/useChat.ts` - State management and API interaction
- `hooks/useChatStorage.ts` - localStorage persistence
- `hooks/useSpeechRecognition.ts` - Voice input
- `types.ts` - TypeScript interfaces

### Component Composition
- **Layout Components**: Nested per-role layouts (avoid duplication)
- **Custom Hooks**: Extract business logic from components
- **Client Components**: Use "use client" directive for interactive features
- **Server Components**: Default for data fetching and DB queries

### File Upload & Storage
- AWS S3 integration with presigned URLs
- Bulk operations support (CSV/Excel import)
- Excel export via ExcelJS for reports

### Internationalization (i18n)
- **Persian Language Support**: RTL layout ready
- **Persian Calendar**: moment-jalaali for dates
- **Digit Conversion**: Persian ↔ English digit utilities
- **Font**: Vazirmatn Persian font built into Tailwind config

## Common Development Tasks

### Adding a New API Endpoint
1. Create route file at `src/app/api/{role}/{resource}/route.ts`
2. Implement GET/POST/PUT/DELETE handlers with proper auth checks
3. Use `lib/database.ts` types for type safety
4. Follow the standardized response pattern (success, data, error)
5. Add role-based middleware for authorization

### Working with Database Queries
1. Use connection pool from `lib/database.ts` - never create new connections
2. All queries should include `school_id` for multi-tenant isolation
3. Use TypeScript interfaces from `database.ts` for type safety
4. Handle connection errors gracefully

### Creating AI-Powered Features
1. Define role-specific prompt in `lib/aiPrompts.ts`
2. Use `aiService.ts` for API calls
3. For streaming responses, use `sendChatToOpenAIStream()` with ReadableStream
4. Test with both cloud (OpenAI) and local AI models if applicable

### Styling Components
- Use Tailwind CSS utility classes exclusively
- Persian fonts (Vazirmatn) already configured in Tailwind
- RTL support handled automatically in layout
- Dark/light mode context available via root layout

### Exporting Data
- Use `ExcelJS` for complex reports (via `lib/exportUtils.ts`)
- Use `csv-parse` for bulk imports
- Generate exports server-side to handle large datasets

### Adding Educational Activities
- Follow existing pattern in `src/app/api/principal/activities/` and `/teacher/activities/`
- Activities can use AI grading via `aiService.gradeActivityWithAI()`
- Activities are stored school-wide but assigned to classes

### Bulk Activities Management
The system supports importing/exporting activities in bulk via Excel:
- **Import/Export**: CSV/Excel files with validation
- **Generation**: Create activity templates filtered by grade, class, subject
- **Validation**: Complete data validation (students, teachers, classes, subjects)
- **Error Reporting**: Comprehensive error logs with line numbers and issues
- **Operations**: Support both insert and update modes
- Learn more: docs/BULK_ACTIVITIES_GUIDE.md

## Important Configuration Files

- `.env` - Environment variables (API keys, DB connection string, email config)
- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js configuration (Turbopack settings, image optimization)
- `tailwind.config.ts` - Tailwind CSS configuration with Persian font setup
- `database/migrations/` - SQL migration files for schema changes

## Debugging & Troubleshooting

### Database Connection Issues
- Check `.env` DATABASE_URL setting
- Verify PostgreSQL server is running
- Check connection pool limits in `lib/database.ts`

### AI Service Failures
- Verify API keys in `.env` (OPENAI_API_KEY, GOOGLE_AI_KEY, etc.)
- Check network connectivity to AI providers
- Review fallback behavior in `aiService.ts`

### Build Issues
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run build`
- Check ESLint errors: `npm run lint`

### Type Errors
- Check TypeScript strict mode in `tsconfig.json`
- Verify all DB queries use proper types from `lib/database.ts`
- Use `types.ts` files in feature directories for local types

## Performance Considerations

- **Turbopack**: Use `npm run dev:turbo` for faster builds
- **Connection Pooling**: Configured for optimal performance (max 20 connections)
- **Streaming**: AI responses use streaming to improve perceived performance
- **Image Optimization**: Next.js Image component auto-optimizes
- **lazy Loading**: Use dynamic imports for heavy components
- **Database Indexes**: Consider indexes on frequently queried fields (school_id, user_id, class_id)

## Security Notes

- **Passwords**: Always use bcryptjs hashing, never store plain text
- **API Keys**: Keep all API keys in `.env.local`, never commit to git
- **CORS**: Configured for Next.js API routes
- **SQL Injection**: Always use parameterized queries (pg library handles this)
- **Authentication**: Every API endpoint must verify user role and school_id
- **Input Validation**: Validate at system boundaries (user input, external APIs)

## Documentation

Comprehensive documentation is available in `/docs/`:
- `DATABASE_STRUCTURE.md` - Full schema documentation with bulk activities section
- `AUTHENTICATION.md` - Auth system details and login methods
- `CLASS_MANAGEMENT.md` - Class and academic structure
- `EDUCATIONAL_ACTIVITIES.md` - Activity types and workflows
- `BULK_ACTIVITIES_GUIDE.md` - Import/export and bulk management of activities
- `PRINCIPAL_ASSISTANT_IMPROVEMENTS.md` - AI anti-hallucination patterns
- `BALE_BOT_INTEGRATION.md` - Bale messenger bot setup and troubleshooting ⭐ **New**
- `TELEGRAM_BOT_INTEGRATION.md` - Telegram messenger bot setup and troubleshooting ⭐ **New**
- `SUBJECTS_TO_LESSONS_MIGRATION.md` - Schema migration documentation
- And 20+ other detailed guides in Persian and English

Also available in root directory:
- `BALE_DEPLOYMENT_CHECKLIST.md` - 5-minute Bale bot deployment guide
- `BALE_IMPLEMENTATION_SUMMARY.md` - Bale bot implementation overview
- `TELEGRAM_DEPLOYMENT_CHECKLIST.md` - 5-minute Telegram bot deployment guide
- `TELEGRAM_IMPLEMENTATION_SUMMARY.md` - Telegram bot implementation overview

Refer to these documents for specific domain knowledge before making changes. Pay special attention to the **bolded** documents for recent feature implementations (messenger bots).

## Common Pitfalls & Solutions

### SQL Query Errors with SELECT DISTINCT
**Problem**: `for SELECT DISTINCT, ORDER BY expressions must appear in select list`

**Solution**: When using `SELECT DISTINCT`, all columns in `ORDER BY` must be in the SELECT list:
```sql
-- ❌ Wrong
SELECT DISTINCT title ORDER BY LENGTH(title) DESC

-- ✅ Correct
SELECT DISTINCT title, LENGTH(title) AS title_length ORDER BY title_length DESC
```

### LangChain Streaming with Timeout
**Problem**: "Internal Server Error" when calling `.stream()` with `signal` parameter

**Solution**: LangChain's `.stream()` only accepts message array, not options:
```typescript
// ❌ Wrong
await model.stream([messages], { signal: abortController.signal })

// ✅ Correct - Handle timeout separately with setTimeout
await model.stream([messages])
```
