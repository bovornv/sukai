# Testing Guide: Medical-Grade Profile Fields Integration

## Step 1: Database Migration

### Execute Migration
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `backend/database/add-medical-profile-fields.sql`
3. Execute the SQL script
4. Verify migration using `backend/database/verify-migration.sql`

### Expected Result
- 8 new columns added to `user_profiles` table
- All columns are nullable (backward compatible)
- Arrays default to empty arrays `[]`

## Step 2: Backend Testing

### Test Case 1: Profile with All Fields Populated

**Setup:**
```javascript
// Create test profile via Supabase or API
{
  full_name: "Test User",
  gender: "female",
  birth_date: "1990-01-01",
  weight_kg: 60.0,
  height_cm: 165.0,
  chronic_diseases: ["เบาหวาน", "ความดันโลหิตสูง"],
  drug_allergies: ["พาราเซตามอล", "แอสไพริน"],
  food_allergies: ["ถั่วลิสง"],
  other_allergies: ["ยาง"],
  is_pregnant: false,
  is_breastfeeding: false,
  surgery_history: ["ผ่าตัดไส้ติ่ง"],
  current_medications: ["เมทฟอร์มิน", "โลซาร์แทน"],
  occasional_medications: ["พาราเซตามอล"],
  supplements: ["วิตามินดี", "แคลเซียม"]
}
```

**Test:**
1. Start assessment with symptom: "ปวดหัว"
2. Verify backend logs show all fields loaded
3. Check OTC recommendations exclude paracetamol (allergy)
4. Verify no aspirin recommendation (allergy)

### Test Case 2: Pregnancy Safety Check

**Setup:**
```javascript
{
  is_pregnant: true,
  drug_allergies: []
}
```

**Test:**
1. Start assessment with symptom: "ปวดหัว"
2. Verify OTC recommendations exclude NSAIDs
3. Check logs for: `ตั้งครรภ์ - หลีกเลี่ยงยานี้`
4. Verify only pregnancy-safe medications recommended

### Test Case 3: Drug Interaction Check

**Setup:**
```javascript
{
  current_medications: ["วาร์ฟาริน", "แอสไพริน"],
  drug_allergies: []
}
```

**Test:**
1. Start assessment with symptom: "ปวดหัว"
2. Verify backend checks for interactions
3. Check logs for: `อาจมีปฏิกิริยากับยาที่ใช้อยู่`
4. Verify recommendations avoid interacting medications

### Test Case 4: All Allergy Types Check

**Setup:**
```javascript
{
  drug_allergies: ["พาราเซตามอล"],
  food_allergies: ["ถั่วลิสง"],
  other_allergies: ["ยาง"]
}
```

**Test:**
1. Start assessment with symptom: "ปวดท้อง"
2. Verify all allergy types checked
3. Verify drug allergies block medication recommendations
4. Verify food/other allergies don't block medications (unless relevant)

### Test Case 5: Surgery History Warning

**Setup:**
```javascript
{
  surgery_history: ["ผ่าตัดหัวใจ"],
  drug_allergies: []
}
```

**Test:**
1. Start assessment with symptom: "ปวดหัว"
2. Verify surgery history checked
3. Check for warnings if medication contraindicated for surgery

## Step 3: Monitoring & Verification

### Backend Logs to Check

#### 1. Profile Loading
```
[ASSESS-SYMPTOM] Loading health profile for user: {userId}
Health profile loaded: {age, weightKg, allergies, medications, etc.}
```

#### 2. OTC Selection
```
[OTC-SELECTION] Medical-grade selection: {
  symptomCategory: "...",
  severity: "...",
  timeCourse: "...",
  availableMedications: [...],
  medicationCount: N
}
```

#### 3. Safety Checks
```
[OTC-SELECTION] Filtered by Severity × Time-course: {count} medications
[OTC-SELECTION] Safety check passed/failed: {medication} - {reason}
```

#### 4. Allergy Checks
```
[SAFETY-CHECK] Checking allergies: {allAllergies}
[SAFETY-CHECK] Medication {med} excluded: {reason}
```

