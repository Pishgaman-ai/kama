# Bulk Activities Management Guide

## Overview

The Bulk Activities Management system provides principals with powerful tools to manage educational activities at scale using Excel import/export functionality. This guide covers the complete workflow from template generation to data import.

## Quick Start

### Access the System

Navigate to: `/dashboard/principal/bulk-activities`

### Basic Workflow

1. **Generate Template** → Fill Data Offline → **Import Excel** → Review Results

## Database Tables

### Primary Table: educational_activities

```sql
CREATE TABLE educational_activities (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  teacher_id UUID REFERENCES users(id),
  class_id UUID REFERENCES classes(id),
  subject_id UUID REFERENCES lessons(id),
  activity_type VARCHAR(50) NOT NULL,
  activity_title VARCHAR(255) NOT NULL,
  activity_date DATE NOT NULL,
  quantitative_score NUMERIC,
  qualitative_evaluation TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Supporting Tables

- **users**: Student and teacher information
- **classes**: Class organization by grade level
- **lessons**: Subject/curriculum information
- **class_memberships**: Student enrollment validation
- **teacher_assignments**: Teacher authorization validation

## Activity Types

| Type Key | Persian Name | Score Required | Evaluation Required |
|----------|--------------|----------------|---------------------|
| `midterm_exam` | آزمون میان‌ترم | ✅ Required | ❌ Optional |
| `monthly_exam` | آزمون ماهیانه | ✅ Required | ❌ Optional |
| `weekly_exam` | آزمون هفتگی | ✅ Required | ❌ Optional |
| `class_activity` | فعالیت کلاسی | ✅ Required | ✅ Required |
| `class_homework` | تکلیف کلاسی | ✅ Required | ✅ Required |
| `home_homework` | تکلیف منزل | ✅ Required | ❌ Optional |

## Template Generation

### Standard Template

Download a basic template with all students from all classes:

**Endpoint**: `GET /api/principal/activities/template`

### Custom Template

Generate a template with specific filters:

**Endpoint**: `POST /api/principal/activities/custom-template`

**Request Body**:
```json
{
  "gradeLevels": ["هفتم", "هشتم"],
  "classes": ["class-uuid-1", "class-uuid-2"],
  "lessons": ["lesson-uuid-1", "lesson-uuid-2"],
  "activityTypes": ["midterm_exam", "class_activity"],
  "defaultScore": 15.0,
  "defaultDate": "2025-03-15"
}
```

### Template Structure

Each activity type gets its own sheet in the Excel file:

| Column | Description | Validation |
|--------|-------------|------------|
| Student ID | UUID of student | Must exist in database |
| Student Name | Full name | Display only |
| Class | Class name + section | Must match student enrollment |
| Grade | Grade level | Display only |
| Subject | Lesson/subject name | Must exist in database |
| Teacher | Teacher name | Must be assigned to subject |
| Activity Title | Title of activity | Free text |
| Date | Activity date | Date format (YYYY-MM-DD) |
| Score | Quantitative score | 0-20, decimal allowed |
| Evaluation | Qualitative text | Required for some types |

## Import Process

### Step 1: Prepare Excel File

- Use downloaded template
- Fill in required fields
- Ensure data validation passes
- Save as .xlsx or .xls

### Step 2: Upload File

**Endpoint**: `POST /api/principal/activities/import`

**Request**:
- Method: POST
- Content-Type: multipart/form-data
- Body: Excel file

### Step 3: Review Results

**Response Structure**:
```json
{
  "success": true,
  "message": "Import completed",
  "summary": {
    "total": 150,
    "added": 100,
    "updated": 45,
    "failed": 5
  },
  "errors": [
    "Row 15: Student not found in database",
    "Row 23: Teacher not assigned to this subject"
  ],
  "results": [
    {
      "row": 1,
      "student": "علی احمدی",
      "activity": "آزمون میان‌ترم",
      "teacher": "محمد رضایی",
      "status": "added"
    }
  ]
}
```

## Validation Rules

### Student Validation

```sql
-- Check student exists
SELECT id FROM users
WHERE id = $1 AND role = 'student';

-- Check student is enrolled in class
SELECT 1 FROM class_memberships
WHERE user_id = $1
  AND class_id = $2
  AND role = 'student';
