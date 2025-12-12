# Deploy to Vercel

## Quick Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd backend
vercel

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NODE_ENV production
```

## Or Use Vercel Dashboard

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Set root directory to `backend`
5. Framework preset: Other
6. Build command: (leave empty)
7. Output directory: (leave empty)
8. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NODE_ENV=production`
9. Deploy

## Get Your Backend URL

After deployment:
1. Go to Vercel dashboard
2. Your project will have a URL like: `https://sukai-backend.vercel.app`
3. Update `mobile/lib/config/api_config.dart` with this URL

## Custom Domain (Optional)

1. In Vercel dashboard, go to Settings → Domains
2. Add your domain
3. Update DNS records as instructed

