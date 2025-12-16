#!/bin/bash
# Helper script to update Railway environment variables
# Run this AFTER you've rotated keys in Supabase

echo "🚂 Railway Environment Variables Update"
echo "======================================="
echo ""
echo "⚠️  IMPORTANT: Rotate keys in Supabase FIRST!"
echo "   Get NEW keys from: https://supabase.com/dashboard/project/uuuqpiaclmleclsylfqh/settings/api"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo "Install with: npm install -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &>/dev/null; then
    echo "❌ Not logged in to Railway"
    echo "Run: railway login"
    exit 1
fi

echo "✅ Railway CLI ready"
echo ""

# Prompt for new keys
read -p "Enter NEW Supabase Anon Key: " NEW_ANON_KEY
read -p "Enter NEW Supabase Service Role Key: " NEW_SERVICE_KEY

if [ -z "$NEW_ANON_KEY" ] || [ -z "$NEW_SERVICE_KEY" ]; then
    echo "❌ Keys cannot be empty!"
    exit 1
fi

echo ""
echo "🔧 Updating Railway environment variables..."
echo ""

# Update variables using Railway CLI
railway variables --set "SUPABASE_ANON_KEY=$NEW_ANON_KEY"
railway variables --set "SUPABASE_SERVICE_ROLE_KEY=$NEW_SERVICE_KEY"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Environment variables updated!"
    echo ""
    echo "Railway will automatically redeploy with new keys."
    echo "Wait 2-3 minutes, then test:"
    echo "  curl https://sukai-production.up.railway.app/health"
else
    echo ""
    echo "❌ Failed to update variables"
    echo "Try updating manually in Railway dashboard:"
    echo "  https://railway.app → Service 'sukai' → Variables"
fi

