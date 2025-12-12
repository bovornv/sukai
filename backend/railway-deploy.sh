#!/bin/bash
# Railway Deployment Script
# This script helps deploy to Railway

set -e

echo "🚀 Railway Deployment Helper"
echo "============================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo ""
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
    echo ""
fi

echo "Step 1: Login to Railway"
echo "Run: railway login"
echo ""
read -p "Press Enter after you've logged in..."

echo ""
echo "Step 2: Initialize Railway project"
echo "Run: railway init"
echo ""
read -p "Press Enter after initialization..."

echo ""
echo "Step 3: Setting environment variables..."
echo ""

# Read from .env if exists
if [ -f .env ]; then
    echo "Reading from .env file..."
    source .env
    
    railway variables set SUPABASE_URL="$SUPABASE_URL"
    railway variables set SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
    railway variables set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
    railway variables set PORT=3000
    railway variables set NODE_ENV=production
    
    echo "✅ Environment variables set"
else
    echo "⚠️  .env file not found"
    echo "Please set environment variables manually:"
    echo "  railway variables set SUPABASE_URL=..."
    echo "  railway variables set SUPABASE_ANON_KEY=..."
    echo "  railway variables set SUPABASE_SERVICE_ROLE_KEY=..."
    echo "  railway variables set PORT=3000"
    echo "  railway variables set NODE_ENV=production"
fi

echo ""
echo "Step 4: Deploying..."
echo "Run: railway up"
echo ""
read -p "Press Enter to deploy (or Ctrl+C to cancel)..."

railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Step 5: Get your backend URL"
echo "Run: railway domain"
echo ""
echo "Then update mobile/lib/config/api_config.dart with your URL"

