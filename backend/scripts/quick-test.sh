#!/bin/bash

# Quick Test Script - All Steps Combined
# User ID: fe1107c1-25f8-4202-9f4e-00dc911b61ae

set -e

USER_ID="fe1107c1-25f8-4202-9f4e-00dc911b61ae"
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
SESSION_ID="test-$(date +%s)"

echo "🧪 Quick Test: Medical Profile Integration"
echo "==========================================="
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
echo "📝 Step 1: Starting assessment..."
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
  echo "✅ Assessment request successful"
else
  echo "⚠️  Unexpected response:"
  echo "$RESPONSE" | head -c 200
  echo "..."
fi
echo ""

# Test 2: Get diagnosis
echo "📝 Step 2: Getting diagnosis..."
sleep 2

DIAGNOSIS=$(curl -s -X GET "$API_BASE_URL/api/triage/diagnosis?session_id=$SESSION_ID" \
  -H "x-user-id: $USER_ID" \
  -H "x-language: th")

if echo "$DIAGNOSIS" | grep -q "recommendations\|otcMeds\|triageLevel"; then
  echo "✅ Diagnosis retrieved"
  echo ""
  
  # Check for paracetamol exclusion
  if echo "$DIAGNOSIS" | grep -qi "paracetamol\|พาราเซตามอล"; then
    echo "⚠️  WARNING: Paracetamol found in recommendations (should be excluded due to allergy)"
  else
    echo "✅ Paracetamol correctly excluded from recommendations"
  fi
else
  echo "⚠️  Diagnosis response:"
  echo "$DIAGNOSIS" | head -c 300
  echo "..."
fi
echo ""

echo "✅ Test completed!"
echo ""
echo "📋 Check backend terminal logs for:"
echo "   - [PROFILE-LOAD] Loading health profile"
echo "   - [PROFILE-LOAD] Profile loaded: {drugAllergies: 2, ...}"
echo "   - [SAFETY-CHECK] Medication paracetamol excluded"
echo "   - [OTC-SELECTION] Excluded medications"
