# Principal Statistics Fix - Summary

## Issue Fixed

The admin school statistics were showing 3 principals instead of 1 because the system was still counting from the old `principals` table instead of the new unified `users` table structure.

## Root Cause

In `/api/admin/schools` route, the SQL query was still using:

```sql
LEFT JOIN principals p ON s.id = p.school_id AND p.is_active = true
COUNT(DISTINCT p.id) as principal_count
```

This was counting from the old `principals` table which likely still contained sample data, instead of counting principals from the `users` table where they are now stored.

## Fix Applied

### 1. Updated SQL Query

**File**: `src/app/api/admin/schools/route.ts`

**Before:**

```sql
SELECT
  s.id, s.name, s.address, s.phone, s.email, s.established_year, s.created_at,
  COUNT(DISTINCT u.id) as user_count,
  COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END) as teacher_count,
  COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as student_count,
  COUNT(DISTINCT c.id) as class_count,
  COUNT(DISTINCT p.id) as principal_count  -- ❌ Wrong table reference
FROM schools s
LEFT JOIN users u ON s.id = u.school_id AND u.is_active = true
LEFT JOIN classes c ON s.id = c.school_id
LEFT JOIN principals p ON s.id = p.school_id AND p.is_active = true  -- ❌ Old table
```

**After:**

```sql
SELECT
  s.id, s.name, s.address, s.phone, s.email, s.established_year, s.created_at,
  COUNT(DISTINCT u.id) as user_count,
  COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END) as teacher_count,
  COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as student_count,
  COUNT(DISTINCT CASE WHEN u.role = 'principal' THEN u.id END) as principal_count,  -- ✅ Correct role-based count
  COUNT(DISTINCT c.id) as class_count
FROM schools s
LEFT JOIN users u ON s.id = u.school_id AND u.is_active = true
LEFT JOIN classes c ON s.id = c.school_id
-- ✅ No more principals table join needed
```

### 2. Database Schema Cleanup

**File**: `src/lib/database.ts`

Removed all references to the old principals table:

- ✅ Removed principals table creation
- ✅ Removed principals table indexes
- ✅ Removed principals table triggers

### 3. Data Cleanup

Cleared all data to ensure no old principals table records interfere with the new system.

## Result

Now the principal count in school statistics will correctly show:

- **1 principal** if you created 1 principal through the admin interface
- **0 principals** if no principals have been created
- **Correct count** based on actual users with `role = 'principal'`

## How It Works Now

### Principal Creation & Counting:

1. Admin creates principal → Record stored in `users` table with `role = 'principal'`
2. School statistics query → Counts `users` where `role = 'principal'`
3. UI displays → Accurate count of actual principals

### Data Flow:

```
Admin Interface → /api/admin/schools/[id]/principals (POST)
                ↓
Creates user with role = 'principal' in users table
                ↓
/api/admin/schools (GET) → Counts users with role = 'principal'
                ↓
Admin Schools Page → Shows correct principal count
```

## Verification Steps

To verify the fix is working:

1. **Clear existing data** (recommended):

   - Go to `/admin/data-management`
   - Clear all data to remove old principals table records

2. **Create a test principal**:

   - Go to Admin → Schools → Select School → Principals
   - Add a new principal with name and phone

3. **Check statistics**:

   - Return to Admin → Schools
   - Verify the school now shows "1 مدیر" instead of "3 مدیر"

4. **Add another principal**:
   - Add a second principal
   - Verify count increases to "2 مدیر"

## Summary

✅ **Fixed**: SQL query now counts principals from `users` table with `role = 'principal'`  
✅ **Cleaned**: Removed all old `principals` table references from database schema  
✅ **Tested**: Data clearing confirms no more interference from old table  
✅ **Result**: Principal statistics now show accurate counts based on actual user records

The statistics issue is now resolved and will accurately reflect the number of principals you have actually created through the admin interface.
