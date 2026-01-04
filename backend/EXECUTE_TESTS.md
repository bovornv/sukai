# Execute Tests: Step-by-Step Guide

## Prerequisites

1. ✅ Database migration executed (`add-medical-profile-fields.sql`)
2. ✅ Backend server running (`npm start` in `backend/` directory)
3. ✅ Test user ID from Supabase Auth

## Step 1: Create Test Profile

### Option A: Using SQL (Recommended)

1. **Get your User ID:**
   - Supabase Dashboard → Authentication → Users
   - Copy your user ID (UUID format)

2. **Run SQL Script:**
   ```sql
   -- Open: backend/scripts/create-test-profile.sql
   -- Replace {your_user_id} with your actual UUID
   -- Execute in Supabase SQL Editor
   ```

3. **Verify Profile:**
   ```sql
   SELECT * FROM public.user_profiles WHERE id = '{your_user_id}';
   ```
   Should show all fields populated.

### Option B: Using Mobile App

1. Open app → Profile → Edit Profile
2. Fill in all medical fields:
   - Drug allergies: "พาราเซตามอล", "แอสไพริน"
   - Current medications: "เมทฟอร์มิน"
   - Food allergies: "ถั่วลิสง"
   - etc.
3. Save profile

---

## Step 2: Start Backend Server

```bash
cd backend
npm start
```

**Expected output:**
```
Server running on port 3000
Database connected
```

**Keep this terminal open** - you'll see logs here.

---

## Step 3: Run Tests

### Test 1: Profile Loading

**In new terminal:**
```bash
cd backend
export TEST_USER_ID="your-user-id-here"
export API_BASE_URL="http://localhost:3000"

# Run test
./scripts/test-allergy-exclusion.sh
```

**Watch backend logs for:**
```
[PROFILE-LOAD] Loading health profile for user: {userId}
[PROFILE-LOAD] Profile loaded: {
  age: 34,
  drugAllergies: 2,
  foodAllergies: 1,
  currentMedications: 1,
  ...
}
```

### Test 2: Allergy Exclusion

**Expected backend logs:**
```
[SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้ (Allergies: พาราเซตามอล, แอสไพริน)
[SAFETY-CHECK] Medication aspirin excluded: แพ้ยานี้
[OTC-SELECTION] Excluded 2 medications: [
  { medication: 'paracetamol', reason: 'แพ้ยานี้' },
  { medication: 'aspirin', reason: 'แพ้ยานี้' }
]
[OTC-SELECTION] Safety check passed: 3 safe medications available
```

**Verify:**
- OTC recommendations do NOT include paracetamol
- OTC recommendations do NOT include aspirin
- At least 2 safe alternatives are recommended

### Test 3: Pregnancy Safety

**Update profile:**
```sql
UPDATE public.user_profiles
SET is_pregnant = true
WHERE id = '{your_user_id}'::uuid;
```

**Run test:**
```bash
./scripts/test-pregnancy-safety.sh
```

**Expected backend logs:**
```
[PROFILE-LOAD] Profile loaded: {isPregnant: true, ...}
[SAFETY-CHECK] Medication ibuprofen excluded: ตั้งครรภ์ - หลีกเลี่ยงยานี้
[SAFETY-CHECK] Medication naproxen excluded: ตั้งครรภ์ - หลีกเลี่ยงยานี้
```

**Verify:**
- Only pregnancy-safe medications recommended
- NSAIDs excluded

### Test 4: Drug Interaction

**Update profile:**
```sql
UPDATE public.user_profiles
SET current_medications = ARRAY['วาร์ฟาริน']
WHERE id = '{your_user_id}'::uuid;
```

**Run test:**
```bash
./scripts/test-drug-interaction.sh
```

**Expected backend logs:**
```
[PROFILE-LOAD] Profile loaded: {currentMedications: 1, ...}
[SAFETY-CHECK] Medication aspirin excluded: อาจมีปฏิกิริยากับยาที่ใช้อยู่ (Current meds: วาร์ฟาริน)
```

**Verify:**
- Medications that interact with warfarin are excluded
- Warning message appears

### Test 5: Complete Test Suite

**Run all tests:**
```bash
export TEST_USER_ID="your-user-id-here"
./scripts/run-all-tests.sh
```

---

## Step 4: Monitor Logs

### Real-Time Monitoring

