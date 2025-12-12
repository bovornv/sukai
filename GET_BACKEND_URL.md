# Step 7: Get Backend URL

## You're on the Settings Page!

### Find the Networking Section

1. **Scroll down** on the Settings page
2. Look for **"Networking"** section
3. Under **"Public Domain"**, you should see a URL like:
   - `https://sukai-production.up.railway.app`
   - Or `https://sukai-production.railway.app`

### If No URL is Shown

1. Look for **"Generate Domain"** button
2. Click it
3. Railway will generate a domain automatically
4. Copy the URL

### Alternative: Check Service Overview

If you can't find it in Settings:

1. Go back to the service overview page
2. Look at the top of the page
3. Railway sometimes shows the URL there
4. Or check the **"Deployments"** tab - the URL might be shown there

## Step 8: Update Mobile App

Once you have the URL, run:

```bash
cd backend
./update-mobile-app.sh https://your-backend-url.railway.app
```

This will automatically:
- Update `mobile/lib/config/api_config.dart`
- Set `prodBaseUrl` to your Railway URL
- Set `isProduction = true`
- Create a backup

Then rebuild:
```bash
cd ../mobile
flutter clean && flutter pub get && flutter run
```

## Test Your Backend

After getting the URL:

```bash
curl https://your-backend-url.railway.app/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## Quick Checklist

- [ ] Found Networking section in Settings
- [ ] Copied backend URL
- [ ] Updated mobile app with URL
- [ ] Tested backend endpoint
- [ ] Rebuilt Flutter app

