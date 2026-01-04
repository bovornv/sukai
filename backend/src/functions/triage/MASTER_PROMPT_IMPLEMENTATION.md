# Master Prompt Implementation Guide

This document describes how the 7-step clinical reasoning flow is implemented in Suk AI.

## Overview

The diagnostic flow follows a strict 7-step process defined in the Master Prompt:

1. **STEP 1**: Intent Lock-In (Implicit)
2. **STEP 2**: Red-Flag Screening (MAX 2 questions)
3. **STEP 3**: Severity Calibration (2-3 questions)
4. **STEP 4**: Time-Course Disambiguation (2-3 questions)
5. **STEP 5**: Hypothesis-Targeted Symptoms (2-4 questions)
6. **STEP 6**: Health Context Safety Check (MANDATORY)
7. **STEP 7**: Confidence Calculation & Stop Rule

## Implementation Files

- **`structured_question_flow.js`**: Generates questions for each step with standardized answer choices
- **`assess.js`**: Main assessment logic that orchestrates the flow
- **`diagnosis.js`**: Generates final output with 6 fixed sections
- **`intent_loader.js`**: Resolves intent_id from 700-intent dataset
- **`severity_timecourse_matrix.js`**: Calculates confidence and determines triage level

## Question Generation

Each step generates questions with:
- **4-6 answer choices** per question
- **Always includes "ไม่แน่ใจ / Not sure"** option
- **Multiple-choice only** (no free text after Page 1)
- **Step-specific question patterns**

### STEP 2: Red-Flag Screening
- Binary or near-binary questions
- High-risk focused
- Answer choices: `['มีอาการชัดเจน', 'มีเล็กน้อย', 'ไม่มี', 'ไม่แน่ใจ']`
- If ANY red-flag answer = true → STOP FLOW, output Emergency

### STEP 3: Severity Calibration
- Functional impact questions (not numeric pain scores)
- Answer choices: `['แทบไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รุนแรงผิดปกติ', 'ไม่แน่ใจ']`

### STEP 4: Time-Course Disambiguation
- Asks BOTH onset timing AND symptom trend
- Onset choices: `['วันนี้', 'เมื่อวาน', '2-3 วัน', '1 สัปดาห์', 'เป็นๆ หายๆ', 'ไม่แน่ใจ']`
- Trend choices: `['ดีขึ้น', 'เท่าเดิม', 'แย่ลง', 'ขึ้นๆ ลงๆ', 'ไม่แน่ใจ']`

### STEP 5: Hypothesis-Targeted
- Pulls questions from intent hypothesis set
- Allows multi-select when appropriate
- Answer choices include associated symptoms + `['ไม่มีอาการอื่น', 'ไม่แน่ใจ']`

### STEP 6: Health Context Safety Check
- MANDATORY before conclusion
- Answer choices: `['ไม่มี', 'มีโรคประจำตัว', 'ตั้งครรภ์ / ให้นม', 'ใช้ยาประจำ', 'เคยแพ้ยา', 'ไม่แน่ใจ']`

## Final Output Structure

The final output MUST contain these 6 sections in fixed order:

1. **What this is likely to be** (non-diagnostic, probability-based language)
2. **Self-care plan** (primary) - clear, actionable, Thai-context
3. **OTC Comparison Card** (2-3 items) - Each with: When to use, Who should avoid, Why suitable
4. **Why this plan is safe for you** - Explicitly reference: Age, Diseases, Meds, Allergies, Pregnancy
5. **Follow-up logic** (24-48 hrs) - "If not better → do X"
6. **When to seek urgent care** - Clear red-flag list

## Confidence Calculation

Confidence is calculated using:
- Red-flag clearance
- Severity stability
- Time-course clarity
- Symptom consistency
- Health profile compatibility
- **confidence_weight from intent** (from 700-intent dataset)

**Stop Rule**: If confidence ≥ threshold → STOP QUESTIONS. Total questions target: 7-12, never exceed 12 unless safety requires.

## Hard Constraints

❌ Do NOT change emergency logic
❌ Do NOT A/B test clinical logic
❌ Do NOT vary severity matrix
❌ Do NOT shorten safety steps for UX reasons
❌ Do NOT show diagnosis claims

Clinical reasoning must remain: Single, consistent, medical-grade

