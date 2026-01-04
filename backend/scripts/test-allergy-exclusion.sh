#!/bin/bash

# Test Script: Allergy Exclusion
# Tests that backend excludes medications user is allergic to

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
USER_ID="${TEST_USER_ID:-your-user-id-here}"
SESSION_ID="test-allergy-$(date +%s)"

echo "🧪 Testing Allergy Exclusion"
echo "============================"
echo "API: $API_BASE_URL"
echo "User ID: $USER_ID"
echo "Session ID: $SESSION_ID"
echo ""

# Test 1: Start assessment with symptom
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

echo "Response: $RESPONSE"
echo ""

# Check backend logs for:
echo "✅ Check backend logs for:"
echo "   [PROFILE-LOAD] Loading health profile for user: $USER_ID"
echo "   [PROFILE-LOAD] Profile loaded: {drugAllergies: 2, ...}"
echo "   [SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้"
echo "   [SAFETY-CHECK] Medication aspirin excluded: แพ้ยานี้"
echo "   [OTC-SELECTION] Excluded 2 medications: [...]"
echo ""

# Test 2: Complete assessment and get diagnosis
echo "📝 Test 2: Getting diagnosis..."
DIAGNOSIS=$(curl -s -X GET "$API_BASE_URL/api/triage/diagnosis?session_id=$SESSION_ID" \
  -H "x-user-id: $USER_ID" \
  -H "x-language: th")

echo "Diagnosis: $DIAGNOSIS"
echo ""

# Verify OTC recommendations
echo "✅ Verify OTC recommendations:"
echo "   - Should NOT include paracetamol (allergy)"
echo "   - Should NOT include aspirin (allergy)"
echo "   - Should include at least 2 safe alternatives"
echo ""

echo "✅ Test completed!"
echo "Check backend console logs for detailed safety check messages"
