# ✅ Ready to Test: Medical Profile Integration

## 🎯 What's Ready

### ✅ Database Migration
- **File:** `backend/database/add-medical-profile-fields.sql`
- **Status:** Ready to execute in Supabase
- **Verification:** `backend/database/verify-migration.sql`

### ✅ Backend Code Updated
- **Files Updated:**
  - `backend/src/functions/triage/index.js` - Loads all new fields
  - `backend/src/functions/triage/thai_otc_catalog.js` - Enhanced safety checks
- **Logging Added:** Comprehensive logging for monitoring
- **Status:** Ready to test

### ✅ Testing Tools Created
- **SQL Scripts:** `scripts/create-test-profile.sql`
- **Shell Scripts:** `scripts/test-*.sh` (allergy, pregnancy, interaction)
- **Node Script:** `scripts/test-medical-profile.js`
- **Documentation:** Multiple guides for testing

---

## 🚀 Quick Start (10 minutes)

### Step 1: Run Migration (2 min)
```sql
-- In Supabase SQL Editor:
-- Copy/paste: backend/database/add-medical-profile-fields.sql
-- Click Run
```

### Step 2: Create Test Profile (2 min)
```sql
-- Replace {your_user_id} with your UUID:
UPDATE public.user_profiles
SET 
  drug_allergies = ARRAY['พาราเซตามอล'],
  current_medications = ARRAY['เมทฟอร์มิน']
WHERE id = '{your_user_id}'::uuid;
```

### Step 3: Start Backend (1 min)
```bash
cd backend
npm start
```

### Step 4: Run Test (2 min)
```bash
# In new terminal:
export TEST_USER_ID="your-user-id"
export API_BASE_URL="http://localhost:3000"

# Test
curl -X POST "$API_BASE_URL/api/triage/assess" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $TEST_USER_ID" \
  -H "x-language: th" \
  -d '{"session_id":"test-123","symptom":"ปวดหัว","previous_answers":{},"language":"th"}'
```

### Step 5: Monitor Logs (3 min)
**Watch backend terminal for:**
- `[PROFILE-LOAD]` messages
- `[SAFETY-CHECK]` messages  
- `[OTC-SELECTION]` messages

---

## 📋 Test Scenarios

### Scenario 1: Allergy Exclusion ✅
**Setup:** Profile with `drug_allergies: ['พาราเซตามอล']`
**Expected:** Paracetamol excluded from recommendations
**Logs:** `[SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้`

### Scenario 2: Pregnancy Safety ✅
**Setup:** Profile with `is_pregnant: true`
**Expected:** NSAIDs excluded
**Logs:** `[SAFETY-CHECK] Medication ibuprofen excluded: ตั้งครรภ์ - หลีกเลี่ยงยานี้`

### Scenario 3: Drug Interaction ✅
**Setup:** Profile with `current_medications: ['วาร์ฟาริน']`
**Expected:** Interacting medications excluded
**Logs:** `[SAFETY-CHECK] Medication aspirin excluded: อาจมีปฏิกิริยากับยาที่ใช้อยู่`

---

## 📊 Expected Log Output

### Successful Test Run:

```
[ASSESS-SYMPTOM] Starting assessment: sessionId=test-123, userId={id}
[PROFILE-LOAD] Loading health profile for user: {id}
[PROFILE-LOAD] Profile loaded: {
  age: 34,
  drugAllergies: 1,
  currentMedications: 1,
  isPregnant: false
}
[OTC-SELECTION] Medical-grade selection: {...}
[SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้ (Allergies: พาราเซตามอล)
[OTC-SELECTION] Excluded 1 medications: [{ medication: 'paracetamol', reason: 'แพ้ยานี้' }]
[OTC-SELECTION] Safety check passed: 2 safe medications available
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `TEST_NOW.md` | Quick 5-minute test guide |
| `EXECUTE_TESTS.md` | Detailed step-by-step guide |
| `MONITORING_GUIDE.md` | Complete log monitoring guide |
| `LOG_REFERENCE_CARD.md` | Quick log lookup reference |
| `QUICK_TEST_CHECKLIST.md` | Checklist format |
| `TESTING_MEDICAL_PROFILE.md` | Comprehensive testing guide |

---

## 🎯 Success Indicators

### ✅ Profile Loading
- Logs show `[PROFILE-LOAD]` with field counts
- All 8 new fields loaded correctly
- No errors

### ✅ Safety Checks
- Logs show `[SAFETY-CHECK]` for excluded medications
- Allergies block medications correctly
- Pregnancy/breastfeeding checks work
- Drug interactions detected

### ✅ OTC Recommendations
- Unsafe medications excluded
- At least 2 safe alternatives provided
- Recommendations use profile data (age, weight)

---

## 🐛 Common Issues & Fixes

### Issue: No logs appearing
**Fix:** Check backend is running, console output visible

### Issue: Profile not loading
**Fix:** Verify migration executed, user ID correct, RLS policies

### Issue: Safety checks not working
**Fix:** Check profile has data, `isMedicationSafe()` called, catalog has entries

### Issue: Wrong exclusions
**Fix:** Review matching logic, verify medication names match

---

## ✅ Final Checklist

- [ ] Migration executed in Supabase
- [ ] Test profile created with allergies/medications
- [ ] Backend server running
- [ ] Test API call executed
- [ ] Logs show `[PROFILE-LOAD]` messages
- [ ] Logs show `[SAFETY-CHECK]` messages
- [ ] OTC recommendations exclude unsafe medications
- [ ] At least 2 safe alternatives recommended

---

## 🎉 Ready!

**Everything is set up and ready to test.**

**Start with:** `TEST_NOW.md` for quick 5-minute test
**For details:** `EXECUTE_TESTS.md` for comprehensive guide
**For monitoring:** `MONITORING_GUIDE.md` for log patterns

**Happy testing!** 🚀
