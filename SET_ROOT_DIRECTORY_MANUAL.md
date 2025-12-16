# Set Root Directory in Railway - Manual Steps

## ⚠️ Important: You're on the Wrong Page!

You were looking at **Project Settings**, but you need **Service Settings**.

## ✅ Correct Navigation Path

1. **Go to Railway Dashboard:**
   - https://railway.app

2. **Click on your project:**
   - Click on "harmonious-encouragement" or your project name

3. **Click on the SERVICE (not project):**
   - Click on service **"sukai"** (the actual service, not project settings)

4. **Go to Service Settings:**
   - Click **"Settings"** tab (at the top navigation)
   - You should see "sukai | Railway" in the title

5. **Find Root Directory:**
   - Scroll down the Settings page
   - Look for **"Source"** section
   - Find **"Root Directory"** heading
   - Click **"Add Root Directory"** button (if not already set)

6. **Set Root Directory:**
   - A dialog or input field will appear
   - Type: `backend`
   - Click **"Save"** or **"Update"**

7. **Verify:**
   - The Root Directory should now show: `backend`
   - Railway will automatically redeploy

## Visual Guide

**Wrong Page (Project Settings):**
- Title: "Project Settings"
- Shows: Visibility, Generate Template, Transfer Project
- ❌ No Root Directory here!

**Correct Page (Service Settings):**
- Title: "sukai | Railway" 
- Shows: Source Repo, Root Directory, Build, Networking
- ✅ Root Directory is here!

## Quick URL

Direct link to Service Settings:
```
https://railway.com/project/954e785a-edda-4de2-a5ba-a6df454b4989/service/0dfd874f-d458-40bd-85b2-a28cb96cadcd/settings
```

## After Setting Root Directory

1. Railway will auto-redeploy
2. Check **"Deployments"** tab
3. Should now build from `backend/` directory ✅
4. Test: `curl https://sukai-production.up.railway.app/health`