### Expected Log Patterns

**Successful Flow:**
1. Profile loads with all fields
2. OTC selection filters by severity/time-course
3. Safety checks exclude unsafe medications
4. At least 2 safe medications recommended

**Allergy Exclusion:**
```
[SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้
[OTC-SELECTION] Filtered medications after safety check: {count}
```

**Pregnancy Check:**
```
[SAFETY-CHECK] Medication ibuprofen excluded: ตั้งครรภ์ - หลีกเลี่ยงยานี้
```

**Drug Interaction:**
```
[SAFETY-CHECK] Medication aspirin excluded: อาจมีปฏิกิริยากับยาที่ใช้อยู่ - ควรปรึกษาแพทย์
```

## Verification Checklist

### Database
- [ ] All 8 new columns exist in `user_profiles`
- [ ] Columns are nullable (backward compatible)
- [ ] Array columns default to empty arrays

### Backend Loading
- [ ] `assessSymptom()` loads all new fields
- [ ] `getDiagnosis()` loads all new fields
- [ ] Health profile object includes all fields
- [ ] No errors when fields are null/empty

### Safety Checks
- [ ] Drug allergies block medications
- [ ] Food allergies checked (but don't block medications unless relevant)
- [ ] Other allergies checked
- [ ] Pregnancy status blocks unsafe medications
- [ ] Breastfeeding status blocks unsafe medications
- [ ] Current medications checked for interactions
- [ ] Surgery history warnings appear when relevant

### OTC Recommendations
- [ ] At least 2 medications recommended (when appropriate)
- [ ] Unsafe medications excluded
- [ ] Safe alternatives provided
- [ ] Dosing uses age/weight from profile

### Error Handling
- [ ] Null fields handled gracefully
- [ ] Empty arrays don't cause errors
- [ ] Missing profile doesn't crash backend
- [ ] Backward compatible with old profiles

## Manual Testing Script

### Test Profile Creation (via Supabase SQL)
```sql
-- Create test profile with all fields
UPDATE public.user_profiles
SET 
  is_pregnant = false,
  is_breastfeeding = false,
  surgery_history = ARRAY['ผ่าตัดไส้ติ่ง'],
  current_medications = ARRAY['เมทฟอร์มิน'],
  occasional_medications = ARRAY['พาราเซตามอล'],
  supplements = ARRAY['วิตามินดี'],
  food_allergies = ARRAY['ถั่วลิสง'],
  other_allergies = ARRAY['ยาง']
WHERE id = '{your_user_id}';
```

### Test API Calls

**1. Start Assessment:**
```bash
POST /api/triage/assess
{
  "session_id": "test-session-123",
  "symptom": "ปวดหัว",
  "previous_answers": {},
  "language": "th"
}
Headers: x-user-id: {your_user_id}
```

**2. Check Response:**
- Verify `needMoreInfo` or `triageLevel`
- Check backend logs for profile loading
- Verify safety checks in logs

**3. Get Diagnosis:**
```bash
GET /api/triage/diagnosis?session_id=test-session-123
Headers: x-user-id: {your_user_id}
```

**4. Verify Recommendations:**
- Check OTC medications exclude allergies
- Verify pregnancy-safe medications if pregnant
- Check for interaction warnings

## Troubleshooting

### Issue: Fields not loading
- Check database migration ran successfully
- Verify column names match exactly
- Check Supabase RLS policies allow read access

### Issue: Safety checks not working
- Verify `isMedicationSafe()` receives healthProfile
- Check logs for `[SAFETY-CHECK]` messages
- Verify allergy arrays are not empty

### Issue: OTC recommendations include unsafe meds
- Check `isMedicationSafe()` return value
- Verify `selectTwoOTCOptions()` filters by safety
- Check logs for excluded medications

### Issue: Null/undefined errors
- Verify all fields use optional chaining (`?.`)
- Check array defaults to `[]`
- Verify boolean fields use `?? null`
