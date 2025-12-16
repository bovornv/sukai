# Quick Fix: Railway Root Directory

## ⚠️ Problem

Railway is scanning the root directory instead of `backend/`, causing build failures.

## ✅ Solution: Set in Railway Dashboard

The `rootDirectory` in `railway.toml` isn't being respected. You **must** set it in Railway dashboard.

### Step-by-Step:

1. **Open Railway Settings:**
   - Go to: https://railway.app
   - Click on service **"sukai"**
   - Click **"Settings"** tab
   - (Settings page is already open for you!)

2. **Find Root Directory Field:**
   - Scroll down the Settings page
   - Look for **"Root Directory"** field
   - It might be under "Build Settings" or "General" section

3. **Set Root Directory:**
   - Enter: `backend`
   - Click **"Save"** button

4. **Verify Start Command:**
   - In the same Settings page
   - Find **"Start Command"** field
   - Should be: `npm start`
   - If empty or different, set it to: `npm start`
   - Click **"Save"**

5. **Redeploy:**
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** button (or wait for auto-redeploy)
   - Railway will now build from `backend/` directory ✅

## Alternative: If Root Directory Field Not Visible

If you can't find the Root Directory field:

1. **Check Railway Service Settings:**
   - Make sure you're on the correct service ("sukai")
   - Try refreshing the page

2. **Use Railway CLI:**
   ```bash
   railway link
   railway variables set RAILWAY_ROOT_DIRECTORY=backend
   railway up
   ```

3. **Contact Railway Support:**
   - The field should be visible in Settings
   - If not, it might be a UI issue

## Verify Fix

After setting Root Directory and redeploying:

1. **Check Deployment Logs:**
   - Railway → Service "sukai" → Deployments → Latest → Logs
   - Should see: Building from `backend/` directory
   - Should see: `npm install` running
   - Should see: `npm start` running

2. **Test Backend:**
   ```bash
   curl https://sukai-production.up.railway.app/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

## Why This Happens

Railway sometimes ignores `rootDirectory` in `railway.toml` if:
- The setting isn't configured in dashboard
- The service was created before the setting was added
- There's a caching issue

**Setting it in the dashboard ensures it's always respected.**

