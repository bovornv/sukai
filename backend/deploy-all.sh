#!/bin/bash
# Complete Railway Deployment Script
# This will guide you through deployment

set -e

echo "🚀 Railway Deployment Script"
echo "============================"
echo ""

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo "Installing..."
    npm install -g @railway/cli
fi

echo "✅ Railway CLI ready"
echo ""

# Step 1: Login
echo "Step 1: Login to Railway"
echo "This will open your browser..."
echo ""
read -p "Press Enter to login (or Ctrl+C to cancel)..."
railway login

echo ""
echo "✅ Logged in!"
echo ""

# Step 2: Initialize
echo "Step 2: Initialize Railway project"
echo ""
read -p "Press Enter to initialize..."
railway init

echo ""
echo "✅ Project initialized!"
echo ""

# Step 3: Set environment variables
echo "Step 3: Setting environment variables..."
echo ""

echo "⚠️  IMPORTANT: Replace placeholders with your actual Supabase keys!"
echo "   Get them from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"
railway variables set SUPABASE_URL=YOUR_SUPABASE_URL
railway variables set SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
railway variables set SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
railway variables set PORT=3000
railway variables set NODE_ENV=production

echo ""
echo "✅ Environment variables set!"
echo ""

# Step 4: Deploy
echo "Step 4: Deploying to Railway..."
echo ""
read -p "Press Enter to deploy..."
railway up

echo ""
echo "✅ Deployment started!"
echo ""

# Step 5: Get URL
echo "Step 5: Getting your backend URL..."
echo ""
BACKEND_URL=$(railway domain 2>/dev/null | head -1 | tr -d ' ' || echo "")

if [ -z "$BACKEND_URL" ]; then
    echo "⚠️  Could not get URL automatically"
    echo "Please run: railway domain"
    echo "Or check Railway dashboard: https://railway.app"
    echo ""
    read -p "Enter your Railway backend URL: " BACKEND_URL
fi

echo ""
echo "✅ Backend URL: $BACKEND_URL"
echo ""

# Step 6: Test
echo "Step 6: Testing backend..."
echo ""
curl -s "$BACKEND_URL/health" && echo "" || echo "⚠️  Backend not responding yet (may need a minute)"

echo ""
echo "Step 7: Updating mobile app..."
echo ""

if [ -f "./update-mobile-app.sh" ]; then
    ./update-mobile-app.sh "$BACKEND_URL"
else
    echo "⚠️  Update script not found"
    echo "Please manually update mobile/lib/config/api_config.dart"
    echo "Set prodBaseUrl = '$BACKEND_URL/api'"
    echo "Set isProduction = true"
fi

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Test backend: curl $BACKEND_URL/health"
echo "2. Rebuild mobile app: cd ../mobile && flutter clean && flutter pub get && flutter run"
echo "3. Test mobile app connects to backend"
echo ""

