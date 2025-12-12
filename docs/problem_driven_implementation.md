# 📄 PROBLEM_DRIVEN_IMPLEMENTATION.md
SukAI — Problem-Driven App Implementation Specification

---

## 0. Purpose of This Document

This document defines **WHY SukAI exists** and **WHAT problems every feature must solve**.

It is the highest-priority reference for:
- Product decisions
- AI prompting
- UI / UX
- Backend logic
- Monetization strategy

If a feature does **not** directly solve one of the problems below, it should not be built.

---

## 1. Product Positioning (Thailand-first)

**“AI Doctor for Thai families — fast, clear, safe, and clinically guided.”**

SukAI combines:
- Ada-style triage accuracy
- Babylon-style conversational experience
- GoodRx-style medication clarity
- Ping An-style human-doctor hybrid

Target users:
- Thai families
- Parents & caregivers
- Elderly users
- Workers without easy doctor access
- Employers (B2B)

---

## 2. Core User Problems (Ranked by Willingness to Pay)

### 🔴 Problem 1 — Uncertainty & Fear  
**“Do I need to see a doctor now?”**

This is the #1 problem SukAI must solve.

User pain:
- Anxiety
- Panic ER visits
- Dangerous delays in care

Product requirement:
Every interaction must end with:
- A clear triage result
- A clear next action
- A clear safety boundary

Forbidden outputs:
- “ลองสังเกตอาการไปก่อน” (without criteria)
- “อาจเป็นได้หลายอย่าง”
- Long medical explanations

---

### 🟠 Problem 2 — Access to Good Doctors Is Expensive & Time-Consuming

User pain:
- Long queues
- High private hospital cost
- Short consultations

Product requirement:
SukAI acts as a **doctor pre-consult assistant**.
Doctors review summaries, not raw chats.

---

### 🟡 Problem 3 — Overpaying for Medicine / Not Knowing What to Take

User pain:
- Buying unnecessary medicine
- Wrong dosage
- Fear of side effects

Product requirement:
Medication advice must be:
- Conservative
- Simple
- Safety-first
- OTC-focused (unless doctor reviewed)

---

### 🟢 Problem 4 — Poor Follow-up & Monitoring

User pain:
- No follow-up after advice
- Symptoms worsen unnoticed

Product requirement:
SukAI must remember, follow up, and re-evaluate.

---

## 3. Mandatory Diagnosis Output Structure

Every completed diagnosis MUST include all sections below.

---

### 3.1 Diagnosis Summary Card (Top)

Rules:
- 2–4 short lines
- Emoji-based
- Calm, non-alarming tone

Examples:

Self-care:
💊 อาการไม่รุนแรง
🏠 ดูแลตัวเองที่บ้านได้
⏰ ติดตามอาการ 24–48 ชม.

makefile
Copy code

GP:
👨‍⚕️ ควรพบแพทย์
📅 ภายใน 1–2 วัน
📌 เตรียมข้อมูลอาการ

makefile
Copy code

Emergency:
🚨 อาการฉุกเฉิน
🏥 ไปโรงพยาบาลทันที
⚠️ อย่ารอให้อาการแย่ลง

yaml
Copy code

---

### 3.2 Recommendation Sections (Always Present)

Rules:
- Every section must appear
- 3–5 short bullet items
- No paragraphs
- Simple Thai
- Emoji allowed

---

#### ✔ วิธีดูแลตัวเอง
🛌 พักผ่อนให้เพียงพอ
💧 ดื่มน้ำอุ่นบ่อย ๆ
🧊 หลีกเลี่ยงของเย็น

yaml
Copy code

---

#### ✔ ยาที่ควรทาน (OTC เท่านั้น)
💊 พาราเซตามอล — ลดปวด
⏱ ทุก 6 ชม. หลังอาหาร
⚠️ ไม่เกิน 4,000 มก./วัน

yaml
Copy code

---

#### ✔ ควรพบแพทย์เมื่อไหร่
📅 ไม่ดีขึ้นใน 2–3 วัน
🤒 ไข้สูงกว่า 38.5°C
😣 อาการแย่ลง

yaml
Copy code

---

#### ✔ สัญญาณอันตราย
🚨 หายใจลำบาก
💥 เจ็บหน้าอกรุนแรง
😵 หมดสติ / ชัก

yaml
Copy code

---

#### ✔ ข้อแนะนำเพิ่มเติม
📝 จดอาการเปลี่ยนแปลง
📱 กลับมาประเมินใหม่ได้
👨‍⚕️ ปรึกษาแพทย์หากกังวล

yaml
Copy code

---

## 4. Questioning Engine Rules

- Questions must depend on symptoms and risk
- Never ask the same question for every case
- Do not repeat answered questions
- Stop when confidence is sufficient

Question style:
- Short
- One concept per question
- Friendly Thai tone

Example:
อาการนี้เริ่มเป็นมากี่วันแล้วคะ?

yaml
Copy code

---

## 5. Follow-up & Monitoring

Rules:
- Self-care → follow-up 24–48 ชม.
- GP → reminder + prep guidance
- Emergency → immediate action only

Follow-up UI:
- One-tap response
- ดีขึ้น / เท่าเดิม / แย่ลง

---

## 6. Hybrid Doctor Model (Premium)

AI handles:
- Triage
- Questioning
- Summary
- Medication guidance

Doctor handles:
- Review
- Edge cases
- Final responsibility

AI must never contradict doctor feedback.

---

## 7. Monetization Alignment

Free:
- Basic triage
- Limited follow-up

Pro:
- Unlimited AI
- Medication guidance
- Monitoring

Premium Doctor:
- Human review
- Doctor chat
- Employer plans

---

## 8. UI / UX Rules

- Kakao-style warmth
- Friendly doctor mascot
- Large readable text
- Calm colors
- Elderly-friendly spacing

If UI increases fear → redesign.

---

## 9. Final Rule

If a feature does **not** reduce uncertainty, cost, or improve follow-up — remove it.

---