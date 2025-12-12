# Deploy to Render

## Steps

1. Go to https://render.com
2. Sign up/Login
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: sukai-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`

6. Add Environment Variables:
   - `SUPABASE_URL` = `https://uuuqpiaclmleclsylfqh.supabase.co`
   - `SUPABASE_ANON_KEY` = (your anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)
   - `PORT` = `3000`
   - `NODE_ENV` = `production`

7. Click "Create Web Service"

## Get Your Backend URL

After deployment:
1. Render will provide a URL like: `https://sukai-backend.onrender.com`
2. Update `mobile/lib/config/api_config.dart` with this URL

## Free Tier Notes

- Render free tier spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Consider upgrading for production use

