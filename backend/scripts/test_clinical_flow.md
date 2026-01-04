# Testing 7-Step Clinical Flow

## Test Cases

### Test 1: Emergency Detection (Step 2)
**Symptom**: `ปวดหัวรุนแรงฉับพลันที่สุดในชีวิต`
**Expected Flow**:
1. Step 1: Intent lock-in (implicit)
2. Step 2: Red-flag question → User answers "มีอาการชัดเจน"
3. **STOP** → Emergency screen immediately
4. No further questions

### Test 2: Non-Emergency Flow (Steps 2-7)
**Symptom**: `ปวดหัวเล็กน้อย`
**Expected Flow**:
1. Step 1: Intent lock-in
2. Step 2: Red-flag question → User answers "ไม่มี"
3. Step 3: Severity question → "แทบไม่รบกวน"
4. Step 4: Time-course question (onset) → "เมื่อวาน"
5. Step 4: Time-course question (trend) → "เท่าเดิม"
6. Step 5: Hypothesis-targeted question (if needed) → Multi-select allowed
7. Step 6: Health context question → "ไม่มี"
8. Step 7: Confidence check → If ≥ threshold, show summary

### Test 3: Multi-Select Question (Step 5)
**Symptom**: `ไอ`
**Expected**:
- Step 5 question: "มีอาการเหล่านี้ร่วมด้วยไหม?"
- Choices: [อาการ A] [อาการ B] [อาการ C] [ไม่มีอาการอื่น] [ไม่แน่ใจ]
- User can select multiple options
- "Confirm" button appears when selections made
- Submitting sends comma-separated answers

### Test 4: Health Context Required (Step 6)
**Symptom**: `ปวดท้อง`
**Expected**:
- Before summary, MUST ask: "มีข้อมูลสุขภาพสำคัญที่ควรรู้เพิ่มเติมไหม?"
- Cannot skip this step
- If user adds info → Recalculate confidence

### Test 5: Confidence Threshold
**Symptom**: `ไข้ต่ำ`
**Expected**:
- System asks questions until confidence ≥ threshold
- Thresholds:
  - Emergency: ≥90%
  - GP: ≥75%
  - Self-care: ≥65%
- If confidence < threshold → Ask ONE more question
- Never exceed 12 questions total

## Running Tests

### Backend API Test
```bash
# Test Step 2 (Red-flag)
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-001",
    "symptom": "ปวดหัวรุนแรง",
    "previous_answers": {},
    "language": "th"
  }'

# Test Step 3 (Severity)
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-002",
    "symptom": "ปวดหัว",
    "previous_answers": {
      "red_flag": "ไม่มี"
    },
    "language": "th"
  }'

# Test Step 5 (Multi-select)
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-003",
    "symptom": "ไอ",
    "previous_answers": {
      "red_flag": "ไม่มี",
      "severity": "รบกวนบ้าง",
      "time_course_onset": "2-3 วัน",
      "time_course_trend": "เท่าเดิม"
    },
    "language": "th"
  }'
```

### Flutter App Test
1. Run Flutter app
2. Start assessment with test symptom
3. Answer questions step by step
4. Verify:
   - Correct question shown at each step
   - Multi-select works for Step 5
   - Health context question appears before summary
   - Emergency detection works immediately

## Success Criteria

✅ Emergency detected ≤3 questions  
✅ Non-emergency flow follows 7 steps  
✅ Multi-select works for Step 5  
✅ Health context question mandatory  
✅ Confidence threshold respected  
✅ Questions never repeat  
✅ Total questions ≤12  

