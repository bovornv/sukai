# Testing Guide: Master Prompt 7-Step Flow

## Quick Test Commands

### 1. Start Backend
```bash
cd backend
npm run start:clean
```

### 2. Test Step 2 (Red-Flag Screening)
```bash
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-redflag-001",
    "symptom": "ปวดหัว",
    "previous_answers": {},
    "language": "th"
  }'
```

**Expected Response:**
- `need_more_info: true`
- `next_question`: Red-flag question (e.g., "มีอาการปวดหัวรุนแรงผิดปกติหรือมีอาการอื่นร่วมด้วยไหม?")
- `structured_question.step: 2`
- `structured_question.step_name: "red_flag_screening"`
- `structured_question.choices`: ["มีอาการชัดเจน", "มีเล็กน้อย", "ไม่มี", "ไม่แน่ใจ"]

### 3. Test Step 3 (Severity Calibration)
```bash
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-severity-001",
    "symptom": "ปวดหัว",
    "previous_answers": {
      "redFlagScreeningPassed": true
    },
    "language": "th"
  }'
```

**Expected Response:**
- `structured_question.step: 3`
- `structured_question.step_name: "severity_calibration"`
- Question about functional impact

### 4. Test Step 4 (Time-Course Disambiguation)
```bash
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-timecourse-001",
    "symptom": "ปวดหัว",
    "previous_answers": {
      "redFlagScreeningPassed": true,
      "severity_level": "moderate"
    },
    "language": "th"
  }'
```

**Expected Response:**
- `structured_question.step: 4`
- `structured_question.step_name: "time_course_disambiguation"`
- Question about onset timing or symptom trend

### 5. Test Step 5 (Hypothesis-Targeted - Multi-Select)
```bash
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-hypothesis-001",
    "symptom": "ปวดหัว",
    "previous_answers": {
      "redFlagScreeningPassed": true,
      "severity_level": "moderate",
      "time_course": "acute"
    },
    "language": "th"
  }'
```

**Expected Response:**
- `structured_question.step: 5`
- `structured_question.step_name: "hypothesis_targeted"`
- `structured_question.allow_multi_select: true`
- Question about associated symptoms

### 6. Test Step 6 (Health Context - MANDATORY)
```bash
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-healthcontext-001",
    "symptom": "ปวดหัว",
    "previous_answers": {
      "redFlagScreeningPassed": true,
      "severity_level": "moderate",
      "time_course": "acute"
    },
    "language": "th"
  }'
```

**Expected Response:**
- `structured_question.step: 6`
- `structured_question.step_name: "health_context_safety"`
- `structured_question.mandatory: true`
- Question: "มีข้อมูลสุขภาพสำคัญที่ควรรู้เพิ่มเติมไหม?"
- Choices: ["ไม่มี", "มีโรคประจำตัว", "ตั้งครรภ์ / ให้นม", "ใช้ยาประจำ", "เคยแพ้ยา", "ไม่แน่ใจ"]

### 7. Test Emergency Detection (≤3 questions)
```bash
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-emergency-001",
    "symptom": "ปวดหัว",
    "previous_answers": {
      "red_flag_answer": "มีอาการชัดเจน"
    },
    "language": "th"
  }'
```

**Expected Response:**
- `need_more_info: false`
- `triage_level: "emergency"`
- `next_question: null`
- No more questions (stopped early)

## Validation Checklist

### Master Prompt Requirements

- [ ] **Step 2 (Red-Flag)**: Emergency detection ≤3 total questions
- [ ] **Step 3 (Severity)**: Severity calibration questions appear (2-3 questions)
- [ ] **Step 4 (Time-Course)**: Both onset timing AND symptom trend questions appear
- [ ] **Step 5 (Hypothesis)**: Associated symptom questions appear (2-4 questions, multi-select allowed)
- [ ] **Step 6 (Health Context)**: Mandatory question appears before conclusion
- [ ] **Step 7 (Confidence)**: System stops when confidence threshold reached (7-12 questions total)
- [ ] **Answer Choices**: Always includes "ไม่แน่ใจ" option
- [ ] **Final Output**: All 6 sections appear in correct order:
  1. What this is likely to be
  2. Self-care plan
  3. OTC Comparison Card (2-3 items)
  4. Why this plan is safe for you
  5. Follow-up logic (24-48 hrs)
  6. When to seek urgent care

### UI Integration

- [ ] Flutter app uses `structured_question.choices` for answer buttons
- [ ] Multi-select works for Step 5 (hypothesis-targeted)
- [ ] Single-select works for Steps 2-4, 6
- [ ] Submit button appears for multi-select when at least one option selected
- [ ] Answer choices always include "ไม่แน่ใจ"

## Success Criteria

✅ Emergency cases exit early (≤3 questions)
✅ Non-emergency cases stop confidently (7-12 questions)
✅ Users understand "why" the plan fits them
✅ OTC + self-care feels safe and personalized
✅ All 6 sections appear in final output
✅ Answer choices always include "ไม่แน่ใจ"
✅ One question per screen (no chat history)

