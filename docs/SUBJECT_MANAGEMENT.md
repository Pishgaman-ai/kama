# Subject Management System - مدیریت دروس

## Overview

Complete subject management system that allows principals to create subjects, view subject lists, and assign subjects to teachers.

## Features Implemented

### 1. Subject Management (`/dashboard/principal/subjects`)

#### Create New Subjects

- **نام درس (Subject Name)**: Required - e.g., "ریاضی", "فیزیک", "شیمی"
- **کد درس (Subject Code)**: Optional - e.g., "MATH101", "PHYS201"
- **توضیحات (Description)**: Optional - Additional details about the subject

#### View Subject List

- Grid view displaying all subjects
- Shows teacher count for each subject
- Real-time search by name or code
- Color-coded subject cards

#### Delete Subjects

- Remove subjects from the system
- Validation: Cannot delete if assigned to teachers
- Confirmation dialog before deletion

### 2. Teacher-Subject Assignment

#### In Teachers Page (`/dashboard/principal/teachers`)

When creating a new teacher, principals can:

- Select multiple subjects the teacher can teach
- Subjects are displayed as checkboxes
- Teacher profile shows assigned subjects

#### In Classes Page (`/dashboard/principal/classes`)

When creating a class, principals can:

- Assign specific teachers to specific subjects
- Each teacher teaches ONE subject per class
- Multiple teachers can be assigned to one class

## User Interface

### Subjects Page Features

- 📚 **Subject Cards**: Visual display with icons
- 🔍 **Search Bar**: Filter subjects by name or code
- ➕ **Create Button**: Opens modal dialog
- 👥 **Teacher Count**: Shows how many teachers teach each subject
- ✏️ **Edit Button**: Edit subject details (future)
- 🗑️ **Delete Button**: Remove subjects with validation

### Create Subject Dialog

- Clean modal interface
- Form validation
- Success/error messages
- Auto-close on success

## API Endpoints

### GET `/api/principal/subjects`

Retrieves all subjects for the principal's school with teacher count.

**Response:**

```json
{
  "subjects": [
    {
      "id": "uuid",
      "name": "ریاضی",
      "code": "MATH101",
      "description": "ریاضیات پایه دهم",
      "teacher_count": 3,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/principal/subjects`

Creates a new subject.

**Request Body:**

```json
{
  "name": "ریاضی",
  "code": "MATH101",
  "description": "ریاضیات پایه دهم"
}
```

**Validation:**

- Subject name is required
- Subject name must be unique within the school
- Subject code must be unique (if provided)

**Response:**

```json
{
  "success": true,
  "message": "درس با موفقیت ایجاد شد",
  "subject": {
    "id": "uuid",
    "name": "ریاضی",
    "code": "MATH101"
  }
}
```

### DELETE `/api/principal/subjects/{id}`

Deletes a subject.

**Validation:**

- Subject must belong to the principal's school
- Cannot delete if assigned to any teachers

**Response:**

```json
{
  "success": true,
  "message": "درس با موفقیت حذف شد"
}
```

## Database Schema

### subjects Table

```sql
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name),
  UNIQUE (school_id, code)
);
```

### Relationships

- **One-to-Many**: School → Subjects
- **Many-to-Many**: Teachers ↔ Subjects (via teacher profile)
- **Many-to-One**: Teacher Assignment → Subject (in classes)

## Business Rules

### Subject Creation

✅ Subject name is **required**
✅ Subject name must be **unique** within the school
✅ Subject code must be **unique** within the school (if provided)
✅ Only principals can create subjects for their school

### Subject Deletion

✅ Subject must not be assigned to any teachers
✅ Subject must not be used in any teacher assignments
❌ Cannot delete subject if it has active assignments

### Teacher Assignment

✅ Teachers can be assigned to **multiple subjects**
✅ In a class, each teacher teaches **one subject**
✅ Multiple teachers can teach **different subjects** in the same class

## Workflow Examples

### Example 1: Creating a Subject

1. Principal navigates to `/dashboard/principal/subjects`
2. Clicks **"درس جدید"** (New Subject)
3. Fills in:
   - Name: "ریاضی"
   - Code: "MATH101"
   - Description: "ریاضیات پایه دهم"
4. Clicks **"ایجاد درس"** (Create Subject)
5. ✅ Subject is created and appears in the list

### Example 2: Assigning Subject to Teacher

1. Principal navigates to `/dashboard/principal/teachers`
2. Clicks **"افزودن معلم"** (Add Teacher)
3. Fills in teacher details
4. Selects subjects from checkboxes (e.g., ریاضی, فیزیک)
5. ✅ Teacher can now teach those subjects

### Example 3: Using Subjects in Classes

