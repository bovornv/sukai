# Next Steps: Master Prompt Implementation

## ✅ Completed

1. **Structured Question Flow Module** (`structured_question_flow.js`)
   - Implemented 7-step clinical reasoning flow
   - Standardized answer choices (4-6 per question, always includes "ไม่แน่ใจ")
   - Step determination logic

2. **Final Output Structure** (`diagnosis.js`)
   - 6-section fixed order structure
   - Non-diagnostic "likely condition" generation
   - Personalized safety explanations

3. **Integration** (`assess.js`)
   - Structured flow integrated as PRIORITY 0
   - Falls back to adaptive system if structured flow doesn't provide question
   - Returns structured question data (choices, step, stepName) for UI

4. **Documentation**
   - `MASTER_PROMPT_IMPLEMENTATION.md` - Flow documentation
   - `INTEGRATION_GUIDE.md` - Mobile app integration guide

## 🔄 Next Steps

### 1. Testing
- [ ] Test Step 2 (Red-Flag Screening) with various symptoms
- [ ] Test Step 3 (Severity Calibration) - verify questions appear
- [ ] Test Step 4 (Time-Course) - verify both onset and trend questions
- [ ] Test Step 5 (Hypothesis-Targeted) - verify associated symptom questions
- [ ] Test Step 6 (Health Context) - verify mandatory question appears
- [ ] Test Step 7 (Confidence) - verify stop rule works correctly
- [ ] Test emergency detection ≤3 questions
- [ ] Test final output structure (all 6 sections)

### 2. Mobile App Integration
- [ ] Update Flutter app to use `structuredQuestion.choices` for answer buttons
- [ ] Display step indicator (optional, based on `structuredQuestion.step`)
- [ ] Handle multi-select for Step 5 (hypothesis-targeted)
- [ ] Update UI to show one question per screen (no chat history)

### 3. Enhancements
- [ ] Improve Step 5 question generation (use intent's associated_symptoms)
- [ ] Add more severity calibration question variations
- [ ] Enhance time-course question variations
- [ ] Improve "likely condition" generation (use intent data)

### 4. Validation
- [ ] Verify all answer choices include "ไม่แน่ใจ"
- [ ] Verify question count stays within 7-12 range
- [ ] Verify emergency cases exit early (≤3 questions)
- [ ] Verify health context question is mandatory
- [ ] Verify final output has all 6 sections

## Testing Commands

```bash
# Start backend
cd backend
npm run start:clean

# Test with sample symptom
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "symptom": "ปวดหัว",
    "previousAnswers": {},
    "questionsAsked": [],
    "questionCount": 0
  }'
```

## Success Criteria

✅ Emergency cases exit early (≤3 questions)
✅ Non-emergency cases stop confidently (7-12 questions)
✅ Users understand "why" the plan fits them
✅ OTC + self-care feels safe and personalized
✅ All 6 sections appear in final output
✅ Answer choices always include "ไม่แน่ใจ"
✅ One question per screen (no chat history)

