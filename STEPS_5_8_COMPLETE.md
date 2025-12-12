# Complete Steps 5-8

## ✅ Step 5: Root Directory - SOLVED!

I've created `railway.toml` file that automatically configures:
- Root Directory: `backend`
- Start Command: `npm start`

**The file is created locally. Push it to GitHub:**

```bash
git add railway.toml
git commit -m "Add railway.toml configuration"
git push origin main
```

Railway will automatically detect this file and configure the service!

## Step 6: Add Environment Variables

**Go to Railway → Service "sukai" → Variable tab:**

1. Click **"Variable"** tab
2. Click **"New Variable"** for each:

### Copy these values:

**Variable 1:**
- Name: `SUPABASE_URL`
- Value: `YOUR_SUPABASE_URL`

**Variable 2:**
- Name: `SUPABASE_ANON_KEY`
- Value: `YOUR_SUPABASE_ANON_KEY`

**Variable 3:**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `YOUR_SUPABASE_SERVICE_ROLE_KEY`

**Variable 4:**
- Name: `PORT`
- Value: `3000`

**Variable 5:**
- Name: `NODE_ENV`
- Value: `production`

**💡 All values are in `backend/ENV_VARS.txt`**

## Step 7: Get Backend URL

After Railway redeploys (wait 2-3 minutes):

1. Go to **Settings** tab
2. Scroll to **"Networking"** section
3. Under **"Public Domain"**, copy the URL
4. If no URL, click **"Generate Domain"**

Example URL: `https://sukai-production.up.railway.app`

## Step 8: Update Mobile App

Once you have your Railway URL:

```bash
cd backend
./update-mobile-app.sh https://your-backend-url.railway.app
```

Then rebuild:
```bash
cd ../mobile
flutter clean
flutter pub get
flutter run
```

## Quick Checklist

- [x] Step 5: railway.toml created (push to GitHub)
- [ ] Step 6: Add 5 environment variables
- [ ] Step 7: Get backend URL
- [ ] Step 8: Update mobile app

## Test Your Backend

After deployment:
```bash
curl https://your-backend-url.railway.app/health
```

Should return: `{"status":"ok","timestamp":"..."}`

