# Final Configuration Steps 4-8

## ✅ Step 4 Complete: Service renamed to "sukai"!

## Step 5: Configure Root Directory

**You're on the Settings page!**

1. Scroll down to find **"Root Directory"** field
2. Enter: `backend`
3. Click **"Save"** button

This will trigger a redeploy with the correct directory.

## Step 6: Add Environment Variables

After saving root directory:

1. Click **"Variable"** tab (next to Settings)
2. Click **"New Variable"** button
3. Add each variable one by one:

### Variable 1: SUPABASE_URL
- Name: `SUPABASE_URL`
- Value: `YOUR_SUPABASE_URL`
- Click "Add"

### Variable 2: SUPABASE_ANON_KEY
- Name: `SUPABASE_ANON_KEY`
- Value: `YOUR_SUPABASE_ANON_KEY`
- Click "Add"

### Variable 3: SUPABASE_SERVICE_ROLE_KEY
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `YOUR_SUPABASE_SERVICE_ROLE_KEY`
- Click "Add"

### Variable 4: PORT
- Name: `PORT`
- Value: `3000`
- Click "Add"

### Variable 5: NODE_ENV
- Name: `NODE_ENV`
- Value: `production`
- Click "Add"

**💡 Tip:** All values are in `backend/ENV_VARS.txt` for easy copy-paste!

## Step 7: Get Backend URL

After Railway redeploys successfully (wait 2-3 minutes):

1. Stay on **Settings** tab
2. Scroll to **"Networking"** section
3. Under **"Public Domain"**, Railway will show a URL
4. If no URL, click **"Generate Domain"** button
5. Copy the URL (e.g., `https://sukai-production.up.railway.app`)

## Step 8: Update Mobile App

Once you have your Railway URL, run:

```bash
cd backend
./update-mobile-app.sh https://your-backend-url.railway.app
```

This script will:
- Update `mobile/lib/config/api_config.dart`
- Set `prodBaseUrl` to your Railway URL
- Set `isProduction = true`
- Create a backup

Then rebuild:
```bash
cd ../mobile
flutter clean
flutter pub get
flutter run
```

## Quick Test

After deployment:

```bash
curl https://your-backend-url.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

## Summary

✅ Step 4: Service renamed to "sukai" - DONE!
🔄 Step 5: Set root directory to "backend" - DO THIS NOW
🔄 Step 6: Add 5 environment variables - DO THIS NEXT
🔄 Step 7: Get backend URL - AFTER DEPLOYMENT
🔄 Step 8: Update mobile app - AFTER YOU GET URL

## All Values Ready

- Environment variables: `backend/ENV_VARS.txt`
- Update script: `backend/update-mobile-app.sh`
- Mobile config: `mobile/lib/config/api_config.dart`

**You're on the Settings page - complete Steps 5-6 now!**

