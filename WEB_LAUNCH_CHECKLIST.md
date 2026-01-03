# Web App Launch Checklist
## Complete Step-by-Step Guide for Web Launch

---

## ✅ Phase 1: Database Setup

### Step 1.1: Create Notification Tables

**Action**: Run SQL scripts in Supabase SQL Editor

1. Open Supabase Dashboard → SQL Editor
2. Run `backend/database/followup_notifications.sql`
3. Run `backend/database/device_tokens.sql`

**Verification**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('followup_notifications', 'device_tokens');
```

**Expected**: Both tables should exist

---

## ✅ Phase 2: Backend Setup

### Step 2.1: Install Dependencies

**Action**: Install npm packages

```bash
cd backend
npm install
```

**Verification**:
```bash
npm list firebase-admin node-cron
```

**Expected**: Both packages installed (even if not used yet)

---

### Step 2.2: Set Environment Variables

**Action**: Configure Railway or `.env` file

**Required Variables**:
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Optional Variables** (for cron job):
```bash
CRON_SECRET=your-secret-key-here
ENABLE_NODE_CRON=false  # Set true only for local testing
```

**Verification**:
- Railway: Check Variables tab
- Local: Check `backend/.env` file exists

---

### Step 2.3: Test Backend

**Action**: Start server and test

```bash
cd backend
npm start
```

**Verification**:
- Server starts without errors
- Health check works: `curl http://localhost:3000/health`
- No FCM errors (expected, not configured yet)

---

## ✅ Phase 3: Cron Job Setup

### Step 3.1: Set Up Railway Cron Job

**Action**: Configure Railway cron

1. Go to Railway Dashboard
2. Select backend service
3. Settings → Cron Jobs
4. Add new cron:
   - Name: `notification-sender`
   - Schedule: `*/15 * * * *`
   - Command: `node src/jobs/notification_sender.js`

**Verification**:
- Cron job appears in list
- Status shows "Active"

---

### Step 3.2: Test Cron Job Manually

**Action**: Test notification sender

```bash
cd backend
node src/jobs/notification_sender.js
```

**Expected Output**:
```
🔄 Starting notification sender job...
📬 Found X pending notifications
✅ Notification job complete: X sent, 0 failed, 0 skipped
```

---

## ✅ Phase 4: Web App Testing

### Step 4.1: Test Notification Scheduling

**Action**: Complete an assessment

1. Open web app
2. Start new symptom check
3. Complete assessment (non-emergency)
4. View summary page

**Verification**:
```sql
SELECT COUNT(*) FROM followup_notifications 
WHERE session_id = '<session_id>';
```

**Expected**: 2 notifications (24h and 48h)

---

### Step 4.2: Test Notification Display

**Action**: Make notification appear

1. **Update notification time** (in database):
```sql
UPDATE followup_notifications
SET scheduled_at = NOW() - INTERVAL '1 hour'
WHERE session_id = '<session_id>'
LIMIT 1;
```

2. **Refresh web app**
3. **Check home page**

**Expected**:
- ✅ Notification card appears below greeting
- ✅ Badge in AppBar shows count (1)
- ✅ Notification shows symptom-specific message

---

### Step 4.3: Test Response Handling

**Action**: Respond to notification

1. Click "ดีขึ้นแล้ว" (or any response button)
2. Check database:
```sql
SELECT response, responded_at FROM followup_notifications 
WHERE id = '<notification_id>';
```

**Expected**:
- ✅ Response recorded
- ✅ `responded_at` timestamp set
- ✅ Notification card shows confirmation
- ✅ Badge count decreases

---

### Step 4.4: Test Notifications Page

**Action**: Navigate to notifications

1. Click notification badge in AppBar
2. Or navigate to `/notifications`

**Expected**:
- ✅ Lists all pending notifications
- ✅ Shows notification count
- ✅ Can respond to each notification
- ✅ Pull-to-refresh works

---

## ✅ Phase 5: End-to-End Flow Test

### Step 5.1: Complete Flow

**Action**: Full user journey

1. **Complete assessment** → Notifications scheduled
2. **Wait or manually trigger** → Notifications appear
3. **Respond to notification** → Confidence updated
4. **Check history** → Session shows updated confidence

**Verification**:
- All steps work smoothly
- No errors in console
- Database updates correctly

---

## 📋 Final Verification Checklist

### Backend
- [ ] Database tables created
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Server starts without errors
- [ ] Cron job configured
- [ ] Notification scheduling works
- [ ] Notification processing works

### Web App
- [ ] Notifications appear on home page
- [ ] Badge shows correct count
- [ ] Response buttons work
- [ ] Notifications page works
- [ ] Navigation after response works
- [ ] Confidence model updates

### Integration
- [ ] Assessment → Notification scheduled
- [ ] Notification → Response → Confidence updated
- [ ] Multiple notifications handled correctly
- [ ] Emergency cases excluded (no notifications)

---

## 🚀 Launch Readiness

**Status**: ✅ Ready for Web Launch

**What Works**:
- ✅ In-app notifications (full functionality)
- ✅ Notification scheduling (automatic)
- ✅ Response handling (confidence model)
- ✅ Cron job (ready to send)

**What's Deferred**:
- ⏳ Web push notifications (optional enhancement)
- ⏳ Mobile app setup (for future mobile launch)

---

## 📝 Post-Launch Monitoring

### Monitor These Metrics:
1. **Notification Scheduling**
   - How many notifications scheduled per day?
   - Are they scheduled correctly?

2. **Notification Display**
   - How many users see notifications?
   - Response rate?

3. **Response Handling**
   - Which responses are most common?
   - Confidence model updates working?

4. **Cron Job**
   - Running successfully?
   - Any errors in logs?

---

## 🎯 Next Steps After Launch

1. **Monitor** notification system for 1 week
2. **Collect** user feedback
3. **Optimize** notification timing if needed
4. **Plan** mobile app launch (when ready)

---

**You're Ready to Launch!** 🚀

