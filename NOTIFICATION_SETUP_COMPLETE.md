# Notification System Setup - Web App First
## Setup Guide for Web Launch (Mobile Apps Later)

---

## 🎯 Launch Strategy

**Web App Launch (Now)**:
- ✅ In-app notifications (fully working)
- ✅ Notification scheduling (automatic)
- ✅ Response handling (confidence model)
- ✅ Cron job (ready)

**Mobile Apps (Later)**:
- ⏳ Android & iOS setup deferred
- ⏳ Mobile push notifications deferred
- ⏳ Firebase setup deferred until mobile launch

---

## ✅ What's Been Implemented

### Backend (100% Complete)
1. ✅ **Database Schema**
   - `followup_notifications` table
   - `device_tokens` table (ready for future mobile)
   - Indexes and RLS policies

2. ✅ **Services**
   - `notification_scheduler.js` - Schedule and manage notifications
   - `fcm_service.js` - Send push notifications via FCM (ready for mobile)
   - `notification_sender.js` - Cron job to process pending notifications

3. ✅ **API Routes**
   - `/api/notifications/*` - Notification management
   - `/api/device-tokens/*` - Device token registration (ready for mobile)

4. ✅ **Integration**
   - Auto-schedule on assessment completion
   - Confidence model updates
   - Response handling

### Web App (100% Complete)
1. ✅ **Services**
   - `notification_service.dart` - Fetch and respond to notifications
   - Works perfectly for web app

2. ✅ **UI Components**
   - `notification_card.dart` - Display notification with responses
   - `notifications_page.dart` - List all notifications

3. ✅ **Integration**
   - Home page badge and card
   - Router integration
   - Auto-refresh on app resume

---

## 🚀 Web Launch Checklist

### Step 1: Database Setup (Required)
- [ ] Run `backend/database/followup_notifications.sql` in Supabase
- [ ] Run `backend/database/device_tokens.sql` in Supabase (for future mobile)
- [ ] Verify tables created successfully
- [ ] Verify indexes and RLS policies

### Step 2: Backend Dependencies (Required)
- [ ] Install dependencies: `npm install` in `backend/`
- [ ] Verify `firebase-admin` and `node-cron` installed (for future use)

### Step 3: Environment Variables (Required)
Add to Railway or `.env`:
```bash
# Required (Supabase)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional (for cron job protection)
CRON_SECRET=your-secret-key-here

# Optional (for local cron testing)
ENABLE_NODE_CRON=false  # Use Railway Cron Jobs for production
```

**Note**: `FIREBASE_SERVICE_ACCOUNT` not needed for web launch (defer until mobile)

### Step 4: Cron Job Setup (Required)
- [ ] Set up Railway Cron Job (recommended)
  - Schedule: `*/15 * * * *` (every 15 minutes)
  - Command: `node src/jobs/notification_sender.js`
- [ ] Or use external cron service
- [ ] See `CRON_JOB_SETUP.md` for details

### Step 5: Testing (Required)
- [ ] Test notification scheduling (complete assessment)
- [ ] Test notification display (appears on home page)
- [ ] Test response handling (click response buttons)
- [ ] Test notifications page (navigate to `/notifications`)
- [ ] See `NOTIFICATION_TESTING_GUIDE.md` for details

---

## ⏳ Deferred Until Mobile Launch

### Mobile-Specific Setup (Do Later)
- ⏳ Firebase project setup
- ⏳ Firebase service account key
- ⏳ Android app configuration
- ⏳ iOS app configuration
- ⏳ Mobile push notification service initialization
- ⏳ Device token registration (mobile)

**Current Status**: Backend and database ready for mobile, but mobile setup deferred.

---

## 📋 Quick Start for Web Launch

### 1. Database (5 minutes)
```sql
-- Run in Supabase SQL Editor
-- File 1: backend/database/followup_notifications.sql
-- File 2: backend/database/device_tokens.sql
```

### 2. Backend (2 minutes)
```bash
cd backend
npm install
```

### 3. Environment Variables (2 minutes)
- Set Supabase credentials in Railway
- Set CRON_SECRET (optional)

### 4. Cron Job (5 minutes)
- Set up Railway Cron Job
- Or use external cron service

### 5. Test (10 minutes)
- Complete assessment
- Check notifications appear
- Test responses

**Total Time**: ~25 minutes

---

## ✅ What Works Now (Web)

1. ✅ **In-App Notifications**
   - Display on home page
   - Full notifications page
   - Response buttons
   - Confidence model updates

2. ✅ **Notification Scheduling**
   - Automatic after assessments
   - 24h and 48h notifications
   - Safety variant for red flags

3. ✅ **Backend Processing**
   - Cron job ready
   - API endpoints working
   - Database complete

---

## 📚 Documentation

- **`WEB_FIRST_SETUP_GUIDE.md`** - Complete web-first setup guide
- **`WEB_LAUNCH_CHECKLIST.md`** - Step-by-step launch checklist
- **`NOTIFICATION_TESTING_GUIDE.md`** - Testing scenarios
- **`CRON_JOB_SETUP.md`** - Cron job configuration
- **`FIREBASE_FCM_SETUP_GUIDE.md`** - Mobile setup (defer until mobile launch)

---

**Status**: ✅ Ready for Web Launch!

Mobile setup can be done later when launching mobile apps.

---

## 📋 Quick Start Commands

### Backend:
```bash
# Install dependencies
cd backend
npm install

# Test notification sender manually
node src/jobs/notification_sender.js

# Start server
npm start
```

### Mobile:
```bash
# Add Firebase dependencies
cd mobile
flutter pub add firebase_core firebase_messaging flutter_local_notifications

# Run app
flutter run
```

---

## 📚 Documentation Files

1. **NOTIFICATION_TESTING_GUIDE.md** - Complete testing checklist
2. **FIREBASE_FCM_SETUP_GUIDE.md** - Firebase setup instructions
3. **CRON_JOB_SETUP.md** - Cron job configuration
4. **NOTIFICATION_SYSTEM_COMPLETE.md** - Implementation summary
5. **NOTIFICATION_SETUP_COMPLETE.md** - This file

---

## 🎯 Next Actions

1. **Set up Firebase project** (if not done)
2. **Configure environment variables**
3. **Set up cron job** (Railway recommended)
4. **Test end-to-end flow**
5. **Deploy to production**

---

**Status**: Ready for Firebase Setup & Deployment! 🚀

