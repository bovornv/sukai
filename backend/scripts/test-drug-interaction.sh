#!/bin/bash

# Test Script: Drug Interaction Check
# Tests that backend detects drug interactions

API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
USER_ID="${TEST_USER_ID:-your-user-id-here}"
SESSION_ID="test-interaction-$(date +%s)"

echo "🧪 Testing Drug Interaction Check"
echo "================================="
echo ""

# First, update profile with warfarin
echo "📝 Step 1: Update profile with current_medications = ['วาร์ฟาริน']"
echo "Run in Supabase SQL Editor:"
echo ""
echo "UPDATE public.user_profiles"
echo "SET current_medications = ARRAY['วาร์ฟาริน']"
echo "WHERE id = '$USER_ID'::uuid;"
echo ""
read -p "Press Enter after updating profile..."

# Start assessment
echo "📝 Step 2: Starting assessment..."
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

# Check logs
echo "✅ Check backend logs for:"
echo "   [PROFILE-LOAD] Profile loaded: {currentMedications: 1, ...}"
echo "   [SAFETY-CHECK] Medication aspirin excluded: อาจมีปฏิกิริยากับยาที่ใช้อยู่"
echo "   [OTC-SELECTION] Medications that interact with warfarin excluded"
echo ""

echo "✅ Test completed!"
