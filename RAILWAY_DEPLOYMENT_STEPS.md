# Railway Dashboard Deployment - Step by Step

## Current Progress

✅ Step 1: Opened Railway Dashboard
✅ Step 2: Clicked "New Project"  
✅ Step 3: Selected "GitHub Repository"
🔄 Step 4: Configure GitHub App (in progress)

## Next Steps

### Step 4: Connect GitHub (Current Step)

1. Railway will ask you to connect GitHub
2. Click "Configure GitHub App" or "Connect GitHub"
3. Authorize Railway to access your repositories
4. Select the repositories you want Railway to access

### Step 5: Select Your Repository

1. After connecting GitHub, search for your repository
2. Type: `sukai` (or your repo name)
3. Select your repository from the list
4. Click "Deploy"

### Step 6: Configure Service

After Railway creates the service:

1. Click on the service that was created
2. Go to **"Settings"** tab
3. Set **Root Directory**: `backend`
4. Set **Start Command**: `npm start` (optional)

### Step 7: Add Environment Variables

In **Settings** → **Variables** tab, click **"New Variable"** for each:

```
SUPABASE_URL = https://uuuqpiaclmleclsylfqh.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjE0NDQsImV4cCI6MjA4MTA5NzQ0NH0.l1Zk76YxZsYOfsdAESZ0wA6D6nGu8G0UwxREkafOmec
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUyMTQ0NCwiZXhwIjoyMDgxMDk3NDQ0fQ.k4V_Di3qrnGY6QimlBCOrEVAe7OgsKVjYOGf3Y4z5pg
PORT = 3000
NODE_ENV = production
```

### Step 8: Get Your Backend URL

1. Go to **Settings** → **Networking**
2. Under **"Public Domain"**, Railway will show a URL
3. Copy it (e.g., `https://sukai-backend-production.up.railway.app`)

### Step 9: Update Mobile App

Run this command with your Railway URL:

```bash
cd backend
./update-mobile-app.sh https://your-backend-url.railway.app
```

### Step 10: Rebuild Mobile App

```bash
cd ../mobile
flutter clean
flutter pub get
flutter run
```

## Current Status

🔄 **Connecting GitHub** - Follow the prompts in Railway dashboard

After GitHub is connected, Railway will show your repositories and you can select `sukai` to deploy!

