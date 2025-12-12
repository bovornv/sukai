# SukAI Mobile App

Flutter mobile application for SukAI - AI Doctor for Thai families.

## Features

- **AI Symptom Checker**: Free-text input with dynamic questioning (no repeated questions)
- **Triage System**: 5 levels (self_care, pharmacy, gp, emergency, uncertain)
- **Summary Cards**: Kakao-style color-coded cards
- **Recommendations**: 5 sections (home_care, otc_meds, when_to_see_doctor, danger_signs, additional_advice)
- **Follow-up Monitoring**: Daily check-ins and symptom tracking
- **Billing**: Free, Pro, and Premium Doctor plans

## Setup

1. Install Flutter dependencies:
```bash
flutter pub get
```

2. Generate freezed models:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

3. Run the app:
```bash
flutter run
```

## Project Structure

```
lib/
├── app/              # App configuration (router, theme)
├── features/         # Feature modules
│   ├── home/
│   ├── chat/
│   ├── summary/
│   ├── followup/
│   └── billing/
├── l10n/            # Localization (Thai default)
├── models/          # Data models
└── services/        # API services
```

## Default Language

Thai (th_TH) - as specified in requirements.

## UI Style

Kakao-inspired design with:
- Primary color: #FFE812 (yellow)
- Rounded corners
- Soft shadows
- Emoji support
- Large, readable fonts

## Backend Integration

Update base URLs in service files:
- `lib/services/triage_service.dart`
- `lib/services/chat_service.dart`
- `lib/services/billing_service.dart`
