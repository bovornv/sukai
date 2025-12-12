# SukAI Mobile App — Year 1 Master Build Plan (Thailand)

This document follows /docs/PROBLEM_DRIVEN_IMPLEMENTATION.md

## Positioning
**“AI Doctor for Thai families — fast, clear, safe, and clinically guided.”**

Hybrid model:
- Ada-style medical triage accuracy
- Babylon-style chat UX
- GoodRx-style medication clarity
- Ping An-style human doctor integration

Default language: Thai  
Secondary language (future): English

---

## Core Values (Non-Negotiable)
1. Medical safety first
2. Clear, simple language (เด็ก–ผู้สูงอายุ)
3. Short, structured outputs
4. Human escalation when uncertain

---

## Core Features (MVP → Year 1)

### A. AI Symptom Checker (Medical-grade)
- Free-text input (Thai)
- Dynamic doctor questioning (no repeated questions)
- Red-flag detection
- Outputs:
  - Triage level
  - Short diagnosis summary
  - 5 recommendation sections

### B. Recommendation Engine
Each diagnosis MUST output:
- home_care (3–5 items)
- otc_meds (3–5 items)
- when_to_see_doctor (3–5 items)
- danger_signs (3–5 items)
- additional_advice (3–5 items)

Rules:
- No paragraphs
- Short bullets only
- Emoji allowed
- Child-safe language

### C. Summary Card (Kakao-style)
- Color-coded by triage
- 4–6 short lines
- Emoji-based
- Always explain “what this means”

### D. Hybrid Doctor Review
- AI prepares case summary
- Human doctor reviews (Premium)
- Doctor note returned to user

### E. Follow-up Monitoring
- Daily check-in prompts
- Symptom trend tracking
- Escalation if worsening

---

## Monetization (Year 1)
- Free
- Pro
- Premium Doctor

(see pricing_model_th_v1.md)

---

## Non-Goals (Year 1)
- No diagnosis naming diseases
- No dosage personalization without Pro
- No emergency replacement claims
