# Symptom Group Integration in Question Variation System

## Overview

Symptom groups are now integrated into the question variation system, allowing for group-specific question variations while maintaining clinical accuracy.

## What Changed

### 1. Symptom Group Definitions

Added `SYMPTOM_GROUPS` constant in `question_variation_system.js` with 16 symptom groups:

- `headache_neuro` - ปวดหัว / ระบบประสาท
- `respiratory` - ระบบหายใจ
- `gi` - ระบบทางเดินอาหาร
- `urinary` - ระบบปัสสาวะ
- `musculoskeletal` - กล้ามเนื้อและกระดูก
- `skin` - ผิวหนัง
- `fever_infection` - ไข้ / การติดเชื้อ
- `chest_cardio` - หน้าอก / หัวใจ
- `ent` - หู คอ จมูก
- `general_symptoms` - อาการทั่วไป
- `womens_health` - สุขภาพสตรี
- `mens_health` - สุขภาพบุรุษ
- `pediatric_common` - อาการเด็กทั่วไป
- `allergy_immune` - ภูมิแพ้ / ระบบภูมิคุ้มกัน
- `eye` - ตา
- `mental_sleep` - จิตใจ / การนอน

Each group has:
- `name_th`: Thai name
- `name_en`: English name
- `tone`: Tone characteristic (careful, reassuring, gentle, etc.)

### 2. Updated Function Signatures

All question generation functions now accept `symptomGroup` parameter:

```javascript
generateSeverityQuestion(..., symptomGroup = null)
generateTimeCourseQuestion(..., symptomGroup = null)
generateHypothesisQuestion(..., symptomGroup = null)
generateFrequencyQuestion(..., symptomGroup = null)
generateTriggerQuestion(..., symptomGroup = null)
generateImpactQuestion(..., symptomGroup = null)
```

### 3. Updated `selectQuestionVariant`

```javascript
selectQuestionVariant(intentId, language, sessionSeed, questionCount, questionsAsked, symptomGroup = null)
```

- Now accepts `symptomGroup` parameter
- Uses `getVariantsForGroup()` to get group-specific variations (if available)
- Falls back to base variations if no group-specific variations exist
- Logs when using group-specific variations

### 4. Integration in Assessment Flow

In `assess.js`:
- Determines `symptomGroup` from `intent.symptom_group` (preferred)
- Falls back to keyword-based detection if intent not available
- Passes `symptomGroup` to `generateNextStructuredQuestion()`

## Current Behavior

### ✅ Group-Specific Variations (Implemented)

Group-specific variations are now implemented for the most common symptom groups:

1. **headache_neuro** (ปวดหัว / ระบบประสาท)
   - Severity questions customized for headaches
   - Duration questions customized for neurological symptoms
   - Tone: Careful, detailed

2. **respiratory** (ระบบหายใจ)
   - Severity questions mention "ไอ/หายใจลำบาก"
   - Frequency questions customized for respiratory symptoms
   - Tone: Reassuring, clear

3. **gi** (ระบบทางเดินอาหาร)
   - Severity questions mention "ปวดท้อง/ท้องเสีย"
   - Duration questions customized for GI symptoms
   - Tone: Gentle, sensitive

4. **chest_cardio** (หน้าอก / หัวใจ)
   - Severity questions mention "เจ็บหน้าอก/ใจสั่น"
   - Tone: Very careful, urgent

5. **musculoskeletal** (กล้ามเนื้อและกระดูก)
   - Severity questions mention "การเคลื่อนไหว"
   - Trigger questions customized for pain
   - Tone: Practical, functional

6. **fever_infection** (ไข้ / การติดเชื้อ)
   - Severity questions mention "ไข้/หนาวสั่น"
   - Duration questions customized for infections
   - Tone: Urgent, attentive

### Base Variations (Fallback)

Groups without specific variations use base variations from `QUESTION_INTENT_DB`. These are still tone-appropriate and clinically accurate.

### Adding More Group-Specific Variations

To add group-specific variations for other groups:

1. Create group-specific variation objects in `QUESTION_INTENT_DB`:
```javascript
const GROUP_SPECIFIC_VARIANTS = {
  headache_neuro: {
    [QUESTION_INTENTS.SEVERITY_IMPACT]: {
      variants_th: [
        'อาการปวดหัวนี้รบกวนการทำงานของคุณแค่ไหน?',
        'อาการปวดหัวทำให้คุณทำอะไรได้ยากขึ้นบ้าง?',
        // ... group-specific variations
      ],
      // ...
    },
  },
  respiratory: {
    [QUESTION_INTENTS.SEVERITY_IMPACT]: {
      variants_th: [
        'อาการไอหรือหายใจลำบากนี้รบกวนการใช้ชีวิตแค่ไหน?',
        // ... respiratory-specific variations
      ],
      // ...
    },
  },
};
```

2. Update `getVariantsForGroup()` to check for group-specific variants first:
```javascript
function getVariantsForGroup(intentId, symptomGroup = null) {
  // Check group-specific variants first
  if (symptomGroup && GROUP_SPECIFIC_VARIANTS[symptomGroup]?.[intentId]) {
    return GROUP_SPECIFIC_VARIANTS[symptomGroup][intentId];
  }
  
  // Fall back to base variations
  return QUESTION_INTENT_DB[intentId];
}
```

## Benefits

1. **Extensibility**: Easy to add group-specific variations in the future
2. **Consistency**: All question types now support symptom groups
3. **Clinical Accuracy**: Can customize questions based on symptom type
4. **Backward Compatible**: Falls back to base variations if group not specified

## Example Usage

```javascript
// In assess.js
const symptomGroup = intent?.symptom_group || 'general_symptoms';

const structuredQuestion = await generateNextStructuredQuestion({
  symptom: symptom,
  intent: intent,
  questionCount: questionCount,
  questionsAsked: questionsAsked,
  answers: enrichedAnswers,
  hypotheses: hypotheses,
  language: language,
  sessionSeed: sessionSeed,
  symptomGroup: symptomGroup, // Pass symptom group
});

// In structured_question_flow.js
const severityQ = generateSeverityQuestion(
  symptom,
  questionsAsked,
  language,
  sessionSeed,
  questionCount,
  symptomGroup // Pass symptom group
);

// In question_variation_system.js
const variant = selectQuestionVariant(
  QUESTION_INTENTS.SEVERITY_IMPACT,
  'th',
  sessionSeed,
  questionCount,
  questionsAsked,
  symptomGroup // Use symptom group for customization
);
```

## Testing

To verify symptom group integration:

1. Check logs for `[QUESTION-VARIATION] Using variations for symptom group: ...`
2. Test with different symptom groups (headache_neuro, respiratory, gi, etc.)
3. Verify questions vary appropriately for each group
4. Ensure fallback to base variations works when group not specified

## Next Steps

1. **Add Group-Specific Variations**: Create customized variations for each symptom group
2. **Tone Customization**: Use group tone characteristics to adjust question wording
3. **A/B Testing**: Test which variations work best for each group
4. **Analytics**: Track which variations lead to better outcomes per group

