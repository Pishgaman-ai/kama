# Login Methods Quick Reference

## Overview

The EduHelper system supports **three different login methods** based on user roles:

---

## 📱 Method 1: Phone OTP (شماره همراه + OTP)

### Who can use this?

- ✅ **Administrators** (مدیران مدرسه)
- ✅ **Teachers** (معلمان)
- ✅ **Parents** (اولیا)

### How it works:

1. User enters their phone number (09XXXXXXXXX)
2. System sends a 6-digit OTP code via SMS
3. User enters the OTP code
4. System verifies and logs them in

### Security Features:

- ✅ OTP expires after 5 minutes
- ✅ Maximum 3 attempts per code
- ✅ One-time use only
- ✅ 2-minute cooldown for resend

### User Interface:

```
┌─────────────────────────────────┐
│  📱 مدیر / معلم / ولی           │
│  🎓 دانش‌آموز                   │
│  ✉️ ایمیل                      │
└─────────────────────────────────┘
        ⬇️ Click first tab
┌─────────────────────────────────┐
│ شماره موبایل                    │
│ [09123456789        ]           │
│                                 │
│ کد تایید به این شماره ارسال    │
│ خواهد شد (مدیر، معلم یا ولی)    │
│                                 │
│ [ ارسال کد تایید ]              │
└─────────────────────────────────┘
        ⬇️ Receive SMS
┌─────────────────────────────────┐
│ کد تایید به شماره 09123456789  │
│ ارسال شد                        │
│                                 │
│ کد تایید                        │
│ [● ● ● ● ● ●]                   │
│                                 │
│ ارسال مجدد در 1:45             │
│                                 │
│ [ ورود به حساب کاربری ]         │
└─────────────────────────────────┘
```

---

## 🎓 Method 2: National ID (کد ملی + رمز عبور)

### Who can use this?

- ✅ **Students** (دانش‌آموزان)

### How it works:

1. Student enters their 10-digit national ID
2. Student enters their password
3. System verifies and logs them in

### Security Features:

- ✅ Password hashed with bcrypt (12 rounds)
- ✅ National ID format validation
- ✅ Secure password comparison

### User Interface:

```
┌─────────────────────────────────┐
│  📱 مدیر / معلم / ولی           │
│  🎓 دانش‌آموز                   │
│  ✉️ ایمیل                      │
└─────────────────────────────────┘
        ⬇️ Click second tab
┌─────────────────────────────────┐
│ کد ملی                          │
│ [1234567890     ]               │
│                                 │
│ رمز عبور                        │
│ [••••••••       ] 👁️           │
│                                 │
│ [ ورود به حساب کاربری ]         │
└─────────────────────────────────┘
```

---

## ✉️ Method 3: Email (ایمیل + رمز عبور)

### Who can use this?

- ✅ **Legacy users** (کاربران قدیمی)
- ✅ **Backup method** (روش پشتیبان)

### How it works:

1. User enters their email address
2. User enters their password
3. System verifies and logs them in

### User Interface:

```
┌─────────────────────────────────┐
│  📱 مدیر / معلم / ولی           │
│  🎓 دانش‌آموز                   │
│  ✉️ ایمیل                      │
└─────────────────────────────────┘
        ⬇️ Click third tab
┌─────────────────────────────────┐
│ ایمیل                           │
│ [you@example.com]               │
│                                 │
│ رمز عبور                        │
│ [••••••••       ] 👁️           │
│                                 │
│ [ ورود به حساب کاربری ]         │
│                                 │
│ فراموشی رمز عبور                │
└─────────────────────────────────┘
```

---

## Role-Based Access Summary

| User Role               | Primary Method | Alternative Method |
| ----------------------- | -------------- | ------------------ |
| **مدیر (Admin)**        | 📱 Phone OTP   | ✉️ Email           |
| **معلم (Teacher)**      | 📱 Phone OTP   | ✉️ Email           |
| **ولی (Parent)**        | 📱 Phone OTP   | ✉️ Email           |
| **دانش‌آموز (Student)** | 🎓 National ID | -                  |

