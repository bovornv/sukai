#!/bin/bash
# Run Next Steps: Test Backend and Rebuild Flutter App

echo "🚀 Running Next Steps"
echo "===================="
echo ""

# Step 1: Test Backend
echo "Step 1: Testing Backend Health..."
echo ""
HEALTH_RESPONSE=$(curl -s https://sukai-production.up.railway.app/health 2>&1)

if echo "$HEALTH_RESPONSE" | grep -q "status.*ok"; then
    echo "✅ Backend is healthy!"
    echo "$HEALTH_RESPONSE"
else
    echo "⚠️  Backend might still be deploying"
    echo "Response: $HEALTH_RESPONSE"
    echo ""
    echo "Wait 2-3 minutes for Railway to finish deploying, then try:"
    echo "  curl https://sukai-production.up.railway.app/health"
fi

echo ""
echo ""

# Step 2: Rebuild Flutter App
echo "Step 2: Rebuilding Flutter App..."
echo ""

if [ ! -d "mobile" ]; then
    echo "❌ mobile directory not found"
    exit 1
fi

cd mobile

echo "Cleaning Flutter project..."
flutter clean

echo ""
echo "Getting dependencies..."
flutter pub get

echo ""
echo "✅ Flutter app ready!"
echo ""
echo "Run: flutter run"
echo ""
echo "Your app will connect to: https://sukai-production.up.railway.app/api"