1. Principal creates a class
2. Adds teacher assignments:
   - Teacher: "محمد رضایی" → Subject: "ریاضی"
   - Teacher: "علی احمدی" → Subject: "فیزیک"
3. ✅ Each teacher has a specific subject in that class

## File Structure

```
eduhelper/
├── src/app/
│   ├── dashboard/principal/
│   │   ├── subjects/
│   │   │   └── page.tsx          # Subject management page
│   │   ├── teachers/
│   │   │   └── page.tsx          # Teachers page (with subject assignment)
│   │   ├── classes/
│   │   │   └── page.tsx          # Classes page (with teacher-subject assignment)
│   │   └── layout.tsx            # Navigation with subjects link
│   └── api/principal/
│       └── subjects/
│           ├── route.ts          # GET & POST endpoints
│           └── [id]/
│               └── route.ts      # DELETE endpoint
```

## Navigation

### Principal Sidebar

The subjects link is available in the principal dashboard sidebar:

- **Icon**: 📚 BookOpen
- **Label**: "دروس"
- **Route**: `/dashboard/principal/subjects`
- **Position**: Second item (after Dashboard)

## Error Handling

### Common Errors

#### Subject Creation

1. **"نام درس الزامی است"**: Subject name is required
2. **"درس با این نام قبلاً ثبت شده است"**: Duplicate subject name
3. **"کد درس قبلاً استفاده شده است"**: Duplicate subject code

#### Subject Deletion

1. **"این درس به معلمانی اختصاص داده شده است"**: Subject has active teacher assignments
2. **"درس یافت نشد یا متعلق به این مدرسه نیست"**: Subject not found or access denied

## Validation Rules

### Subject Name

- ✅ Required field
- ✅ Must be unique within school
- ✅ Trimmed automatically
- ❌ Cannot be empty

### Subject Code

- ⚪ Optional field
- ✅ Must be unique within school (if provided)
- ✅ Case-sensitive
- ⚪ Can be empty

### Subject Description

- ⚪ Optional field
- ⚪ No length restrictions
- ⚪ Can contain any text

## Integration with Other Features

### With Teachers

- Teachers can have multiple subjects assigned
- Subjects appear on teacher profile
- Used for filtering and organization

### With Classes

- Each class can have multiple subjects
- Each subject is taught by one teacher in a class
- Teacher-subject pairs are stored in `teacher_assignments`

### With Exams (Future)

- Exams will be linked to subjects
- Subject-based gradebooks
- Subject performance analytics

## Testing Checklist

- [ ] Create a new subject
- [ ] Create subject with duplicate name (should fail)
- [ ] Create subject with duplicate code (should fail)
- [ ] View subject list
- [ ] Search for subjects
- [ ] Delete subject with no assignments
- [ ] Try to delete subject with assignments (should fail)
- [ ] Assign subjects to teacher
- [ ] Use subjects in class creation
- [ ] Test on mobile devices
- [ ] Test with different themes

## Future Enhancements

### Planned Features

- [ ] Edit existing subjects
- [ ] Subject categories (e.g., Science, Math, Arts)
- [ ] Subject prerequisites
- [ ] Subject-specific settings
- [ ] Bulk import subjects
- [ ] Subject templates

### Potential Improvements

- [ ] Subject icons/colors
- [ ] Subject schedules
- [ ] Credit hours per subject
- [ ] Subject materials library
- [ ] Subject performance analytics

## Sample Data

### Common Persian Subjects

```
ریاضی (Mathematics)
فیزیک (Physics)
شیمی (Chemistry)
زیست‌شناسی (Biology)
زبان فارسی (Persian Language)
زبان انگلیسی (English Language)
عربی (Arabic)
تاریخ (History)
جغرافیا (Geography)
علوم اجتماعی (Social Studies)
تربیت بدنی (Physical Education)
هنر (Art)
موسیقی (Music)
کامپیوتر (Computer Science)
دین و زندگی (Religious Studies)
```

## Notes

- All forms support Persian (RTL) language
- Subject codes are typically in English (e.g., MATH101)
- Teacher assignments in classes are separate from teacher subject qualifications
- A teacher qualified to teach multiple subjects can only teach one subject per class
- Database uses UUID for all IDs
- All timestamps are in UTC

## Security

### Authorization

- Only principals can manage subjects
- Subjects are school-specific (isolated by school_id)
- Session validation on all endpoints

### Data Integrity

- Unique constraints prevent duplicates
- Foreign key constraints maintain relationships
- Soft delete capability (removed_at field in teacher_assignments)

## Performance Considerations

- Teacher count is calculated via JOIN in the GET query
- Indexes on school_id for fast filtering
- Unique indexes on (school_id, name) and (school_id, code)
- Connection pooling for database efficiency
