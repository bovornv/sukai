# Supabase Auth Setup Guide

## Issue: 401 Unauthorized on Signup

If you're getting a `401 Unauthorized` error when trying to sign up, it's likely because:

1. **Email confirmation is required** (default Supabase setting)
2. **Auth is not properly configured** in Supabase Dashboard

## Solution: Configure Supabase Auth

### Step 1: Disable Email Confirmation (For Development)

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: `uuuqpiaclmleclsylfqh`
3. Click **Authentication** in the left sidebar
4. Click **Settings** (gear icon)
5. Scroll down to **"Email Auth"** section
6. **Uncheck** "Enable email confirmations"
7. Click **Save**

### Step 2: Verify Auth is Enabled

1. Still in **Authentication** → **Settings**
2. Make sure **"Enable email signup"** is checked
3. Make sure **"Enable email signin"** is checked

### Step 3: Test Signup Again

After disabling email confirmation:
- Users can sign up and immediately sign in
- No email verification required
- Perfect for development/testing

## Alternative: Keep Email Confirmation

If you want to keep email confirmation enabled:

1. **Keep "Enable email confirmations" checked**
2. **Update the app** to handle email confirmation flow:
   - Show message: "กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี"
   - User clicks link in email
   - User can then sign in

## Current Error Handling

The app now shows user-friendly Thai error messages:
- ✅ "อีเมลนี้ถูกใช้งานแล้ว" - Email already exists
- ✅ "รหัสผ่านอ่อนเกินไป" - Weak password
- ✅ "รูปแบบอีเมลไม่ถูกต้อง" - Invalid email format
- ✅ "ไม่สามารถเชื่อมต่อได้" - Network error

## Testing

After configuring Supabase Auth:

1. **Try signing up** with a new email
2. **Should work immediately** (if email confirmation disabled)
3. **Try signing in** with the same credentials
4. **Should redirect to home page**

## Production Considerations

For production:
- **Enable email confirmation** for security
- **Add email templates** in Supabase Dashboard
- **Handle email verification flow** in the app
- **Add password reset** functionality

---

**Quick Fix**: Disable email confirmation in Supabase Dashboard → Authentication → Settings

