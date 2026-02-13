# Principal Analytics Dashboard – Source of Truth
> Living Specification for Implementation with Codex / LLMs

## 1. Purpose
This document defines the **single source of truth** for implementing the
**Principal (School Manager) Analytical Dashboard** in kama.

All implementations (UI, API, DB queries, charts) MUST follow this document.
When changes are required, this document must be updated first.

---

## 2. Target User
**Role:** Principal (School Manager)  
**Goal:**  
- Monitor academic performance
- Detect risks early
- Compare classes, teachers, and trends
- Take operational and educational actions based on data

---

## 3. Scope & Constraints
- Dashboard is **single-page**
- Uses **existing database schema only**
- No destructive migrations
- Performance-oriented (aggregated queries preferred)
- Supports filters (time, grade, class, lesson)

---

## 4. Global Filters (Affect All Widgets)
All widgets must react to the following filters:

- Academic Year → `classes.academic_year`
- Date Range → based on:
  - `educational_activities.activity_date`
  - `answers.submitted_at`
  - `exams.starts_at / ends_at`
- Grade Level → `classes.grade_level`
- Class → `classes.id`
- Lesson / Subject → `lessons.id` (or legacy `subject_name` if required)

Default:
- Academic Year = current
- Date Range = last 30 days

---

## 5. Dashboard Layout (Single Page)

### 5.1 KPI Cards (Top Row)
Show 4–6 KPI cards. Each card includes:
- Main value
- Delta vs previous period
- Short explanation

#### KPI List
1. **Active Classes**
   - Source: `classes`
   - Filter: academic_year

2. **Active Students**
   - Source: `users (role=student)` + `class_memberships`

3. **Educational Activities Count**
   - Source: `educational_activities`
   - Metric: count in selected range

4. **Average Academic Performance**
   - Source: `class_grades`
   - Metric: avg(`percentage`) OR `grade_value / max_score`

5. **Exam Status Overview**
   - Source: `exams`
   - Breakdown: draft / published / active

6. **Skill Assessment Coverage**
   - Source:
     - `life_skills_assessments`
     - `active_life_assessments`
     - `growth_development_assessments`
   - Metric: % of students with at least one assessment

---

### 5.2 School Pulse (Trends & Comparisons)

#### A. Learning Activity Trend (Line / Area Chart)
X-axis: time (day/week)  
Series:
- Educational Activities count
- Exam submissions
- Grade records

Sources:
- `educational_activities`
- `answers`
- `class_grades`

Purpose:
Detect engagement drops or peaks.

---

#### B. Class Comparison Ranking (Bar Chart)
Compare classes by:
- Average score
- Activity volume
- Assessment coverage

Sources:
- `classes`
- `class_grades`
- `educational_activities`
- assessments tables

Supports:
- Top 5 / Bottom 5
- Switch by lesson or overall

---

### 5.3 Insight Panels (Three Columns)

#### Panel 1: Teacher Engagement & Performance
Table columns:
- Teacher name
- Classes count
- Activities count
- Average class score
- Last activity date

Sources:
- `users (teacher)`
- `teacher_assignments`
- `educational_activities`
- `class_grades`

Purpose:
Identify low-activity or overloaded teachers.

---

#### Panel 2: Students Needing Attention
Tabs:
1. Academic decline
2. Low engagement
3. Behavioral / AI risk

Sources:
- `class_grades`
- `educational_activities`
- `behavioral_reports`
- `ai_reports`

Purpose:
Generate actionable lists.

---

#### Panel 3: AI Usage & System Load
Metrics:
- AI request count
- Success vs error rate
- Avg response time
- Model usage distribution

Source:
- `ai_logs`

Purpose:
Operational & cost awareness.

---

### 5.4 Action & Data Health Center
Alert-style list of issues:

- Classes without assigned teachers
- Students without parents
- Activities missing files
- Repeated AI or auth errors

Sources:
- `teacher_assignments`
- `parent_student_relations`
- `educational_activities`
- `logs`

Each item must be clickable → filtered view or admin tool.

---

## 6. API Design Principles
- Prefer **one aggregated endpoint**:
  `/api/principal/performance-analysis`
- Response shape must match dashboard sections
- Heavy joins handled server-side
- Cacheable by filter hash

---

## 7. UI / Implementation Notes
- Next.js App Router
- Charts: `recharts`
- Cards: reusable KPI component
- All widgets must support loading & empty states
- No hardcoded strings (i18n-ready)

---

## 8. Living Document Rules
- Any KPI change → update this file first
- Any new widget → add section
- Deprecated metrics must be marked clearly
- Codex / LLM must treat this file as authoritative

---

## 9. Future Extensions (Non-breaking)
- Predictive trends (AI)
- Cross-school comparison (Admin)
- Custom KPI builder for principals
- Saved dashboard views

---

## 10. Status
- Version: v1.0
- Owner: kama Core Team
- Last Updated: YYYY-MM-DD

## 11. Persian & RTL Considerations (Mandatory)

This dashboard is **Persian-first** and **RTL-native**.

All implementations MUST comply with the following rules:

### 11.1 Language & Localization
- All visible UI texts MUST be in **Persian (fa-IR)**
- No English labels in UI (except technical debug views)
- KPI titles, chart labels, tooltips, empty states → Persian

### 11.2 Direction (RTL)
- Entire dashboard layout is **RTL**
- Charts must render correctly in RTL:
  - X-axis labels ordered logically for Persian reading
  - Legends aligned properly (right side by default)
- Tables:
  - First column on the right
  - Action buttons aligned left

### 11.3 Numbers & Formatting
- All numbers displayed in **Persian digits**
- Percentages use Persian symbol (٪)
- Thousand separators must follow Persian format

### 11.4 Dates & Calendar
- Use **Persian (Jalali) calendar**
- Format example: `۱۴۰۳/۰۷/۲۱`
- Relative time (e.g. "۳ روز قبل") preferred where applicable

### 11.5 Charts & Visuals
- Recharts configurations must support RTL
- Tooltip content must be Persian
- Avoid abbreviations that break Persian readability

### 11.6 Sorting & Ranking Logic
- Rankings (Top/Bottom) must be visually clear in RTL
- Color semantics:
  - Green = positive
  - Red = warning/decline
  - Yellow/Orange = attention required

### 11.7 AI-Generated Content
- AI outputs shown to principals MUST be Persian
- Tone: formal, professional, educational
- Avoid slang or informal phrasing

### 11.8 Fonts
- Use Vazirmatn consistently
- No fallback to default Latin fonts

Failure to comply with these rules is considered an implementation bug.
