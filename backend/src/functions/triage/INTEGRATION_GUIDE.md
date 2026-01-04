# Master Prompt Integration Guide

This guide explains how the 7-step structured clinical flow integrates with the existing assessment system.

## Integration Points

### 1. Question Generation

The structured flow (`structured_question_flow.js`) is integrated into `assess.js` as **PRIORITY 0** (highest priority):

```javascript
// Priority 0: Structured 7-Step Flow (Master Prompt)
const structuredQuestion = generateNextStructuredQuestion({
  symptom: symptom,
  intent: intent,
  questionCount: questionCount,
  questionsAsked: questionsAsked,
  answers: enrichedAnswers,
  hypotheses: hypotheses,
  language: language,
});
```

If the structured flow doesn't provide a question, the system falls back to the adaptive question selection system.

### 2. Answer Choices Format

Each structured question returns:
- `question`: The question text
- `choices`: Array of 4-6 answer choices (always includes "ไม่แน่ใจ")
- `step`: Current step number (2-6)
- `stepName`: Step identifier
- `allowMultiSelect`: Boolean (for Step 5 - hypothesis-targeted)

**UI Integration**: The mobile app should use `structuredQuestion.choices` to display answer buttons instead of generating its own choices.

### 3. Step Determination

The system automatically determines the current step based on:
- `questionCount`: Number of questions asked
- `answers.redFlagScreeningPassed`: Whether red flags were cleared
- `answers.severity_level`: Whether severity is determined
- `answers.time_course`: Whether time-course is determined
- `answers.health_context`: Whether health context was answered

### 4. Final Output Structure

The final diagnosis output (`diagnosis.js`) follows the Master Prompt's 6-section structure:

1. **likely_condition**: What this is likely to be (non-diagnostic)
2. **self_care_plan**: Self-care recommendations
3. **otc_comparison_card**: OTC medication options (2-3 items)
4. **why_safe_for_you**: Personalized safety explanation
5. **follow_up_logic**: 24-48 hour follow-up instructions
6. **when_to_seek_urgent_care**: Red-flag list

## Mobile App Integration

### Question Display

When receiving a question from the backend, check if it includes `choices`:

```dart
if (response['choices'] != null) {
  // Use structured answer choices
  final choices = response['choices'] as List<String>;
  // Display as buttons
} else {
  // Fallback to generating choices from question text
}
```

### Step Tracking

The backend returns `step` and `stepName` in the question response. The mobile app can use this to:
- Show progress indicators
- Customize UI per step
- Track analytics per step

### Answer Format

When sending answers, use the exact choice text from the `choices` array:

```dart
// User selects: "มีอาการชัดเจน"
final answer = selectedChoice; // Use exact text from choices array
```

## Testing Checklist

- [ ] Step 2 (Red-Flag): Emergency detection works correctly
- [ ] Step 3 (Severity): Severity calibration questions appear
- [ ] Step 4 (Time-Course): Both onset and trend questions appear
- [ ] Step 5 (Hypothesis): Associated symptom questions appear
- [ ] Step 6 (Health Context): Mandatory question appears before conclusion
- [ ] Step 7 (Confidence): System stops when confidence threshold reached
- [ ] Final Output: All 6 sections appear in correct order
- [ ] Answer Choices: Always includes "ไม่แน่ใจ" option
- [ ] Multi-Select: Step 5 allows multiple selections

## Backward Compatibility

The system maintains backward compatibility:
- If structured flow doesn't provide a question → Falls back to adaptive system
- If answer choices not provided → UI can generate its own
- Legacy question format still supported

