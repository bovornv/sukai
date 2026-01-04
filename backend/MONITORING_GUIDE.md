# Backend Monitoring Guide: Medical Profile Safety Checks

## 🎯 What to Monitor

After running the database migration and starting the backend, monitor these log patterns to verify medical-grade safety checks are working.

## 📊 Log Patterns

### 1. Profile Loading

**Success Pattern:**
```
[PROFILE-LOAD] Loading health profile for user: {userId}
[PROFILE-LOAD] Profile loaded: {
  age: 34,
  gender: 'female',
  chronicDiseases: 2,
  drugAllergies: 2,
  foodAllergies: 2,
  otherAllergies: 1,
  isPregnant: false,
  isBreastfeeding: false,
  currentMedications: 2,
  surgeryHistory: 1
}
```

**What it means:**
- ✅ Backend successfully loaded all new fields
- ✅ Profile data is available for safety checks

**If missing:**
- Check database migration ran successfully
- Verify user ID is correct
- Check Supabase RLS policies

---

### 2. Allergy Safety Checks

**Success Pattern:**
```
[SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้ (Allergies: พาราเซตามอล, แอสไพริน)
[SAFETY-CHECK] Medication aspirin excluded: แพ้ยานี้ (Allergies: พาราเซตามอล, แอสไพริน)
[OTC-SELECTION] Excluded 2 medications: [
  { medication: 'paracetamol', reason: 'แพ้ยานี้' },
  { medication: 'aspirin', reason: 'แพ้ยานี้' }
]
[OTC-SELECTION] Safety check passed: 3 safe medications available
```

**What it means:**
- ✅ All allergies (drug, food, other) are checked
- ✅ Unsafe medications are excluded
- ✅ Safe alternatives are available

**If missing:**
- Verify `drug_allergies` array is populated in database
- Check `isMedicationSafe()` function is called
- Verify allergy matching logic

---

### 3. Pregnancy Safety Checks

**Success Pattern:**
```
[PROFILE-LOAD] Profile loaded: {isPregnant: true, ...}
[SAFETY-CHECK] Medication ibuprofen excluded: ตั้งครรภ์ - หลีกเลี่ยงยานี้
[SAFETY-CHECK] Medication naproxen excluded: ตั้งครรภ์ - หลีกเลี่ยงยานี้
[OTC-SELECTION] Only pregnancy-safe medications recommended
```

**What it means:**
- ✅ Pregnancy status loaded from profile
- ✅ NSAIDs excluded for pregnant users
- ✅ Only safe medications recommended

**If missing:**
- Verify `is_pregnant = true` in database
- Check medication contraindications include pregnancy
- Verify `isMedicationSafe()` checks pregnancy

---

### 4. Drug Interaction Checks

**Success Pattern:**
```
[PROFILE-LOAD] Profile loaded: {currentMedications: 1, ...}
[SAFETY-CHECK] Medication aspirin excluded: อาจมีปฏิกิริยากับยาที่ใช้อยู่ (Current meds: วาร์ฟาริน)
[OTC-SELECTION] Excluded medications that interact with current medications
```

**What it means:**
- ✅ Current medications loaded
- ✅ Interactions detected
- ✅ Unsafe combinations excluded

**If missing:**
- Verify `current_medications` array populated
- Check interaction keywords match
- Verify interaction detection logic

---

### 5. OTC Selection Summary

**Success Pattern:**
```
[OTC-SELECTION] Medical-grade selection: {
  symptomCategory: 'headache',
  severity: 'moderate',
  timeCourse: 'subacute',
  availableMedications: ['paracetamol', 'ibuprofen', 'naproxen'],
  medicationCount: 3
}
[OTC-SELECTION] Filtered by Severity × Time-course: 2 medications
[OTC-SELECTION] Safety check passed: 2 safe medications available
[OTC-SELECTION] Scored medications: [...]
[OTC-SELECTION] High-confidence medications: Option A + Option B
```

**What it means:**
- ✅ Medications filtered by severity/time-course
- ✅ Safety checks applied
- ✅ At least 2 safe options selected

**If missing:**
- Check symptom category mapping
- Verify severity/time-course detection
- Check medication catalog has entries

---

## 🔍 Real-Time Monitoring

### Using Terminal (Backend Logs)

```bash
# Start backend
cd backend
npm start

# Watch logs in real-time
# Look for these patterns:
# - [PROFILE-LOAD]
# - [SAFETY-CHECK]
# - [OTC-SELECTION]
```

### Using grep to Filter Logs

```bash
# Filter profile loading
npm start 2>&1 | grep "PROFILE-LOAD"

# Filter safety checks
npm start 2>&1 | grep "SAFETY-CHECK"

# Filter OTC selection
npm start 2>&1 | grep "OTC-SELECTION"

# Filter exclusions
npm start 2>&1 | grep "excluded"
```

