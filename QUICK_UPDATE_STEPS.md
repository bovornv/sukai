# Quick Update Steps 3-5

## ⚠️ Reminder: You Need BOTH Keys!

Make sure you have reset BOTH keys in Supabase:
- ✅ Anon Key (you did this)
- ⚠️ Service Role Key (did you reset this too?)

If not, go back and reset the Service Role Key first!

---

## Step 3: Update Railway Environment Variables

### Option A: Railway Dashboard (Easiest)

1. **Railway Dashboard is opening...**
   - Go to: https://railway.app
   - Click on service **"sukai"**
   - Click **"Variables"** tab

2. **Update SUPABASE_ANON_KEY:**
   - Find `SUPABASE_ANON_KEY`
   - Click edit/pencil icon
   - Paste your NEW anon key
   - Click Save

3. **Update SUPABASE_SERVICE_ROLE_KEY:**
   - Find `SUPABASE_SERVICE_ROLE_KEY`
   - Click edit/pencil icon
   - Paste your NEW service role key
   - Click Save

4. **Wait for Redeployment:**
   - Railway auto-redeploys (2-3 minutes)
   - Check deployment status

### Option B: Railway CLI

Run:
```bash
./UPDATE_RAILWAY_VARS.sh
```

---

## Step 4: Update Local .env File

### Option A: Helper Script

Run:
```bash
./UPDATE_LOCAL_ENV.sh
```

### Option B: Manual Edit

Edit `backend/.env`:

```env
SUPABASE_URL=https://uuuqpiaclmleclsylfqh.supabase.co
SUPABASE_ANON_KEY=YOUR_NEW_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_NEW_SERVICE_ROLE_KEY_HERE
PORT=3000
NODE_ENV=development
```

---

## Step 5: Close GitHub Alert

1. Go to: https://github.com/bovornv/sukai
2. Click **"Security"** tab
3. Click **"Secret scanning alerts"**
4. Click on the Supabase alert
5. Click **"Mark as revoked"**
6. Click **"Close alert"**

---

## Test After Updates

```bash
curl https://sukai-production.up.railway.app/health
```

Should return: `{"status":"ok","timestamp":"..."}`

