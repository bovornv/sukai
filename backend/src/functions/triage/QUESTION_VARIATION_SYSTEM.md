# Question Variation System

## Overview

The Question Variation System separates **clinical question intent** from **display wording**, enabling natural question variation while preserving clinical accuracy.

## Core Principles

1. **One Intent, Multiple Wordings**: Each question step has ONE clinical intent with 3-6 wording variations
2. **Deterministic Within Session**: Same `sessionSeed` + same `intentId` = same wording (user won't see different wording if they go back)
3. **Varied Across Sessions**: Different `sessionSeed` = different wording (each new assessment feels fresh)
4. **Medical Meaning Preserved**: All variations ask for the same clinical information
5. **No Clinical Logic Changes**: Severity × Time-course matrix, emergency screening, scoring remain unchanged

## Architecture

### Files

- **`question_variation_system.js`**: Core variation engine with intent definitions
- **`structured_question_flow.js`**: Integration with existing 7-step flow

### Key Components

#### 1. Question Intents (`QUESTION_INTENTS`)

Each intent represents a clinical information need:

```javascript
QUESTION_INTENTS.SEVERITY_IMPACT      // How much symptom interferes
QUESTION_INTENTS.DURATION_ONSET        // When symptom started
QUESTION_INTENTS.TREND_CHANGE          // How symptom changed
QUESTION_INTENTS.FREQUENCY_OCCURRENCE // How often symptom occurs
QUESTION_INTENTS.TRIGGER_AGGRAVATING  // What makes it worse
QUESTION_INTENTS.IMPACT_DAILY_LIFE     // Impact on daily activities
// ... and more
```

#### 2. Intent Database (`QUESTION_INTENT_DB`)

Each intent contains:
- `clinical_meaning`: What information is being asked
- `variants_th`: 3-6 Thai wording variations
- `variants_en`: 3-6 English wording variations
- `answer_options_th`: Standardized answer choices (Thai)
- `answer_options_en`: Standardized answer choices (English)

#### 3. Selection Logic (`selectQuestionVariant`)

```javascript
selectQuestionVariant(intentId, language, sessionSeed, questionCount, questionsAsked)
```

**Deterministic Selection**:
- Uses `sessionSeed + intentId + questionCount` to generate variation seed
- Same inputs = same output (deterministic)
- Different `sessionSeed` = different output (varied across sessions)

**Duplicate Prevention**:
- Checks `questionsAsked` to avoid semantic duplicates
- Filters out variants that were already asked

## Integration with Existing Flow

### Current 7-Step Flow

The variation system integrates into the existing structured flow:

1. **STEP 2**: Red-Flag Screening (uses intent system)
2. **STEP 3**: Severity Calibration → Uses `QUESTION_INTENTS.SEVERITY_*`
3. **STEP 4**: Time-Course Disambiguation → Uses `QUESTION_INTENTS.DURATION_*` and `TREND_*`
4. **STEP 5**: Hypothesis-Targeted → Uses `QUESTION_INTENTS.ASSOCIATED_*`, `FREQUENCY_*`, `TRIGGER_*`, `IMPACT_*`
5. **STEP 6**: Health Context (removed)
6. **STEP 7**: Confidence check

### Example Usage

```javascript
// In structured_question_flow.js
export function generateSeverityQuestion(..., sessionSeed, questionCount) {
  // Try different severity intents
  const severityIntents = [
    QUESTION_INTENTS.SEVERITY_IMPACT,
    QUESTION_INTENTS.SEVERITY_COMPARISON,
    QUESTION_INTENTS.SEVERITY_FUNCTIONAL,
  ];
  
  // Select variant deterministically
  const variant = selectQuestionVariant(
    selectedIntent, 
    language, 
    sessionSeed, 
    questionCount, 
    questionsAsked
  );
  
  return {
    question: variant.question,      // Natural variation
    choices: variant.choices,        // Standardized answers
    intent_id: variant.intent_id,    // For tracking
  };
}
```

## Question Coverage

### ✅ Implemented

- **Severity Questions**: 3 intents × 6 variants each = 18 variations
- **Time-Course Questions**: 4 intents × 6 variants each = 24 variations
- **Associated Symptoms**: 2 intents × 6 variants each = 12 variations
- **Frequency**: 2 intents × 6 variants each = 12 variations
- **Triggers/Relieving**: 3 intents × 6 variants each = 18 variations
- **Impact**: 3 intents × 6 variants each = 18 variations

**Total**: 17 intents × ~6 variants = **102+ question variations**

### Language Support

- **Thai**: All intents have natural Thai doctor-style wording
- **English**: Parallel English wording with same intent
- **No Mixing**: One language per session (determined by `language` parameter)

## Deterministic Behavior

### Within Session (Same `sessionSeed`)

```javascript
// First call
selectQuestionVariant(QUESTION_INTENTS.SEVERITY_IMPACT, 'th', 12345, 3, [])
// → Returns: "อาการนี้รบกวนชีวิตประจำวันแค่ไหน?"

// User goes back, same call
selectQuestionVariant(QUESTION_INTENTS.SEVERITY_IMPACT, 'th', 12345, 3, [])
// → Returns: "อาการนี้รบกวนชีวิตประจำวันแค่ไหน?" (SAME - deterministic)
```

### Across Sessions (Different `sessionSeed`)

```javascript
// Session 1
selectQuestionVariant(QUESTION_INTENTS.SEVERITY_IMPACT, 'th', 12345, 3, [])
// → Returns: "อาการนี้รบกวนชีวิตประจำวันแค่ไหน?"

// Session 2 (different seed)
selectQuestionVariant(QUESTION_INTENTS.SEVERITY_IMPACT, 'th', 67890, 3, [])
// → Returns: "อาการนี้ทำให้คุณทำกิจกรรมปกติได้ยากแค่ไหน?" (DIFFERENT - varied)
```

## Clinical Safety

### ✅ No Changes to Medical Logic

- **Severity × Time-course Matrix**: Unchanged
- **Emergency Screening**: Unchanged
- **Confidence Scoring**: Unchanged
- **Red Flag Detection**: Unchanged
- **Triage Decision**: Unchanged

### ✅ Answer Mapping

All variations map to the same `intent_id`, so answers are processed identically:

```javascript
// User sees: "อาการนี้รบกวนชีวิตประจำวันแค่ไหน?"
// Backend receives: { intent_id: 'Q_SEVERITY_IMPACT', answer: 'รบกวนมาก' }

// User sees: "อาการนี้ทำให้คุณทำกิจกรรมปกติได้ยากแค่ไหน?"
// Backend receives: { intent_id: 'Q_SEVERITY_IMPACT', answer: 'รบกวนมาก' }

// Both answers processed the same way (same intent_id)
```

## Tone Guidelines (Thai)

All Thai variations follow these guidelines:

- ✅ **Polite**: Uses "คะ" ending
- ✅ **Reassuring**: Doctor-like, careful tone
- ✅ **Natural**: Sounds like real OPD doctor conversation
- ✅ **No Slang**: Professional medical language
- ✅ **Clear**: Easy to understand

## Adding New Question Types

To add a new question type:

1. **Define Intent** in `QUESTION_INTENTS`:
```javascript
export const QUESTION_INTENTS = {
  // ... existing intents
  NEW_QUESTION_TYPE: 'Q_NEW_QUESTION_TYPE',
};
```

2. **Add Intent Database Entry**:
```javascript
const QUESTION_INTENT_DB = {
  // ... existing entries
  [QUESTION_INTENTS.NEW_QUESTION_TYPE]: {
    clinical_meaning: 'What information this asks for',
    variants_th: [
      'Variation 1 in Thai?',
      'Variation 2 in Thai?',
      'Variation 3 in Thai?',
      // ... 3-6 variations
    ],
    variants_en: [
      'Variation 1 in English?',
      'Variation 2 in English?',
      // ... parallel variations
    ],
    answer_options_th: ['Option 1', 'Option 2', '...'],
    answer_options_en: ['Option 1', 'Option 2', '...'],
  },
};
```

3. **Create Generator Function**:
```javascript
export function generateNewQuestionType(..., sessionSeed, questionCount) {
  const variant = selectQuestionVariant(
    QUESTION_INTENTS.NEW_QUESTION_TYPE,
    language,
    sessionSeed,
    questionCount,
    questionsAsked
  );
  return variant ? { ...variant, step: 5, stepName: 'new_type' } : null;
}
```

4. **Integrate into Flow**:
```javascript
// In generateNextStructuredQuestion()
if (currentStep === 5) {
  const newQ = generateNewQuestionType(..., sessionSeed, questionCount);
  if (newQ) return newQ;
}
```

## Testing

### Test Deterministic Behavior

```javascript
// Same sessionSeed should produce same wording
const seed = 12345;
const q1 = selectQuestionVariant(QUESTION_INTENTS.SEVERITY_IMPACT, 'th', seed, 3, []);
const q2 = selectQuestionVariant(QUESTION_INTENTS.SEVERITY_IMPACT, 'th', seed, 3, []);
assert(q1.question === q2.question); // ✅ Should be identical
```

### Test Variation Across Sessions

```javascript
// Different sessionSeed should produce different wording
const q1 = selectQuestionVariant(QUESTION_INTENTS.SEVERITY_IMPACT, 'th', 11111, 3, []);
const q2 = selectQuestionVariant(QUESTION_INTENTS.SEVERITY_IMPACT, 'th', 22222, 3, []);
assert(q1.question !== q2.question); // ✅ Should be different
```

### Test Duplicate Prevention

```javascript
// Already asked question should not be selected again
const questionsAsked = ['อาการนี้รบกวนชีวิตประจำวันแค่ไหน?'];
const variant = selectQuestionVariant(
  QUESTION_INTENTS.SEVERITY_IMPACT,
  'th',
  12345,
  3,
  questionsAsked
);
// Should select a different variant, not the one already asked
```

## Performance

- **Fast**: O(1) intent lookup, O(n) variant selection (n = number of variants)
- **Cached**: Intent database is static, no runtime loading
- **Memory Efficient**: ~50KB for all intent definitions

## Future Enhancements

1. **Context-Aware Variations**: Adjust wording based on symptom type
2. **User Preference Learning**: Remember which variations user prefers
3. **A/B Testing**: Test which variations lead to better outcomes
4. **More Intents**: Add more question types as needed

