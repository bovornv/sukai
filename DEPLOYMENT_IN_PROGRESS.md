# 🚀 Deployment In Progress

## Current Status

✅ Railway CLI installed and ready
✅ Environment variables prepared
✅ Deployment scripts created
✅ Mobile app update script ready

## Next Steps

### 1. Login to Railway

Run this command in your terminal:
```bash
cd backend
railway login
```

This will:
- Open your browser
- Ask you to authenticate with Railway
- Link your terminal to Railway account

**After logging in, continue to step 2.**

### 2. Initialize Project

```bash
railway init
```

Choose:
- **"New Project"** (recommended for first time)
- Or select existing project if you have one

### 3. Set Environment Variables

Run these commands (they're already prepared):

```bash
railway variables set SUPABASE_URL=https://uuuqpiaclmleclsylfqh.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjE0NDQsImV4cCI6MjA4MTA5NzQ0NH0.l1Zk76YxZsYOfsdAESZ0wA6D6nGu8G0UwxREkafOmec
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUyMTQ0NCwiZXhwIjoyMDgxMDk3NDQ0fQ.k4V_Di3qrnGY6QimlBCOrEVAe7OgsKVjYOGf3Y4z5pg
railway variables set PORT=3000
railway variables set NODE_ENV=production
```

### 4. Deploy

```bash
railway up
```

This will:
- Build your backend
- Deploy to Railway
- Take 2-3 minutes

### 5. Get Your Backend URL

```bash
railway domain
```

You'll get a URL like:
```
https://sukai-backend-production.up.railway.app
```

**Copy this URL!** You'll need it for the mobile app.

### 6. Test Your Backend

```bash
curl https://your-backend-url.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### 7. Update Mobile App

Once you have your Railway URL, run:

```bash
./update-mobile-app.sh https://your-backend-url.railway.app
```

This automatically updates the mobile app config!

### 8. Rebuild Mobile App

```bash
cd ../mobile
flutter clean
flutter pub get
flutter run
```

## Quick Commands Summary

```bash
# All in one go (after login):
cd backend
railway init
railway variables set SUPABASE_URL=https://uuuqpiaclmleclsylfqh.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjE0NDQsImV4cCI6MjA4MTA5NzQ0NH0.l1Zk76YxZsYOfsdAESZ0wA6D6nGu8G0UwxREkafOmec
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUyMTQ0NCwiZXhwIjoyMDgxMDk3NDQ0fQ.k4V_Di3qrnGY6QimlBCOrEVAe7OgsKVjYOGf3Y4z5pg
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway up
railway domain
./update-mobile-app.sh $(railway domain | head -1)
```

## Troubleshooting

**Railway CLI not found?**
- Open a new terminal
- Or: `export PATH="$PATH:$(npm config get prefix)/bin"`

**Login fails?**
- Make sure browser opens
- Complete authentication in browser
- Return to terminal

**Deployment fails?**
- Check logs: `railway logs`
- Verify environment variables: `railway variables`

## 🎯 Start Now

Run: `railway login`

Then follow the steps above!

