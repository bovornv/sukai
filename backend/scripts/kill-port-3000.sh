#!/bin/bash

# Kill process on port 3000
# Useful when port is already in use

echo "🔍 Checking for process on port 3000..."

if lsof -ti:3000 > /dev/null 2>&1; then
  echo "⚠️  Found process on port 3000"
  PID=$(lsof -ti:3000)
  echo "   Process ID: $PID"
  echo "   Killing process..."
  kill -9 $PID 2>/dev/null
  sleep 1
  echo "✅ Port 3000 is now free"
else
  echo "✅ Port 3000 is already free"
fi

echo ""
echo "You can now run: npm start"