```

### Teacher Validation

```sql
-- Check teacher is assigned to subject in class
SELECT 1 FROM teacher_assignments
WHERE teacher_id = $1
  AND class_id = $2
  AND subject_id = $3
  AND removed_at IS NULL;
```

### Score Validation

- Must be numeric
- Range: 0 to 20 (Iranian grading system)
- Decimal values allowed (e.g., 17.5)
- Can be NULL for activities without scores

### Date Validation

- Format: YYYY-MM-DD (Gregorian)
- Persian dates are converted automatically
- Must be a valid date

## Common Queries

### Get All Activities

```sql
SELECT
  ea.id,
  u.name as student_name,
  c.name as class_name,
  c.grade_level,
  c.section,
  l.title as subject_name,
  t.name as teacher_name,
  ea.activity_type,
  ea.activity_title,
  ea.activity_date,
  ea.quantitative_score,
  ea.qualitative_evaluation
FROM educational_activities ea
JOIN users u ON ea.student_id = u.id
JOIN classes c ON ea.class_id = c.id
LEFT JOIN lessons l ON ea.subject_id = l.id
JOIN users t ON ea.teacher_id = t.id
WHERE c.school_id = $1
ORDER BY ea.activity_date DESC;
```

### Get Statistics

```sql
-- Total activities
SELECT COUNT(*) as total_activities
FROM educational_activities ea
JOIN classes c ON ea.class_id = c.id
WHERE c.school_id = $1;

-- Average score
SELECT AVG(quantitative_score) as average_score
FROM educational_activities ea
JOIN classes c ON ea.class_id = c.id
WHERE c.school_id = $1
  AND ea.quantitative_score IS NOT NULL;

-- Active students
SELECT COUNT(DISTINCT ea.student_id) as active_students
FROM educational_activities ea
JOIN classes c ON ea.class_id = c.id
WHERE c.school_id = $1;
```

## Use Cases

### Use Case 1: Midterm Exam Scores

**Scenario**: Record midterm exam scores for all 7th-grade students

**Steps**:
1. Select grade level: "هفتم"
2. Select all 7th-grade classes
3. Select lessons: ریاضی, علوم, فارسی, عربی, انگلیسی
4. Select activity type: "آزمون میان‌ترم"
5. Set default date: Exam date
6. Generate template
7. Fill scores (0-20)
8. Import Excel file
9. Review: 150 activities added successfully

**SQL Check**:
```sql
SELECT
  c.name as class_name,
  COUNT(*) as activities_count,
  AVG(ea.quantitative_score) as avg_score
FROM educational_activities ea
JOIN classes c ON ea.class_id = c.id
WHERE c.grade_level = 'هفتم'
  AND ea.activity_type = 'midterm_exam'
  AND ea.activity_date = '2025-03-15'
