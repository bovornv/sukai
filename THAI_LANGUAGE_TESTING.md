# Thai Language Understanding - Testing Guide

## 🎯 Purpose

Test the new Thai language understanding features:
- Misspelling normalization
- Slang understanding
- Context extraction
- Smart clarification
- Anxiety-aware responses

---

## 📋 Test Cases

### Test 1: Misspelling Handling

**Test Inputs:**
1. `ปวดหัว` (correct spelling)
2. `ปวดหัวมาก` (variant)
3. `ปวดหัวๆ` (variant)
4. `หนักหัว` (slang)
5. `ไค้` (misspelling of ไข้)
6. `อ๊วก` (slang for อาเจียน)

**Expected Results:**
- ✅ All inputs understood correctly
- ✅ Normalized to standard medical terms
- ✅ Triage proceeds normally
- ✅ No "ไม่เข้าใจ" errors

---

### Test 2: Context Extraction

**Test Case 2.1: Duration Extraction**
```
Input: "ปวดหัวตั้งแต่เมื่อวาน"
Expected:
- Duration extracted: 1 วัน
- Duration question skipped
- Triage proceeds with duration info
```

**Test Case 2.2: Worsening Detection**
```
Input: "ปวดหัว 2 วันแล้ว ยังไม่หาย"
Expected:
- Duration extracted: 2 วัน
- Worsening detected: แย่ลง
- Severity trend question skipped
- Higher triage level (GP)
```

**Test Case 2.3: Self-Care Detection**
```
Input: "ปวดหัว กินยาแล้วไม่ดีขึ้น"
Expected:
- Self-care detected: เคยลองแล้ว
- Worsening detected: แย่ลง
- Self-care question skipped
- Higher triage level (GP)
```

**Test Case 2.4: Combined Context**
```
Input: "ปวดหัวตั้งแต่เมื่อวาน กินยาแล้วไม่ดีขึ้น"
Expected:
- Duration extracted: 1 วัน
- Self-care detected: เคยลองแล้ว
- Worsening detected: แย่ลง
- 3 questions skipped
- Higher triage level (GP)
- Faster triage completion
```

---

### Test 3: Slang Understanding

**Test Inputs:**
1. `ไม่ไหวละ` → Should understand as "รุนแรง"
2. `เพลียจัด` → Should understand as "อ่อนเพลีย"
3. `แน่นอก` → Should understand as "เจ็บหน้าอก"
4. `ตัวร้อน` → Should understand as "ไข้"
5. `มึนๆ` → Should understand as "เวียนหัว"

**Expected Results:**
- ✅ All slang terms understood
- ✅ Mapped to correct medical terms
- ✅ Triage proceeds correctly
- ✅ Appropriate triage level assigned

---

### Test 4: Anxiety Detection

**Test Case 4.1: Anxious User**
```
Input: "ปวดหัว กลัวมาก"
Expected:
- Anxiety detected: true
- Reassurance message added
- Response: "ไม่ต้องกังวลนะคะ หมอจะช่วยประเมินอาการให้\n\n..."
```

**Test Case 4.2: Worried User**
```
Input: "ปวดหัว ไม่รู้จะทำไง"
Expected:
- Anxiety detected: true
- Reassurance message included
- Calm, supportive tone
```

**Test Case 4.3: Normal User**
```
Input: "ปวดหัว"
Expected:
- Anxiety detected: false
- No reassurance message
- Normal triage flow
```

---

### Test 5: Smart Clarification

**Test Case 5.1: Duration Already Mentioned**
```
Input: "ปวดหัว 2 วันแล้ว"
Expected:
- Duration question NOT asked
- Next question: severity_trend or risk_group
- Faster triage
```

**Test Case 5.2: Worsening Already Mentioned**
```
Input: "ปวดหัว แย่ลง"
Expected:
- Severity trend question NOT asked
- Duration question asked instead
- Faster triage
```

**Test Case 5.3: Self-Care Already Mentioned**
```
Input: "ปวดหัว กินยาแล้ว"
Expected:
- Self-care question NOT asked
- Other questions asked
- Faster triage
```

**Test Case 5.4: All Context Present**
```
Input: "ปวดหัว 2 วันแล้ว กินยาแล้วไม่ดีขึ้น"
Expected:
- Duration question skipped
- Severity trend question skipped
- Self-care question skipped
- Only risk_group and associated_symptoms asked
- Much faster triage (2 questions instead of 5)
```

---

### Test 6: Severity Detection

