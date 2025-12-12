# SukAI Quick Start Guide

## Prerequisites

- Node.js 18+ (for backend)
- Flutter 3.0+ (for mobile app)

## Setup

### 1. Backend Setup

```bash
cd backend
npm install
npm start
```

Backend will run on `http://localhost:3000`

### 2. Mobile App Setup

```bash
cd mobile
flutter pub get
flutter run
```

## Testing the Integration

### Test Triage API

```bash
# Start a triage session
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-123",
    "symptom": "ปวดหัว",
    "previous_answers": {}
  }'

# Get diagnosis
curl http://localhost:3000/api/triage/diagnosis?session_id=test-123
```

### Test Chat API

```bash
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-123",
    "message": "เป็นอะไรคะ",
    "history": []
  }'
```

### Test Billing API

```bash
curl -X POST http://localhost:3000/api/billing/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "pro"
  }'
```

## Development Workflow

1. Start backend: `cd backend && npm run dev`
2. Start mobile app: `cd mobile && flutter run`
3. Test features in the app

## Production Deployment

### Backend
- Deploy to cloud service (AWS, GCP, Azure, etc.)
- Update `baseUrl` in mobile service files
- Add environment variables
- Set up database/Redis for session storage

### Mobile
- Update API URLs in:
  - `mobile/lib/services/triage_service.dart`
  - `mobile/lib/services/chat_service.dart`
  - `mobile/lib/services/billing_service.dart`
- Build release: `flutter build apk` or `flutter build ios`

## Notes

- Backend uses in-memory session storage (replace with Redis/DB in production)
- Mobile app has mock fallbacks if backend is unavailable
- All logic follows documentation in `/docs` strictly
