# Web App Launch - Step-by-Step Instructions
## Complete Guide to Launch Notification System for Web

---

## 🎯 Overview

This guide walks you through setting up the notification system for **web app launch only**. Mobile app setup is deferred until later.

**Time Required**: ~25 minutes
**Difficulty**: Easy

---

## ✅ Step 1: Database Setup (5 minutes)

### 1.1 Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New query**

### 1.2 Run First SQL Script

1. Open file: `backend/database/followup_notifications.sql`
2. Copy **entire contents**
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

**Expected**: ✅ Success message, table created

### 1.3 Run Second SQL Script

1. Open file: `backend/database/device_tokens.sql`
2. Copy **entire contents**
3. Paste into Supabase SQL Editor
4. Click **Run**

**Expected**: ✅ Success message, table created

### 1.4 Verify Tables Created

Run this query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('followup_notifications', 'device_tokens')
ORDER BY table_name;
```

**Expected**: Should see both tables listed

---

## ✅ Step 2: Backend Dependencies (2 minutes)

### 2.1 Install Dependencies

Open terminal:
```bash
cd backend
npm install
```

**Expected**: Packages install successfully

### 2.2 Verify Installation

```bash
npm list firebase-admin node-cron
```

**Expected**: Both packages listed (even if not used yet)

---

## ✅ Step 3: Environment Variables (2 minutes)

### 3.1 For Railway (Production)

1. Go to [Railway Dashboard](https://railway.app)
2. Select your backend service
3. Click **Variables** tab
4. Verify these exist:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

5. **Add optional variable** (for cron job):
   - Click **New Variable**
   - Key: `CRON_SECRET`
   - Value: Generate a random secret (e.g., `sukai-cron-2024-$(openssl rand -hex 16)`)
   - Click **Add**

### 3.2 For Local Development

Create/update `backend/.env`:
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: For local cron testing
CRON_SECRET=your-local-secret-key
ENABLE_NODE_CRON=false
```

**Note**: `FIREBASE_SERVICE_ACCOUNT` is **NOT needed** for web launch (defer until mobile)

---

## ✅ Step 4: Cron Job Setup (5 minutes)

### Option A: Railway Cron Jobs (Recommended)

1. **Go to Railway Dashboard**
   - Select your backend service
   - Click **Settings** tab
   - Scroll to **Cron Jobs** section

2. **Add New Cron Job**
   - Click **New Cron Job**
   - **Name**: `notification-sender`
   - **Schedule**: `*/15 * * * *` (every 15 minutes)
   - **Command**: `node src/jobs/notification_sender.js`
   - Click **Add**

3. **Verify**
   - Cron job appears in list
   - Status shows "Active"

### Option B: External Cron Service (Alternative)

