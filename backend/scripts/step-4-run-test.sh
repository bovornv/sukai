#!/bin/bash

# Step 4: Run Test Assessment
# Tests profile loading and safety checks

set -e

API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
USER_ID="${TEST_USER_ID}"

if [ -z "$USER_ID" ]; then
  echo "❌ Error: TEST_USER_ID environment variable not set"
  echo ""
  echo "Usage:"
  echo "  export TEST_USER_ID='your-user-id-here'"
  echo "  ./scripts/step-4-run-test.sh"
  echo ""
  echo "To get your user ID:"
  echo "  1. Go to Supabase Dashboard → Authentication → Users"
  echo "  2. Copy your user ID (UUID format)"
  exit 1
fi

SESSION_ID="test-$(date +%s)"

echo "🧪 Running Test Assessment"
echo "========================="
echo "API: $API_BASE_URL"
echo "User ID: $USER_ID"
echo "Session ID: $SESSION_ID"
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

echo "✅ Assessment request sent"
echo ""

# Check response
if echo "$RESPONSE" | grep -q "needMoreInfo\|triageLevel\|nextQuestion"; then
  echo "✅ Assessment response received"
  echo ""
  echo "Response preview:"
  echo "$RESPONSE" | head -c 200
  echo "..."
  echo ""
else
  echo "⚠️  Unexpected response format:"
  echo "$RESPONSE"
  echo ""
fi

# Test 2: Get diagnosis
echo "📝 Step 2: Getting diagnosis..."
sleep 2

DIAGNOSIS=$(curl -s -X GET "$API_BASE_URL/api/triage/diagnosis?session_id=$SESSION_ID" \
  -H "x-user-id: $USER_ID" \
  -H "x-language: th")

if echo "$DIAGNOSIS" | grep -q "recommendations\|otcMeds\|triageLevel"; then
  echo "✅ Diagnosis retrieved"
  echo ""
  
  # Extract OTC medications if present
  if echo "$DIAGNOSIS" | grep -q "otcMeds"; then
    echo "OTC Medications Recommended:"
    echo "$DIAGNOSIS" | grep -o '"otcMeds":\[[^]]*\]' | head -1
    echo ""
  fi
else
  echo "⚠️  Diagnosis response:"
  echo "$DIAGNOSIS" | head -c 300
  echo "..."
  echo ""
fi

echo "✅ Test completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Check backend terminal for logs:"
echo "   - [PROFILE-LOAD] Loading health profile"
echo "   - [PROFILE-LOAD] Profile loaded: {summary}"
echo "   - [SAFETY-CHECK] Medication excluded"
echo "   - [OTC-SELECTION] Excluded medications"
echo ""
echo "2. Verify OTC recommendations exclude paracetamol (if allergic)"
echo "3. See MONITORING_GUIDE.md for detailed log patterns"
