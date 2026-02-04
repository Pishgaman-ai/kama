# Class Grades Management Feature

This document describes the implementation of the class grades management feature that allows teachers to assign grades to students in their classes.

## Feature Overview

The class grades management feature enables teachers to:

- Enter and manage grades for students in their classes
- Organize grades by subject and term
- View grade statistics and letter grades
- Save grades to the database

## Implementation Details

### Database Schema

A new table `class_grades` has been added to store general class grades:

```sql
CREATE TABLE IF NOT EXISTS class_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_name VARCHAR(255) NOT NULL,
  grade_value NUMERIC NOT NULL,
  max_score NUMERIC DEFAULT 100,
  percentage NUMERIC,
  grade_letter VARCHAR(5),
  term VARCHAR(50),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (class_id, student_id, subject_name, term)
)
```

### API Endpoints

#### Get Class Grades

- **Endpoint**: `GET /api/teacher/classes/[classId]/grades`
- **Description**: Retrieves all grades for a specific class
- **Response**: Returns class information, students, existing grades, subjects, and terms

#### Save Class Grades

- **Endpoint**: `POST /api/teacher/classes/[classId]/grades`
- **Description**: Saves grades for students in a class
- **Request Body**: Array of grade objects
- **Response**: Success message or error

### UI Components

#### Class Grades Page

- **File**: `/dashboard/teacher/classes/[id]/grades/page.tsx`
- **Features**:
  - Table for entering/editing student grades
  - Subject and term management
  - Real-time grade calculation and letter grade assignment
  - Save functionality

#### Class Details Page

- **File**: `/dashboard/teacher/classes/[id]/page.tsx`
- **Features**:
  - Link to grades management page

#### Classes List Page

- **File**: `/dashboard/teacher/classes/page.tsx`
- **Features**:
  - Quick link to grades management for each class

## Usage Flow

1. Teachers navigate to the "Classes" section from their dashboard
2. They can either:
   - Click the "نمرات" (Grades) button on the class cards in the main list
   - View class details and click "مدیریت نمرات" (Manage Grades)
3. On the grades management page, teachers can:
   - Add new subjects and terms
   - Enter grades for students
   - See automatic percentage and letter grade calculations
   - Save grades to the database

## Setup Instructions

1. Create the `class_grades` table in the database (script provided in `add-class-grades-table.mjs`)
2. Ensure the database connection is properly configured in environment variables
3. The feature should now be accessible through the teacher dashboard

## Future Enhancements

- Add grade history tracking
- Implement grade export functionality
- Add grade analytics and reporting
- Include parent access to view grades
