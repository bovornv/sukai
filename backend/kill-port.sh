#!/bin/bash
# Kill process on port 3000

PORT=3000
PID=$(lsof -ti:$PORT)

if [ -z "$PID" ]; then
  echo "✅ Port $PORT is free"
else
  echo "🔍 Found process $PID on port $PORT"
  echo "🛑 Killing process $PID..."
  kill -9 $PID
  sleep 1
  if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "❌ Failed to kill process. Try running: sudo kill -9 $PID"
  else
    echo "✅ Port $PORT is now free"
  fi
fi
