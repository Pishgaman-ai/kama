# Test Authentication System

This guide will help you test the new phone-based OTP authentication system.

## Prerequisites

- Database is initialized
- Development server is running (`npm run dev`)

## Test Scenario 1: Phone OTP Login (Admin/Teacher/Parent)

### Step 1: Create Test User

```sql
-- Connect to your PostgreSQL database
-- You can create admin, teacher, or parent user - all use phone OTP

-- Create Admin User
INSERT INTO users (
  id,
  school_id,
  phone,
  name,
  role,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM schools LIMIT 1),  -- Use existing school
  '09121111111',
  'مدیر تست',
  'school_admin',
  true,
  NOW()
);

-- Create Teacher User
INSERT INTO users (
  id,
  school_id,
  phone,
  name,
  role,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM schools LIMIT 1),
  '09123456789',
  'معلم تست',
  'teacher',
  true,
  NOW()
);

-- Create Parent User
INSERT INTO users (
  id,
  school_id,
  phone,
  name,
  role,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM schools LIMIT 1),
  '09129999999',
  'ولی تست',
  'parent',
  true,
  NOW()
);
```

### Step 2: Test OTP Flow

1. Navigate to http://localhost:3000/signin
2. Click on "📱 مدیر / معلم / ولی" tab
3. Enter phone number: `09123456789` (or any of the created users)
4. Click "ارسال کد تایید"
5. Check console output for OTP code (in development mode):
   ```
   📱 SMS not configured. OTP code for development: 123456
      Phone: 09123456789
      Code: 123456
   ```
6. Enter the 6-digit OTP code
7. Click "ورود به حساب کاربری"
8. Should redirect to `/dashboard`

### Expected Results

✅ Phone number accepts only 11 digits starting with 09
✅ OTP code is logged to console
✅ OTP expires after 5 minutes
✅ Maximum 3 attempts per OTP
✅ Countdown timer shows 2:00 and counts down
✅ User can request new OTP after timer expires

## Test Scenario 2: National ID Login (Student)

### Step 1: Create Test Student

```sql
-- First, hash a password (use bcrypt with 12 rounds)
-- For testing, you can use password '123456'
-- Hashed: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eo5x0qEaLCmG

INSERT INTO users (
  id,
  school_id,
  national_id,
  password_hash,
  name,
  role,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM schools LIMIT 1),
  '1234567890',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eo5x0qEaLCmG',
  'دانش‌آموز تست',
  'student',
  true,
  NOW()
);
```

### Step 2: Test National ID Login

1. Navigate to http://localhost:3000/signin
2. Click on "🎓 دانش‌آموز" tab
3. Enter national ID: `1234567890`
4. Enter password: `123456`
5. Click "ورود به حساب کاربری"
6. Should redirect to `/dashboard`

### Expected Results

✅ National ID field accepts only 10 digits
✅ Password field has show/hide toggle
✅ Login succeeds with correct credentials
✅ Error message shows for wrong password
✅ Error message shows for invalid national ID format

## Test Scenario 3: Email Login (Legacy/Admin)

### Step 1: Create Test Admin

```
INSERT INTO users (
  id,
  school_id,
  email,
  password_hash,
  name,
  role,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM schools LIMIT 1),
  'admin@test.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eo5x0qEaLCmG',
  'مدیر تست',
  'school_admin',
  true,
  NOW()
);
```

### Step 2: Test Email Login

1. Navigate to http://localhost:3000/signin
2. Click on "✉️ ایمیل" tab
3. Enter email: `admin@test.com`
4. Enter password: `123456`
5. Click "ورود به حساب کاربری"
6. Should redirect to `/dashboard`

### Expected Results

✅ Email field validates email format
✅ Password field has show/hide toggle
✅ "فراموشی رمز عبور" link is visible
✅ Login succeeds with correct credentials

## API Testing with curl

### Test Send OTP

```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789"}'
```

Expected Response:

```json
{
  "success": true,
  "message": "کد تایید به شماره موبایل شما ارسال شد",
  "expiresAt": "2025-10-11T12:35:00Z"
}
```

### Test Verify OTP

```bash
# Replace with the OTP from console logs
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789","otpCode":"123456"}'
```

Expected Response:

