# Clinical Framework Implementation Summary

## 🎯 Overview

SukAI has been upgraded to follow **textbook-based clinical reasoning** standards, matching OPD triage practices in Thai hospitals. The system now operates as a **Clinical Triage & Decision Support Assistant** rather than a simple Q&A bot.

---

## ✅ Key Implementations

### 1. Mandatory Health Context Check

**Requirement**: Must ask about health context before summarizing (unless emergency)

**Implementation**:
- Added `health_context_check` question category in `clinical_reasoning.js`
- Modified `assess.js` to enforce health context check before summarizing
- Question: *"ข้อมูลด้านสุขภาพหรืออาการสำคัญที่ยังไม่ได้แจ้งไหมคะ? เช่น โรคประจำตัว ยาที่ทานอยู่ การแพ้ยา การตั้งครรภ์ หรืออาการผิดปกติอื่น"*

**Logic**:
- Asks after 3+ questions (when triage level is becoming clear)
- Skips if emergency detected
- Skips if already answered (chronic_disease, medications, allergy)
- Blocks summary until answered (safety requirement)

---

### 2. Differential-Oriented Questioning

**Requirement**: Questions must help differentiate conditions, not just collect data

**Implementation**:
- Enhanced `symptom_characterization` questions:
  - Added `aggravating_factors` (what makes it worse)
  - Added `relieving_factors` (what makes it better)
  - These help differentiate between similar conditions

- Enhanced `associated_symptoms` questions:
  - More specific: "มีไข้ไหมคะ? ถ้ามี ไข้สูงเท่าไหร่คะ?"
  - Symptom-specific: "มีไอไหมคะ? ถ้ามี ไอแบบไหนคะ? (แห้ง / มีเสมหะ / เสมหะสีอะไร)"
  - Added `rash` question for skin-related differentials

- Updated `selectNextQuestion` to:
  - Ask symptom-specific questions based on chief complaint
  - Focus on questions that help differentiate conditions
  - Skip questions when context already provided

---

### 3. Clinical OTC Medication Logic

**Requirement**: Recommend medications based on symptom-based differential + clinical reasoning

**Implementation**:
- Created `generateOTCMeds()` function in `diagnosis.js`
- Matches medication to symptom group:
  - **Headache/Pain**: Paracetamol with clinical reasoning
  - **Fever**: Paracetamol with fever-specific guidance
  - **Sore Throat**: Throat lozenges + honey/lemon alternative
  - **Generic**: Ask pharmacist with safety guidance

**Each recommendation includes**:
- ✅ **เหตุผลทางคลินิก** (Clinical reasoning)
- ✅ **วิธีใช้** (Usage instructions - short, clear)
- ✅ **ข้อควรระวัง** (Precautions - 1 line)
- ✅ **💡 พอเหมาะ ไม่เกินจำเป็น** (Appropriate, not excessive)

**Safety**:
- OTC only (no prescription drugs)
- Avoids masking important symptoms
- Clear warnings for contraindications

---

### 4. Structured Clinical Advice Output

**Requirement**: Output must match structured clinical advice format

**Implementation**:
- Updated `generateDiagnosis()` to ensure:
  - **Home Care Management**: 3-5 bullets
  - **OTC Medication Options**: 1 main + 1 alternative (max 2)
  - **Indications to See a Doctor**: 3-5 bullets
  - **Danger Signs (Red Flags)**: 3-5 bullets
  - **Additional Clinical Advice**: 3-5 bullets

- Each section limited to 3-5 items (not overwhelming)
- Short, concise bullets (no long sentences)

---

### 5. Formal, Doctor-Like Tone

**Requirement**: Formal, professional tone while remaining understandable

**Implementation**:
- Updated `generateSummary()` WHY explanations:
  - More formal language
  - Clinical terminology with brief explanations
  - Clear, structured reasoning

**Examples**:
- Before: "อาการไม่รุนแรงมาก แต่ควรใช้ยาช่วยบรรเทา"
- After: "อาการไม่รุนแรงมาก แต่ควรใช้ยาช่วยบรรเทาเพื่อให้หายเร็วขึ้นและลดความไม่สบาย"

