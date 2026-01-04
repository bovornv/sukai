#!/bin/bash

# Step 3: Start Backend Server
# This script starts the backend and monitors for errors

echo "🚀 Starting SukAI Backend..."
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  Warning: .env file not found"
  echo "Create .env file with Supabase credentials"
  echo ""
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Check if port 3000 is already in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
  echo "⚠️  Port 3000 is already in use"
  echo "Killing existing process..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo "✅ Starting backend server..."
echo "📊 Watch this terminal for logs:"
echo "   - [PROFILE-LOAD] = Profile loading"
echo "   - [SAFETY-CHECK] = Safety checks"
echo "   - [OTC-SELECTION] = Medication selection"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start backend
npm start
