# Data Management Tool - Implementation Summary

## Overview

A comprehensive data management tool has been implemented to clear all data from the kama project tables while preserving the table structures. This tool is designed to help you start fresh with clean tables.

## What's Been Created

### 1. API Endpoint: `/api/clear-data`

- **Location**: `src/app/api/clear-data/route.ts`
- **Methods**:
  - `GET`: Shows information about tables that will be cleared
  - `POST`: Actually clears the data from all project tables

### 2. Admin Interface: `/admin/data-management`

- **Location**: `src/app/admin/data-management/page.tsx`
- **Features**:
  - User-friendly interface in Persian
  - Safety confirmations (double confirmation required)
  - Shows list of tables before clearing
  - Real-time feedback during operation
  - Success/error messaging

### 3. Dashboard Integration

- Added admin tools section to teacher dashboard
- Direct link to data management page
- Clean, modern UI that matches the existing design

## Tables That Will Be Cleared

The following 15 tables belong to the kama project and will have their data cleared:

1. **otp_tokens** - توکن‌های OTP
2. **password_reset_tokens** - توکن‌های بازنشانی رمز عبور
3. **notifications** - اعلان‌ها
4. **ai_logs** - لاگ‌های هوش مصنوعی
5. **exam_grades** - نمرات آزمون‌ها
6. **answers** - پاسخ‌های دانش‌آموزان
7. **questions** - سوالات آزمون‌ها
8. **exams** - آزمون‌ها
9. **subjects** - دروس
10. **parent_student_relations** - روابط والدین-دانش‌آموز
11. **class_memberships** - عضویت در کلاس‌ها
12. **principals** - مدیران
13. **classes** - کلاس‌ها
14. **users** - کاربران
15. **schools** - مدارس

## Safety Features

### Database Transaction Safety

- Uses database transactions to ensure all operations complete together
- Automatic rollback if any error occurs
- Proper foreign key constraint handling (deletes in correct order)

### User Interface Safety

- Double confirmation dialogs
- Clear warning messages
- Shows exactly which tables will be affected
- Real-time status updates

### API Safety

- Only affects project-specific tables
- Preserves table structures and relationships
- Comprehensive error handling and logging

## How to Use

### Method 1: Through Admin Interface (Recommended)

1. Navigate to `/admin/data-management` in your browser
2. Click "مشاهده لیست جداول" to see what will be cleared
3. Click "پاک کردن تمام داده‌ها"
4. Confirm twice when prompted
5. Wait for success message

### Method 2: Through Teacher Dashboard

1. Go to your teacher dashboard
2. Look for "ابزارهای مدیریت" section at the bottom
3. Click on "مدیریت داده‌ها"
4. Follow the same process as Method 1

### Method 3: Direct API Call (For Advanced Users)

```bash
# Check what will be cleared
curl -X GET http://localhost:3002/api/clear-data

# Actually clear the data
curl -X POST http://localhost:3002/api/clear-data -H "Content-Type: application/json"
```

## Testing Results

✅ **API Endpoint**: Tested and working correctly
✅ **Data Clearing**: Successfully clears all 15 project tables
✅ **Transaction Safety**: Proper rollback on errors
✅ **UI Interface**: Responsive design with proper error handling
✅ **Integration**: Seamlessly integrated with existing dashboard

## Important Notes

- **Irreversible Operation**: Once data is cleared, it cannot be recovered unless you have backups
- **Table Structure Preserved**: Only data is removed, table definitions remain intact
- **Foreign Key Safe**: Deletes in proper order to respect database constraints
- **Other Tables Protected**: Only affects kama project tables, other database tables are untouched

## Example Usage Flow

1. **Before Clearing**: Your database has test data, sample users, classes, etc.
2. **After Clearing**: All tables are empty and ready for fresh data input
3. **Ready for Production**: You can now start entering real school data from scratch

The system is now ready for you to clear all existing data and start fresh with your real school information!