---

## Setup Requirements

### For Phone OTP Users (Admin/Teacher/Parent):

```sql
-- User must have a phone number in the database
UPDATE users
SET phone = '09123456789'
WHERE id = 'user_id_here';
```

### For National ID Users (Students):

```sql
-- User must have national_id and password_hash
UPDATE users
SET
  national_id = '1234567890',
  password_hash = '$2a$12$hashed_password_here'
WHERE id = 'student_id_here';
```

### For Email Users (Legacy):

```sql
-- User must have email and password_hash
UPDATE users
SET
  email = 'user@example.com',
  password_hash = '$2a$12$hashed_password_here'
WHERE id = 'user_id_here';
```

---

## Common Questions

### Q: Can an admin use both Phone OTP and Email?

**A:** Yes! If a user has both `phone` and `email` set in the database, they can use either method to login.

### Q: Can a student use Phone OTP?

**A:** Currently, students are designed to use National ID login. However, if needed, you can add a phone number to their account and they can use the Phone OTP method.

### Q: What if I forget my phone number?

**A:** Contact your school administrator. They can check your phone number in the system or update it if needed.

### Q: What if the OTP doesn't arrive?

**A:**

1. Check if SMS provider is configured (production mode)
2. In development mode, check the server console logs
3. Wait for the 2-minute cooldown and request a new code
4. Verify your phone number is correct

### Q: Can I change my login method?

**A:** Yes! An administrator can add/update your phone number, email, or national ID in the database to enable different login methods.

---

## Development vs Production

### Development Mode (No SMS)

- OTP codes are logged to the console
- No real SMS is sent
- Perfect for testing

Example console output:

```
📱 SMS not configured. OTP code for development: 123456
   Phone: 09123456789
   Code: 123456
```

### Production Mode (Real SMS)

- OTP codes are sent via SMS provider
- User receives real text messages
- Requires SMS provider configuration

---

## Migration Guide

### Adding Phone Numbers to Existing Users

```sql
-- Add phone number to an admin
UPDATE users
SET phone = '09121111111'
WHERE email = 'admin@school.com';

-- Add phone number to a teacher
UPDATE users
SET phone = '09123456789'
WHERE email = 'teacher@school.com';

-- Add phone number to a parent
UPDATE users
SET phone = '09129999999'
WHERE email = 'parent@example.com';

-- Verify updates
SELECT id, name, role, phone, email, national_id
FROM users
WHERE phone IS NOT NULL;
```

### Adding National IDs to Students

```sql
-- Add national ID to a student (requires password hash)
UPDATE users
SET
  national_id = '1234567890',
  password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eo5x0qEaLCmG'
WHERE id = 'student_id_here';

-- Note: The above hash is for password '123456' - use a proper password in production!
```

---

## Security Best Practices

### For Phone OTP:

1. ✅ Never share OTP codes with anyone
2. ✅ OTP is valid for 5 minutes only
3. ✅ Request a new code if expired
4. ✅ Verify the phone number is yours

### For National ID Login:

1. ✅ Use a strong password
2. ✅ Don't share your password
3. ✅ Change password periodically
4. ✅ Don't use your national ID as password

### For Email Login:

1. ✅ Use a strong, unique password
2. ✅ Enable two-factor authentication if available
3. ✅ Don't share your credentials
4. ✅ Use the "Forgot Password" feature if needed

---

## Support

If you encounter any issues:

1. Check the [TESTING.md](./TESTING.md) file for troubleshooting
2. Verify your credentials with your school administrator
3. Check server logs for error messages
4. Ensure you're using the correct login method for your role

---

## Summary

✅ **Admins, Teachers, Parents**: Use Phone OTP (📱 مدیر / معلم / ولی)
✅ **Students**: Use National ID (🎓 دانش‌آموز)
✅ **Legacy/Backup**: Use Email (✉️ ایمیل)

**The system is flexible and secure, supporting multiple authentication methods to meet everyone's needs!** 🎉
