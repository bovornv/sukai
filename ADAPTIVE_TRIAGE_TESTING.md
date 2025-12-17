# Adaptive Triage Engine - Testing Guide

## 🎯 What to Test

The new adaptive triage engine should:
1. ✅ Ask different questions based on symptom
2. ✅ Skip questions when context already provided
3. ✅ Use risk scoring to determine triage level
4. ✅ Provide explainable recommendations with WHY

---

## 🧪 Test Scenarios

### Test 1: Context Extraction (Smart Question Skipping)

**Scenario A: Duration Already Mentioned**
```
Input: "ปวดหัว 2 วันแล้ว"
Expected Behavior:
- ✅ Duration question SKIPPED (extracted from text)
- ✅ Asks: severity, trend, or associated symptoms
- ✅ Faster triage (fewer questions)
```

**Scenario B: Worsening Already Mentioned**
```
Input: "ปวดหัว แย่ลง"
Expected Behavior:
- ✅ Trend question SKIPPED (worsening detected)
- ✅ Asks: duration, severity, associated symptoms
- ✅ Higher risk score (trend adds +20 points)
```

**Scenario C: Self-Care Already Mentioned**
```
Input: "ปวดหัว กินยาแล้วไม่ดีขึ้น"
Expected Behavior:
- ✅ Self-care question SKIPPED (detected from text)
- ✅ Worsening detected (adds +20 points)
- ✅ Self-care failure detected (adds +15 points)
- ✅ Higher triage level (GP instead of Pharmacy)
```

**Scenario D: All Context Provided**
```
Input: "ปวดหัว 2 วันแล้ว กินยาแล้วไม่ดีขึ้น"
Expected Behavior:
- ✅ Duration question SKIPPED
- ✅ Trend question SKIPPED (worsening detected)
- ✅ Self-care question SKIPPED
- ✅ Only asks: severity, associated symptoms, risk group
- ✅ Much faster triage (2-3 questions instead of 5-6)
```

---

### Test 2: Adaptive Question Selection

**Scenario A: Red Flags Present**
```
Input: "ปวดหัว หายใจลำบาก"
Expected Behavior:
- ✅ Red flag detected immediately
- ✅ Emergency triage level
- ✅ No questions asked (direct to emergency)
```

**Scenario B: High Risk Symptom**
```
Input: "ปวดหัวรุนแรง"
Expected Behavior:
- ✅ High severity detected (+30 points)
- ✅ Asks red flag questions FIRST
- ✅ Then asks associated symptoms
- ✅ GP level triage
```

**Scenario C: Low Risk Symptom**
```
Input: "ปวดหัวนิดหน่อย"
Expected Behavior:
- ✅ Low severity detected (-5 points)
- ✅ Fewer questions asked
- ✅ Self-care level triage
```

---

### Test 3: Risk Scoring Accumulation

**Scenario A: Progressive Risk Increase**
```
Step 1: "ปวดหัว"
  → Risk: ~5 points → Self-care

Step 2: Answer "รุนแรง"
  → Risk: ~35 points → Pharmacy

Step 3: Answer "แย่ลง"
  → Risk: ~55 points → GP

Step 4: Answer "ไม่ดีขึ้น"
  → Risk: ~70 points → GP (close to emergency)
```

**Scenario B: Risk Reduction**
```
Step 1: "ปวดหัว"
  → Risk: ~5 points

Step 2: Answer "เบา"
  → Risk: ~0 points (clamped to 0)

Step 3: Answer "ดีขึ้น"
  → Risk: ~-5 points (clamped to 0)
  → Self-care level maintained
```

---

### Test 4: Explainable Recommendations

**Test Each Triage Level:**

**Self-Care:**
```
Expected WHY: "อาการไม่รุนแรงและไม่มีสัญญาณอันตราย"
```

**Pharmacy:**
```
Expected WHY: "อาการไม่รุนแรงมาก แต่ควรใช้ยาช่วยบรรเทาเพื่อให้หายเร็วขึ้น"
```

