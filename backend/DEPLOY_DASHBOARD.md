# Deploy via Railway Dashboard (Easiest Method)

Since Railway CLI requires interactive steps, using the dashboard is faster!

## Step-by-Step Dashboard Deployment

### Step 1: Go to Railway Dashboard

1. Open https://railway.app
2. Make sure you're logged in

### Step 2: Create New Project

1. Click **"New Project"** (top right)
2. Select **"Deploy from GitHub repo"**
3. Connect your GitHub account (if not already connected)
4. Select your repository: `sukai` (or your repo name)
5. Click **"Deploy Now"**

### Step 3: Configure Service

1. Railway will detect it's a Node.js project
2. Click on the service that was created
3. Go to **"Settings"** tab
4. Set **Root Directory** to: `backend`
5. Set **Start Command** to: `npm start`

### Step 4: Add Environment Variables

1. Still in Settings, go to **"Variables"** tab
2. Click **"New Variable"** for each:

```
SUPABASE_URL = https://uuuqpiaclmleclsylfqh.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjE0NDQsImV4cCI6MjA4MTA5NzQ0NH0.l1Zk76YxZsYOfsdAESZ0wA6D6nGu8G0UwxREkafOmec
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUyMTQ0NCwiZXhwIjoyMDgxMDk3NDQ0fQ.k4V_Di3qrnGY6QimlBCOrEVAe7OgsKVjYOGf3Y4z5pg
PORT = 3000
NODE_ENV = production
```

### Step 5: Get Your Backend URL

1. Go to **"Settings"** → **"Networking"**
2. Under **"Public Domain"**, Railway will generate a URL
3. Copy this URL (e.g., `https://sukai-backend-production.up.railway.app`)

Or Railway will show it in the service overview.

### Step 6: Test Your Backend

```bash
curl https://your-backend-url.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### Step 7: Update Mobile App

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

### Step 8: Rebuild Mobile App

```bash
cd ../mobile
flutter clean
flutter pub get
flutter run
```

## ✅ Done!

Your backend is live and mobile app is connected!

## Troubleshooting

**Deployment fails?**
- Check logs in Railway dashboard → "Deployments" → Click latest → View logs
- Verify environment variables are set correctly
- Check root directory is set to `backend`

**Can't find URL?**
- Go to Settings → Networking
- Enable "Generate Domain" if not enabled
- Copy the generated domain

**Backend not responding?**
- Check deployment logs
- Verify PORT is set to 3000
- Wait 1-2 minutes after deployment

