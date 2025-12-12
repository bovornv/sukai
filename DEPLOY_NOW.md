# 🚀 Deploy Now - Final Instructions

## Step-by-Step Deployment

### Step 1: Login to Railway (Required)

Open your terminal and run:

```bash
cd backend
railway login
```

This will:
- Open your browser
- Ask you to authenticate
- Link your terminal to Railway

**After logging in, continue to Step 2.**

### Step 2: Deploy (Automated)

Once logged in, run:

```bash
./QUICK_DEPLOY.sh
```

This script will:
1. ✅ Check Railway login
2. ✅ Initialize project (if needed)
3. ✅ Set all environment variables
4. ✅ Deploy backend
5. ✅ Get backend URL
6. ✅ Test backend
7. ✅ Update mobile app automatically

### Step 3: Verify

After deployment:

1. **Test backend:**
   ```bash
   curl https://your-backend-url.railway.app/health
   ```

2. **Rebuild mobile app:**
   ```bash
   cd ../mobile
   flutter clean
   flutter pub get
   flutter run
   ```

## Alternative: Manual Deployment

If you prefer manual steps:

```bash
# 1. Login
railway login

# 2. Initialize
railway init

# 3. Set environment variables
railway variables set SUPABASE_URL=YOUR_SUPABASE_URL
railway variables set SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
railway variables set SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
railway variables set PORT=3000
railway variables set NODE_ENV=production

# 4. Deploy
railway up

# 5. Get URL
railway domain

# 6. Update mobile app
./update-mobile-app.sh https://your-backend-url.railway.app
```

## Quick Start (2 Commands)

```bash
# Command 1: Login (opens browser)
cd backend && railway login

# Command 2: Deploy (after login)
./QUICK_DEPLOY.sh
```

That's it! 🎉

## Troubleshooting

**"Not logged in" error?**
- Run `railway login` first
- Complete browser authentication

**Deployment fails?**
- Check logs: `railway logs`
- Verify env vars: `railway variables`

**Can't get URL?**
- Check Railway dashboard: https://railway.app
- Go to your project → Service → Domains

## After Deployment

✅ Backend is live
✅ Mobile app updated
✅ Ready to test!

Next: Rebuild Flutter app and test!

