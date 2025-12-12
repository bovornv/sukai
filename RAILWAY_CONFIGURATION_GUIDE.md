# Railway Configuration Guide

## Current Status

✅ Step 1: Code pushed to GitHub - https://github.com/bovornv/sukai.git
✅ Step 2: Railway project created
🔄 Step 3: Need to add service from GitHub

## Step 3: Add Service from GitHub

Since the project is empty, you need to add a service:

### Option 1: Via Railway Dashboard

1. Click **"Add a New Service"** button (top right)
2. Select **"GitHub Repo"**
3. Search for: `bovornv/sukai`
4. Select the repository
5. Railway will start deploying automatically

### Option 2: Via Settings

1. Go to **Settings** tab
2. Look for **"Service"** section
3. Click **"Add Service"** or **"Connect GitHub"**
4. Select `bovornv/sukai` repository

## Step 4: Configure Service

After Railway creates the service:

1. **Click on the service** that was created
2. Go to **"Settings"** tab
3. Set **Root Directory**: `backend`
4. Set **Start Command**: `npm start` (optional)

## Step 5: Add Environment Variables

In the service **Settings** → **Variables** tab, add:

```
SUPABASE_URL = YOUR_SUPABASE_URL
SUPABASE_ANON_KEY = YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY = YOUR_SUPABASE_SERVICE_ROLE_KEY
PORT = 3000
NODE_ENV = production
```

## Step 6: Get Backend URL

1. Go to service **Settings** → **Networking**
2. Under **"Public Domain"**, Railway will show a URL
3. Copy it (e.g., `https://sukai-production.up.railway.app`)

## Step 7: Update Mobile App

```bash
cd backend
./update-mobile-app.sh https://your-backend-url.railway.app
```

## Quick Reference

- **Repository**: https://github.com/bovornv/sukai.git
- **Root Directory**: `backend`
- **Start Command**: `npm start`
- **Port**: `3000`

