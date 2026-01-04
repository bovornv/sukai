# Execute Steps 2-5 Now

## ✅ Step 2: Run SQL in Supabase

1. **Open Supabase SQL Editor**
2. **Copy the entire content** from `backend/scripts/step-2-create-test-profile.sql`
3. **Paste and Run** in Supabase SQL Editor
4. **Verify** you see the SELECT results showing your profile with:
   - `drug_allergies: {พาราเซตามอล,แอสไพริน}`
   - `current_medications: {เมทฟอร์มิน 500mg}`

---

## 🚀 Step 3: Start Backend

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

## 🧪 Step 4: Run Test

**Terminal 2 (Test):**
```bash
cd backend
./scripts/quick-test.sh
```

**Or manual test:**
```bash
export TEST_USER_ID="fe1107c1-25f8-4202-9f4e-00dc911b61ae"
export API_BASE_URL="http://localhost:3000"

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

## 📊 Step 5: Monitor Logs

**In Terminal 1 (Backend), watch for:**

### ✅ Success Pattern:
```
[PROFILE-LOAD] Loading health profile for user: fe1107c1-25f8-4202-9f4e-00dc911b61ae
[PROFILE-LOAD] Profile loaded: {
  age: 34,
  drugAllergies: 2,
  currentMedications: 1,
  foodAllergies: 1,
  ...
}
[SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้ (Allergies: พาราเซตามอล, แอสไพริน)
[SAFETY-CHECK] Medication aspirin excluded: แพ้ยานี้
[OTC-SELECTION] Excluded 2 medications: [...]
[OTC-SELECTION] Safety check passed: 3 safe medications available
```

---

## ✅ Verification Checklist

- [ ] SQL executed successfully in Supabase
- [ ] Profile shows `drug_allergies: {พาราเซตามอล,แอสไพริน}`
- [ ] Backend started on port 3000
- [ ] Test script runs without errors
- [ ] `[PROFILE-LOAD]` appears in backend logs
- [ ] `[SAFETY-CHECK]` messages appear
- [ ] Paracetamol excluded from recommendations

---

**Ready to execute!** Start with Step 2 (run SQL), then proceed through steps 3-5.
