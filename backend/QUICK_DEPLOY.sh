#!/bin/bash
# Quick Deploy Script - Run this after railway login

set -e

echo "🚀 Quick Railway Deployment"
echo "==========================="
echo ""

# Check if logged in
if ! railway whoami &>/dev/null; then
    echo "❌ Not logged in to Railway"
    echo ""
    echo "Please run first:"
    echo "  railway login"
    echo ""
    exit 1
fi

echo "✅ Logged in to Railway"
echo ""

# Check if project initialized
if [ ! -f ".railway" ]; then
    echo "📦 Initializing Railway project..."
    railway init
    echo ""
fi

echo "✅ Project ready"
echo ""

# Set environment variables (Railway CLI v4 syntax)
echo "🔧 Setting environment variables..."
echo "⚠️  IMPORTANT: Replace placeholders with your actual Supabase keys!"
echo "   Get them from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"
echo ""
railway variables --set "SUPABASE_URL=YOUR_SUPABASE_URL" \
  --set "SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY" \
  --set "SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY" \
  --set "PORT=3000" \
  --set "NODE_ENV=production"

echo "✅ Environment variables set"
echo ""

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment complete!"
echo ""

# Get URL
echo "📡 Getting your backend URL..."
BACKEND_URL=$(railway domain 2>/dev/null | grep -v "^$" | head -1 | xargs || echo "")

if [ -z "$BACKEND_URL" ]; then
    echo "⚠️  Could not get URL automatically"
    echo "Please run: railway domain"
    echo "Or check Railway dashboard"
else
    echo "✅ Backend URL: $BACKEND_URL"
    echo ""
    
    # Test backend
    echo "🧪 Testing backend..."
    sleep 2
    if curl -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
        echo "✅ Backend is responding!"
        curl -s "${BACKEND_URL}/health" | head -1
    else
        echo "⚠️  Backend may need a minute to start"
    fi
    
    echo ""
    echo "📱 Updating mobile app..."
    if [ -f "./update-mobile-app.sh" ]; then
        ./update-mobile-app.sh "$BACKEND_URL"
    else
        echo "⚠️  Update script not found"
        echo "Please manually update mobile/lib/config/api_config.dart"
        echo "Set prodBaseUrl = '$BACKEND_URL/api'"
        echo "Set isProduction = true"
    fi
fi

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Test backend: curl $BACKEND_URL/health"
echo "2. Rebuild mobile: cd ../mobile && flutter clean && flutter pub get && flutter run"
echo ""

