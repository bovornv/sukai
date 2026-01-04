# Quick Start: Steps 2-5

## ✅ Step 2: Run SQL (Do This First!)

1. **Open Supabase Dashboard** → **SQL Editor**
2. **Copy entire file:** `backend/scripts/step-2-create-test-profile.sql`
3. **Paste and Run** in SQL Editor
4. **Verify** you see results showing:
   - `drug_allergies: {พาราเซตามอล,แอสไพริน}`
   - `current_medications: {เมทฟอร์มิน 500mg}`

---

## 🚀 Step 3: Start Backend

**Open Terminal 1:**
```bash
cd backend
npm start
```

**Expected:**
```
SukAI Backend running on port 3000
```

**Keep this terminal open** - logs appear here!

---

## 🧪 Step 4: Run Test

**Open Terminal 2:**
```bash
cd backend
export TEST_USER_ID="fe1107c1-25f8-4202-9f4e-00dc911b61ae"
./scripts/quick-test.sh
```

**Or manual:**
```bash
curl -X POST "http://localhost:3000/api/triage/assess" \
  -H "Content-Type: application/json" \
  -H "x-user-id: fe1107c1-25f8-4202-9f4e-00dc911b61ae" \
  -H "x-language: th" \
  -d '{"session_id":"test-123","symptom":"ปวดหัว","previous_answers":{},"language":"th"}'
```

---

## 📊 Step 5: Watch Logs

**In Terminal 1 (Backend), look for:**

### ✅ Success Logs:
```
[PROFILE-LOAD] Loading health profile for user: fe1107c1-25f8-4202-9f4e-00dc911b61ae
[PROFILE-LOAD] Profile loaded: {
  drugAllergies: 2,
  currentMedications: 1,
  ...
}
[SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้
[OTC-SELECTION] Excluded 2 medications: [...]
```

---

## ✅ Checklist

- [ ] SQL executed in Supabase
- [ ] Profile has `drug_allergies` populated
- [ ] Backend running on port 3000
- [ ] Test script executed
- [ ] `[PROFILE-LOAD]` logs appear
- [ ] `[SAFETY-CHECK]` logs appear
- [ ] Paracetamol excluded from recommendations

---

**Ready! Start with Step 2 (run SQL), then proceed through 3-5.**
