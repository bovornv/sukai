# Triage Engine Upgrade - Doctor-Level Clinical Reasoning

## 🎯 What Changed

The triage engine has been upgraded from a **fixed question set** to an **adaptive clinical reasoning system** that works like a real doctor.

### Before (Fixed Question Set)
- ❌ Asked same 5-6 questions every time
- ❌ Didn't adapt to user's answers
- ❌ Binary logic (yes/no decisions)
- ❌ Generic recommendations

### After (Adaptive Clinical Reasoning)
- ✅ Questions adapt based on symptom and answers
- ✅ Only asks questions that change triage level
- ✅ Risk scoring system (accumulates risk points)
- ✅ Explainable recommendations with WHY

---

## 🧠 Core Improvements

### 1. Risk Scoring System

Instead of binary yes/no decisions, the system now uses **risk accumulation**:

- Each answer adds/subtracts risk points
- Risk thresholds determine triage level:
  - **Self-care**: 0-20 points
  - **Pharmacy**: 21-40 points
  - **GP**: 41-70 points
  - **Emergency**: 71+ points

**Example:**
```
ปวดหัว (base: 5 points)
+ แย่ลง (trend: +20 points)
+ ไม่ดีขึ้น (self-care: +15 points)
= 40 points → Pharmacy level
```

### 2. Adaptive Questioning

Questions are selected based on:
- **Current risk score** (only ask if answer would change triage)
- **Symptom characteristics** (red flags checked first)
- **What's already known** (don't ask redundant questions)

**Example:**
- If user says "ปวดหัว 2 วันแล้ว" → Duration question skipped
- If user says "แย่ลง" → Trend question skipped
- If red flags present → Emergency questions asked first

### 3. Clinical Question Categories

Questions organized by clinical priority:

1. **Red Flags** (Priority 1) - Always checked first
   - หายใจลำบาก
   - เจ็บหน้าอก
   - หมดสติ/ชัก

2. **Symptom Characterization** (Priority 2)
   - Location, severity, quality

3. **Timeline** (Priority 3)
   - Duration, trend, pattern

4. **Associated Symptoms** (Priority 4)
   - Fever, nausea, neurological signs

5. **Patient Context** (Priority 5)
   - Age, chronic disease, pregnancy

6. **Treatment Response** (Priority 6)
   - Self-care attempts, improvement

### 4. Explainable Recommendations

Every recommendation now includes **WHY**:

**Before:**
```
🟡 ควรติดตาม / พบเภสัชกร
```

**After:**
```
🟡 ควรติดตาม / พบเภสัชกร
ทำไม: อาการไม่รุนแรงมาก แต่ควรใช้ยาช่วยบรรเทาเพื่อให้หายเร็วขึ้น
```

**For GP cases:**
```
🟡 ควรติดตาม / พบแพทย์
ทำไม: อาการแย่ลงแม้ดูแลตัวเองแล้ว ควรให้แพทย์ตรวจเพื่อหาสาเหตุ
```

---

## 📊 Risk Factors

### Red Flags (Highest Risk)
- หายใจลำบาก: +50 points
- เจ็บหน้าอกรุนแรง: +55 points
- หมดสติ: +70 points
- ชัก: +70 points

### Severity
- รุนแรง: +30 points
- ปานกลาง: +10 points
- เบา: -5 points

### Trend
- แย่ลง: +20 points
- เหมือนเดิม: +5 points
- ดีขึ้น: -5 points

### Duration
- มากกว่า 7 วัน: +15 points
- 3-7 วัน: +10 points
- 1-3 วัน: +5 points

### Risk Groups
- เด็ก (< 2 ปี): +15 points
- ผู้สูงอายุ (> 65 ปี): +15 points
- ตั้งครรภ์: +20 points
- โรคประจำตัว: +10 points

### Self-Care Response
- ไม่ดีขึ้น: +15 points
- ดีขึ้น: -5 points

---

## 🧪 Testing Guide

### Test 1: Adaptive Questioning

