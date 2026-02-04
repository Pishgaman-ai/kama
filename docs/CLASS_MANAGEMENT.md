# Class Management System - مدیریت کلاس‌ها

## Overview

This document describes the class management system that allows principals to create and manage classes with multiple teacher assignments.

## Features Implemented

### 1. Class Creation

Principals can create new classes with the following information:

- **نام کلاس (Class Name)**: Required
- **پایه تحصیلی (Grade Level)**: Required (1-12)
- **شعبه (Section)**: Optional (e.g., الف، ب، ج)
- **سال تحصیلی (Academic Year)**: Auto-filled with current year
- **توضیحات (Description)**: Optional

### 2. Teacher Assignments

- **Multiple Teachers**: Each class can have multiple teachers
- **Subject Assignment**: Each teacher is assigned to teach ONE specific subject in the class
- **Validation**: Prevents duplicate teacher-subject assignments

### 3. User Interface

Location: `/dashboard/principal/classes`

#### Features:

- **Search**: Search classes by name, grade level, or section
- **Grid View**: Visual card-based display of all classes
- **Create Dialog**: Modal form for creating new classes
- **Teacher Assignment**: Dynamic form to add/remove teacher-subject pairs

## Database Schema

### Tables Involved

#### 1. `classes` Table

```sql
CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  grade_level text,
  section text,
  academic_year text,
  description text,
  subject text,
  code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);
```

#### 2. `subjects` Table

```sql
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);
```

#### 3. `teacher_assignments` Table

```sql
CREATE TABLE teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  subject text,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);
```

## API Endpoints

### GET `/api/principal/classes`

Retrieves all classes for the principal's school with:

- Student count
- Teacher assignments (with teacher names and subject names)

**Response:**

```json
{
  "classes": [
    {
      "id": "uuid",
      "name": "ریاضی ۱",
      "grade_level": "10",
      "section": "الف",
      "academic_year": "1403",
      "description": "کلاس ریاضی پایه دهم",
      "student_count": 25,
      "teacher_assignments": [
        {
          "teacher_id": "uuid",
          "subject_id": "uuid",
          "teacher_name": "محمد رضایی",
          "subject_name": "ریاضی"
        }
      ]
    }
  ]
}
```

### POST `/api/principal/classes`

Creates a new class with teacher assignments.

**Request Body:**

```json
{
  "name": "ریاضی ۱",
  "grade_level": "10",
  "section": "الف",
  "academic_year": "1403",
  "description": "کلاس ریاضی پایه دهم",
  "teacher_assignments": [
    {
      "teacher_id": "uuid",
      "subject_id": "uuid"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "کلاس با موفقیت ایجاد شد",
  "class": {
    "id": "uuid",
    "name": "ریاضی ۱",
    "grade_level": "10",
    "section": "الف"
  }
}
```

### GET `/api/principal/teachers`

Retrieves all teachers for the school.

### GET `/api/principal/subjects`

Retrieves all subjects for the school.

## Business Rules

### 1. Teacher Assignment Rules

- ✅ Each class can have **multiple teachers**
- ✅ Each teacher can be assigned to **one subject** per class
- ✅ A teacher can teach **different subjects** in different classes
- ❌ A teacher **cannot** be assigned to the same subject twice in the same class

### 2. Validation Rules

- Class name and grade level are **required**
- Teacher assignments must have both `teacher_id` and `subject_id`
- No duplicate teacher-subject combinations in the same class

## User Workflow

### Creating a New Class

1. **Navigate** to `/dashboard/principal/classes`
2. **Click** "کلاس جدید" (New Class) button
3. **Fill** class information:
   - نام کلاس (Class Name) \*
   - پایه تحصیلی (Grade Level) \*
   - شعبه (Section)
   - سال تحصیلی (Academic Year)
   - توضیحات (Description)
4. **Add Teachers**:
   - Click "افزودن معلم" (Add Teacher)
   - Select teacher from dropdown
   - Select subject from dropdown
   - Repeat for multiple teachers
5. **Submit** the form

### Viewing Classes

- All classes are displayed in a grid layout
- Each card shows:
  - Class name
  - Grade level and section
  - Student count
  - Teacher count
  - Description (if available)

## Technical Implementation

### Frontend

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Theme**: Light/Dark mode support
- **State Management**: React useState
- **API Calls**: Fetch API

### Backend

- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: pg (node-postgres)
- **Authentication**: Cookie-based sessions

## File Structure

```
eduhelper/
├── src/app/
│   ├── dashboard/principal/
│   │   ├── classes/
│   │   │   └── page.tsx          # Class management page
│   │   ├── layout.tsx             # Principal dashboard layout
│   │   └── page.tsx               # Principal dashboard home
│   └── api/principal/
│       ├── classes/
│       │   └── route.ts           # Classes API endpoint
│       ├── teachers/
│       │   └── route.ts           # Teachers API endpoint
│       └── subjects/
│           └── route.ts           # Subjects API endpoint
```

## Future Enhancements

### Planned Features

- [ ] Edit existing classes
- [ ] Delete classes
- [ ] Reassign teachers to different subjects
- [ ] Remove teacher assignments
- [ ] Add students to classes
- [ ] View class details page
- [ ] Export class lists
- [ ] Bulk operations

### Potential Improvements

- [ ] Drag-and-drop teacher assignment
- [ ] Calendar view for class schedules
- [ ] Automated teacher load balancing
- [ ] Subject prerequisites
- [ ] Class capacity limits

## Error Handling

### Common Errors

1. **"نام کلاس و پایه تحصیلی الزامی است"**: Class name and grade level are required
2. **"لطفاً تمام اطلاعات معلمان و دروس را کامل کنید"**: All teacher and subject fields must be filled
3. **"هر معلم فقط می‌تواند یک بار برای هر درس انتخاب شود"**: Duplicate teacher-subject assignment detected

## Testing Checklist

- [ ] Create class with no teachers
- [ ] Create class with one teacher
- [ ] Create class with multiple teachers
- [ ] Attempt to assign same teacher-subject twice
- [ ] Search for classes
- [ ] View class details
- [ ] Test on mobile devices
- [ ] Test with different themes (light/dark)

## Notes

- All forms support Persian (RTL) language
- Accessibility warnings exist but don't affect functionality
- Database migrations should be run to add `subjects` table if not exists
