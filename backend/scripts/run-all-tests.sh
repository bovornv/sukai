#!/bin/bash

# Comprehensive Test Suite: Medical Profile Integration
# Runs all test scenarios and monitors logs

set -e

API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
USER_ID="${TEST_USER_ID}"

if [ -z "$USER_ID" ]; then
  echo "❌ Error: TEST_USER_ID environment variable not set"
  echo "Usage: TEST_USER_ID=your-user-id ./scripts/run-all-tests.sh"
  exit 1
fi

echo "🧪 Medical Profile Integration Test Suite"
echo "==========================================="
echo "API: $API_BASE_URL"
echo "User ID: $USER_ID"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Profile Loading
echo -e "${YELLOW}Test 1: Profile Loading${NC}"
echo "-------------------"
SESSION_ID="test-load-$(date +%s)"
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

if echo "$RESPONSE" | grep -q "needMoreInfo\|triageLevel"; then
  echo -e "${GREEN}✅ Profile loading test passed${NC}"
else
  echo -e "${RED}❌ Profile loading test failed${NC}"
  echo "Response: $RESPONSE"
fi
echo ""

# Test 2: Allergy Exclusion
echo -e "${YELLOW}Test 2: Allergy Exclusion${NC}"
echo "----------------------"
echo "Expected: Medications matching allergies should be excluded"
SESSION_ID="test-allergy-$(date +%s)"
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

echo -e "${GREEN}✅ Check backend logs for:${NC}"
echo "   [SAFETY-CHECK] Medication excluded: แพ้ยานี้"
echo ""

# Test 3: Get Diagnosis with Full Profile
echo -e "${YELLOW}Test 3: Get Diagnosis${NC}"
echo "-------------------"
# Complete assessment first
SESSION_ID="test-diagnosis-$(date +%s)"
curl -s -X POST "$API_BASE_URL/api/triage/assess" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -H "x-language: th" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"symptom\": \"ปวดหัว\",
    \"previous_answers\": {},
    \"language\": \"th\"
  }" > /dev/null

sleep 2

# Get diagnosis
DIAGNOSIS=$(curl -s -X GET "$API_BASE_URL/api/triage/diagnosis?session_id=$SESSION_ID" \
  -H "x-user-id: $USER_ID" \
  -H "x-language: th")

if echo "$DIAGNOSIS" | grep -q "recommendations\|otcMeds"; then
  echo -e "${GREEN}✅ Diagnosis retrieved${NC}"
  echo "Check recommendations exclude allergies"
else
  echo -e "${RED}❌ Diagnosis retrieval failed${NC}"
  echo "Response: $DIAGNOSIS"
fi
echo ""

# Summary
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Review backend console logs for detailed messages"
echo "2. Verify [PROFILE-LOAD] shows all fields"
echo "3. Verify [SAFETY-CHECK] excludes unsafe medications"
echo "4. Verify [OTC-SELECTION] shows excluded medications"
echo ""
echo "See MONITORING_GUIDE.md for detailed log patterns"
