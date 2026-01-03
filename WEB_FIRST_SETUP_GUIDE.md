# Web App First - Setup Guide
## Notification System Setup for Web Launch (Mobile Later)

---

## 🎯 Launch Strategy

**Phase 1: Web App** (Now)
- Web push notifications
- In-app notifications (already working)
- Full notification system backend

**Phase 2: Mobile Apps** (Later)
- Android app with FCM
- iOS app with FCM
- Mobile-specific optimizations

---

## ✅ What's Already Working (No Changes Needed)

1. ✅ **Backend Notification System** - Fully functional
2. ✅ **In-App Notifications** - Working in web app
3. ✅ **Notification Scheduling** - Automatic after assessments
4. ✅ **Response Handling** - Updates confidence model
5. ✅ **Database Schema** - Ready for web and mobile

---

## 🔧 Step 1: Database Setup (Required)

### 1.1 Create Notification Tables

Run these SQL scripts in Supabase SQL Editor:

**File 1: `backend/database/followup_notifications.sql`**
- Creates `followup_notifications` table
- Run this first

**File 2: `backend/database/device_tokens.sql`**
- Creates `device_tokens` table
- Needed for web push tokens (and future mobile tokens)
- Run this second

### Verification:
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('followup_notifications', 'device_tokens');
```

---

## 🔧 Step 2: Backend Dependencies (Required)

### 2.1 Install Dependencies

```bash
cd backend
npm install
```

This will install:
- `firebase-admin` (for future mobile push, optional for web)
- `node-cron` (for cron job)

### 2.2 Verify Installation

```bash
npm list firebase-admin node-cron
```

---

## 🔧 Step 3: Environment Variables (Required)

### 3.1 For Railway (Production)

Go to Railway Dashboard → Your Backend Service → Variables

**Required Variables:**
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Optional (for future mobile push):**
```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'  # Defer until mobile launch
CRON_SECRET=your-secret-key  # For cron job protection
```

### 3.2 For Local Development

Create/update `backend/.env`:

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: For cron job (if using node-cron locally)
CRON_SECRET=your-local-secret-key
ENABLE_NODE_CRON=false  # Set to true if testing cron locally
```

---

## 🔧 Step 4: Web Push Notifications (Optional - Can Defer)

### Current Status: In-App Notifications Work ✅

The notification system already works with **in-app notifications**:
- Notifications appear on home page
- Users can respond via UI
- Confidence model updates
- No push notifications needed for MVP

### Web Push Setup (Future Enhancement)

If you want web push notifications later, you'll need:

1. **Service Worker** for background notifications
2. **Web Push API** integration
3. **VAPID keys** from Firebase (or self-hosted)

**For now: Skip web push, use in-app notifications only.**

---

## 🔧 Step 5: Cron Job Setup (Required)

### Option A: Railway Cron Jobs (Recommended)

1. **Go to Railway Dashboard**
   - Select your backend service
   - Click **Settings** tab
   - Scroll to **Cron Jobs** section

2. **Add New Cron Job**
   - **Name**: `notification-sender`
   - **Schedule**: `*/15 * * * *` (every 15 minutes)
   - **Command**: `node src/jobs/notification_sender.js`
   - **Environment**: Production

3. **Save**
   - Railway will run the job automatically

### Option B: External Cron Service

Use [cron-job.org](https://cron-job.org) or similar:

- **URL**: `https://your-backend-url/api/notifications/process`
- **Method**: POST
- **Headers**: `x-cron-secret: your-secret-key`
- **Schedule**: Every 15 minutes

### Option C: Manual Testing (Development)

```bash
# Test manually
cd backend
node src/jobs/notification_sender.js
```

---

## ✅ Step 6: Verification & Testing

### 6.1 Test Notification Scheduling

1. **Complete an assessment** in web app
2. **Check database**:
```sql
SELECT * FROM followup_notifications 
WHERE session_id = '<your_session_id>'
ORDER BY scheduled_at;
```

Should see 2 notifications (24h and 48h).

### 6.2 Test In-App Notifications

1. **Manually set notification to past time**:
```sql
UPDATE followup_notifications
SET scheduled_at = NOW() - INTERVAL '1 hour'
WHERE session_id = '<your_session_id>'
LIMIT 1;
```

2. **Refresh web app**
3. **Check home page** - Should see notification card
4. **Check AppBar** - Should see badge with count

### 6.3 Test Response Handling

1. **Click response button** (e.g., "ดีขึ้นแล้ว")
2. **Check database**:
```sql
SELECT response, responded_at, confidence_delta
FROM followup_notifications
WHERE id = '<notification_id>';
```

3. **Check confidence update**:
```sql
SELECT confidence, updated_at
FROM triage_sessions
WHERE session_id = '<session_id>';
```

---

## 📋 Complete Checklist for Web Launch

### Backend Setup
- [ ] Database tables created (`followup_notifications`, `device_tokens`)
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables set (Supabase credentials)
- [ ] Cron job configured (Railway or external)
- [ ] Test notification scheduling works
- [ ] Test notification display works
- [ ] Test response handling works

### Web App (Already Working)
- [ ] Notification card widget displays correctly
- [ ] Notifications page works
- [ ] Badge in AppBar shows count
- [ ] Response buttons work
- [ ] Navigation after response works

### Testing
- [ ] Complete assessment → Notifications scheduled
- [ ] Notifications appear on home page
- [ ] Can respond to notifications
- [ ] Confidence model updates correctly
- [ ] Cron job sends notifications (if web push enabled)

---

## 🚀 What's Deferred (Mobile Launch)

### Mobile-Specific Setup (Do Later)
- ⏳ Firebase project setup (for mobile FCM)
- ⏳ Android app configuration
- ⏳ iOS app configuration
- ⏳ Mobile push notification service
- ⏳ Device token registration (mobile)

### Current Status
- ✅ Backend supports mobile tokens (schema ready)
- ✅ API endpoints ready for mobile
- ⏳ Mobile app integration (deferred)

---

## 📊 Current System Capabilities

### ✅ Working Now (Web)
1. **In-App Notifications**
   - Display on home page
   - Full notification page
   - Response handling
   - Confidence model integration

2. **Notification Scheduling**
   - Automatic after assessments
   - 24h and 48h notifications
   - Safety variant for red flags

3. **Backend Processing**
   - Cron job ready
   - API endpoints working
   - Database schema complete

### ⏳ Future (Mobile)
- Push notifications (FCM)
- Background notifications
- Mobile-specific UI

---

## 🎯 Next Steps (Web Launch)

### Immediate Actions:
1. ✅ Run database migrations
2. ✅ Install backend dependencies
3. ✅ Set environment variables
4. ✅ Set up cron job
5. ✅ Test end-to-end flow

### After Launch:
- Monitor notification delivery
- Track response rates
- Optimize notification timing
- Add web push (optional)

---

## 📝 Quick Start Commands

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Test notification sender manually
node src/jobs/notification_sender.js

# 3. Start server
npm start

# 4. Test API endpoint
curl -X POST "http://localhost:3000/api/notifications/process" \
  -H "x-cron-secret: your-secret-key"
```

---

## 🐛 Troubleshooting

### Notifications not appearing?
- Check `scheduled_at` is in the past
- Check `sent_at` is NULL
- Check `dismissed` is FALSE
- Refresh web app

### Cron job not running?
- Check Railway cron job status
- Check logs for errors
- Test manually first

### Database errors?
- Verify tables exist
- Check RLS policies
- Verify user_id matches

---

**Status**: Ready for Web Launch! 🚀

Mobile setup can be done later when launching mobile apps.