- Before: "อาการแย่ลงแม้ดูแลตัวเองแล้ว ควรให้แพทย์ตรวจเพื่อหาสาเหตุ"
- After: "อาการแย่ลงแม้ดูแลตัวเองแล้ว ควรให้แพทย์ตรวจเพื่อหาสาเหตุและวางแผนการรักษา"

---

## 📋 Clinical Reasoning Framework

The system now follows this framework for every case:

### 1. Chief Complaint
- Main symptom user is concerned about
- When it started / how it changed

### 2. HPI (History of Present Illness)
- Duration (onset, duration)
- Severity (severity, progression)
- Aggravating/relieving factors
- Associated symptoms

### 3. Red Flag Screening (Highest Priority)
- Breathing difficulty
- Severe chest pain
- Loss of consciousness / seizures
- Abnormal bleeding
- High fever with neurological symptoms
- **→ If found → Emergency immediately, no more questions**

### 4. Differential-Oriented Questioning
- Questions change based on answers
- Ask to "differentiate conditions" not just collect data
- Example: If pain → what type? (sharp/dull/tight/burning)

### 5. Mandatory Confidence Check
- Before summarizing (unless emergency):
  - "ข้อมูลด้านสุขภาพหรืออาการสำคัญที่ยังไม่ได้แจ้งไหมคะ? เช่น โรคประจำตัว ยาที่ทานอยู่ การแพ้ยา การตั้งครรภ์ หรืออาการผิดปกติอื่น"
- **Cannot summarize without this**

### 6. OTC Medication Logic
- Based on symptom group + differential
- Clinical reasoning included
- Safety warnings included
- OTC only (no prescription)

### 7. Structured Clinical Advice
- Home Care Management
- OTC Medication Options (1 main + 1 alternative)
- Indications to See a Doctor
- Danger Signs (Red Flags)
- Additional Clinical Advice

---

## 🔄 Flow Changes

### Before
1. Ask fixed 5-6 questions
2. Summarize when confidence ≥ 80%
3. Generic recommendations

### After
1. Extract context from text (duration, severity, trend)
2. Ask adaptive questions (only if they change triage)
3. **Mandatory health context check** (before summarizing)
4. Generate clinical OTC recommendations (symptom-based)
5. Structured clinical advice output

---

## 🎯 Success Criteria

**System should feel like**:
- ✅ "ระบบนี้คิดเป็นขั้นตอนเหมือนหมอจริง"
- ✅ "ไม่รีบสรุป และคำแนะนำดูมีเหตุผลทางการแพทย์"
- ✅ "ถามคำถามที่ช่วยแยกโรค ไม่ใช่แค่เก็บข้อมูล"
- ✅ "ให้คำแนะนำยาที่เหมาะสมกับบริบทประเทศไทย"

---

## 📝 Files Modified

1. **`backend/src/functions/triage/clinical_reasoning.js`**
   - Added `health_context_check` question category
   - Enhanced `symptom_characterization` questions
   - Enhanced `associated_symptoms` questions
   - Added `needsHealthContextCheck()` function
   - Updated `selectNextQuestion()` for differential-oriented questioning

2. **`backend/src/functions/triage/assess.js`**
   - Added mandatory health context check logic
   - Blocks summary until health context answered
   - Updated stop conditions to require health context

3. **`backend/src/functions/triage/diagnosis.js`**
   - Added `generateOTCMeds()` function (clinical OTC logic)
   - Updated `generateSummary()` for formal, doctor-like tone
   - Updated `generateDiagnosis()` to use clinical OTC recommendations
   - Ensured structured output (3-5 bullets per section)

---

## 🧪 Testing Checklist

- [ ] Test mandatory health context check appears before summary
- [ ] Test health context check skipped for emergency cases
- [ ] Test differential-oriented questions (symptom-specific)
- [ ] Test clinical OTC recommendations (symptom-based)
- [ ] Test formal, doctor-like tone in WHY explanations
- [ ] Test structured output (3-5 bullets per section)

---

**Implementation Complete! ✅**

The system now follows textbook-based clinical reasoning standards and operates as a proper Clinical Triage & Decision Support Assistant.

