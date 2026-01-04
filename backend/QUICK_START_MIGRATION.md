# Quick Start: Medical Profile Migration

## 🚀 3-Step Execution

### Step 1: Run Database Migration (5 minutes)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy/paste contents of: `backend/database/add-medical-profile-fields.sql`
3. Click **Run**
4. Verify: Run `backend/database/verify-migration.sql` → Should return 8 rows

### Step 2: Test Backend (10 minutes)

1. **Start backend server**
   ```bash
   cd backend
   npm start
   ```

2. **Create test profile** (via app or SQL):
   ```sql
   UPDATE public.user_profiles
   SET 
     drug_allergies = ARRAY['พาราเซตามอล'],
     is_pregnant = false,
     current_medications = ARRAY['เมทฟอร์มิน']
   WHERE id = '{your_user_id}';
   ```

3. **Test assessment:**
   - Start assessment with symptom: "ปวดหัว"
   - Check backend logs for `[PROFILE-LOAD]` messages
   - Verify OTC recommendations exclude paracetamol

### Step 3: Monitor Logs (Ongoing)

**Watch for these log patterns:**

✅ **Success:**
```
[PROFILE-LOAD] Loading health profile for user: {userId}
[PROFILE-LOAD] Profile loaded: {summary}
[OTC-SELECTION] Safety check passed: N safe medications available
```

⚠️ **Allergy Exclusion:**
```
[SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้
[OTC-SELECTION] Excluded N medications: [{medication, reason}]
```

⚠️ **Pregnancy Check:**
```
[SAFETY-CHECK] Medication ibuprofen excluded: ตั้งครรภ์ - หลีกเลี่ยงยานี้
```

⚠️ **Drug Interaction:**
```
[SAFETY-CHECK] Medication aspirin excluded: อาจมีปฏิกิริยากับยาที่ใช้อยู่
```

## ✅ Verification Checklist

- [ ] Migration executed (8 columns added)
- [ ] Backend loads all new fields
- [ ] Safety checks log excluded medications
- [ ] OTC recommendations exclude allergies
- [ ] Pregnancy/breastfeeding checks work
- [ ] Drug interaction warnings appear

## 📚 Full Documentation

- **Migration Guide:** `backend/MIGRATION_EXECUTION_GUIDE.md`
- **Testing Guide:** `backend/TESTING_MEDICAL_PROFILE.md`
- **Integration Summary:** `backend/BACKEND_INTEGRATION_SUMMARY.md`
