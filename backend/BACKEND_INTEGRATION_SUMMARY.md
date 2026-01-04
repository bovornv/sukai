# Backend Integration Summary - Medical-Grade Profile Fields

## Overview
Backend triage logic has been updated to use all new medical-grade profile fields for enhanced safety checks and clinical reasoning.

## Changes Made

### 1. Database Queries Updated
**Files:** `backend/src/functions/triage/index.js`

- Updated `assessSymptom()` function to load all new fields:
  - `is_pregnant`, `is_breastfeeding`
  - `surgery_history`
  - `current_medications`, `occasional_medications`, `supplements`
  - `food_allergies`, `other_allergies`

- Updated `getDiagnosis()` function with same field loading

### 2. Health Profile Object Enhanced
**Files:** `backend/src/functions/triage/index.js`

Both functions now construct `healthProfile` object with:
```javascript
{
  gender, age, weightKg, heightCm,
  chronicDiseases,
  drugAllergies, foodAllergies, otherAllergies,
  isPregnant, isBreastfeeding,
  surgeryHistory,
  currentMedications, occasionalMedications, supplements
}
```

### 3. Enriched Answers Updated
**Files:** `backend/src/functions/triage/index.js`

`enrichedAnswers` now includes:
- `all_allergies`: Combined array of all allergy types
- `drug_allergies`, `food_allergies`, `other_allergies`: Separate arrays
- `current_medications`: Combined medications array
- `pregnancy`, `pregnant`: Boolean flags
- `breastfeeding`: Boolean flag
- `surgery_history`: Array of surgeries

### 4. Enhanced Medication Safety Checks
**Files:** `backend/src/functions/triage/thai_otc_catalog.js`

`isMedicationSafe()` function now checks:

#### All Allergies (Drug, Food, Other)
- Checks generic name, brand names, and contraindications
- Absolute exclusion if any allergy matches

#### Drug Interactions
- Checks current medications for known interactions
- Warns if interaction detected: "อาจมีปฏิกิริยากับยาที่ใช้อยู่ - ควรปรึกษาแพทย์"

#### Pregnancy & Breastfeeding
- Uses `healthProfile.isPregnant` (from database) as primary source
- Falls back to `answers.pregnancy` if profile not available
- Checks medication contraindications for pregnancy/breastfeeding

#### Surgery History
- Checks for recent surgeries that might contraindicate medications
- Warns: "มีประวัติผ่าตัด - ควรปรึกษาแพทย์ก่อนใช้ยา"

## Integration Points

### Clinical Flow 6-Steps Usage

1. **Step 1 (Emergency Screening)**
   - Uses `age`, `chronicDiseases` for red flag sensitivity
   - Uses `isPregnant`, `isBreastfeeding` for emergency thresholds

2. **Step 2 (Severity × Time-course)**
   - Uses `weightKg`, `heightCm`, `BMI` for severity modifiers
   - Uses `surgeryHistory` for risk assessment

3. **Step 3 (Confidence Score)**
   - Profile completeness increases confidence weight
   - More complete profile = higher confidence

4. **Step 4 (Mandatory Health Context Check)**
   - Uses profile as baseline
   - Compares new answers against profile data

5. **Step 5 (OTC Recommendation)**
   - **Allergy Check**: Hard stop for all allergy types
   - **Drug Interaction**: Checks current medications
   - **Pregnancy/Breastfeeding**: Contraindication checks
   - **Dosing**: Uses `age`, `weightKg` for dose calculation

6. **Step 6 (Follow-up Logic)**
   - Uses `age`, `chronicDiseases` for follow-up thresholds
   - Adjusts 24-48hr thresholds based on risk factors

## Testing Checklist

After running database migration, verify:

- [ ] Backend loads all new fields from `user_profiles`
- [ ] `isMedicationSafe()` checks all allergies (drug, food, other)
- [ ] Drug interaction checks work with `currentMedications`
- [ ] Pregnancy/breastfeeding checks use profile data
- [ ] Surgery history warnings appear when appropriate
- [ ] OTC recommendations exclude unsafe medications
- [ ] Error handling works if fields are null/empty

## Next Steps

1. **Run Database Migration**
   ```sql
   -- Execute: backend/database/add-medical-profile-fields.sql
   ```

2. **Test Backend**
   - Create test profile with all fields populated
   - Test OTC recommendation with allergies
   - Test pregnancy/breastfeeding contraindications
   - Test drug interaction warnings

3. **Monitor Logs**
   - Check console logs for `[OTC-SELECTION]` messages
   - Verify safety checks are working
   - Monitor for any null/undefined errors

## Notes

- All new fields are optional (nullable) - backward compatible
- Empty arrays default to `[]` - safe for array operations
- Boolean fields use `?? null` to distinguish between `false` and `not set`
- Safety checks prioritize profile data over answers (more reliable)
