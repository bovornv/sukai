# Quick Steps 6-8

## ✅ Step 5 Complete: railway.toml Created!

**Push to GitHub:**
```bash
git push origin main
```

Railway will automatically detect `railway.toml` and set root directory to `backend`!

## Step 6: Add Environment Variables

**In Railway Dashboard:**

1. Go to service **"sukai"**
2. Click **"Variable"** tab
3. Click **"New Variable"** button
4. Add these 5 variables:

### Quick Copy-Paste Values:

**1. SUPABASE_URL**
```
YOUR_SUPABASE_URL
```

**2. SUPABASE_ANON_KEY**
```
YOUR_SUPABASE_ANON_KEY
```

**3. SUPABASE_SERVICE_ROLE_KEY**
```
YOUR_SUPABASE_SERVICE_ROLE_KEY
```

**4. PORT**
```
3000
```

**5. NODE_ENV**
```
production
```

After adding all variables, Railway will automatically redeploy!

## Step 7: Get Backend URL

Wait 2-3 minutes for deployment, then:

1. Go to **Settings** tab
2. Scroll to **"Networking"** section
3. Under **"Public Domain"**, copy the URL
4. If no URL shown, click **"Generate Domain"**

Example: `https://sukai-production.up.railway.app`

## Step 8: Update Mobile App

Once you have the URL:

```bash
cd backend
./update-mobile-app.sh https://your-backend-url.railway.app
```

Then rebuild:
```bash
cd ../mobile
flutter clean && flutter pub get && flutter run
```

## Test

```bash
curl https://your-backend-url.railway.app/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## Summary

✅ Step 5: railway.toml created (push to GitHub)
🔄 Step 6: Add 5 environment variables (DO THIS NOW)
🔄 Step 7: Get backend URL (after deployment)
🔄 Step 8: Update mobile app (after you get URL)

**All environment variable values are ready - just copy and paste!**