### Using Log Files (if configured)

If backend writes to log files:
```bash
# Watch log file
tail -f backend.log | grep -E "PROFILE-LOAD|SAFETY-CHECK|OTC-SELECTION"
```

---

## ✅ Verification Checklist

### After Each Test

- [ ] `[PROFILE-LOAD]` appears in logs
- [ ] Profile summary shows correct field counts
- [ ] `[SAFETY-CHECK]` messages appear for excluded medications
- [ ] `[OTC-SELECTION]` shows excluded medications list
- [ ] Final recommendations exclude unsafe medications
- [ ] At least 2 safe alternatives recommended

### Test Scenarios

#### Test 1: Allergy Exclusion
- [ ] Profile has `drug_allergies: ['พาราเซตามอล']`
- [ ] Logs show: "Medication paracetamol excluded: แพ้ยานี้"
- [ ] OTC recommendations exclude paracetamol

#### Test 2: Pregnancy Safety
- [ ] Profile has `is_pregnant: true`
- [ ] Logs show: "Medication ibuprofen excluded: ตั้งครรภ์ - หลีกเลี่ยงยานี้"
- [ ] Only pregnancy-safe medications recommended

#### Test 3: Drug Interaction
- [ ] Profile has `current_medications: ['วาร์ฟาริน']`
- [ ] Logs show: "Medication aspirin excluded: อาจมีปฏิกิริยากับยาที่ใช้อยู่"
- [ ] Interacting medications excluded

#### Test 4: All Fields Populated
- [ ] Profile has all 8 new fields populated
- [ ] Logs show all fields in profile summary
- [ ] All safety checks use profile data

---

## 🐛 Troubleshooting

### No `[PROFILE-LOAD]` logs
**Possible causes:**
- User ID not passed in request header
- Database migration not executed
- Supabase connection issue

**Fix:**
- Verify `x-user-id` header in API request
- Check database migration ran successfully
- Verify Supabase credentials

### No `[SAFETY-CHECK]` logs
**Possible causes:**
- `isMedicationSafe()` not being called
- No medications in catalog
- Safety check logic not executed

**Fix:**
- Verify OTC selection code path
- Check medication catalog has entries
- Verify `selectTwoOTCOptions()` calls `isMedicationSafe()`

### Medications not excluded
**Possible causes:**
- Allergy matching logic not working
- Profile data not loaded correctly
- Safety check returning `safe: true` incorrectly

**Fix:**
- Check allergy arrays in profile
- Verify matching logic in `isMedicationSafe()`
- Check medication names match allergies

### Too many medications excluded
**Possible causes:**
- Overly strict matching logic
- False positive allergy matches
- All medications unsafe

**Fix:**
- Review allergy matching algorithm
- Check for substring false matches
- Verify medication catalog has safe alternatives

---

## 📈 Expected Log Flow

### Complete Assessment Flow

```
1. [ASSESS-SYMPTOM] Starting assessment: sessionId=xxx, userId=yyy
2. [PROFILE-LOAD] Loading health profile for user: yyy
3. [PROFILE-LOAD] Profile loaded: {summary}
4. [ASSESS-SYMPTOM] questionCount: 0, symptom: "ปวดหัว"
5. [OTC-SELECTION] Medical-grade selection: {...}
6. [SAFETY-CHECK] Medication X excluded: reason
7. [OTC-SELECTION] Excluded N medications: [...]
8. [OTC-SELECTION] Safety check passed: N safe medications
9. [OTC-SELECTION] High-confidence medications: Option A + Option B
```

### Diagnosis Flow

```
1. [PROFILE-LOAD] Loading health profile for diagnosis: yyy
2. [PROFILE-LOAD] Profile loaded for diagnosis: {summary}
3. [OTC-SELECTION] Medical-grade selection: {...}
4. [SAFETY-CHECK] Multiple medications checked
5. [OTC-SELECTION] Final recommendations exclude unsafe meds
```

---

## 🎓 Best Practices

1. **Monitor continuously** during testing phase
2. **Check logs after each assessment** to verify safety checks
3. **Test with different profiles** (pregnant, allergies, medications)
4. **Verify exclusions are correct** - not too strict, not too lenient
5. **Document any issues** found in logs

---

## 📞 Quick Reference

**Key Log Prefixes:**
- `[PROFILE-LOAD]` - Profile loading
- `[SAFETY-CHECK]` - Medication safety checks
- `[OTC-SELECTION]` - OTC medication selection
- `[ASSESS-SYMPTOM]` - Assessment flow

**Critical Messages:**
- "excluded" - Medication excluded from recommendations
- "Safety check passed" - Safe medications available
- "WARNING" - Potential issues to investigate
