# Quick Deploy Guide

## 🚀 Fastest Way: Railway

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login & Initialize
```bash
railway login
cd backend
railway init
```

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

### Step 5: Get Your URL
After deployment, Railway will show your URL. It will look like:
```
https://sukai-backend-production.up.railway.app
```

### Step 6: Update Mobile App
Update `mobile/lib/config/api_config.dart`:
```dart
static const String prodBaseUrl = 'https://your-railway-url.railway.app/api';
static const bool isProduction = true;
```

## ✅ Verification

After deployment, test your backend:
```bash
curl https://your-backend-url.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

## 📱 Mobile App Update

1. Open `mobile/lib/config/api_config.dart`
2. Update `prodBaseUrl` with your Railway URL
3. Set `isProduction = true`
4. Rebuild your Flutter app

## 🔍 Monitoring

### Set Up Sentry (Optional but Recommended)

1. Sign up at https://sentry.io (free)
2. Create Node.js project
3. Get DSN from project settings
4. Add to Railway:
   ```bash
   railway variables set SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```
5. Install Sentry (already in code, just needs DSN)

### Set Up Uptime Monitoring

1. Go to https://uptimerobot.com
2. Add new monitor:
   - Type: HTTP(s)
   - URL: Your Railway backend URL
   - Interval: 5 minutes
3. Get email alerts if backend goes down

## 🎉 Done!

Your backend is now live and your mobile app is configured!

