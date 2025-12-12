# Complete Service Setup - "sukai"

## Current Status

✅ New service created from GitHub repo `bovornv/sukai`
📍 Currently on Settings page
📝 Service name: "pretty-recreation" (needs to be renamed)

## Step 4: Rename Service to "sukai"

**You're on the Settings page!**

1. Scroll to the top of the Settings page
2. Look for **"Service Name"** field (usually at the top)
3. Change from: `pretty-recreation`
4. To: `sukai`
5. Click **"Save"** or the save button

## Step 5: Configure Root Directory

Still on Settings page:

1. Scroll down to find **"Root Directory"** field
2. Enter: `backend`
3. Click **"Save"**

This tells Railway to build from the `backend` folder.

## Step 6: Add Environment Variables

1. Click on **"Variable"** tab (next to Settings)
2. Click **"New Variable"** button
3. Add each variable:

**Variable 1:**
- Name: `SUPABASE_URL`
- Value: `YOUR_SUPABASE_URL` (Get from Supabase Dashboard → Settings → API)
- Click "Add"

**Variable 2:**
- Name: `SUPABASE_ANON_KEY`
- Value: `YOUR_SUPABASE_ANON_KEY` (Get from Supabase Dashboard → Settings → API)
- Click "Add"

**Variable 3:**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `YOUR_SUPABASE_SERVICE_ROLE_KEY` (Get from Supabase Dashboard → Settings → API)
- Click "Add"

**Variable 4:**
- Name: `PORT`
- Value: `3000`
- Click "Add"

**Variable 5:**
- Name: `NODE_ENV`
- Value: `production`
- Click "Add"

## Step 7: Get Backend URL

After Railway redeploys successfully:

1. Go to **Settings** tab
2. Scroll to **"Networking"** section
3. Under **"Public Domain"**, Railway will show a URL
4. If no URL, click **"Generate Domain"**
5. Copy the URL (e.g., `https://sukai-production.up.railway.app`)

## Step 8: Update Mobile App

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

## Step 9: Rebuild Mobile App

```bash
cd ../mobile
flutter clean
flutter pub get
flutter run
```

## Quick Checklist

- [ ] Rename service to "sukai"
- [ ] Set root directory to "backend"
- [ ] Add all 5 environment variables
- [ ] Get backend URL
- [ ] Test backend: `curl https://your-url/health`
- [ ] Update mobile app config
- [ ] Rebuild Flutter app

## After Configuration

Railway will automatically:
- Redeploy with new settings
- Build from `backend` directory
- Use environment variables
- Generate a public URL

Wait 2-3 minutes for deployment to complete!

