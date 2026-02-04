# Educational Activities Feature

## Overview

The educational activities feature allows teachers to record and manage various types of educational activities for their students. This includes different types of assessments and activities with both quantitative (numerical scores) and qualitative (text-based) evaluations.

## Activity Types

The system supports the following activity types:

1. **Midterm Exam** (آزمون میان‌ترم)
2. **Monthly Exam** (آزمون ماهیانه)
3. **Weekly Exam** (آزمون هفتگی)
4. **Class Activity** (فعالیت کلاسی)
5. **Class Homework** (تکلیف کلاسی)
6. **Home Homework** (تکلیف منزل)

## Evaluation Types

Each activity type has specific evaluation requirements:

| Activity Type  | Quantitative Score | Qualitative Evaluation |
| -------------- | ------------------ | ---------------------- |
| Midterm Exam   | Required           | Not Applicable         |
| Monthly Exam   | Required           | Not Applicable         |
| Weekly Exam    | Required           | Not Applicable         |
| Class Activity | Required           | Required               |
| Class Homework | Required           | Required               |
| Home Homework  | Required           | Not Applicable         |

## Database Schema

The feature uses the `educational_activities` table with the following structure:

```sql
CREATE TABLE educational_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  activity_title VARCHAR(255) NOT NULL,
  activity_date DATE NOT NULL,
  quantitative_score NUMERIC,
  qualitative_evaluation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Important Note**: The `subject_id` field references the `lessons` table (not `subjects`). This was updated as part of the [subjects-to-lessons migration](./SUBJECTS_TO_LESSONS_MIGRATION.md).

## API Endpoints

The feature provides the following API endpoints:

### Get Activities

```
GET /api/teacher/classes/[id]/activities
```

Retrieves all educational activities for a specific class.

### Create/Update Activity

```
POST /api/teacher/classes/[id]/activities
```

Creates a new educational activity or updates an existing one.

### Delete Activity

```
DELETE /api/teacher/classes/[id]/activities?activityId=[activityId]
```

Deletes a specific educational activity.

## Frontend Implementation

The feature is integrated into the teacher dashboard, specifically in the class details page. Teachers can:

- View activities for each student
- Add new activities
- Edit existing activities
- Delete activities

The interface provides a modal for adding/editing activities with appropriate form validation based on the activity type requirements.
