#!/bin/bash

# Test Script: Pregnancy Safety Check
# Tests that backend excludes unsafe medications for pregnant users

API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
USER_ID="${TEST_USER_ID:-your-user-id-here}"
SESSION_ID="test-pregnancy-$(date +%s)"

echo "🧪 Testing Pregnancy Safety Check"
echo "=================================="
echo ""

# First, update profile to be pregnant
echo "📝 Step 1: Update profile to is_pregnant = true"
echo "Run in Supabase SQL Editor:"
echo ""
echo "UPDATE public.user_profiles"
echo "SET is_pregnant = true"
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
echo "   [PROFILE-LOAD] Profile loaded: {isPregnant: true, ...}"
echo "   [SAFETY-CHECK] Medication ibuprofen excluded: ตั้งครรภ์ - หลีกเลี่ยงยานี้"
echo "   [SAFETY-CHECK] Medication naproxen excluded: ตั้งครรภ์ - หลีกเลี่ยงยานี้"
echo "   [OTC-SELECTION] Only pregnancy-safe medications recommended"
echo ""

echo "✅ Test completed!"