```json
{
  "success": true,
  "user": {
    "id": "...",
    "phone": "09123456789",
    "name": "معلم تست",
    "role": "teacher"
  }
}
```

### Test National ID Sign In

```bash
curl -X POST http://localhost:3000/api/auth/signin-national-id \
  -H "Content-Type: application/json" \
  -d '{"nationalId":"1234567890","password":"123456"}'
```

Expected Response:

```json
{
  "success": true,
  "user": {
    "id": "...",
    "national_id": "1234567890",
    "name": "دانش‌آموز تست",
    "role": "student"
  }
}
```

## Testing with SMS Provider

### Configure SMS Provider

1. Choose a provider (Kavenegar recommended)
2. Sign up and get API key
3. Add to `.env.local`:
   ```env
   SMS_PROVIDER=kavenegar
   SMS_API_KEY=your_api_key_here
   SMS_SENDER=10008663
   ```
4. Restart server
5. Test OTP - you should receive real SMS

### Test SMS with Kavenegar

```bash
# Test Kavenegar API directly
curl "https://api.kavenegar.com/v1/YOUR_API_KEY/sms/send.json" \
  -d "receptor=09123456789" \
  -d "message=Test message from EduHelper" \
  -d "sender=10008663"
```

## Error Testing

### Test Invalid Phone Number

```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"12345"}'
```

Expected: `{"error":"شماره موبایل نامعتبر است"}`

### Test Invalid OTP

```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789","otpCode":"000000"}'
```

Expected: `{"error":"کد تایید نادرست است"}`

### Test Expired OTP

1. Send OTP
2. Wait 6 minutes
3. Try to verify
   Expected: `{"error":"کد تایید منقضی شده است"}`

### Test Max Attempts

1. Send OTP
2. Try wrong code 3 times
   Expected: `{"error":"تعداد تلاش‌های مجاز تمام شده است. لطفاً کد جدید درخواست کنید"}`

## UI/UX Testing

### Test Tab Switching

- ✅ Switch between all three tabs
- ✅ Form clears when switching tabs
- ✅ Error messages clear when switching

### Test Responsive Design

- ✅ Test on mobile (375px width)
- ✅ Test on tablet (768px width)
- ✅ Test on desktop (1920px width)
- ✅ All elements should be readable and clickable

### Test Dark Mode

- ✅ Toggle dark mode
- ✅ All text should be readable
- ✅ Forms should have proper contrast
- ✅ Buttons should be visible

### Test Accessibility

- ✅ Tab navigation works
- ✅ Focus indicators visible
- ✅ Labels associated with inputs
- ✅ Error messages are announced

## Performance Testing

### Test OTP Generation Speed

```bash
time curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789"}'
```

Expected: < 500ms

### Test Concurrent Requests

```bash
# Send 10 concurrent OTP requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phone":"09123456789"}' &
done
wait
```

## Database Verification

### Check OTP Token Creation

```sql
SELECT * FROM otp_tokens
WHERE phone = '09123456789'
ORDER BY created_at DESC
LIMIT 5;
```

### Check User Login Timestamp

```sql
SELECT id, name, phone, national_id, last_login
FROM users
WHERE phone = '09123456789'
OR national_id = '1234567890';
```

### Check Session Creation

```sql
-- If you have a sessions table
SELECT * FROM sessions
WHERE user_id IN (
  SELECT id FROM users
  WHERE phone = '09123456789'
)
ORDER BY created_at DESC;
```

## Cleanup After Testing

### Remove Test Users

```sql
DELETE FROM users WHERE phone = '09123456789';
DELETE FROM users WHERE national_id = '1234567890';
DELETE FROM users WHERE email = 'admin@test.com';
```

### Remove Test OTP Tokens

```sql
DELETE FROM otp_tokens WHERE phone = '09123456789';
```

## Checklist

- [ ] Database migrations applied successfully
- [ ] Phone OTP flow works end-to-end
- [ ] National ID login works
- [ ] Email login works (legacy)
- [ ] Tab switching works smoothly
- [ ] Form validation works correctly
- [ ] Error messages are clear and in Persian
- [ ] Success messages appear
- [ ] Countdown timer works
- [ ] OTP resend works
- [ ] Password show/hide toggle works
- [ ] Responsive design looks good
- [ ] Dark mode works
- [ ] API endpoints return correct responses
- [ ] Database records are created correctly
- [ ] Session/cookies are set properly
- [ ] Redirects to dashboard after login

