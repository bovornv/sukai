# 🚀 Deployment Ready!

## Everything is Prepared

✅ Railway CLI installed
✅ Environment variables ready
✅ Deployment guides created
✅ Mobile app config template ready

## Deploy Now (5 minutes)

### Option 1: Use Railway CLI (Recommended)

Open a **new terminal** (to refresh PATH) and run:

```bash
cd backend

# Step 1: Login
railway login

# Step 2: Initialize
railway init

# Step 3: Set environment variables
railway variables set SUPABASE_URL=YOUR_SUPABASE_URL
railway variables set SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
railway variables set SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
railway variables set PORT=3000
railway variables set NODE_ENV=production

# Step 4: Deploy
railway up

# Step 5: Get URL
railway domain
```

### Option 2: Use Railway Dashboard (Easier)

1. Go to https://railway.app
2. Sign up/Login
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Connect your repository
6. Set root directory to `backend`
7. Add environment variables:
   - `SUPABASE_URL` = `YOUR_SUPABASE_URL`
   - `SUPABASE_ANON_KEY` = `YOUR_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` = `YOUR_SUPABASE_SERVICE_ROLE_KEY`
   - `PORT` = `3000`
   - `NODE_ENV` = `production`
8. Railway will auto-deploy!

## After Deployment

### 1. Get Your Backend URL

Railway will give you a URL like:
```
https://sukai-backend-production.up.railway.app
```

### 2. Test Your Backend

```bash
curl https://your-backend-url.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### 3. Update Mobile App

Edit `mobile/lib/config/api_config.dart`:

```dart
// Production - UPDATE THIS
static const String prodBaseUrl = 'https://your-backend-url.railway.app/api';

// Set to true
static const bool isProduction = true;
```

### 4. Rebuild Flutter App

```bash
cd mobile
flutter clean
flutter pub get
flutter run
```

## Quick Reference

- **Deployment steps**: `backend/RAILWAY_DEPLOY_STEPS.txt`
- **Detailed guide**: `backend/DEPLOY_NOW.md`
- **Mobile update**: `UPDATE_MOBILE_APP.md`

## Need Help?

- Railway docs: https://docs.railway.app
- Check logs: `railway logs` (or in dashboard)
- Verify env vars: `railway variables`

🎉 **Ready to deploy!**

