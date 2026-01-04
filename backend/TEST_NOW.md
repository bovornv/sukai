# 🚀 Test Now: Quick 5-Minute Test

## Prerequisites Checklist

- [ ] Database migration executed (`add-medical-profile-fields.sql`)
- [ ] Backend server can start (`npm start` works)
- [ ] You have a Supabase user ID

---

## Step 1: Create Test Profile (2 minutes)

### Get Your User ID
1. Supabase Dashboard → Authentication → Users
2. Copy your user ID (UUID format, e.g., `123e4567-e89b-12d3-a456-426614174000`)

### Update Profile
1. Open Supabase SQL Editor
2. Run this (replace `{your_user_id}` with your UUID):

```sql
UPDATE public.user_profiles
SET 
  drug_allergies = ARRAY['พาราเซตามอล'],
  current_medications = ARRAY['เมทฟอร์มิน'],
  is_pregnant = false
WHERE id = '{your_user_id}'::uuid;
```

3. Verify:
```sql
SELECT drug_allergies, current_medications FROM public.user_profiles WHERE id = '{your_user_id}'::uuid;
```

Should show:
- `drug_allergies`: `{พาราเซตามอล}`
- `current_medications`: `{เมทฟอร์มิน}`

---

## Step 2: Start Backend (1 minute)

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```

**Expected output:**
```
SukAI Backend running on port 3000
```

**Keep this terminal open** - logs will appear here.

---

## Step 3: Test Assessment (2 minutes)

**Terminal 2 (Test):**

```bash
# Set your user ID
export TEST_USER_ID="your-user-id-here"
export API_BASE_URL="http://localhost:3000"

# Test assessment
curl -X POST "$API_BASE_URL/api/triage/assess" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $TEST_USER_ID" \
  -H "x-language: th" \
  -d '{
    "session_id": "test-123",
    "symptom": "ปวดหัว",
    "previous_answers": {},
    "language": "th"
  }'
```

---

## Step 4: Check Logs (Monitor)

**In Terminal 1 (Backend), look for:**

### ✅ Success Pattern:

```
[ASSESS-SYMPTOM] Starting assessment: sessionId=test-123, userId={your_id}
[PROFILE-LOAD] Loading health profile for user: {your_id}
[PROFILE-LOAD] Profile loaded: {
  age: 34,
  drugAllergies: 1,
  currentMedications: 1,
  ...
}
[OTC-SELECTION] Medical-grade selection: {...}
[SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้ (Allergies: พาราเซตามอล)
[OTC-SELECTION] Excluded 1 medications: [{ medication: 'paracetamol', reason: 'แพ้ยานี้' }]
[OTC-SELECTION] Safety check passed: 2 safe medications available
```

### ✅ What This Means:

- ✅ Profile loaded successfully
- ✅ Allergies detected
- ✅ Unsafe medication excluded
- ✅ Safe alternatives available

---

## Step 5: Verify OTC Recommendations

**Get diagnosis:**
```bash
curl -X GET "$API_BASE_URL/api/triage/diagnosis?session_id=test-123" \
  -H "x-user-id: $TEST_USER_ID" \
  -H "x-language: th"
```

**Check response:**
- OTC medications should NOT include "พาราเซตามอล" or "paracetamol"
- Should include at least 2 safe alternatives

---

## ✅ Quick Verification

### Profile Loading ✅
- [ ] `[PROFILE-LOAD]` appears in logs
- [ ] Shows `drugAllergies: 1` (or your count)
- [ ] Shows `currentMedications: 1` (or your count)

### Safety Checks ✅
- [ ] `[SAFETY-CHECK]` messages appear
- [ ] Shows "Medication paracetamol excluded: แพ้ยานี้"
- [ ] `[OTC-SELECTION] Excluded N medications` appears

### OTC Recommendations ✅
- [ ] Final recommendations exclude paracetamol
- [ ] At least 2 safe alternatives recommended

---

## 🐛 Troubleshooting

### No `[PROFILE-LOAD]` logs
- Check: User ID is correct
- Check: Database migration executed
- Check: Profile exists in `user_profiles` table

### No `[SAFETY-CHECK]` logs
- Check: `drug_allergies` array is populated
- Check: Backend reached OTC selection code
- Check: Medication catalog has entries

### Paracetamol still recommended
- Check: Allergy matching logic
- Check: Medication name matches exactly
- Check: Safety check is being called

---

## 📊 Expected Log Flow

```
1. [ASSESS-SYMPTOM] Starting assessment...
2. [PROFILE-LOAD] Loading health profile...
3. [PROFILE-LOAD] Profile loaded: {summary}
4. [OTC-SELECTION] Medical-grade selection...
5. [SAFETY-CHECK] Medication excluded...
6. [OTC-SELECTION] Excluded N medications
7. [OTC-SELECTION] Safety check passed: N safe medications
```

---

## 🎯 Success Criteria

**If you see:**
- ✅ `[PROFILE-LOAD]` with field counts
- ✅ `[SAFETY-CHECK]` excluding unsafe meds
- ✅ `[OTC-SELECTION]` showing excluded medications
- ✅ Final recommendations exclude allergies

**Then:** ✅ **Integration is working correctly!**

---

## 📚 More Details

- **Full Testing Guide:** `TESTING_MEDICAL_PROFILE.md`
- **Monitoring Guide:** `MONITORING_GUIDE.md`
- **Execution Guide:** `EXECUTE_TESTS.md`
