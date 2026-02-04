# 📧 Email Configuration Guide

Your password reset system is ready! You just need to configure email sending.

## 🚀 Quick Setup Options

### Option 1: Gmail (Recommended for testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings → Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Update .env.local**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-digit-app-password
   ```

### Option 2: Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Option 3: Custom SMTP Server

```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

## 🔧 Current Status

- ✅ **Email Service**: Implemented with Nodemailer
- ✅ **Email Templates**: Beautiful HTML templates ready
- ✅ **API Integration**: Forgot password API sends emails
- ⚠️ **Configuration**: Needs SMTP credentials in .env.local

## 🧪 Testing

### Without Email Configuration (Current):

- System works but shows reset URL in console
- Perfect for development and testing

### With Email Configuration:

- Users receive beautiful password reset emails
- Production-ready email system

## 📋 Email Template Features

- ✅ **RTL Support**: Right-to-left layout for Persian
- ✅ **Responsive Design**: Works on all devices
- ✅ **Security Warnings**: Clear instructions and warnings
- ✅ **Branding**: Matches your کاما brand
- ✅ **Fallback Text**: Plain text version included

## 🔐 Security Features

- **Token Expiration**: 1-hour validity
- **One-time Use**: Tokens become invalid after use
- **No Email Enumeration**: Same response whether email exists or not
- **Secure Delivery**: HTTPS links only in production

## 🚀 Next Steps

1. **Choose an email provider** (Gmail recommended for testing)
2. **Update .env.local** with your SMTP credentials
3. **Test the system** by requesting a password reset
4. **Users will receive beautiful emails** with reset links!

## 📞 Need Help?

If you need help setting up Gmail app passwords or other email providers, let me know!