**Scenario 1: Context Already Provided**
```
Input: "ปวดหัว 2 วันแล้ว กินยาแล้วไม่ดีขึ้น"
Expected:
- Duration question skipped (extracted from text)
- Self-care question skipped (detected from text)
- Trend question skipped (worsening detected)
- Only asks: severity, associated symptoms
- Result: Faster triage (2-3 questions instead of 5-6)
```

**Scenario 2: Red Flags Present**
```
Input: "ปวดหัว หายใจลำบาก"
Expected:
- Red flag detected immediately
- Emergency triage level
- No questions asked
- Direct to emergency recommendation
```

**Scenario 3: Low Risk**
```
Input: "ปวดหัวนิดหน่อย"
Expected:
- Low severity detected
- Risk score: ~5 points
- Self-care triage
- Fewer questions (only if needed)
```

### Test 2: Risk Scoring

**Scenario 1: Accumulating Risk**
```
Input: "ปวดหัว"
Answer 1: "รุนแรง" → +30 points
Answer 2: "แย่ลง" → +20 points
Answer 3: "ไม่ดีขึ้น" → +15 points
Total: 65 points → GP level
```

**Scenario 2: Risk Reduction**
```
Input: "ปวดหัว"
Answer 1: "เบา" → -5 points
Answer 2: "ดีขึ้น" → -5 points
Total: -5 points (clamped to 0) → Self-care level
```

### Test 3: Explainable Recommendations

**Test Cases:**
1. **Self-care case**: Should explain why safe to self-care
2. **Pharmacy case**: Should explain why OTC meds help
3. **GP case**: Should explain why doctor needed (based on risk factors)
4. **Emergency case**: Should explain urgency

**Expected Format:**
```
🟢/🟡/🔴 [Severity]
ทำไม: [Clinical reasoning explanation]
[Action]
[Follow-up]
```

---

## 🔧 Technical Details

### New Files
- `backend/src/functions/triage/clinical_reasoning.js`
  - Risk scoring functions
  - Question selection logic
  - Clinical reasoning helpers

### Modified Files
- `backend/src/functions/triage/assess.js`
  - Integrated clinical reasoning
  - Uses risk scoring instead of binary logic
  - Adaptive question selection

- `backend/src/functions/triage/diagnosis.js`
  - Explainable WHY explanations
  - Risk score-based reasoning
  - Context-aware recommendations

- `backend/src/functions/triage/index.js`
  - Calculates risk score
  - Passes risk score to diagnosis generation

---

## 📈 Expected Improvements

### Question Count
- **Before**: 5-6 questions (always same)
- **After**: 2-4 questions (adaptive)
- **Reduction**: 40-60% fewer questions

### User Experience
- ✅ Questions feel relevant
- ✅ Faster triage completion
- ✅ More personalized experience
- ✅ Better understanding of recommendations

### Clinical Accuracy
- ✅ Risk-based triage (more accurate)
- ✅ Red flags prioritized
- ✅ Context-aware recommendations
- ✅ Explainable decisions

---

## 🚀 Next Steps

1. **Test Adaptive Questioning**
   - Try different symptoms
   - Verify questions change
   - Check question relevance

2. **Test Risk Scoring**
   - Try different answer combinations
   - Verify triage level changes
   - Check risk accumulation

3. **Test Explainable Recommendations**
   - Verify WHY explanations
   - Check clinical reasoning
   - Ensure recommendations make sense

4. **Monitor Performance**
   - Track question count
   - Track triage accuracy
   - Collect user feedback

---

## 🐛 Troubleshooting

### Issue: Questions still same every time
**Fix**: Check if `selectNextQuestion` is being called correctly

### Issue: Risk score not accumulating
**Fix**: Verify `calculateRiskScore` is called with correct parameters

### Issue: Recommendations not explainable
**Fix**: Check `generateSummary` function receives risk score

### Issue: Too many questions
**Fix**: Verify `hasEnoughInfo` logic is working correctly

---

## ✅ Success Criteria

**Upgrade Successful If:**
- ✅ Questions adapt to symptom and answers
- ✅ Risk scoring works correctly
- ✅ Recommendations include WHY
- ✅ Fewer questions asked (40% reduction)
- ✅ Triage level matches risk score
- ✅ User experience improved

---

**Ready for testing! 🎉**

