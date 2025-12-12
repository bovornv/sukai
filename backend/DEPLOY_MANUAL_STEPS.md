# Manual Deployment Steps

Since Railway CLI requires interactive authentication, here are the exact commands to run:

## Step 1: Login (You've done this ✅)

```bash
railway login
```

## Step 2: Initialize Project

```bash
railway init
```

Choose "New Project" when prompted.

## Step 3: Link to Project (if needed)

If you already have a project, link it:
```bash
railway link
```

## Step 4: Set Environment Variables

Railway CLI v4 uses a different syntax. Use the Railway dashboard instead:

1. Go to https://railway.app
2. Click your project
3. Click your service (or create one)
4. Go to "Variables" tab
5. Add these variables:

```
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
PORT=3000
NODE_ENV=production
```

## Step 5: Deploy

```bash
railway up
```

Or use Railway dashboard:
1. Go to your project
2. Click "Deploy" or it will auto-deploy

## Step 6: Get Your URL

In Railway dashboard:
1. Click your service
2. Go to "Settings" → "Networking"
3. Copy the generated domain

Or run:
```bash
railway domain
```

## Step 7: Update Mobile App

Once you have your URL:
```bash
./update-mobile-app.sh https://your-backend-url.railway.app
```

## Alternative: Use Railway Dashboard (Easier)

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your repository
5. Set root directory: `backend`
6. Add environment variables (see Step 4)
7. Railway auto-deploys!

