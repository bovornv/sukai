# 🚀 Deploy Now - Final Instructions

## Everything is Ready!

✅ Railway CLI installed (v4.12.0)
✅ Environment variables prepared
✅ Deployment guides created
✅ Mobile app update script ready

## Deploy Backend (5 minutes)

### Step 1: Login to Railway

Open terminal and run:
```bash
cd backend
railway login
```

This will:
- Open your browser
- Ask you to authenticate
- Link your terminal to Railway

### Step 2: Initialize Project

```bash
railway init
```

Choose:
- **"New Project"** (if first time)
- Or select existing project

### Step 3: Set Environment Variables

Copy and paste these commands:

```bash
railway variables set SUPABASE_URL=YOUR_SUPABASE_URL
railway variables set SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
railway variables set SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
railway variables set PORT=3000
railway variables set NODE_ENV=production
```

### Step 4: Deploy

```bash
railway up
```

Wait for deployment to complete (2-3 minutes).

### Step 5: Get Your Backend URL

```bash
railway domain
```

Or check Railway dashboard:
- Go to https://railway.app
- Click your project → Your service
- Copy URL from "Domains" section

You'll get something like:
```
https://sukai-backend-production.up.railway.app
```

### Step 6: Test Your Backend

```bash
curl https://your-backend-url.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

## Update Mobile App

### Option 1: Use Update Script (Easiest)

```bash
cd backend
./update-mobile-app.sh https://your-backend-url.railway.app
```

This will automatically:
- Update `prodBaseUrl` with your Railway URL
- Set `isProduction = true`
- Create a backup

### Option 2: Manual Update

Edit `mobile/lib/config/api_config.dart`:

```dart
// Change this line:
static const String prodBaseUrl = 'https://your-backend-url.railway.app/api';

// Change this line:
static const bool isProduction = true;
```

### Step 7: Rebuild Flutter App

```bash
cd mobile
flutter clean
flutter pub get
flutter run
```

## Verify Everything Works

1. **Backend**: `curl https://your-url/health` ✅
2. **Mobile App**: Run app and test API calls ✅
3. **Database**: Check Supabase dashboard for saved data ✅

## Quick Reference

- **All commands**: `backend/DEPLOY_COMMANDS.sh`
- **Step-by-step**: `backend/RAILWAY_DEPLOY_STEPS.txt`
- **Detailed guide**: `backend/DEPLOY_NOW.md`
- **Mobile update**: `UPDATE_MOBILE_APP.md`

## Troubleshooting

**Railway CLI not found?**
- Open a new terminal
- Or run: `export PATH="$PATH:$(npm config get prefix)/bin"`

**Deployment fails?**
- Check logs: `railway logs`
- Verify environment variables: `railway variables`

**Mobile app can't connect?**
- Verify backend URL is correct
- Check backend is running: `curl https://your-url/health`
- Make sure `isProduction = true`

## 🎉 Done!

Your backend is live and mobile app is connected!

Next steps:
- Set up monitoring (Sentry, UptimeRobot)
- Test all features
- Share your app!

