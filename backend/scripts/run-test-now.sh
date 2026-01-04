#!/bin/bash

# Step 4: Run Test Assessment
# User ID: fe1107c1-25f8-4202-9f4e-00dc911b61ae

set -e

USER_ID="fe1107c1-25f8-4202-9f4e-00dc911b61ae"
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
SESSION_ID="test-$(date +%s)"

echo "🧪 Step 4: Running Test Assessment"
echo "==================================="
echo "User ID: $USER_ID"
echo "API: $API_BASE_URL"
echo "Session ID: $SESSION_ID"
echo ""

# Check if backend is running
if ! curl -s "$API_BASE_URL/health" > /dev/null 2>&1; then
  echo "❌ Backend not running on $API_BASE_URL"
  echo "Start backend first: cd backend && npm start"
  exit 1
fi

echo "✅ Backend is running"
echo ""

# Test 1: Start assessment
echo "📝 Test 1: Starting assessment..."
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

echo "Response received"
if echo "$RESPONSE" | grep -q "needMoreInfo\|triageLevel\|nextQuestion"; then
  echo "✅ Assessment successful"
  echo ""
  echo "Response preview:"
  echo "$RESPONSE" | head -c 300
  echo "..."
else
  echo "⚠️  Response:"
  echo "$RESPONSE" | head -c 300
fi
echo ""
echo ""

# Test 2: Get diagnosis
echo "📝 Test 2: Getting diagnosis..."
sleep 2

DIAGNOSIS=$(curl -s -X GET "$API_BASE_URL/api/triage/diagnosis?session_id=$SESSION_ID" \
  -H "x-user-id: $USER_ID" \
  -H "x-language: th")

if echo "$DIAGNOSIS" | grep -q "recommendations\|otcMeds\|triageLevel"; then
  echo "✅ Diagnosis retrieved"
  echo ""
  
  # Check for paracetamol exclusion
  if echo "$DIAGNOSIS" | grep -qi "paracetamol\|พาราเซตามอล"; then
    echo "⚠️  WARNING: Paracetamol found in recommendations"
    echo "   (Should be excluded due to allergy)"
  else
    echo "✅ Paracetamol correctly excluded from recommendations"
  fi
  
  # Show OTC medications if present
  if echo "$DIAGNOSIS" | grep -q "otcMeds"; then
    echo ""
    echo "OTC Medications Recommended:"
    echo "$DIAGNOSIS" | grep -o '"otcMeds":\[[^]]*\]' | head -1 || echo "  (Check full response)"
  fi
else
  echo "⚠️  Diagnosis response:"
  echo "$DIAGNOSIS" | head -c 300
  echo "..."
fi

echo ""
echo "✅ Test completed!"
echo ""
echo "📋 Step 5: Monitor Backend Logs"
echo "================================"
echo ""
echo "In your backend terminal, look for these log patterns:"
echo ""
echo "✅ Profile Loading:"
echo "   [PROFILE-LOAD] Loading health profile for user: $USER_ID"
echo "   [PROFILE-LOAD] Profile loaded: {drugAllergies: 2, currentMedications: 1, ...}"
echo ""
echo "✅ Safety Checks:"
echo "   [SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้"
echo "   [SAFETY-CHECK] Medication aspirin excluded: แพ้ยานี้"
echo ""
echo "✅ OTC Selection:"
echo "   [OTC-SELECTION] Excluded 2 medications: [...]"
echo "   [OTC-SELECTION] Safety check passed: N safe medications available"
echo ""
echo "If you see all these logs, integration is working correctly! 🎉"