## Common Issues

### OTP not appearing in console

- Check that `SMS_PROVIDER` is NOT set in `.env.local`
- Check server logs for errors
- Verify database connection

### Login doesn't redirect

- Check browser console for errors
- Verify session cookie is set
- Check `/dashboard` route exists

### Phone validation fails

- Use format: 09XXXXXXXXX (11 digits)
- Must start with 09
- No spaces or special characters

### National ID validation fails

- Must be exactly 10 digits
- Only numbers, no spaces

## Next Steps

After successful testing:

1. Configure production SMS provider
2. Set up proper session management
3. Add rate limiting for OTP requests
4. Implement auto-registration for new users
5. Add phone number verification
6. Set up monitoring and alerts

# Testing the User Management System

## Manual Testing Guide

### Prerequisites

1. Ensure the development server is running (`npm run dev`)
2. Make sure you have admin access to the system
3. Have a few test schools and users in the database

### Test Cases

#### 1. Accessing User Management

- [ ] Navigate to `/admin/users` and verify the page loads correctly
- [ ] Check that all users from all schools are displayed
- [ ] Verify that the navigation sidebar includes "مدیریت کاربران"

#### 2. Filtering and Searching

- [ ] Use the school filter to view users from a specific school
- [ ] Use the role filter to view users with a specific role
- [ ] Use the search box to find users by name, email, phone, or national ID
- [ ] Apply multiple filters simultaneously
- [ ] Clear filters using the "پاک کردن فیلترها" button

#### 3. Adding a New User

- [ ] Click the "کاربر جدید" button
- [ ] Fill in all required fields in the modal
- [ ] Select a school and role
- [ ] Set a password
- [ ] Click "افزودن کاربر" and verify the user is added to the list

#### 4. Editing a User

- [ ] Click the edit icon (✏️) next to any user
- [ ] Modify some fields in the modal
- [ ] Click "ذخیره تغییرات" and verify the changes are reflected in the list

#### 5. Resetting a User's Password

- [ ] Click the key icon (🔑) next to any user
- [ ] Enter a new password and confirm it
- [ ] Click "تغییر رمز عبور" and verify success message

#### 6. Viewing Sensitive Information

- [ ] Click the eye icon (👁️) next to the password field to toggle visibility
- [ ] Verify that email and national ID are always visible

#### 7. School-Specific User Management

- [ ] Navigate to `/admin/schools`
- [ ] Click on any school to view its users
- [ ] Verify that only users from that school are displayed
- [ ] Test all user management features in this context

### Expected Behaviors

#### Successful Operations

- All API calls should return 200 status codes
- Success messages should be displayed for all operations
- UI should update immediately after successful operations
- Pagination should work correctly with large datasets

#### Error Handling

- Unauthorized access should redirect to login page
- Invalid data should show appropriate error messages
- Duplicate user creation should be prevented
- Database errors should be logged and user-friendly messages displayed

### Common Issues to Watch For

1. **Authentication Issues**

   - Ensure admin session is valid
   - Check that cookies are being sent with requests

2. **Data Validation**

   - Required fields should be validated
   - Password strength requirements should be enforced
   - Email format validation should work

3. **UI/UX Issues**

   - Loading states should be displayed during API calls
   - Error messages should be clear and helpful
   - Responsive design should work on all screen sizes

4. **Performance**
   - Large user lists should be paginated
   - Search and filter operations should be fast
   - No memory leaks in components

### API Endpoints to Test

1. `GET /api/admin/users` - Fetch all users
2. `POST /api/admin/users/create` - Create new user
3. `GET /api/admin/users/[id]` - Get specific user
4. `PUT /api/admin/users/[id]` - Update user
5. `DELETE /api/admin/users/[id]` - Delete user
6. `POST /api/admin/users/[id]/reset-password` - Reset password
7. `GET /api/admin/schools` - Fetch all schools
8. `GET /api/admin/schools/[id]` - Get specific school

### Database Considerations

- Verify that all database queries are parameterized to prevent SQL injection
- Check that foreign key relationships are properly maintained
- Ensure that cascading deletes are handled appropriately
- Verify that indexes exist for frequently queried fields
