# SukAI

AI Doctor for Thai families — fast, clear, safe, and clinically guided.

## Project Structure

```
sukai/
├── backend/
│   └── functions/
│       └── src/
│           ├── triage/      # Clinical triage API
│           ├── chat/        # AI doctor chat API
│           ├── billing/     # Subscription management
│           └── orgs/        # B2B features
│
├── mobile/
│   └── lib/
│       ├── app/             # App config (router, theme)
│       ├── features/        # Feature modules
│       │   ├── home/
│       │   ├── chat/
│       │   ├── summary/
│       │   ├── followup/
│       │   └── billing/
│       ├── l10n/           # Localization (Thai default)
│       ├── models/         # Data models
│       └── services/       # API services
│
└── docs/                   # Project documentation
    ├── sukai_app_plan_v1.md
    ├── prompts_clinical_triage_v2.md
    ├── prompts_doctor_chat_v2.md
    ├── summary_card_spec_v2.md
    ├── pricing_model_th_v1.md
    ├── b2b_employer_school_plan_v1
    └── ui_kakao_style_guidelines.md
```

## Mobile App

Flutter mobile application. See `mobile/README.md` for setup instructions.

### Quick Start

```bash
cd mobile
flutter pub get
flutter run
```

## Backend

Node.js/Express backend API. See `backend/README.md` for setup and API documentation.

### Quick Start

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:3000` by default.

## Documentation

All project documentation is in `/docs`. Key documents:

- **sukai_app_plan_v1.md**: Master build plan and core features
- **prompts_clinical_triage_v2.md**: Triage logic and rules
- **prompts_doctor_chat_v2.md**: Chat behavior guidelines
- **summary_card_spec_v2.md**: Summary card UI spec
- **pricing_model_th_v1.md**: Subscription plans
- **ui_kakao_style_guidelines.md**: UI design guidelines

## Core Features

- ✅ AI Symptom Checker with dynamic questioning
- ✅ 5-level triage system (self_care, pharmacy, gp, emergency, uncertain)
- ✅ Kakao-style summary cards
- ✅ 5-section recommendations
- ✅ Follow-up monitoring
- ✅ Subscription plans (Free, Pro, Premium Doctor)

## Default Language

Thai (th_TH)

## UI Style

Kakao-inspired design with primary color #FFE812
