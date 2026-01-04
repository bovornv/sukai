# Log Reference Card: Quick Lookup

## 🎯 Key Log Prefixes

| Prefix | Meaning | When It Appears |
|--------|---------|----------------|
| `[PROFILE-LOAD]` | Profile loading | When backend loads user profile |
| `[SAFETY-CHECK]` | Medication safety | When checking if medication is safe |
| `[OTC-SELECTION]` | OTC selection | When selecting OTC medications |
| `[ASSESS-SYMPTOM]` | Assessment start | When assessment begins |

---

## ✅ Success Patterns

### Profile Loading Success
```
[PROFILE-LOAD] Loading health profile for user: {userId}
[PROFILE-LOAD] Profile loaded: {
  age: 34,
  drugAllergies: 2,
  foodAllergies: 1,
  currentMedications: 1,
  isPregnant: false
}
```

### Safety Check Success
```
[SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้
[OTC-SELECTION] Excluded 2 medications: [...]
[OTC-SELECTION] Safety check passed: 3 safe medications available
```

---

## ⚠️ Warning Patterns

### No Safe Medications
```
[OTC-SELECTION] WARNING: No safe medications after safety check
```
**Action:** Check if all medications are excluded incorrectly

### No Medications Match
```
[OTC-SELECTION] WARNING: No medications match severity/time-course
```
**Action:** Check symptom category mapping

---

## 🔍 What to Look For

### Test 1: Allergy Exclusion
**Look for:**
```
[SAFETY-CHECK] Medication {name} excluded: แพ้ยานี้
```

### Test 2: Pregnancy Safety
**Look for:**
```
[SAFETY-CHECK] Medication {name} excluded: ตั้งครรภ์ - หลีกเลี่ยงยานี้
```

### Test 3: Drug Interaction
**Look for:**
```
[SAFETY-CHECK] Medication {name} excluded: อาจมีปฏิกิริยากับยาที่ใช้อยู่
```

---

## 📊 Log Counts

**Expected per assessment:**
- `[PROFILE-LOAD]`: 1-2 times (assess + diagnosis)
- `[SAFETY-CHECK]`: 3-10 times (one per medication checked)
- `[OTC-SELECTION]`: 5-10 times (selection process)

---

## 🚨 Error Patterns

### Profile Not Found
```
[PROFILE-LOAD] Failed to load health profile: {error}
```
**Fix:** Check user ID, migration, RLS policies

### Database Error
```
Failed to load session from DB
```
**Fix:** Check Supabase connection, credentials

---

## 💡 Pro Tips

1. **Filter logs:** `grep "SAFETY-CHECK" backend.log`
2. **Count exclusions:** `grep "excluded" backend.log | wc -l`
3. **Watch real-time:** `npm start 2>&1 | grep -E "PROFILE-LOAD|SAFETY-CHECK"`

---

**Print this card** and keep it handy while testing!
