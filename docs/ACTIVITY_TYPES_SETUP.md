# Activity Types Feature - Quick Setup Guide

## Overview

This feature allows school principals to define and manage custom activity types for their school. All teacher and student activities will use these configured activity types.

## Quick Setup

### Step 1: Run Database Migration

Create the `activity_types` table:

```bash
npm run build
node scripts/db/add-activity-types-table.ts
```

This creates:
- `activity_types` table with all necessary fields
- Unique index on `(school_id, type_key)`
- Indexes for performance
- Updated_at trigger

### Step 2: Seed Default Activity Types

Populate default activity types for all existing schools:

```bash
node scripts/seed-default-activity-types.ts
```

This adds 7 default activity types to each school:
1. Midterm Exam (آزمون میان‌ترم)
2. Monthly Exam (آزمون ماهیانه)
3. Weekly Exam (آزمون هفتگی)
4. Final Exam (آزمون پایان ترم)
5. Class Activity (فعالیت کلاسی)
6. Class Homework (تکلیف کلاسی)
7. Home Homework (تکلیف منزل)

### Step 3: Verify Installation

1. Log in as a principal
2. Navigate to "انواع فعالیت" (Activity Types) in the sidebar
3. You should see the 7 default activity types
4. Try adding a new activity type

## What's Included

### Database Schema

```sql
activity_types (
  id UUID PRIMARY KEY,
  school_id UUID NOT NULL,
  type_key VARCHAR(100) NOT NULL,
  persian_name VARCHAR(255) NOT NULL,
  requires_quantitative_score BOOLEAN DEFAULT true,
  requires_qualitative_evaluation BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### API Endpoints

**Principal APIs:**
- `GET /api/principal/activity-types` - List all activity types
- `POST /api/principal/activity-types` - Create new activity type
- `GET /api/principal/activity-types/[id]` - Get single activity type
- `PUT /api/principal/activity-types/[id]` - Update activity type
- `DELETE /api/principal/activity-types/[id]` - Delete activity type

**Teacher APIs:**
- `GET /api/teacher/activity-types` - Get active activity types for dropdown

### UI Pages

- `/dashboard/principal/activity-types` - Management page for principals
- Teachers automatically see activity types in activity creation forms
- Bulk activities page uses dynamic activity types
- Import/Export uses dynamic type mapping

## Features

✅ School-specific activity types
✅ Configurable evaluation requirements (quantitative/qualitative)
✅ CRUD operations for principals
✅ Dynamic loading in all forms
✅ Import/Export integration
✅ Fallback to defaults if database unavailable
✅ Soft delete (deactivation)
✅ Custom display order

## Testing

### Test Principal Management

1. Login as principal
2. Go to Activity Types page
3. Add a new type: "Photo Activity"
4. Edit it to change the name
5. Toggle active/inactive
6. Try to delete (should work if not used in activities)

### Test Teacher Integration

1. Login as teacher
2. Create new activity for a student
3. Check activity type dropdown shows school's types
4. Select a type that requires qualitative evaluation
5. Verify qualitative field appears

### Test Import/Export

1. Export activities to Excel
2. Check activity types are in Persian
3. Import the same file back
4. Verify it works with custom activity types

## Migration Notes

### For New Schools

When creating a new school, run:
```bash
node scripts/seed-default-activity-types.ts
```

This will automatically seed the default types for any new schools.

### For Existing Schools

The seed script automatically:
- Detects all existing schools
- Adds default activity types to each
- Skips types that already exist
- Shows summary of changes

## Troubleshooting

### Activity types not showing in dropdown

1. Check if teacher's school has activity types:
   ```sql
   SELECT * FROM activity_types WHERE school_id = 'school-uuid';
   ```

2. Check if activity types are active:
   ```sql
   SELECT * FROM activity_types WHERE school_id = 'school-uuid' AND is_active = true;
   ```

3. Check browser console for API errors

### Cannot delete activity type

This is expected if the activity type is being used in any educational activities. Instead:
1. Deactivate it using the toggle
2. It will be hidden from new activities but existing ones remain intact

### Import fails with custom activity types

Make sure:
1. Excel file uses exact Persian names from your school's activity types
2. Activity types are active
3. Check error messages for specific rows

## File Structure

```
scripts/
├── db/
│   └── add-activity-types-table.ts       # Migration
└── seed-default-activity-types.ts         # Seed script

src/app/
├── api/
│   ├── principal/
│   │   ├── activity-types/
│   │   │   ├── route.ts                   # List & Create
│   │   │   └── [id]/route.ts              # Get, Update, Delete
│   │   └── activities/
│   │       ├── export/route.ts            # Updated with dynamic types
│   │       └── import/route.ts            # Updated with dynamic types
│   └── teacher/
│       ├── activity-types/
│       │   └── route.ts                   # Get active types
│       └── activities/
│           ├── export/route.ts            # Updated with dynamic types
│           └── import/route.ts            # Updated with dynamic types
└── dashboard/
    ├── principal/
    │   ├── activity-types/
    │   │   └── page.tsx                   # Management UI
    │   ├── bulk-activities/page.tsx       # Updated with dynamic types
    │   └── layout.tsx                     # Added menu item
    └── teacher/
        └── classes/[id]/
            ├── page.tsx                   # Updated with dynamic types
            └── types.ts                   # Updated ActivityType interface
```

## Next Steps

1. ✅ Database migration completed
2. ✅ Default types seeded
3. ✅ Test principal management UI
4. ✅ Test teacher activity creation
5. ✅ Test import/export functionality
6. ✅ Verify all schools have default types

## Support

For issues or questions:
- Check `ACTIVITY_TYPES_FEATURE.md` for detailed documentation
- Open an issue on GitHub
- Contact the development team

---

**Version:** 1.0.0
**Date:** December 29, 2025
**Status:** Ready for Production
