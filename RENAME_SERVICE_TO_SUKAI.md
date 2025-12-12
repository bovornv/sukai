# Rename Service to "sukai"

## Current Status

Railway is deploying a new service from GitHub repo `bovornv/sukai`.

## Option 1: Rename Existing Service (After Deployment)

Once the service is created:

1. Click on the service (it might be named "ukai" or "sukai" based on repo)
2. Go to **Settings** tab
3. Find **"Service Name"** field
4. Change it to: `sukai`
5. Click **Save**

## Option 2: Delete "ukai" Service and Keep New One

If Railway creates a service named "sukai" automatically:

1. Delete the old "ukai" service:
   - Click on "ukai" service
   - Go to Settings
   - Scroll to bottom
   - Click "Delete Service"

2. Keep the new "sukai" service

## Option 3: Configure New Service

After the new service is created:

1. **Set Root Directory**: `backend`
2. **Add Environment Variables** (see below)
3. **Get Backend URL**

## Environment Variables to Add

```
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
PORT=3000
NODE_ENV=production
```

## Next Steps

1. Wait for deployment to complete
2. Check service name
3. Rename if needed to "sukai"
4. Configure root directory: `backend`
5. Add environment variables
6. Get backend URL

