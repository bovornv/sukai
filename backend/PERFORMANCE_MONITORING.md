# Performance Monitoring - Question Count Tracking

## Overview

SukAI tracks question count performance metrics to ensure the assessment flow meets medical-grade standards:
- **Emergency cases**: Target ≤3 questions
- **Non-emergency cases**: Target 7-12 questions

## Implementation

### Metrics Collection

Performance metrics are automatically recorded when:
1. A triage session completes (no more questions needed)
2. A final diagnosis is generated

Metrics are stored in the `triage_sessions` table with the following fields:
- `question_count`: Number of questions asked
- `triage_level`: Final triage level (emergency/self_care/gp/etc.)
- `confidence`: Confidence score (if available)

### API Endpoint

**GET `/api/analytics/performance`**

Get performance statistics for a date range.

**Query Parameters:**
- `startDate` (optional): ISO date string (default: 7 days ago)
- `endDate` (optional): ISO date string (default: now)
- `triageLevel` (optional): Filter by triage level (emergency/self_care/gp/etc.)

**Response:**
```json
{
  "stats": {
    "totalSessions": 150,
    "emergencySessions": 12,
    "nonEmergencySessions": 138,
    "averageQuestionCount": 8.5,
    "emergencyAverage": 2.1,
    "nonEmergencyAverage": 9.2,
    "targetMetRate": 85.3,
    "emergencyTargetMetRate": 91.7,
    "nonEmergencyTargetMetRate": 84.8,
    "distribution": {
      "1-3": 15,
      "4-6": 20,
      "7-9": 45,
      "10-12": 50,
      "13-15": 15,
      "16+": 5
    },
    "dateRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-08T00:00:00.000Z"
    }
  },
  "health": {
    "healthy": true,
    "warnings": [],
    "alerts": [],
    "stats": { ... }
  },
  "targets": {
    "emergency": "≤3 questions",
    "nonEmergency": "7-12 questions"
  }
}
```

### Health Checks

The system automatically checks if performance metrics are within acceptable ranges:

**Alerts (High Severity):**
- Emergency cases averaging >3 questions

**Warnings (Medium Severity):**
- Non-emergency cases averaging <7 or >12 questions
- Target met rate <70%

### Usage Examples

**Get last 7 days stats:**
```bash
curl http://localhost:3000/api/analytics/performance
```

**Get stats for specific date range:**
```bash
curl "http://localhost:3000/api/analytics/performance?startDate=2024-01-01&endDate=2024-01-31"
```

**Get emergency-only stats:**
```bash
curl "http://localhost:3000/api/analytics/performance?triageLevel=emergency"
```

**Get non-emergency stats:**
```bash
curl "http://localhost:3000/api/analytics/performance?triageLevel=self_care"
```

### Monitoring Dashboard (Future)

A dashboard can be built using this API to visualize:
- Average question counts over time
- Distribution of question counts
- Target met rates
- Performance trends

### Logging

Performance metrics are logged to console with format:
```
[PERFORMANCE-METRICS] Session {sessionId}:
  - Question Count: {count}
  - Triage Level: {level}
  - Confidence: {confidence}%
  - Target Met: ✅/⚠️
  - Expected: {target} questions
```

## Database Schema

Metrics use existing `triage_sessions` table:
- `question_count`: INTEGER - Number of questions asked
- `triage_level`: TEXT - Final triage level
- `confidence`: INTEGER - Confidence score (stored in answers JSONB)
- `created_at`: TIMESTAMPTZ - Session creation time
- `updated_at`: TIMESTAMPTZ - Last update time

## Next Steps

1. Create admin dashboard to visualize metrics
2. Set up alerts for performance degradation
3. Add more granular metrics (by symptom type, user demographics)
4. Export metrics to analytics platform (e.g., Google Analytics, Mixpanel)
