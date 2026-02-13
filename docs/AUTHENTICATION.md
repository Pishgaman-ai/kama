# Phone-Based OTP Authentication System

## Overview

This system implements a modern authentication solution with multiple login methods:

- **Phone OTP**: For administrators, teachers, and parents (مدیر، معلم و اولیا)
- **National ID**: For students (دانش‌آموزان)
- **Email**: Legacy method for backward compatibility

## Architecture

### 1. Database Schema

#### Users Table Updates

- Added `phone` column (VARCHAR(20) UNIQUE) for phone-based authentication
- Made `email` and `password_hash` nullable to support OTP-only users
- Existing `national_id` field used for student authentication

#### OTP Tokens Table

```sql
CREATE TABLE otp_tokens (
  id UUID PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. SMS Service (`src/lib/smsService.ts`)

Supports multiple Iranian SMS providers:

- **Kavenegar** (recommended)
- **Faraz SMS (IPPanel)**
- **Melipayamak**

#### Configuration (Environment Variables)

```env
# SMS Provider Configuration
SMS_PROVIDER=kavenegar          # Options: kavenegar, farazsms, melipayamak
SMS_API_KEY=your_api_key_here
SMS_SENDER=10008663             # Your SMS sender number

# For Melipayamak (requires username/password)
SMS_USERNAME=your_username
SMS_PASSWORD=your_password
```

#### Development Mode

When SMS is not configured, the system logs OTP codes to the console for testing:

```
📱 SMS not configured. OTP code for development: 123456
   Phone: 09123456789
   Code: 123456
```

### 3. Authentication Library (`src/lib/auth.ts`)

#### New Functions

**sendOTPToPhone(phone: string)**

- Validates Iranian phone number format (09XXXXXXXXX)
- Generates 6-digit OTP code
- Stores OTP in database with 5-minute expiration
- Sends SMS via configured provider
- Returns: `{ success, error?, expiresAt? }`

**verifyOTPAndSignIn(phone: string, otpCode: string)**

- Validates OTP code
- Checks expiration and attempt limits (max 3 attempts)
- Signs in user and creates session
- Returns: `{ success, user?, error? }`

**signInWithNationalID(nationalId: string, password: string)**

- Validates 10-digit national ID
- Authenticates with password
- Returns: `{ success, user?, error? }`

### 4. API Endpoints

#### POST `/api/auth/send-otp`

Request:

```json
{
  "phone": "09123456789"
}
```

Response:

```json
{
  "success": true,
  "message": "کد تایید به شماره موبایل شما ارسال شد",
  "expiresAt": "2025-10-11T12:35:00Z"
}
```

#### POST `/api/auth/verify-otp`

Request:

```json
{
  "phone": "09123456789",
  "otpCode": "123456"
}
```

Response:

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "phone": "09123456789",
    "name": "نام کاربر",
    "role": "teacher"
  }
}
```

#### POST `/api/auth/signin-national-id`

Request:

```json
{
  "nationalId": "1234567890",
  "password": "student_password"
}
```

