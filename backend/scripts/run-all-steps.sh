#!/bin/bash

# Run All Steps: Complete Test Execution
# User ID: fe1107c1-25f8-4202-9f4e-00dc911b61ae

set -e

USER_ID="fe1107c1-25f8-4202-9f4e-00dc911b61ae"
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"

echo "🚀 Running Complete Test Suite"
echo "=============================="
echo "User ID: $USER_ID"
echo ""

# Step 2: Verify SQL was run
echo "📝 Step 2: Verify SQL was executed in Supabase"
echo "   - Open Supabase SQL Editor"
echo "   - Run: backend/scripts/step-2-create-test-profile.sql"
echo "   - Verify profile has drug_allergies populated"
echo ""
read -p "Press Enter after SQL is executed..."

# Step 3: Check if backend is running
echo "📝 Step 3: Checking backend..."
if curl -s "$API_BASE_URL/health" > /dev/null 2>&1; then
  echo "✅ Backend is already running"
else
  echo "⚠️  Backend not running"
  echo "   Start backend in another terminal:"
  echo "   cd backend && npm start"
  echo ""
  read -p "Press Enter after backend is started..."
fi
echo ""

# Step 4: Run test
echo "📝 Step 4: Running test..."
SESSION_ID="test-$(date +%s)"

echo "Starting assessment..."
RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/triage/assess" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -H "x-language: th" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"symptom\": \"ปวดหัว\",
    \"previous_answers\": {},
    \"language\": \"th\"
  }")

if echo "$RESPONSE" | grep -q "needMoreInfo\|triageLevel\|nextQuestion"; then
  echo "✅ Assessment successful"
else
  echo "⚠️  Response: $RESPONSE" | head -c 200
fi
echo ""

echo "Getting diagnosis..."
sleep 2
DIAGNOSIS=$(curl -s -X GET "$API_BASE_URL/api/triage/diagnosis?session_id=$SESSION_ID" \
  -H "x-user-id: $USER_ID" \
  -H "x-language: th")

if echo "$DIAGNOSIS" | grep -q "recommendations\|otcMeds"; then
  echo "✅ Diagnosis retrieved"
  
  if echo "$DIAGNOSIS" | grep -qi "paracetamol\|พาราเซตามอล"; then
    echo "⚠️  WARNING: Paracetamol found (should be excluded)"
  else
    echo "✅ Paracetamol correctly excluded"
  fi
else
  echo "⚠️  Diagnosis: $DIAGNOSIS" | head -c 200
fi
echo ""

# Step 5: Log monitoring instructions
echo "📝 Step 5: Monitor Backend Logs"
echo "================================"
echo ""
echo "In your backend terminal, look for:"
echo ""
echo "✅ Profile Loading:"
echo "   [PROFILE-LOAD] Loading health profile for user: $USER_ID"
echo "   [PROFILE-LOAD] Profile loaded: {drugAllergies: 2, ...}"
echo ""
echo "✅ Safety Checks:"
echo "   [SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้"
echo "   [SAFETY-CHECK] Medication aspirin excluded: แพ้ยานี้"
echo ""
echo "✅ OTC Selection:"
echo "   [OTC-SELECTION] Excluded 2 medications: [...]"
echo "   [OTC-SELECTION] Safety check passed: N safe medications"
echo ""
echo "✅ Test completed!"
echo ""
echo "If you see all these logs, integration is working correctly! 🎉"
