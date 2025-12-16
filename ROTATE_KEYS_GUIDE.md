# 🔑 Rotate Supabase Keys - Step by Step

## ⚠️ IMPORTANT: Do This Before Your Backend Breaks!

Your exposed keys are now removed from the code, but **you must rotate them in Supabase** because they've been publicly exposed.

## Step 1: Rotate Keys in Supabase Dashboard

### 1.1 Go to Supabase Dashboard
Open: https://supabase.com/dashboard/project/uuuqpiaclmleclsylfqh/settings/api

### 1.2 Rotate Service Role Key (CRITICAL!)
1. Scroll to **"Service Role"** section
2. Click **"Reset service role key"** or **"Rotate"** button
3. ⚠️ **Copy the NEW key immediately** - you won't see it again!
4. Save it somewhere safe temporarily

### 1.3 Rotate Anon Key
1. Scroll to **"Project API keys"** section  
2. Find the **"anon"** key
3. Click **"Reset anon key"** or **"Rotate"** button
4. ⚠️ **Copy the NEW key immediately** - you won't see it again!
5. Save it somewhere safe temporarily

### 1.4 Keep Your URL
- Your Supabase URL stays the same: `https://uuuqpiaclmleclsylfqh.supabase.co`
- No need to change this

## Step 2: Update Railway Environment Variables

### 2.1 Go to Railway
1. Open: https://railway.app
2. Go to your project
3. Click on service **"sukai"**
4. Click **"Variables"** tab

### 2.2 Update Variables
1. Find `SUPABASE_ANON_KEY`
   - Click the edit/pencil icon
   - Replace with your NEW anon key from Step 1.3
   - Click "Save"

2. Find `SUPABASE_SERVICE_ROLE_KEY`
   - Click the edit/pencil icon
   - Replace with your NEW service role key from Step 1.2
   - Click "Save"

3. Verify `SUPABASE_URL` is still:
   - `https://uuuqpiaclmleclsylfqh.supabase.co`

### 2.3 Railway Will Auto-Redeploy
- Railway automatically redeploys when you change environment variables
- Wait 2-3 minutes for deployment to complete
- Check deployment status in Railway dashboard

## Step 3: Update Local .env File

Edit `backend/.env`:

```env
# Server Configuration
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://uuuqpiaclmleclsylfqh.supabase.co
SUPABASE_ANON_KEY=YOUR_NEW_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_NEW_SERVICE_ROLE_KEY_HERE
```

Replace `YOUR_NEW_ANON_KEY_HERE` and `YOUR_NEW_SERVICE_ROLE_KEY_HERE` with the keys you copied in Step 1.

## Step 4: Test Backend

After Railway redeploys (2-3 minutes):

```bash
curl https://sukai-production.up.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

If it works, your backend is using the new keys! ✅

## Step 5: Close GitHub Alert

1. Go to GitHub → Your repository
2. Click **"Security"** tab
3. Click **"Secret scanning alerts"**
4. Click on the Supabase Service Key alert
5. Click **"Mark as revoked"** (after you've rotated the keys)
6. Click **"Close alert"**

## Troubleshooting

### Backend returns 404 or errors
- Wait 2-3 more minutes for Railway to redeploy
- Check Railway deployment logs for errors
- Verify environment variables are set correctly

### Can't find "Reset" button in Supabase
- Look for "Rotate" or "Regenerate" button
- Or go to Settings → API → Service Role → Actions menu

### Railway deployment fails
- Check that all environment variables are set
- Verify keys don't have extra spaces or quotes
- Check Railway logs for specific errors

## Summary

✅ **Done:**
- Removed keys from code repository
- Committed and pushed security fixes

⏳ **You Need To:**
1. Rotate keys in Supabase (5 minutes)
2. Update Railway environment variables (2 minutes)
3. Update local .env file (1 minute)
4. Test backend (1 minute)
5. Close GitHub alert (1 minute)

**Total time: ~10 minutes**

Your backend will continue working once Railway redeploys with the new keys!

