#!/bin/bash

# Step 5: Monitor Backend Logs
# Filters and displays key log patterns for medical profile integration

echo "📊 Monitoring Backend Logs"
echo "=========================="
echo ""
echo "Watching for:"
echo "  - [PROFILE-LOAD] = Profile loading"
echo "  - [SAFETY-CHECK] = Medication safety checks"
echo "  - [OTC-SELECTION] = OTC medication selection"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Check if backend is running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
  echo "⚠️  Backend not running on port 3000"
  echo "Start backend first: ./scripts/step-3-start-backend.sh"
  exit 1
fi

# Monitor logs (if backend writes to stdout)
# This assumes backend is running in another terminal
echo "💡 Tip: Run this in a separate terminal while backend is running"
echo ""
echo "To filter logs from a log file:"
echo "  tail -f backend.log | grep -E 'PROFILE-LOAD|SAFETY-CHECK|OTC-SELECTION'"
echo ""
echo "To filter logs from npm start output:"
echo "  npm start 2>&1 | grep -E 'PROFILE-LOAD|SAFETY-CHECK|OTC-SELECTION'"
echo ""

# If log file exists, tail it
if [ -f "backend.log" ]; then
  echo "📄 Tailing backend.log..."
  tail -f backend.log | grep --line-buffered -E "PROFILE-LOAD|SAFETY-CHECK|OTC-SELECTION|excluded"
else
  echo "ℹ️  No backend.log file found"
  echo "Backend logs appear in the terminal where you ran 'npm start'"
  echo ""
  echo "Expected log patterns:"
  echo ""
  echo "✅ Profile Loading:"
  echo "   [PROFILE-LOAD] Loading health profile for user: {userId}"
  echo "   [PROFILE-LOAD] Profile loaded: {age: 34, drugAllergies: 2, ...}"
  echo ""
  echo "✅ Safety Checks:"
  echo "   [SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้"
  echo "   [SAFETY-CHECK] Medication ibuprofen excluded: ตั้งครรภ์ - หลีกเลี่ยงยานี้"
  echo ""
  echo "✅ OTC Selection:"
  echo "   [OTC-SELECTION] Excluded 2 medications: [...]"
  echo "   [OTC-SELECTION] Safety check passed: 3 safe medications available"
  echo ""
fi
