# Backend 404 Error - Troubleshooting

## Issue

Backend returned 404: `{"status":"error","code":404,"message":"Application not found"}`

## Possible Causes

1. **Backend still deploying** - Wait 2-3 more minutes
2. **Deployment failed** - Check Railway logs
3. **Port not exposed** - Check Railway networking settings
4. **Build failed** - Check Railway deployment logs

## Steps to Fix

### Step 1: Check Railway Deployment Status

1. Go to Railway → Service "sukai"
2. Check the **"Deployments"** tab
3. Look for latest deployment status:
   - ✅ Success = Deployment completed
   - ⏳ Building = Still deploying
   - ❌ Failed = Check logs

### Step 2: Check Deployment Logs

1. Click on latest deployment
2. Click **"View Logs"**
3. Look for errors:
   - Missing dependencies
   - Build errors
   - Environment variable issues
   - Port binding errors

### Step 3: Verify Environment Variables

In Railway → Service "sukai" → Variables:
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ PORT=3000
- ✅ NODE_ENV=production

### Step 4: Check Networking

In Railway → Service "sukai" → Settings → Networking:
- Public Domain should be: `sukai-production.up.railway.app`
- If not, click "Generate Domain"

### Step 5: Verify railway.toml

Make sure `railway.toml` is pushed to GitHub:
```bash
git add railway.toml
git commit -m "Add railway.toml"
git push origin main
```

### Step 6: Check Server Configuration

Verify `backend/src/server.js` has:
- Health route: `app.get('/health', ...)`
- Port: `process.env.PORT || 3000`
- Server listening: `app.listen(PORT, ...)`

## Quick Fixes

**If deployment failed:**
1. Check logs for specific errors
2. Fix errors
3. Redeploy (Railway auto-redeploys on git push)

**If still deploying:**
- Wait 2-3 more minutes
- Check deployment status periodically

**If port issue:**
- Verify PORT=3000 in environment variables
- Check Railway networking settings

## Test After Fix

```bash
curl https://sukai-production.up.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

## Next Steps

Once backend is working:
1. ✅ Flutter app is already cleaned and dependencies installed
2. Run: `cd mobile && flutter run`
3. Mobile app will connect to production backend!