GROUP BY c.name;
```

### Use Case 2: Weekly Homework Tracking

**Scenario**: Track weekly homework for specific classes

**Steps**:
1. Select specific classes (not all grades)
2. Select lessons: ریاضی, فارسی
3. Select activity type: "تکلیف منزل"
4. Generate template with current week's date
5. Teachers fill scores throughout the week
6. Import at end of week
7. Review results and handle errors

### Use Case 3: Class Activities with Evaluations

**Scenario**: Record class participation with qualitative feedback

**Steps**:
1. Select classes
2. Select activity type: "فعالیت کلاسی"
3. Generate template
4. Fill both score AND evaluation columns (both required)
5. Import Excel
6. Verify qualitative evaluations are saved

**Validation Note**: Class activities require both quantitative score and qualitative evaluation!

## Export for Backup/Analysis

### Export All Activities

**Endpoint**: `GET /api/principal/activities/export`

**Response**: Excel file with all activities from your school

**Use Cases**:
- Regular backups
- External analysis in Excel
- Sharing with school administration
- End-of-term reports

### Export File Structure

Same structure as import template, with all existing data populated.

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Student not found" | Invalid student ID | Use template-generated student IDs |
| "Teacher not assigned" | Teacher doesn't teach this subject | Check teacher assignments |
| "Invalid score" | Score outside 0-20 | Correct score range |
| "Date format error" | Invalid date | Use YYYY-MM-DD format |
| "Missing evaluation" | Class activity without evaluation | Add qualitative evaluation |
| "Student not in class" | Student not enrolled | Verify class enrollment |

### Validation Messages

Import process provides detailed error messages with row numbers:

```
Row 5: Student با شناسه xxx-xxx-xxx در پایگاه داده یافت نشد
Row 12: معلم به این درس در این کلاس تخصیص داده نشده است
Row 18: نمره باید بین 0 تا 20 باشد
```

## Performance Tips

### For Large Imports

1. **Batch Processing**: Import in batches of 200-500 rows
2. **Network**: Use stable internet connection
3. **File Size**: Keep files under 5MB for best performance
4. **Validation**: Pre-validate data in Excel before upload

### Database Optimization

All foreign keys are indexed:
- `educational_activities.student_id`
- `educational_activities.teacher_id`
- `educational_activities.class_id`
- `educational_activities.subject_id`

## Security & Access Control

### School Isolation

- Principals can only access their school's data
- `school_id` filter applied to all queries
- Cannot import activities for other schools

### Teacher Authorization

- Teachers must be assigned to subject + class
- Checked via `teacher_assignments` table
- Unauthorized activities rejected during import

### Data Privacy

- Student data only visible to authorized school staff
- Activity records include audit timestamps
- All changes tracked via `updated_at`

## Best Practices

### ✅ Do

1. Always use generated templates
2. Validate data in Excel before import
3. Test with small batch first
4. Review error report carefully
5. Export data regularly for backup
6. Fill required fields for each activity type
7. Use correct date format (YYYY-MM-DD)
8. Verify teacher assignments before import

### ❌ Don't

1. Modify student IDs or names in template
2. Delete or rename Excel columns
3. Mix multiple academic years in one import
4. Skip validation of scores (0-20 range)
5. Forget qualitative evaluation for class activities
6. Use very old dates (check academic year)
7. Import without reviewing errors first

## API Reference

### Complete Endpoint List

```typescript
// Fetch activities
GET /api/principal/activities
Response: { success: true, activities: Activity[] }

// Export to Excel
GET /api/principal/activities/export
Response: Excel file (MIME: application/vnd.openxmlformats)

// Basic template
GET /api/principal/activities/template
Response: Excel template file

// Custom template
POST /api/principal/activities/custom-template
Body: {
  gradeLevels: string[],
  classes: string[],
  lessons: string[],
  activityTypes: string[],
  defaultScore?: number,
  defaultDate?: string
}
Response: Customized Excel template

// Import activities
POST /api/principal/activities/import
Body: FormData with file
Response: {
  success: boolean,
  message: string,
  summary: ImportSummary,
  errors: string[],
  results: ImportResult[]
}

// Activity types
GET /api/principal/activity-types
Response: { success: true, data: ActivityType[] }

// Grade levels
GET /api/principal/grade-levels
Response: {
  gradeLevels: {
    elementary: GradeLevel[],
    middleSchool: GradeLevel[],
    highSchool: GradeLevel[]
  }
}

// Classes
GET /api/principal/classes
Response: { classes: Class[] }

// Subjects/Lessons
GET /api/principal/subjects
Response: { subjects: { [gradeLevel: string]: Lesson[] } }
```

## Troubleshooting

### Import Fails Completely

**Check**:
1. File format (.xlsx or .xls)
2. File not corrupted
3. Required columns present
4. At least one valid row of data

### Partial Import Success

**Review**:
1. Error messages for failed rows
2. Student enrollment in classes
3. Teacher assignments
4. Score ranges and formats

### Slow Performance

**Solutions**:
1. Reduce batch size
2. Check network connection
3. Import during off-peak hours
4. Split large files into smaller batches

## Support

For issues or questions:
1. Check error messages in import results
2. Review this guide's troubleshooting section
3. Verify data against validation rules
4. Contact system administrator if problems persist

---

**Last Updated**: February 2026
**Version**: 4.0
**Related Documentation**:
- [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md)
- [SUBJECTS_TO_LESSONS_MIGRATION.md](./SUBJECTS_TO_LESSONS_MIGRATION.md)
