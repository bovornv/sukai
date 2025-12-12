# Deploy to Railway - Step by Step

## Quick Deploy (5 minutes)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login
```bash
railway login
```
This will open your browser to authenticate.

### Step 3: Initialize Project
```bash
cd backend
railway init
```
Choose:
- **New Project** (if first time)
- **Existing Project** (if you have one)

### Step 4: Set Environment Variables
```bash
railway variables set SUPABASE_URL=https://uuuqpiaclmleclsylfqh.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjE0NDQsImV4cCI6MjA4MTA5NzQ0NH0.l1Zk76YxZsYOfsdAESZ0wA6D6nGu8G0UwxREkafOmec
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUyMTQ0NCwiZXhwIjoyMDgxMDk3NDQ0fQ.k4V_Di3qrnGY6QimlBCOrEVAe7OgsKVjYOGf3Y4z5pg
railway variables set PORT=3000
railway variables set NODE_ENV=production
```

### Step 5: Deploy
```bash
railway up
```

Railway will:
1. Build your project
2. Deploy it
3. Give you a URL like: `https://sukai-backend-production.up.railway.app`

### Step 6: Get Your URL
```bash
railway domain
```

Or check Railway dashboard:
1. Go to https://railway.app
2. Click your project
3. Click your service
4. Copy the URL from "Domains" section

### Step 7: Test Your Backend
```bash
curl https://your-backend-url.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### Step 8: Update Mobile App

Update `mobile/lib/config/api_config.dart`:

```dart
class ApiConfig {
  // Development
  static const String devBaseUrl = 'http://localhost:3000/api';
  
  // Production - UPDATE THIS with your Railway URL
  static const String prodBaseUrl = 'https://your-backend-url.railway.app/api';
  
  // Current environment - SET TO TRUE for production
  static const bool isProduction = true;
  
  // ... rest of the code
}
```

## Alternative: Use Railway Dashboard

If you prefer GUI:

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your repository
5. Set root directory to `backend`
6. Add environment variables (same as Step 4 above)
7. Railway will auto-deploy

## Troubleshooting

**Build fails?**
- Check Railway logs: `railway logs`
- Verify Node.js version (should be 18+)

**Environment variables not set?**
- Check: `railway variables`
- Set missing ones: `railway variables set KEY=value`

**Can't connect to backend?**
- Check Railway service is running
- Verify environment variables are set
- Check logs: `railway logs`

## Next Steps

After deployment:
1. ✅ Test backend: `curl https://your-url/health`
2. ✅ Update mobile app config
3. ✅ Test mobile app connects to backend
4. ✅ Set up monitoring (Sentry, UptimeRobot)

🎉 **You're live!**

