# Check Backend Logs for Symptom-Specific Questions

## 🔍 How to Check Backend Logs

After restarting the backend, when you test in Chrome, check your **backend terminal** for these logs:

### Expected Logs for "ปวดหัว":

```
[ASSESS] sessionId: ..., symptom: "ปวดหัว", symptomForTriage: "ปวดหัว"
[ASSESS] questionCount: 0, questionsAsked.length: 0
[ASSESS] isFirstQuestion: true, isAnswer: false
[SELECT-NEXT-Q] symptom: "ปวดหัว", questionCount: 0, questionsAsked.length: 0
[SYMPTOM-SPECIFIC] FIRST QUESTION DETECTED - questionCount: 0, questionsAsked.length: 0
[SYMPTOM-SPECIFIC] QuestionCount=0 - Symptom: "ปวดหัว", Normalized: "ปวดหัว", Type: "headache"
[SYMPTOM-SPECIFIC] ✅ Returning HEADACHE location question for "ปวดหัว"
[ASSESS-SYMPTOM] Result - nextQuestion: "ปวดตรงไหนคะ? (เช่น หน้าผาก, ขมับ, ท้ายทอย)..."
```

### If You See Red Flag Question:

Look for:
```
[RED-FLAGS] Returning red flag question (questionCount: X, isFirstQuestion: false)
```

If `questionCount` is 0 or `isFirstQuestion` is true, that's the bug!

### If You See This:

```
[SYMPTOM-SPECIFIC] ⚠️ No match for "ปวดหัว" (type: headache)
```

That means symptom detection failed - check the symptom text.

## 🐛 Troubleshooting

### Issue: Still getting red flag question

**Check backend logs for**:
1. What is `questionCount`? (Should be 0)
2. What is `questionsAsked.length`? (Should be 0)
3. Is `isFirstQuestion` true or false?
4. What symptom is being passed?

**If questionCount is NOT 0**:
- Session might be loaded from database with wrong questionCount
- Check database: `SELECT * FROM triage_sessions WHERE session_id = 'your-session-id'`

**If symptom is wrong**:
- Check what `symptomForTriage` is
- Might be using old symptom from session instead of current

## ✅ Success Indicators

You should see:
- `[SYMPTOM-SPECIFIC] ✅ Returning HEADACHE location question`
- `[RED-FLAGS] SKIPPED - First question detected`
- Question returned is NOT "มีหายใจลำบาก..."

## 📝 Share Backend Logs

If it's still not working, copy the backend console logs and share them. Look for lines starting with:
- `[ASSESS]`
- `[SELECT-NEXT-Q]`
- `[SYMPTOM-SPECIFIC]`
- `[RED-FLAGS]`