**Test Case 6.1: High Severity**
```
Input: "ปวดหัวมาก รุนแรง"
Expected:
- Severity detected: high
- Higher triage level (GP)
- Confidence boosted
```

**Test Case 6.2: Medium Severity**
```
Input: "ปวดหัว ปานกลาง"
Expected:
- Severity detected: medium
- Moderate triage level (Pharmacy)
```

**Test Case 6.3: Low Severity**
```
Input: "ปวดหัว นิดหน่อย"
Expected:
- Severity detected: low
- Lower triage level (Self-care)
```

---

### Test 7: Real-World Examples

**Example 1: Elderly User**
```
Input: "ปวดหัวๆ ตั้งแต่เมื่อวาน ไม่หายสักที"
Expected:
- Understands "ปวดหัวๆ"
- Extracts duration: 1 วัน
- Detects worsening: ไม่หาย
- Appropriate triage
```

**Example 2: Child/Teen User**
```
Input: "หนักหัวมาก ไม่ไหวละ"
Expected:
- Understands "หนักหัว" → ปวดหัว
- Understands "ไม่ไหวละ" → รุนแรง
- High severity detected
- Higher triage level
```

**Example 3: Worker (Casual Language)**
```
Input: "ปวดหัว 2 วันแล้ว กินยาแล้วก็ไม่ดีขึ้น กลัวมาก"
Expected:
- Extracts duration: 2 วัน
- Detects self-care: กินยาแล้ว
- Detects worsening: ไม่ดีขึ้น
- Detects anxiety: กลัวมาก
- Adds reassurance
- Higher triage level (GP)
- Faster triage (skips 3 questions)
```

---

## 🧪 Testing Steps

### Step 1: Backend Testing

1. **Start Backend**
   ```bash
   cd backend
   npm start
   ```

2. **Test API Endpoint**
   ```bash
   curl -X POST http://localhost:3000/api/triage/assess \
     -H "Content-Type: application/json" \
     -d '{
       "session_id": "test-123",
       "symptom": "ปวดหัว 2 วันแล้ว",
       "previous_answers": {}
     }'
   ```

3. **Verify Response**
   - Check if duration extracted
   - Check if duration question skipped
   - Verify triage level

### Step 2: End-to-End Testing

1. **Start App**
   ```bash
   cd mobile
   flutter run
   ```

2. **Test Each Test Case**
   - Enter test inputs from above
   - Verify behavior matches expected results
   - Check console for any errors

3. **Verify Improvements**
   - Fewer questions asked
   - Faster triage completion
   - Better understanding of slang/misspellings
   - Reassurance for anxious users

---

## ✅ Success Criteria

**Thai Language Understanding Works If:**
- ✅ Misspellings are understood
- ✅ Slang is mapped correctly
- ✅ Context is extracted from text
- ✅ Questions are skipped when info present
- ✅ Anxiety is detected and reassurance added
- ✅ Triage is faster (fewer questions)
- ✅ Triage level is appropriate

---

## 📊 Expected Improvements

**Before Enhancement:**
- Average questions: 5-6
- Misspellings: Not understood
- Slang: Not understood
- Context: Not extracted
- Questions: Always asked

**After Enhancement:**
- Average questions: 2-4 (40% reduction)
- Misspellings: Understood
- Slang: Understood
- Context: Extracted automatically
- Questions: Only when necessary

---

## 🐛 Troubleshooting

### Issue: Misspelling not understood
**Fix**: Add to `SPELLING_VARIANTS` in `thai_normalizer.js`

### Issue: Slang not mapped
**Fix**: Add to `SLANG_MAPPING` in `thai_normalizer.js`

### Issue: Context not extracted
**Fix**: Check regex patterns in extraction functions

### Issue: Questions still asked when info present
**Fix**: Verify `getNextQuestion()` logic in `assess.js`

---

## 📝 Test Results Template

**Date**: _______________

**Test Results:**
- [ ] Test 1: Misspelling Handling - ✅ / ❌
- [ ] Test 2: Context Extraction - ✅ / ❌
- [ ] Test 3: Slang Understanding - ✅ / ❌
- [ ] Test 4: Anxiety Detection - ✅ / ❌
- [ ] Test 5: Smart Clarification - ✅ / ❌
- [ ] Test 6: Severity Detection - ✅ / ❌
- [ ] Test 7: Real-World Examples - ✅ / ❌

**Issues Found:**
1. _________________________________
2. _________________________________

**Overall Status**: ✅ Works / ❌ Needs Fixes

---

**Ready for testing! 🚀**

