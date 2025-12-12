# 🚀 Start Deployment Now

## Quick Deploy (Copy & Paste)

Open your terminal and run:

```bash
cd backend
./deploy-all.sh
```

This script will:
1. ✅ Check Railway CLI
2. ✅ Login (opens browser)
3. ✅ Initialize project
4. ✅ Set environment variables
5. ✅ Deploy backend
6. ✅ Get backend URL
7. ✅ Update mobile app automatically

## Or Deploy Manually

### Step 1: Login
```bash
cd backend
railway login
```
(Opens browser for authentication)

### Step 2: Initialize
```bash
railway init
```
Choose "New Project"

### Step 3: Set Environment Variables
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

### Step 5: Get URL
```bash
railway domain
```

### Step 6: Update Mobile App
```bash
./update-mobile-app.sh https://your-backend-url.railway.app
```

### Step 7: Rebuild Mobile App
```bash
cd ../mobile
flutter clean
flutter pub get
flutter run
```

## Alternative: Railway Dashboard

If you prefer GUI:

1. Go to https://railway.app
2. Sign up/Login
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Connect your repository
6. Set root directory: `backend`
7. Add environment variables (see Step 3 above)
8. Railway auto-deploys!

## After Deployment

✅ Test backend: `curl https://your-url/health`
✅ Test mobile app: Run Flutter app
✅ Check Supabase: Verify data is being saved

## Need Help?

- Check logs: `railway logs`
- Verify env vars: `railway variables`
- Railway docs: https://docs.railway.app

🎉 **Ready to deploy!**

