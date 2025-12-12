# Deployment Complete Steps Summary

## ✅ Completed Steps

### Step 1: Push Code to GitHub ✅
- Repository: https://github.com/bovornv/sukai.git
- Branch: main
- Status: Successfully pushed all code

### Step 2: Railway Project Created ✅
- Project: harmonious-encouragement
- Project ID: 954e785a-edda-4de2-a5ba-a6df454b4989
- Environment: production

## 🔄 Remaining Steps

### Step 3: Add Service from GitHub

**Option A: Via "Add a New Service" Button**
1. Go back to Railway project page (Architecture view)
2. Click **"Add a New Service"** button (top right, or use ⌘K shortcut)
3. Select **"GitHub Repo"** from the menu
4. Search for: `bovornv/sukai`
5. Select the repository
6. Railway will automatically start deploying

**Option B: Via New Project Flow**
1. Go to Railway dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Search and select `bovornv/sukai`
5. Click **"Deploy Now"**

### Step 4: Configure Service

After Railway creates the service:

1. **Click on the service** that was created
2. Go to **"Settings"** tab
3. Scroll to **"Root Directory"** section
4. Set to: `backend`
5. (Optional) Set **Start Command**: `npm start`

### Step 5: Add Environment Variables

In the service **Settings** → **Variables** tab:

1. Click **"New Variable"** for each:

```
SUPABASE_URL = YOUR_SUPABASE_URL
SUPABASE_ANON_KEY = YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY = YOUR_SUPABASE_SERVICE_ROLE_KEY
PORT = 3000
NODE_ENV = production
```

2. Click **"Add"** for each variable

### Step 6: Get Backend URL

1. Go to service **Settings** → **Networking** tab
2. Under **"Public Domain"** section
3. Railway will generate a URL like: `https://sukai-production.up.railway.app`
4. **Copy this URL** - you'll need it for the mobile app

### Step 7: Test Your Backend

```bash
curl https://your-backend-url.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### Step 8: Update Mobile App

Once you have your Railway URL:

```bash
cd backend
./update-mobile-app.sh https://your-backend-url.railway.app
```

Or manually edit `mobile/lib/config/api_config.dart`:
```dart
static const String prodBaseUrl = 'https://your-backend-url.railway.app/api';
static const bool isProduction = true;
```

### Step 9: Rebuild Mobile App

```bash
cd ../mobile
flutter clean
flutter pub get
flutter run
```

## Quick Reference

- **GitHub Repo**: https://github.com/bovornv/sukai.git
- **Railway Project**: https://railway.app/project/954e785a-edda-4de2-a5ba-a6df454b4989
- **Root Directory**: `backend`
- **Port**: `3000`

## Troubleshooting

**Service not deploying?**
- Check Railway logs: Service → Deployments → Latest → View logs
- Verify GitHub repository is accessible
- Check root directory is set correctly

**Environment variables not working?**
- Make sure all 5 variables are set
- Check for typos in variable names
- Verify values are correct (especially keys)

**Backend not responding?**
- Wait 2-3 minutes after deployment
- Check deployment logs for errors
- Verify PORT is set to 3000
- Test with: `curl https://your-url/health`

## Next Steps After Deployment

1. ✅ Test all API endpoints
2. ✅ Verify Supabase connection
3. ✅ Test mobile app connection
4. ✅ Set up monitoring (Sentry)
5. ✅ Configure custom domain (optional)

