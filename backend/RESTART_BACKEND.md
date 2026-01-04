# Restart Backend with Symptom-Specific Fix

## ✅ Changes Made

1. **Added debug logging** to track symptom detection
2. **Simplified symptom detection** - checks both `symptomType` AND direct text matching
3. **Made conditions more robust** - less strict checks to ensure questions are returned

## 🚀 Restart Backend

```bash
cd backend

# Kill any existing process
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start backend
npm start
```

## 🔍 Check Backend Logs

After restarting, test with different symptoms and check the console logs. You should see:

```
[ASSESS] sessionId: ..., symptom: "ปวดหัว", symptomForTriage: "ปวดหัว", questionCount: 0
[SYMPTOM-SPECIFIC] Symptom: "ปวดหัว", Normalized: "ปวดหัว", Type: "headache", QuestionCount: 0
[SYMPTOM-SPECIFIC] ✅ Returning HEADACHE location question for "ปวดหัว"
```

## 🧪 Test Different Symptoms

1. **ปวดหัว** → Should see: `[SYMPTOM-SPECIFIC] ✅ Returning HEADACHE location question`
2. **ไข้** → Should see: `[SYMPTOM-SPECIFIC] ✅ Returning FEVER question`
3. **ไอ** → Should see: `[SYMPTOM-SPECIFIC] ✅ Returning COUGH question`

## 📝 Expected First Questions

| Symptom | Expected Question |
|---------|------------------|
| ปวดหัว | ปวดตรงไหนคะ? (เช่น หน้าผาก, ขมับ, ท้ายทอย) |
| ไข้ | มีไข้ไหมคะ? ถ้ามี อุณหภูมิเท่าไหร่คะ? |
| ไอ | มีเสมหะไหมคะ? ถ้ามี สีอะไรคะ? |
| เจ็บคอ | เจ็บคอมากแค่ไหนคะ? (มาก / ปานกลาง / นิดหน่อย) |
| ท้องเสีย | ท้องเสียมากแค่ไหนคะ? (มาก / ปานกลาง / นิดหน่อย) |

## 🐛 If Still Not Working

Check backend console logs for:
- `[ASSESS]` logs - shows what symptom is being processed
- `[SYMPTOM-SPECIFIC]` logs - shows symptom detection and question selection
- Any errors or warnings

If you see `⚠️ No symptom-specific question returned`, check:
1. Is `questionCount` 0 when you send the symptom?
2. Is the symptom being detected correctly?
3. Are the conditions being met?