1. **Sign up** at [cron-job.org](https://cron-job.org) (free)

2. **Create Cron Job**
   - **URL**: `https://your-backend-url/api/notifications/process`
   - **Method**: POST
   - **Headers**: 
     - Key: `x-cron-secret`
     - Value: `your-secret-key` (from Step 3)
   - **Schedule**: Every 15 minutes
   - **Save**

---

## ✅ Step 5: Test Backend (3 minutes)

### 5.1 Start Server

```bash
cd backend
npm start
```

**Expected**: Server starts, no FCM errors (expected - not configured yet)

### 5.2 Test Health Check

```bash
curl http://localhost:3000/health
```

**Expected**: `{"status":"ok","timestamp":"..."}`

### 5.3 Test Notification Sender (Manual)

```bash
node src/jobs/notification_sender.js
```

**Expected**: 
```
🔄 Starting notification sender job...
📬 Found 0 pending notifications
✅ Notification job complete: 0 sent, 0 failed, 0 skipped
```

---

## ✅ Step 6: Test Web App (10 minutes)

### 6.1 Complete Assessment

1. **Open web app** in browser
2. **Start new symptom check**
3. **Answer questions** (10-14 questions)
4. **Complete assessment** (non-emergency)
5. **View summary page**

### 6.2 Verify Notification Scheduled

Run in Supabase SQL Editor:
```sql
SELECT 
  id,
  session_id,
  notification_type,
  scheduled_at,
  symptom
FROM followup_notifications
WHERE session_id = '<your_session_id>'
ORDER BY scheduled_at;
```

**Expected**: 2 rows (24h and 48h notifications)

### 6.3 Make Notification Appear (For Testing)

Update notification time to past:
```sql
UPDATE followup_notifications
SET scheduled_at = NOW() - INTERVAL '1 hour'
WHERE session_id = '<your_session_id>'
LIMIT 1;
```

### 6.4 Check Web App

1. **Refresh web app** (or reopen)
2. **Check home page**:
   - ✅ Notification card appears below greeting
   - ✅ Badge in AppBar shows count (1)

3. **Check notification card**:
   - ✅ Shows friendly greeting
   - ✅ Shows symptom-specific message
   - ✅ Shows response buttons

### 6.5 Test Response

1. **Click "ดีขึ้นแล้ว"** (or any response)
2. **Check database**:
```sql
SELECT response, responded_at 
FROM followup_notifications 
WHERE id = '<notification_id>';
```

**Expected**: Response recorded, timestamp set

3. **Check web app**:
   - ✅ Notification card shows confirmation
   - ✅ Badge count decreases

### 6.6 Test Notifications Page

1. **Click badge** in AppBar (or navigate to `/notifications`)
2. **Verify**:
   - ✅ Lists all pending notifications
   - ✅ Can respond to each
   - ✅ Pull-to-refresh works

---

## ✅ Step 7: Verify Cron Job (5 minutes)

### 7.1 Check Cron Job Status

**Railway**:
- Go to Cron Jobs section
- Check last run time
- View logs

**External Cron**:
- Check cron service dashboard
- View execution history

### 7.2 Test Cron Endpoint Manually

```bash
curl -X POST "http://localhost:3000/api/notifications/process" \
  -H "x-cron-secret: your-secret-key"
```

**Expected**: 
```json
{
  "success": true,
  "result": {
    "sent": 0,
    "failed": 0,
    "skipped": 0
  }
}
```

---

## ✅ Final Verification Checklist

### Database
- [ ] `followup_notifications` table exists
- [ ] `device_tokens` table exists
- [ ] Indexes created
- [ ] RLS policies active

### Backend
- [ ] Dependencies installed
- [ ] Server starts without errors
- [ ] Environment variables set
- [ ] Cron job configured
- [ ] Notification sender works

### Web App
- [ ] Notifications appear on home page
- [ ] Badge shows correct count
- [ ] Response buttons work
- [ ] Notifications page works
- [ ] Confidence model updates

### Integration
- [ ] Assessment → Notification scheduled
- [ ] Notification → Response → Confidence updated
- [ ] Multiple notifications handled
- [ ] Emergency cases excluded

---

## 🎉 Launch Ready!

**Status**: ✅ **Ready for Web Launch**

**What Works**:
- ✅ In-app notifications (full functionality)
- ✅ Notification scheduling (automatic)
- ✅ Response handling (confidence model)
- ✅ Cron job (ready)

**What's Deferred**:
- ⏳ Firebase setup (for mobile push)
- ⏳ Mobile app configuration
- ⏳ Mobile push notifications

---

## 📝 Post-Launch Monitoring

### Week 1: Monitor
- Notification scheduling rate
- User response rate
- Cron job execution
- Any errors in logs

### Week 2: Optimize
- Adjust notification timing if needed
- Improve notification copy based on feedback
- Fix any issues found

---

## 🐛 Troubleshooting

### Notifications not appearing?
- Check `scheduled_at` is in the past
- Check `dismissed` is FALSE
- Refresh web app
- Check browser console for errors

### Cron job not running?
- Check Railway cron job status
- Check logs for errors
- Test manually first
- Verify command is correct

### Database errors?
- Verify tables exist
- Check RLS policies
- Verify user_id matches

---

**You're Ready to Launch!** 🚀

See `WEB_LAUNCH_CHECKLIST.md` for quick reference.

