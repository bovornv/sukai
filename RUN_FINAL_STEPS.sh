#!/bin/bash
# Final Steps 1-3: Test Backend and Run Mobile App

echo "🔍 Step 1: Testing Backend..."
echo ""
curl -s https://sukai-production.up.railway.app/health || echo "⚠️  Backend might still be deploying. Wait 2-3 minutes and try again."
echo ""
echo ""

echo "📱 Step 2: Cleaning Flutter project..."
cd mobile
flutter clean
echo ""

echo "📦 Step 3: Getting dependencies..."
flutter pub get
echo ""

echo "✅ Ready to run!"
echo "Run: flutter run"
echo ""
echo "Your mobile app will connect to: https://sukai-production.up.railway.app/api"
