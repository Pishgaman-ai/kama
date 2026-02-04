# Principal Management System - Fixed Issue

## Issue Description

When admins added a principal (مدیر) to a school through the admin interface, the information was only being saved to the `principals` table but not to the `users` table. This meant that principals couldn't log in to the system.

## Root Cause

The API endpoint `/api/admin/schools/[id]/principals` was only creating records in the `principals` table without creating corresponding user accounts.

## Solution Implemented

### 1. Updated API Endpoint

**File**: `src/app/api/admin/schools/[id]/principals/route.ts`

The `POST` method has been enhanced with the following improvements:

#### Database Transaction Safety

- Added database transactions (`BEGIN`/`COMMIT`/`ROLLBACK`)
- Ensures both principal and user records are created together
- Automatic rollback if any step fails

#### Dual Record Creation

```sql
-- Creates user account first
INSERT INTO users (school_id, phone, name, role, profile, is_active)
VALUES ($1, $2, $3, 'principal', '{"position": "principal"}'::jsonb, true)

-- Then creates principal record
INSERT INTO principals (school_id, name, phone, is_active)
VALUES ($1, $2, $3, true)
```

#### Enhanced Validation

- Validates phone number format (Iranian mobile: 09xxxxxxxxx)
- Checks for duplicate phone numbers
- Proper error handling with descriptive Persian messages

### 2. Updated User Interface

**File**: `src/app/admin/schools/[id]/principals/page.tsx`

#### Enhanced Success Messages

- Updated success message to inform admins that both records were created
- Extended timeout to give users time to read the message
- Clear indication that a user account was created for login

#### Accessibility Improvements

- Added `title` attributes to buttons for screen readers
- Better error handling and user feedback

## How It Works Now

### When Admin Creates a Principal:

1. **Input Validation**: Name and phone number are validated
2. **Phone Format Check**: Ensures Iranian mobile format (09xxxxxxxxx)
3. **Duplicate Check**: Verifies phone number isn't already used
4. **Transaction Start**: Database transaction begins
5. **User Account Creation**: Creates user with role 'principal'
6. **Principal Record Creation**: Creates principal record linked to school
7. **Transaction Commit**: Both records saved successfully
8. **Success Response**: Returns both principal and user data

### Database Schema:

#### Users Table

```sql
users (
  id UUID PRIMARY KEY,
  school_id UUID REFERENCES schools(id),
  phone VARCHAR(20) UNIQUE,    -- Used for login
  name VARCHAR(255),
  role user_role DEFAULT 'principal',
  profile JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### Principals Table

```sql
principals (
  id UUID PRIMARY KEY,
  school_id UUID REFERENCES schools(id),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,   -- Links to user account
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## Principal Login Process

Once created, principals can log in using:

- **Phone Number**: The mobile number provided during creation
- **Authentication Method**: OTP-based login (no password required)

The system will:

1. Verify phone number exists in users table
2. Send OTP to the phone number
3. Validate role is 'principal'
4. Grant access to principal dashboard

## Testing

### Manual Testing Steps:

1. Log in as admin
2. Navigate to Schools → Select School → Principals
3. Click "Add Principal"
4. Fill in name and phone number
5. Submit form
6. Verify success message mentions user account creation
7. Check database: both `users` and `principals` tables should have new records

### Expected Results:

- ✅ Principal record created in `principals` table
- ✅ User account created in `users` table with role 'principal'
- ✅ Both records linked via school_id and phone number
- ✅ Principal can now log in using phone number + OTP

## Error Handling

### Common Error Scenarios:

1. **Duplicate Phone**: Clear error message if phone number already exists
2. **Invalid Format**: Validation error for non-Iranian mobile numbers
3. **Database Failure**: Transaction rollback ensures no partial data
4. **Network Issues**: Proper error messages displayed to user

## Security Features

### Input Validation:

- Phone number format validation
- SQL injection prevention via parameterized queries
- Admin authentication required
- Role-based access control

### Data Integrity:

- Database transactions ensure consistency
- Foreign key constraints maintain relationships
- Unique constraints prevent duplicates

## Migration Notes

### For Existing Principals:

If you have existing principals in the database who don't have user accounts, you may need to:

1. Run a migration script to create user accounts for existing principals
2. Or delete existing principals and recreate them through the admin interface

### Recommended Action:

Use the data clearing tool (`/admin/data-management`) to start fresh, then recreate all principals through the admin interface to ensure proper user accounts are created.

## Summary

The issue has been completely resolved. Principals created through the admin interface now have:

- ✅ Principal record for school management
- ✅ User account for system login
- ✅ Proper error handling and validation
- ✅ Enhanced user experience with informative messages

The system now correctly creates both records in a single atomic operation, ensuring data consistency and enabling principals to log in to the system successfully.