**In backend terminal, watch for:**

1. **Profile Loading:**
   ```
   [PROFILE-LOAD] Loading health profile for user: {userId}
   [PROFILE-LOAD] Profile loaded: {summary}
   ```

2. **Safety Checks:**
   ```
   [SAFETY-CHECK] Medication {name} excluded: {reason}
   ```

3. **OTC Selection:**
   ```
   [OTC-SELECTION] Excluded N medications: [...]
   [OTC-SELECTION] Safety check passed: N safe medications
   ```

### Filter Logs

**Using grep:**
```bash
# In backend terminal, filter logs:
npm start 2>&1 | grep -E "PROFILE-LOAD|SAFETY-CHECK|OTC-SELECTION"
```

**Or save to file:**
```bash
npm start 2>&1 | tee backend.log
# Then grep:
grep "SAFETY-CHECK" backend.log
```

---

## ✅ Success Criteria

### Profile Loading ✅
- [ ] `[PROFILE-LOAD]` appears in logs
- [ ] Profile summary shows all field counts
- [ ] No errors loading profile

### Allergy Checks ✅
- [ ] `[SAFETY-CHECK]` messages appear
- [ ] Medications matching allergies excluded
- [ ] OTC recommendations exclude unsafe meds

### Pregnancy Checks ✅
- [ ] Pregnancy status loaded from profile
- [ ] Unsafe medications excluded
- [ ] Only safe alternatives recommended

### Drug Interactions ✅
- [ ] Current medications loaded
- [ ] Interactions detected
- [ ] Warnings appear in logs

### OTC Recommendations ✅
- [ ] At least 2 safe medications recommended
- [ ] Unsafe medications excluded
- [ ] Recommendations use age/weight from profile

---

## 🐛 Troubleshooting

### No logs appearing
- **Check:** Backend server is running
- **Check:** Console output is visible
- **Check:** Log level is set correctly

### Profile not loading
- **Check:** User ID is correct
- **Check:** Database migration executed
- **Check:** Supabase connection working

### Safety checks not working
- **Check:** Profile has allergies/medications populated
- **Check:** `isMedicationSafe()` is being called
- **Check:** Medication catalog has entries

### Too many/few exclusions
- **Check:** Allergy matching logic
- **Check:** Medication names match
- **Check:** Contraindication rules

---

## 📊 Expected Results

### Test Profile with All Fields

**Profile:**
- Drug allergies: ["พาราเซตามอล", "แอสไพริน"]
- Current medications: ["เมทฟอร์มิน"]
- Food allergies: ["ถั่วลิสง"]
- is_pregnant: false

**Expected Logs:**
```
[PROFILE-LOAD] Profile loaded: {
  drugAllergies: 2,
  foodAllergies: 1,
  currentMedications: 1,
  isPregnant: false
}
[SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้
[SAFETY-CHECK] Medication aspirin excluded: แพ้ยานี้
[OTC-SELECTION] Excluded 2 medications
[OTC-SELECTION] Safety check passed: 3 safe medications available
```

**Expected OTC Recommendations:**
- ✅ Does NOT include paracetamol
- ✅ Does NOT include aspirin
- ✅ Includes at least 2 safe alternatives (e.g., ibuprofen, naproxen)

---

## 📝 Test Report Template

After running tests, document:

```
Test Date: {date}
User ID: {userId}
Backend Version: {version}

Test Results:
- Profile Loading: ✅/❌
- Allergy Exclusion: ✅/❌
- Pregnancy Safety: ✅/❌
- Drug Interaction: ✅/❌

Logs Summary:
- [PROFILE-LOAD] messages: {count}
- [SAFETY-CHECK] messages: {count}
- Medications excluded: {list}

Issues Found:
- {issue 1}
- {issue 2}
```

---

## 🎯 Quick Test Commands

```bash
# Set environment
export TEST_USER_ID="your-user-id"
export API_BASE_URL="http://localhost:3000"

# Run individual tests
./scripts/test-allergy-exclusion.sh
./scripts/test-pregnancy-safety.sh
./scripts/test-drug-interaction.sh

# Run all tests
./scripts/run-all-tests.sh

# Monitor logs
npm start 2>&1 | grep -E "PROFILE-LOAD|SAFETY-CHECK"
```

---

**Ready to test!** Follow steps 1-4 above to verify everything works correctly.
