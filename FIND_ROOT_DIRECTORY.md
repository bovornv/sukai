# Finding Root Directory Field in Railway

## Where to Look

The "Root Directory" field might be in different locations:

### Option 1: Under "Source" Section
1. Scroll down on Settings page
2. Look for **"Source"** section
3. Find **"Root Directory"** or **"Working Directory"** field

### Option 2: Under "Build & Deploy" Section
1. Scroll to **"Build & Deploy"** section
2. Look for **"Root Directory"** field

### Option 3: Under "Deploy" Tab
1. Click on **"Deployments"** tab
2. Look for deployment settings
3. Find **"Root Directory"** option

### Option 4: Use railway.toml File (Alternative)

If you can't find the field, create a `railway.toml` file in your repo root:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
rootDirectory = "backend"
```

Then commit and push:
```bash
cd /Users/bovorn/Desktop/aurasea/Projects/sukai
echo '[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
rootDirectory = "backend"' > railway.toml

git add railway.toml
git commit -m "Add railway.toml with root directory"
git push origin main
```

Railway will automatically detect this file!

## Alternative: Skip Root Directory (If Not Found)

If Railway can't find the root directory field, you can:

1. **Move backend files to root** (not recommended)
2. **Use railway.toml** (recommended - see above)
3. **Check if Railway auto-detected** - Sometimes Railway detects Node.js projects automatically

## Quick Check

Look for these field names:
- "Root Directory"
- "Working Directory"  
- "Source Root"
- "Build Root"
- "Base Directory"

## Next Steps After Finding It

1. Enter: `backend`
2. Click Save
3. Railway will redeploy automatically

## If Still Can't Find It

Use the `railway.toml` method above - it's the most reliable way!

