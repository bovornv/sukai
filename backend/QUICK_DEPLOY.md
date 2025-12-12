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
railway variables set SUPABASE_URL=https://uuuqpiaclmleclsylfqh.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjE0NDQsImV4cCI6MjA4MTA5NzQ0NH0.l1Zk76YxZsYOfsdAESZ0wA6D6nGu8G0UwxREkafOmec
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUyMTQ0NCwiZXhwIjoyMDgxMDk3NDQ0fQ.k4V_Di3qrnGY6QimlBCOrEVAe7OgsKVjYOGf3Y4z5pg
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

