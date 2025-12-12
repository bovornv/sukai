# 🔒 Security Fix: Rotate Supabase Keys

## ⚠️ CRITICAL: Keys Have Been Leaked

GitHub detected that your Supabase Service Keys were publicly exposed in the repository. **You must rotate these keys immediately.**

## Immediate Actions Required

### Step 1: Rotate Keys in Supabase (DO THIS FIRST!)

1. Go to your Supabase Dashboard:
   - https://supabase.com/dashboard/project/uuuqpiaclmleclsylfqh/settings/api

2. **Rotate the Service Role Key:**
   - Scroll to "Service Role" section
   - Click **"Reset service role key"** or **"Rotate"**
   - Copy the NEW key immediately (you won't see it again!)

3. **Rotate the Anon Key (if needed):**
   - Scroll to "Project API keys" section
   - Click **"Reset anon key"** or **"Rotate"**
   - Copy the NEW key

### Step 2: Update Railway Environment Variables

1. Go to Railway → Service "sukai" → Variables
2. Update these variables with your NEW keys:
   - `SUPABASE_ANON_KEY` → New anon key
   - `SUPABASE_SERVICE_ROLE_KEY` → New service role key
3. Railway will automatically redeploy with new keys

### Step 3: Update Local .env File

Update `backend/.env` with your NEW keys:
```env
SUPABASE_URL=https://uuuqpiaclmleclsylfqh.supabase.co
SUPABASE_ANON_KEY=YOUR_NEW_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_NEW_SERVICE_ROLE_KEY
PORT=3000
NODE_ENV=production
```

### Step 4: Remove Keys from Git History

The keys have been removed from all files, but they're still in git history. To fully remove them:

```bash
# Option 1: Force push (if you're the only contributor)
git add .
git commit -m "Remove exposed Supabase keys"
git push origin main

# Option 2: Use git-filter-repo (more thorough)
# This removes keys from entire git history
git filter-repo --invert-paths --path backend/deploy-commands.txt
git filter-repo --invert-paths --path backend/deploy-commands.sh
git filter-repo --invert-paths --path backend/ENV_VARS.txt
git push origin main --force
```

⚠️ **Warning:** Option 2 rewrites git history. Only use if you're the only contributor!

### Step 5: Close GitHub Alert

1. Go to GitHub → Repository → Security → Secret scanning alerts
2. Click on the alert
3. Mark as **"Revoked"** (after rotating keys)
4. Click **"Close alert"**

## What Was Fixed

✅ Removed all actual keys from:
- `backend/deploy-commands.txt`
- `backend/deploy-commands.sh`
- `backend/ENV_VARS.txt`
- All other documentation files

✅ Replaced with placeholders:
- `YOUR_SUPABASE_URL`
- `YOUR_SUPABASE_ANON_KEY`
- `YOUR_SUPABASE_SERVICE_ROLE_KEY`

✅ Added `.gitignore` to prevent future leaks:
- `.env` files
- `*ENV_VARS*` files
- `*deploy-commands*` files

## Prevention

**Never commit secrets to git!**

- ✅ Use environment variables
- ✅ Use `.env` files (already in `.gitignore`)
- ✅ Use Railway/Render/etc. environment variable settings
- ❌ Never put keys in code or documentation
- ❌ Never commit `.env` files

## Files Updated

All files with exposed keys have been updated:
- Documentation files (`.md`)
- Script files (`.sh`)
- Config files (`.txt`)

Keys are now replaced with placeholders.

## Next Steps

1. ✅ Rotate keys in Supabase (CRITICAL!)
2. ✅ Update Railway environment variables
3. ✅ Update local `.env` file
4. ✅ Commit and push changes
5. ✅ Close GitHub alert

Your backend will continue working once you update Railway with the new keys!