**GP:**
```
Expected WHY (if worsening): "อาการแย่ลงแม้ดูแลตัวเองแล้ว ควรให้แพทย์ตรวจเพื่อหาสาเหตุ"
Expected WHY (if high risk): "อาการรุนแรงหรือมีปัจจัยเสี่ยงสูง (เช่น อายุ, โรคประจำตัว) ควรให้แพทย์ตรวจวินิจฉัย"
```

**Emergency:**
```
Expected WHY: "พบสัญญาณอันตราย (เช่น หายใจลำบาก, เจ็บหน้าอก, หมดสติ) ที่ต้องได้รับการดูแลทันที"
```

---

## 📋 Step-by-Step Testing

### Step 1: Start Backend

```bash
cd backend
npm start
```

**Expected**: Server starts on port 3000

---

### Step 2: Test API Endpoints

**Test Triage Assessment:**
```bash
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{
    "session_id": "test-001",
    "symptom": "ปวดหัว 2 วันแล้ว",
    "previous_answers": {}
  }'
```

**Expected Response:**
```json
{
  "need_more_info": true,
  "next_question": "ปวดมากแค่ไหนคะ? (มาก / ปานกลาง / นิดหน่อย)",
  "triage_level": "uncertain"
}
```

**Verify:**
- ✅ Duration question NOT asked (extracted from text)
- ✅ Question adapts to symptom

---

### Step 3: Test Risk Scoring

**Test Low Risk:**
```bash
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{
    "session_id": "test-002",
    "symptom": "ปวดหัวนิดหน่อย",
    "previous_answers": {}
  }'
```

**Expected**: Lower risk score, self-care level

**Test High Risk:**
```bash
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{
    "session_id": "test-003",
    "symptom": "ปวดหัวรุนแรง แย่ลง",
    "previous_answers": {}
  }'
```

**Expected**: Higher risk score, GP level

---

### Step 4: Test Complete Flow in UI

1. **Start Flutter App**
   ```bash
   cd mobile
   flutter run -d chrome
   ```

2. **Test Adaptive Questioning**
   - Enter: "ปวดหัว 2 วันแล้ว"
   - ✅ Verify duration question NOT asked
   - ✅ Verify other questions asked

3. **Test Risk Accumulation**
   - Enter: "ปวดหัว"
   - Answer: "รุนแรง"
   - Answer: "แย่ลง"
   - ✅ Verify triage level increases (Pharmacy → GP)

4. **Test Explainable Recommendations**
   - Complete triage session
   - ✅ Verify summary includes WHY explanation
   - ✅ Verify WHY matches triage level and risk factors

---

## ✅ Success Criteria

**Adaptive Triage Engine Works If:**
- ✅ Questions change based on symptom
- ✅ Questions skipped when context provided
- ✅ Risk score accumulates correctly
- ✅ Triage level matches risk score
- ✅ Recommendations include WHY
- ✅ Fewer questions asked (40% reduction)

---

## 🐛 Troubleshooting

### Issue: Questions still same every time
**Check:**
- `selectNextQuestion` function is called
- `questionsAsked` array is passed correctly
- Context extraction is working

**Fix:** Verify `assess.js` imports `selectNextQuestion` correctly

### Issue: Risk score not accumulating
**Check:**
- `calculateRiskScore` is called with correct parameters
- Answer keys match `RISK_FACTORS` keys
- Risk factors are defined correctly

**Fix:** Check `clinical_reasoning.js` risk factor mappings

### Issue: Recommendations don't include WHY
**Check:**
- `generateDiagnosis` receives `riskScore` parameter
- `generateSummary` uses risk score for explanation
- Diagnosis response includes `why_explanation`

**Fix:** Verify `index.js` passes `riskScore` to `generateDiagnosis`

---

## 📊 Expected Improvements

**Before Upgrade:**
- Questions: 5-6 (always same)
- Question relevance: Low
- Recommendations: Generic
- User experience: Repetitive

**After Upgrade:**
- Questions: 2-4 (adaptive)
- Question relevance: High
- Recommendations: Explainable
- User experience: Personalized

**Improvement:**
- 40-60% fewer questions
- Better clinical accuracy
- More user-friendly

---

**Ready for testing! 🚀**

