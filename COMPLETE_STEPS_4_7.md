# Complete Steps 4-7: Railway Configuration

## Current Status
✅ Service "ukai" created
❌ Build failed (needs root directory configuration)

## Step 4: Configure Root Directory (DO THIS NOW)

**You're on the Settings page!**

1. Scroll down to find **"Root Directory"** field
2. Type: `backend`
3. Click **"Save"** button

This will fix the build failure!

## Step 5: Add Environment Variables

After saving root directory:

1. Click **"Variable"** tab
2. Click **"New Variable"** for each:

Copy from `backend/ENV_VARS_FOR_RAILWAY.txt`:

```
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
PORT=3000
NODE_ENV=production
```

## Step 6: Get Backend URL

After Railway redeploys successfully:

1. Stay on **Settings** tab
2. Scroll to **"Networking"** section
3. Under **"Public Domain"**, copy the URL
4. If no URL, click **"Generate Domain"**

## Step 7: Update Mobile App

Once you have the URL, run:

```bash
cd backend
./update-mobile-app.sh https://your-backend-url.railway.app
```

Then rebuild:
```bash
cd ../mobile
flutter clean && flutter pub get && flutter run
```

## After Configuration

Railway will automatically:
- Redeploy with new settings
- Build from `backend` directory
- Use environment variables
- Generate a public URL

Wait 2-3 minutes for deployment to complete!

