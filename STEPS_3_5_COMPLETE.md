# Steps 3-5: Complete Guide

## ✅ Step 3: Update Railway Environment Variables

### Railway Variables Page is Open
**URL:** https://railway.com/project/954e785a-edda-4de2-a5ba-a6df454b4989/service/0dfd874f-d458-40bd-85b2-a28cb96cadcd/variables

### Instructions:

1. **Find `SUPABASE_ANON_KEY`:**
   - Look for it in the variables list
   - Click the **edit/pencil icon** or click on the value
   - Replace with your **NEW anon key** (from Supabase)
   - Click **"Save"** or press Enter

2. **Find `SUPABASE_SERVICE_ROLE_KEY`:**
   - Look for it in the variables list
   - Click the **edit/pencil icon** or click on the value
   - Replace with your **NEW service role key** (from Supabase)
   - ⚠️ **Make sure you reset this in Supabase too!**
   - Click **"Save"** or press Enter

3. **Verify `SUPABASE_URL`:**
   - Should be: `https://uuuqpiaclmleclsylfqh.supabase.co`
   - If missing, add it

4. **Wait for Redeployment:**
   - Railway automatically redeploys when you change variables
   - Wait 2-3 minutes
   - Check deployment status in Railway dashboard

### Alternative: Use Helper Script

If you prefer command line:
```bash
./UPDATE_RAILWAY_VARS.sh
```

This will prompt you for both keys and update Railway automatically.

---

## ✅ Step 4: Update Local .env File

### Option A: Helper Script (Easiest)

Run:
```bash
./UPDATE_LOCAL_ENV.sh
```

This will prompt you for both keys and create/update `backend/.env`.

### Option B: Manual Edit

Edit `backend/.env`:

```env
# Server Configuration
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://uuuqpiaclmleclsylfqh.supabase.co
SUPABASE_ANON_KEY=YOUR_NEW_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_NEW_SERVICE_ROLE_KEY_HERE

# Environment
NODE_ENV=development
```

Replace `YOUR_NEW_ANON_KEY_HERE` and `YOUR_NEW_SERVICE_ROLE_KEY_HERE` with your new keys.

---

## ✅ Step 5: Close GitHub Alert

1. **Go to GitHub:**
   - Open: https://github.com/bovornv/sukai
   - Click **"Security"** tab (top navigation)
   - Click **"Secret scanning alerts"** (left sidebar)

2. **Close the Alert:**
   - Click on the **"Supabase Service Key"** alert
   - Click **"Mark as revoked"** button
   - Click **"Close alert"** button
   - Select reason: **"Revoked"**

3. **Verify:**
   - Alert should disappear from the list
   - No more security warnings

---

## 🧪 Test Everything Works

After Railway redeploys (2-3 minutes):

```bash
curl https://sukai-production.up.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

If it works, your backend is using the new keys! ✅

---

## ✅ Checklist

- [ ] Step 3: Updated Railway `SUPABASE_ANON_KEY`
- [ ] Step 3: Updated Railway `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Step 4: Updated local `backend/.env` file
- [ ] Step 5: Closed GitHub alert
- [ ] Tested backend health endpoint

---

## ⚠️ Important Reminders

1. **You need BOTH keys updated:**
   - ✅ Anon Key (you reset this)
   - ⚠️ Service Role Key (did you reset this too?)

2. **If you haven't reset Service Role Key yet:**
   - Go back to Supabase: https://supabase.com/dashboard/project/uuuqpiaclmleclsylfqh/settings/api
   - Scroll to "Service Role" section
   - Click "Reset service role key"
   - Copy the NEW key

3. **Railway will auto-redeploy:**
   - Wait 2-3 minutes after updating variables
   - Check deployment status
   - Test health endpoint

---

**Total time: ~5-10 minutes**

Your backend will continue working once Railway redeploys with the new keys!

