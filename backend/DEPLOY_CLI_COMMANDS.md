# Railway CLI Deployment Commands

Since you're logged in, here are the exact commands to run:

## Step 1: Initialize Project (Interactive)

```bash
cd backend
railway init
```

When prompted:
- Choose "New Project" (or select existing)
- Select environment (usually "production")

## Step 2: Set Environment Variables

Railway CLI v4 uses `--set` flag:

```bash
railway variables --set "SUPABASE_URL=YOUR_SUPABASE_URL" \
  --set "SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY" \
  --set "SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY" \
  --set "PORT=3000" \
  --set "NODE_ENV=production"
```

## Step 3: Deploy

```bash
railway up
```

## Step 4: Get Your URL

```bash
railway domain
```

Or check Railway dashboard for the URL.

## Step 5: Update Mobile App

```bash
./update-mobile-app.sh https://your-backend-url.railway.app
```

## All Commands Together

```bash
cd backend
railway init
railway variables --set "SUPABASE_URL=YOUR_SUPABASE_URL" --set "SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY" --set "SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY" --set "PORT=3000" --set "NODE_ENV=production"
railway up
railway domain
```

