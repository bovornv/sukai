# Symptom Intents Master Dataset (700 Intents Schema)

## Overview

This directory contains the master dataset for Suk AI's symptom suggestion system, designed to support 600-700 clinical intents with medical-grade accuracy.

## Structure

### Files

1. **`symptom_intents_master.csv`** - CSV format for medical review and QA
   - Suitable for Google Sheets / Excel
   - Easy to review and edit by medical professionals
   - Contains all required fields for clinical decision-making

2. **`symptom_intents_master.json`** - JSON format for backend/inference
   - Production-ready structured data
   - Used by Flutter app and Node.js backend
   - Optimized for programmatic access

## Schema Explanation

### CSV Schema

| Field | Type | Description |
|-------|------|-------------|
| `intent_id` | String | Unique identifier (e.g., `HEADACHE_017`) |
| `primary_symptom` | String | Base symptom keyword (e.g., `ปวดหัว`) |
| `display_text_th` | String | Thai display text shown to user |
| `display_text_en` | String | English display text |
| `body_system` | String | Body system category (`neurology`, `cardio`, `gi`, `resp`) |
| `severity_level` | String | `mild` / `moderate` / `severe` |
| `time_course` | String | `acute` / `subacute` / `chronic` / `progressive` |
| `location` | String? | Location modifier (`one_side`, `two_sides`, `whole_head`, etc.) |
| `trigger` | String? | Trigger modifier (`after_food`, `on_standing`, etc.) |
| `associated_symptoms` | String | Pipe-separated list (`คลื่นไส้\|อาเจียน`) |
| `red_flag_question_th` | String | Thai red-flag screening question |
| `red_flag_question_en` | String | English red-flag question |
| `red_flag_if_yes` | Boolean | `true` → Emergency triage |
| `emergency_level` | String | `immediate` / `urgent` / `none` |
| `triage_if_no` | String? | `self_care` / `gp` (if not emergency) |
| `confidence_weight` | Float | 0.02-0.15 (for confidence calculation) |
| `otc_group` | String | OTC category (e.g., `analgesic_basic`) |
| `self_care_group` | String | Self-care category (e.g., `rest_hydration`) |
| `contraindications` | String | Comma-separated contraindications |
| `age_min` | Integer | Minimum age (default: 18) |
| `age_max` | Integer | Maximum age (default: 99) |
| `requires_health_profile` | Boolean | Whether health profile is required |
| `notes_medical` | String? | Medical notes for reviewers |
| `status` | String | `active` / `draft` / `deprecated` |

### JSON Schema

See `symptom_intents_master.json` for the complete JSON structure. Each intent follows this pattern:

```json
{
  "intent_id": "HEADACHE_017",
  "primary_symptom": "ปวดหัว",
  "display": {
    "th": "ปวดหัวรุนแรงทันที",
    "en": "Sudden severe headache"
  },
  "body_system": "neurology",
  "clinical_context": {
    "severity": "severe",
    "time_course": "acute",
    "location": "whole_head",
    "trigger": null,
    "associated_symptoms": []
  },
  "red_flag": {
    "question": {
      "th": "ปวดหัวรุนแรงที่สุดในชีวิตหรือเกิดขึ้นทันทีไหมคะ?",
      "en": "Is this the worst headache of your life or sudden onset?"
    },
    "if_yes": {
      "emergency": true,
      "level": "immediate"
    }
  },
  "triage": {
    "if_no": null
  },
  "confidence": {
    "weight": 0.15
  },
  "recommendation_mapping": {
    "otc_group": [],
    "self_care_group": ["rest_hydration"]
  },
  "safety": {
    "contraindications": [],
    "age_range": {
      "min": 18,
      "max": 99
    },
    "requires_health_profile": true
  },
  "metadata": {
    "notes_medical": "Thunderclap headache red flag",
    "status": "active"
  }
}
```

## Clinical Logic Rules

### Intent Generation Formula

- **Primary Symptoms**: ~60-70 base symptoms
- **Intents per Symptom**: 10-12 clinical variations
- **Total Intents**: 600-840 intents

### Quality Rules

1. **No Duplicate Synonyms**: Every intent must change clinical decision
2. **Red-Flag Mapping**: Every intent must have a red-flag question
3. **Emergency Logic**: 
   - Emergency intents: `confidence_weight ≥ 0.12`
   - Non-emergency intents: `confidence_weight 0.03-0.08`
4. **OTC Mapping**: Every non-emergency intent maps to OTC/self-care groups
5. **Safety**: Contraindications must be checked against health profile

## Usage

### Flutter App

The Flutter app loads intents from `assets/data/symptom_intents_master.json`:

```dart
final intents = await SymptomIntentLoader.loadIntents();
final suggestions = await SymptomSuggestionService.getSuggestions(input, language: 'th');
```

### Backend

The backend can receive `intent_id` in the symptom field:

```javascript
// POST /api/triage/assess
{
  "session_id": "...",
  "symptom": "HEADACHE_017", // intent_id or display text
  "previous_answers": {},
  "language": "th"
}
```

The backend should:
1. Check if symptom is an `intent_id` (matches pattern `[A-Z_]+_[0-9]+`)
2. If yes, load intent from JSON and use structured data
3. If no, use legacy text-based mapping

## Expansion Workflow

To expand to 700 intents:

1. **Add Primary Symptoms**: Add new base symptoms to `_baseSymptoms` list
2. **Generate Intents**: For each primary symptom, create 10-12 clinical variations
3. **Medical Review**: Review each intent for clinical accuracy
4. **QA Checklist**:
   - ✓ No duplicate semantic meaning
   - ✓ Every intent has red-flag question
   - ✓ Emergency intents have `weight ≥ 0.12`
   - ✓ OTC groups don't conflict with contraindications
   - ✓ Thai text is natural (not textbook)
5. **Status**: Mark as `active` when approved

## Cursor Prompt for Auto-Generation

See the user's prompt specification for generating 700 intents automatically using Cursor. The prompt includes:
- Complete schema definition
- Clinical logic rules
- Quality constraints
- Example rows

## Notes

- **Backward Compatibility**: The system falls back to legacy string-based suggestions if JSON intents fail to load
- **Language Support**: All intents support Thai (primary) and English (secondary)
- **Medical Safety**: Every intent is designed to be safe, auditable, and suitable for medical review
