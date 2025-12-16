# Steps 2-5: Complete Security Fix

## Step 2: Rotate Keys in Supabase Dashboard

### 2.1 Open Supabase Dashboard
✅ **Opened for you:** https://supabase.com/dashboard/project/uuuqpiaclmleclsylfqh/settings/api

### 2.2 Rotate Service Role Key
1. Scroll down to **"Service Role"** section
2. Look for **"service_role"** key (this is the secret key)
3. Click **"Reset service role key"** or **"Rotate"** button
4. ⚠️ **Copy the NEW key immediately** - you won't see it again!
5. Save it somewhere safe (you'll need it for steps 3-4)

### 2.3 Rotate Anon Key
1. Scroll to **"Project API keys"** section
2. Find the **"anon"** key (public key)
3. Click **"Reset anon key"** or **"Rotate"** button  
4. ⚠️ **Copy the NEW key immediately** - you won't see it again!
5. Save it somewhere safe (you'll need it for steps 3-4)

### 2.4 Keep Your URL
- Your Supabase URL stays the same: `https://uuuqpiaclmleclsylfqh.supabase.co`
- No need to change this

---

## Step 3: Update Railway Environment Variables

### Option A: Using Railway Dashboard (Recommended)

1. **Open Railway:**
   - Go to: https://railway.app
   - Click on your project
   - Click on service **"sukai"**
   - Click **"Variables"** tab

2. **Update SUPABASE_ANON_KEY:**
   - Find `SUPABASE_ANON_KEY` in the list
   - Click the **edit/pencil icon** or click on the value
   - Replace with your NEW anon key from Step 2.3
   - Click **"Save"** or press Enter

3. **Update SUPABASE_SERVICE_ROLE_KEY:**
   - Find `SUPABASE_SERVICE_ROLE_KEY` in the list
   - Click the **edit/pencil icon** or click on the value
   - Replace with your NEW service role key from Step 2.2
   - Click **"Save"** or press Enter

4. **Verify SUPABASE_URL:**
   - Should be: `https://uuuqpiaclmleclsylfqh.supabase.co`
   - If missing, add it

5. **Wait for Redeployment:**
   - Railway automatically redeploys when you change variables
   - Wait 2-3 minutes
   - Check deployment status in Railway dashboard

### Option B: Using Railway CLI

Run the helper script:
```bash
./UPDATE_RAILWAY_VARS.sh
```

Or manually:
```bash
railway variables --set "SUPABASE_ANON_KEY=YOUR_NEW_ANON_KEY"
railway variables --set "SUPABASE_SERVICE_ROLE_KEY=YOUR_NEW_SERVICE_ROLE_KEY"
```

---

## Step 4: Update Local .env File

### Option A: Using Helper Script

Run:
```bash
./UPDATE_LOCAL_ENV.sh
```

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

Replace `YOUR_NEW_ANON_KEY_HERE` and `YOUR_NEW_SERVICE_ROLE_KEY_HERE` with the keys you copied in Step 2.

---

## Step 5: Close GitHub Alert

1. **Go to GitHub:**
   - Open: https://github.com/bovornv/sukai
   - Click **"Security"** tab (top navigation)
   - Click **"Secret scanning alerts"** (left sidebar)

2. **Close the Alert:**
   - Click on the **"Supabase Service Key"** alert
   - Click **"Mark as revoked"** button (after you've rotated the keys)
   - Click **"Close alert"** button
   - Select reason: **"Revoked"** or **"False positive"**

3. **Verify:**
   - Alert should disappear from the list
   - No more security warnings

---

## Test Everything Works

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

## Quick Checklist

- [ ] Step 2: Rotated keys in Supabase (both anon and service role)
- [ ] Step 3: Updated Railway environment variables
- [ ] Step 4: Updated local `.env` file
- [ ] Step 5: Closed GitHub alert
- [ ] Tested backend health endpoint

---

## Troubleshooting

### Railway deployment fails
- Check that all environment variables are set correctly
- Verify keys don't have extra spaces or quotes
- Check Railway logs for specific errors

### Backend returns 404 or errors
- Wait 2-3 more minutes for Railway to redeploy
- Check Railway deployment status
- Verify environment variables are saved correctly

### Can't find "Reset" button in Supabase
- Look for "Rotate" or "Regenerate" button
- Or go to Settings → API → Service Role → Actions menu (three dots)

---

**Total time: ~10 minutes**

Your backend will continue working once Railway redeploys with the new keys!

