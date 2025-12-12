# 🚀 Deploy Now - Simple Steps

## You're Logged In! ✅

Since Railway CLI requires interactive steps, use the **Dashboard** (fastest):

### Step 1: Open Railway Dashboard

Go to: https://railway.app/dashboard

### Step 2: Create New Project

1. Click **"New Project"** button (top right)
2. Select **"Deploy from GitHub repo"**
3. Connect GitHub (if not already)
4. Select your `sukai` repository
5. Click **"Deploy Now"**

### Step 3: Configure Service

1. Railway creates a service automatically
2. Click on the service
3. Go to **"Settings"** tab
4. Set **Root Directory**: `backend`
5. Set **Start Command**: `npm start` (optional, auto-detected)

### Step 4: Add Environment Variables

In **Settings** → **Variables** tab, add:

```
SUPABASE_URL=https://uuuqpiaclmleclsylfqh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjE0NDQsImV4cCI6MjA4MTA5NzQ0NH0.l1Zk76YxZsYOfsdAESZ0wA6D6nGu8G0UwxREkafOmec
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUyMTQ0NCwiZXhwIjoyMDgxMDk3NDQ0fQ.k4V_Di3qrnGY6QimlBCOrEVAe7OgsKVjYOGf3Y4z5pg
PORT=3000
NODE_ENV=production
```

### Step 5: Get Your Backend URL

1. Go to **Settings** → **Networking**
2. Under **"Public Domain"**, Railway generates a URL
3. Copy it (e.g., `https://sukai-backend-production.up.railway.app`)

### Step 6: Update Mobile App

Run this command with your Railway URL:

```bash
cd backend
./update-mobile-app.sh https://your-backend-url.railway.app
```

Or manually edit `mobile/lib/config/api_config.dart`:
```dart
static const String prodBaseUrl = 'https://your-backend-url.railway.app/api';
static const bool isProduction = true;
```

### Step 7: Rebuild Mobile App

```bash
cd ../mobile
flutter clean
flutter pub get
flutter run
```

## ✅ Done!

Your backend is live and mobile app is connected!

