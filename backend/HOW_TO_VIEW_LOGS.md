# How to View Backend Logs

## 📊 Where Are the Logs?

Backend logs appear in **the terminal where you ran `npm start`**.

### Terminal Setup:

**Terminal 1 (Backend - Keep this open):**
```bash
cd backend
npm start
```

**This terminal shows:**
- Server startup messages
- All `[PROFILE-LOAD]` logs
- All `[SAFETY-CHECK]` logs
- All `[OTC-SELECTION]` logs
- API request logs
- Any errors

---

## 🔍 What to Look For

### After Running Test, Check Terminal 1 for:

#### ✅ Profile Loading:
```
[PROFILE-LOAD] Loading health profile for user: fe1107c1-25f8-4202-9f4e-00dc911b61ae
[PROFILE-LOAD] Profile loaded: {
  age: 34,
  drugAllergies: 2,
  currentMedications: 1,
  foodAllergies: 1,
  ...
}
```

#### ✅ Safety Checks:
```
[SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้ (Allergies: พาราเซตามอล, แอสไพริน)
[SAFETY-CHECK] Medication aspirin excluded: แพ้ยานี้
```

#### ✅ OTC Selection:
```
[OTC-SELECTION] Excluded 2 medications: [
  { medication: 'paracetamol', reason: 'แพ้ยานี้' },
  { medication: 'aspirin', reason: 'แพ้ยานี้' }
]
[OTC-SELECTION] Safety check passed: 3 safe medications available
```

---

## 📝 Filter Logs (Optional)

### Option 1: Watch Terminal 1
Just scroll up in Terminal 1 to see recent logs after running the test.

### Option 2: Save Logs to File
If you want to save logs to a file:

**Terminal 1:**
```bash
cd backend
npm start 2>&1 | tee backend.log
```

Then view logs:
```bash
# View all logs
cat backend.log

# Filter for specific patterns
grep "PROFILE-LOAD" backend.log
grep "SAFETY-CHECK" backend.log
grep "OTC-SELECTION" backend.log
```

### Option 3: Filter in Real-Time
In Terminal 1, you can't filter while npm start is running, but you can:

**Terminal 2 (separate terminal):**
```bash
# If you saved to file
tail -f backend.log | grep -E "PROFILE-LOAD|SAFETY-CHECK|OTC-SELECTION"
```

---

## 🎯 Quick Test Flow

1. **Terminal 1:** `npm start` (backend running)
2. **Terminal 2:** Run test script
3. **Terminal 1:** Immediately check for logs (they appear right after the test runs)

---

## ✅ Success Indicators

**If you see in Terminal 1:**
- ✅ `[PROFILE-LOAD]` messages
- ✅ Profile summary with field counts
- ✅ `[SAFETY-CHECK]` excluding medications
- ✅ `[OTC-SELECTION]` showing excluded medications

**Then:** Integration is working! 🎉

---

## 🐛 Troubleshooting

### No logs appearing?
- Check Terminal 1 is still running (`npm start`)
- Make sure test actually ran (check Terminal 2)
- Scroll up in Terminal 1 to see older logs

### Can't find specific log?
- Use Cmd+F (Mac) or Ctrl+F (Windows) in Terminal 1
- Search for: `PROFILE-LOAD`, `SAFETY-CHECK`, `OTC-SELECTION`

### Want to see all logs clearly?
- Save to file: `npm start 2>&1 | tee backend.log`
- Then filter: `grep "PROFILE-LOAD\|SAFETY-CHECK\|OTC-SELECTION" backend.log`

---

**The logs are in Terminal 1 where `npm start` is running!** Just scroll up after running your test to see them.
