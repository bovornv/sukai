# Deploy to Railway

## Quick Deploy

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Link to existing project (or create new)
railway link

# Set environment variables
railway variables set SUPABASE_URL=YOUR_SUPABASE_URL
railway variables set SUPABASE_ANON_KEY=your-anon-key
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
railway variables set PORT=3000
railway variables set NODE_ENV=production

# Deploy
railway up
```

## Or Use Railway Dashboard

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo" (or "Empty Project")
4. Connect your repository
5. Set root directory to `backend`
6. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PORT=3000`
   - `NODE_ENV=production`
7. Railway will auto-detect Node.js and deploy

## Get Your Backend URL

After deployment:
1. Go to Railway dashboard
2. Click on your service
3. Copy the generated URL (e.g., `https://sukai-backend.railway.app`)
4. Update `mobile/lib/config/api_config.dart` with this URL

## Custom Domain (Optional)

1. In Railway dashboard, go to Settings
2. Add custom domain
3. Update DNS records as instructed

