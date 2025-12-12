# Deployment Next Steps

## Current Status

✅ GitHub connected to Railway
✅ Selected repository: bovornv/ukai
⚠️ Repository appears empty on GitHub

## Step 1: Push Code to GitHub (If Needed)

If your code isn't on GitHub yet, push it:

```bash
cd /Users/bovorn/Desktop/aurasea/Projects/sukai

# Initialize git if needed
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - SukAI backend"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/bovornv/ukai.git

# Push to GitHub
git push -u origin main
```

Or if you already have a remote:
```bash
git push origin main
```

## Step 2: Deploy on Railway

After pushing code to GitHub:

1. **Go back to Railway dashboard**
2. **Refresh the page** or click "Deploy" again
3. Railway will detect your code and start deploying

## Step 3: Configure Service

Once Railway creates the service:

1. **Click on the service** that was created
2. Go to **"Settings"** tab
3. Set **Root Directory**: `backend`
4. Set **Start Command**: `npm start` (optional, auto-detected)

## Step 4: Add Environment Variables

In **Settings** → **Variables** tab, click **"New Variable"** for each:

```
SUPABASE_URL = https://uuuqpiaclmleclsylfqh.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjE0NDQsImV4cCI6MjA4MTA5NzQ0NH0.l1Zk76YxZsYOfsdAESZ0wA6D6nGu8G0UwxREkafOmec
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUyMTQ0NCwiZXhwIjoyMDgxMDk3NDQ0fQ.k4V_Di3qrnGY6QimlBCOrEVAe7OgsKVjYOGf3Y4z5pg
PORT = 3000
NODE_ENV = production
```

## Step 5: Get Your Backend URL

1. Go to **Settings** → **Networking**
2. Under **"Public Domain"**, Railway will show a URL
3. Copy it (e.g., `https://ukai-production.up.railway.app`)

## Step 6: Test Your Backend

```bash
curl https://your-backend-url.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

## Step 7: Update Mobile App

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

## Step 8: Rebuild Mobile App

```bash
cd ../mobile
flutter clean
flutter pub get
flutter run
```

## Troubleshooting

**Repository is empty?**
- Push your code to GitHub first
- Make sure you're pushing to the correct repository

**Deployment fails?**
- Check Railway logs: Click service → "Deployments" → Latest → View logs
- Verify environment variables are set correctly
- Check root directory is set to `backend`

**Can't find URL?**
- Go to Settings → Networking
- Enable "Generate Domain" if not enabled
- Copy the generated domain

