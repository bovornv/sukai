# Quick Test Checklist

## ✅ Pre-Test Setup (5 min)

- [ ] Database migration executed (`add-medical-profile-fields.sql`)
- [ ] Test profile created with allergies/medications
- [ ] Backend server running (`npm start`)
- [ ] User ID copied from Supabase Auth

---

## 🧪 Test Execution (5 min)

### Test 1: Profile Loading
- [ ] Run assessment API call
- [ ] Check logs for `[PROFILE-LOAD]`
- [ ] Verify field counts match profile

**Expected:** Profile loaded with all fields

### Test 2: Allergy Exclusion  
- [ ] Profile has `drug_allergies: ['พาราเซตามอล']`
- [ ] Run assessment
- [ ] Check logs for `[SAFETY-CHECK] Medication paracetamol excluded`
- [ ] Verify OTC recommendations exclude paracetamol

**Expected:** Paracetamol excluded, safe alternatives recommended

### Test 3: Get Diagnosis
- [ ] Complete assessment
- [ ] Get diagnosis API call
- [ ] Check OTC recommendations
- [ ] Verify unsafe medications excluded

**Expected:** Safe medications only in recommendations

---

## 📊 Log Verification

### Must See Logs:
- [ ] `[PROFILE-LOAD] Loading health profile`
- [ ] `[PROFILE-LOAD] Profile loaded: {summary}`
- [ ] `[SAFETY-CHECK] Medication excluded`
- [ ] `[OTC-SELECTION] Excluded N medications`
- [ ] `[OTC-SELECTION] Safety check passed`

### Must NOT See:
- [ ] Errors loading profile
- [ ] Null/undefined errors
- [ ] Unsafe medications in recommendations

---

## ✅ Success Criteria

- [ ] All logs appear correctly
- [ ] Profile fields loaded
- [ ] Safety checks working
- [ ] Unsafe medications excluded
- [ ] Safe alternatives recommended

---

## 🚨 If Tests Fail

1. Check database migration ran
2. Verify profile has test data
3. Check backend logs for errors
4. Verify user ID is correct
5. Check Supabase connection

---

**Total Time:** ~10 minutes
**Status:** Ready to test ✅
