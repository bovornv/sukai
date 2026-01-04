# Run Steps 2-5: Complete Testing Guide

## ✅ Step 1: Migration Complete
You've already run the database migration. Great!

---

## 📝 Step 2: Create Test Profile

### Get Your User ID
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find your user account
3. Copy the **User ID** (UUID format, e.g., `123e4567-e89b-12d3-a456-426614174000`)

### Create Test Profile
1. Open **Supabase SQL Editor**
2. Open file: `backend/scripts/step-2-create-test-profile.sql`
3. Replace `{your_user_id}` with your actual UUID
4. Click **Run**

**Expected Result:**
- Profile updated with test data
- `drug_allergies`: `{พาราเซตามอล,แอสไพริน}`
- `current_medications`: `{เมทฟอร์มิน 500mg}`

**Verify:**
```sql
SELECT drug_allergies, current_medications 
FROM public.user_profiles 
WHERE id = '{your_user_id}'::uuid;
```

---

## 🚀 Step 3: Start Backend

### Option A: Using Script (Recommended)
```bash
cd backend
./scripts/step-3-start-backend.sh
```

### Option B: Manual Start
```bash
cd backend
npm start
```

**Expected Output:**
```
SukAI Backend running on port 3000
```

**Keep this terminal open** - logs will appear here.

**What to Watch For:**
- Server starts without errors
- No database connection errors
- Port 3000 is listening

---

## 🧪 Step 4: Run Test

### Set Your User ID
```bash
export TEST_USER_ID="your-user-id-here"
export API_BASE_URL="http://localhost:3000"
```

### Run Test Script
```bash
cd backend
./scripts/step-4-run-test.sh
```

**Or Manual Test:**
```bash
curl -X POST "http://localhost:3000/api/triage/assess" \
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

**Expected:**
- Assessment request succeeds
- Response contains `needMoreInfo` or `triageLevel`
- No errors

---

## 📊 Step 5: Monitor Logs

### In Backend Terminal, Look For:

#### ✅ Profile Loading Success:
```
[PROFILE-LOAD] Loading health profile for user: {userId}
[PROFILE-LOAD] Profile loaded: {
  age: 34,
  gender: 'male',
  drugAllergies: 2,
  foodAllergies: 1,
  currentMedications: 1,
  isPregnant: false
}
```

#### ✅ Safety Check Success:
```
[SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้ (Allergies: พาราเซตามอล, แอสไพริน)
[SAFETY-CHECK] Medication aspirin excluded: แพ้ยานี้
[OTC-SELECTION] Excluded 2 medications: [
  { medication: 'paracetamol', reason: 'แพ้ยานี้' },
  { medication: 'aspirin', reason: 'แพ้ยานี้' }
]
[OTC-SELECTION] Safety check passed: 3 safe medications available
```

### Filter Logs (Optional)
```bash
# In backend terminal, filter logs:
npm start 2>&1 | grep -E "PROFILE-LOAD|SAFETY-CHECK|OTC-SELECTION"
```

### Or Use Monitoring Script
```bash
# In separate terminal:
cd backend
./scripts/step-5-monitor-logs.sh
```

---

## ✅ Verification Checklist

### Step 2: Profile Created ✅
- [ ] User ID copied from Supabase
- [ ] SQL script executed successfully
- [ ] Profile has `drug_allergies` populated
- [ ] Profile has `current_medications` populated

### Step 3: Backend Running ✅
- [ ] Backend starts without errors
- [ ] Port 3000 is listening
- [ ] No database connection errors

### Step 4: Test Executed ✅
- [ ] Assessment API call succeeds
- [ ] Response contains expected fields
- [ ] No API errors

### Step 5: Logs Verified ✅
- [ ] `[PROFILE-LOAD]` appears in logs
- [ ] Profile summary shows field counts
- [ ] `[SAFETY-CHECK]` messages appear
- [ ] Medications excluded correctly
- [ ] `[OTC-SELECTION]` shows excluded medications

---

## 🎯 Success Criteria

### ✅ Everything Working If:
1. **Profile Loading:** Logs show profile loaded with all fields
2. **Safety Checks:** Logs show medications excluded due to allergies
3. **OTC Selection:** Logs show excluded medications list
4. **Recommendations:** Final OTC recommendations exclude paracetamol (if allergic)

### ❌ Issues to Check:
- **No logs:** Backend might not be running or console output hidden
- **No profile loaded:** Check user ID, migration, RLS policies
- **No safety checks:** Check profile has allergies, medication catalog has entries
- **Wrong exclusions:** Check allergy matching logic

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port is in use
lsof -i :3000

# Kill existing process
lsof -ti:3000 | xargs kill -9

# Check .env file exists
ls -la backend/.env
```

### Profile Not Loading
```sql
-- Verify profile exists
SELECT * FROM public.user_profiles WHERE id = '{your_user_id}'::uuid;

-- Check migration ran
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('drug_allergies', 'current_medications');
```

### No Safety Check Logs
- Verify profile has `drug_allergies` populated
- Check backend reached OTC selection code
- Verify medication catalog has entries

---

## 📚 Additional Resources

- **Quick Test:** `TEST_NOW.md`
- **Detailed Guide:** `EXECUTE_TESTS.md`
- **Monitoring:** `MONITORING_GUIDE.md`
- **Log Reference:** `LOG_REFERENCE_CARD.md`

---

## 🎉 Next Steps After Testing

Once all tests pass:
1. ✅ Integration verified
2. ✅ Safety checks working
3. ✅ Profile data used correctly
4. ✅ Ready for production use

**You're done!** 🚀
