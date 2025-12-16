# Railway Root Directory Fix

## Problem

Railway is scanning the root directory instead of `backend/`, causing build failures.

## Solution: Set Root Directory in Railway Dashboard

The `rootDirectory` in `railway.toml` might not be enough. You need to set it in Railway dashboard:

### Steps:

1. **Go to Railway Dashboard:**
   - https://railway.app
   - Click on your project
   - Click on service **"sukai"**

2. **Go to Settings:**
   - Click **"Settings"** tab

3. **Set Root Directory:**
   - Scroll down to find **"Root Directory"** field
   - Enter: `backend`
   - Click **"Save"** or the save button

4. **Verify Start Command:**
   - In the same Settings page
   - Check **"Start Command"** field
   - Should be: `npm start`
   - If not, set it and save

5. **Redeploy:**
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** or wait for auto-redeploy
   - Railway will now build from `backend/` directory

## Alternative: Use Railway CLI

If dashboard doesn't work, use Railway CLI:

```bash
railway link
railway variables set RAILWAY_ROOT_DIRECTORY=backend
railway up
```

## Verify

After setting Root Directory, Railway should:
- Build from `backend/` directory ✅
- Find `package.json` ✅
- Install dependencies ✅
- Start server ✅

Check deployment logs to confirm it's building from `backend/`.