Response:

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "nationalId": "1234567890",
    "name": "نام دانش‌آموز",
    "role": "student"
  }
}
```

### 5. User Interface

The signin page (`src/app/(auth)/signin/page.tsx`) features:

- **Three-tab interface**: Phone OTP / National ID / Email
- **Two-step OTP flow**:
  1. Enter phone number → Send OTP
  2. Enter OTP code → Verify and sign in
- **Countdown timer**: 2-minute countdown for OTP resend
- **Real-time validation**: Phone and national ID format validation
- **Responsive design**: Works on mobile and desktop
- **Dark mode support**: Adapts to theme preferences

## User Flows

### Teacher/Parent/Admin Login (Phone OTP)

1. Click "مدیر / معلم / ولی" tab
2. Enter phone number (e.g., 09123456789)
3. Click "ارسال کد تایید" (Send OTP)
4. Receive SMS with 6-digit code
5. Enter OTP code
6. Click "ورود به حساب کاربری" (Sign In)
7. Redirect to dashboard

### Student Login (National ID)

1. Click "دانش‌آموز" tab
2. Enter 10-digit national ID
3. Enter password
4. Click "ورود به حساب کاربری" (Sign In)
5. Redirect to dashboard

## Security Features

### OTP Security

- **6-digit random codes**: Generated using secure random number generation
- **5-minute expiration**: Codes expire after 5 minutes
- **3 attempt limit**: Prevents brute force attacks
- **One-time use**: Codes are marked as verified after successful use
- **Phone number validation**: Iranian mobile format (09XXXXXXXXX)

### National ID Security

- **Password hashing**: bcrypt with 12 rounds
- **10-digit validation**: Ensures valid Iranian national ID format
- **Secure comparison**: Constant-time comparison prevents timing attacks

## Setup Instructions

### 1. Database Migration

Run the database migration to add new tables and columns:

```bash
npm run dev  # The app will auto-migrate on first run
```

Or manually:

```bash
curl http://localhost:3000/api/init-database
```

### 2. Configure SMS Provider

#### Option A: Kavenegar (Recommended)

1. Sign up at https://panel.kavenegar.com
2. Get your API key from the dashboard
3. Add to `.env.local`:

```env
SMS_PROVIDER=kavenegar
SMS_API_KEY=your_kavenegar_api_key
SMS_SENDER=10008663
```

#### Option B: Faraz SMS (IPPanel)

1. Sign up at https://ippanel.com
2. Get your API key
3. Add to `.env.local`:

```env
SMS_PROVIDER=farazsms
SMS_API_KEY=your_farazsms_api_key
SMS_SENDER=+983000505
```

#### Option C: Melipayamak

1. Sign up at https://panel.payamak-panel.com
2. Get your username and password
3. Add to `.env.local`:

```env
SMS_PROVIDER=melipayamak
SMS_USERNAME=your_username
SMS_PASSWORD=your_password
SMS_SENDER=50004001400140
```

### 3. Create Test Users

#### Create Teacher with Phone

```sql
INSERT INTO users (phone, name, role, is_active, school_id)
VALUES ('09123456789', 'احمد محمدی', 'teacher', true, 'school_uuid_here');
```

#### Create Student with National ID

```sql
INSERT INTO users (national_id, password_hash, name, role, is_active, school_id)
VALUES (
  '1234567890',
  '$2a$12$hashed_password_here',  -- Use bcrypt to hash password
  'علی احمدی',
  'student',
  true,
  'school_uuid_here'
);
```

### 4. Test the System

#### Development Mode (No SMS)

1. Start the app: `npm run dev`
2. Go to http://localhost:3000/signin
3. Enter phone number
4. Check console for OTP code
5. Enter the OTP code and sign in

#### Production Mode (With SMS)

1. Configure SMS provider (see above)
2. Test SMS sending
3. Users will receive real SMS messages

## Phone Number Format

The system supports multiple formats and normalizes them:

- `09123456789` → `09123456789` ✅
- `+989123456789` → `09123456789` ✅
- `989123456789` → `09123456789` ✅
- `9123456789` → Invalid ❌

## Error Handling

### Common Errors

- **"کاربری با این شماره موبایل یافت نشد"**: User not registered
- **"کد تایید نادرست است"**: Wrong OTP code
- **"کد تایید منقضی شده است"**: OTP expired (>5 minutes)
- **"تعداد تلاش‌های مجاز تمام شده است"**: Too many failed attempts
- **"کد ملی باید 10 رقم باشد"**: Invalid national ID format
- **"خطایی در ارسال پیامک رخ داد"**: SMS sending failed

### Retry Logic

- OTP can be resent after 2 minutes
- Previous OTP is invalidated when new one is requested
- 3 attempts per OTP code

## Future Enhancements

1. **Multi-factor authentication**: Combine phone + password for higher security
2. **SMS templates**: Customizable SMS messages per school
3. **Rate limiting**: Prevent SMS spam and abuse
4. **Phone verification**: Verify phone ownership before registration
5. **Backup codes**: Allow recovery if phone is lost
6. **Session management**: Better JWT/session token handling
7. **Audit logging**: Track all authentication attempts

## Troubleshooting

### OTP not received

1. Check phone number format
2. Verify SMS provider configuration
3. Check SMS provider balance/quota
4. Look for errors in server logs
5. Try development mode (console logs)

### Cannot sign in with National ID

1. Verify user exists in database
2. Check password_hash is set
3. Verify national_id is exactly 10 digits
4. Try resetting password

### Database errors

1. Run migration: `curl http://localhost:3000/api/init-database`
2. Check PostgreSQL connection
3. Verify environment variables
4. Check database logs

## Support

For issues or questions:

1. Check server logs: `npm run dev`
2. Check browser console for errors
3. Verify environment variables
4. Test SMS provider separately
5. Check database schema

## License

This authentication system is part of the kama MVP project.
