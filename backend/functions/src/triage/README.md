# Triage Function

Backend function for clinical triage assessment.

## API Endpoints

### POST /triage/assess
Submit symptom and get triage response.

**Request:**
```json
{
  "session_id": "uuid",
  "symptom": "user symptom text",
  "previous_answers": {}
}
```

**Response:**
```json
{
  "need_more_info": true,
  "next_question": "question text or null",
  "triage_level": "self_care | pharmacy | gp | emergency | uncertain"
}
```

### GET /triage/diagnosis
Get final diagnosis with recommendations.

**Query Parameters:**
- `session_id`: string

**Response:**
```json
{
  "triage_level": "self_care",
  "summary": "short summary",
  "recommendations": {
    "home_care": ["item1", "item2"],
    "otc_meds": ["item1", "item2"],
    "when_to_see_doctor": ["item1", "item2"],
    "danger_signs": ["item1", "item2"],
    "additional_advice": ["item1", "item2"]
  }
}
```

## Rules
- Never repeat questions
- Max 6 questions total
- Stop when triage is clear or confidence ≥ 80%
- Follow prompts_clinical_triage_v2.md
