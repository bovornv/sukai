# Master Prompt Updates - SukAI App

## 🎯 Overview

Updated SukAI app according to the master prompt requirements for a Thai-first, Kakao-style medical AI app.

---

## ✅ Changes Implemented

### 1. Triage Level Labels (User-Friendly Language)

**Updated Labels:**
- 🟢 `ดูแลตัวเองได้` (Self-care) - Green
- 🟡 `ควรติดตาม / พบเภสัชกร` (Pharmacy) - Amber
- 🟡 `ควรติดตาม / พบแพทย์` (GP) - Amber  
- 🔴 `ฉุกเฉิน` (Emergency) - Red

**Files Modified:**
- `backend/src/functions/triage/diagnosis.js` - Updated severity statements

---

### 2. UI/Visual Design (Kakao-Style, Medical-Grade)

**Color Updates:**
- ✅ Yellow = accent only (CTA, highlight) - NOT for text on white
- ✅ Primary text: dark gray/near black (`#1A1A1A`)
- ✅ Background: off-white/warm gray (`#FAFAFA`)
- ✅ AppBar: White background (removed yellow background)
- ✅ Medical states: Green (safe), Amber (caution), Red (emergency)

**Files Modified:**
- `mobile/lib/app/theme.dart`:
  - Changed `textPrimary` from `#000000` to `#1A1A1A`
  - Changed `backgroundColor` from `#F5F5F5` to `#FAFAFA`
  - Added `amber` color for caution states
  - Updated `getTriageColor()` to use amber instead of yellow for pharmacy/gp
  - Changed AppBar background to white (`cardBackground`)
- `mobile/lib/features/home/pages/home_page.dart`:
  - Updated AppBar to use white background and dark text

---

### 3. Medication Guidance ("พอเหมาะ ไม่เกินจำเป็น")

**Updates:**
- Added "💡 พอเหมาะ ไม่เกินจำเป็น" to medication recommendations
- Emphasizes appropriate use without over-medication

**Files Modified:**
- `backend/src/functions/triage/diagnosis.js`:
  - Added "พอเหมาะ ไม่เกินจำเป็น" to `self_care` and `pharmacy` OTC medication recommendations

---

### 4. Profile Page Structure (Trust Center)

**New Structure (Top → Bottom):**

1. **User Card**
   - Name, email
   - Current plan badge
   - Avatar with initial

2. **Health Profile**
   - Age, chronic diseases, allergies
   - Edit health info CTA
   - Note: "💡 ช่วยให้ AI ประเมินแม่นยำขึ้น"

3. **My Plan**
   - Current plan display
   - Compare/Upgrade options
   - All 3 plans: Free, Pro, Premium Doctor

4. **Privacy & PDPA** (Serious, hospital-like tone)
   - Privacy policy
   - Health data rights
   - PDPA compliance

5. **Medical Disclaimer** (Short, clear, not scary)
   - Clear limitation statement
   - Not alarming

6. **Help Center**
   - FAQ
   - Contact support
   - Feedback

**Files Modified:**
- `mobile/lib/features/profile/pages/profile_page.dart`:
  - Restructured to match master prompt requirements
  - Added User Card with avatar
  - Improved Health Profile section with helpful note
  - Enhanced Privacy & PDPA section with 3 items
  - Updated list tile styling (removed yellow accent, used gray icons)
  - Updated Premium Doctor description: "AI + สรุปจากแพทย์"

---

### 5. Business Model (Year 1 Plans)

**Plan Descriptions Updated:**

**Free:**
- Basic triage
- Limited checks per day (3/day)
- Summary only

**Pro (Subscription):**
- Unlimited AI checks
- Detailed recommendations
- Medication guidance
- Follow-up monitoring

**Premium Doctor:**
- Human doctor review
- AI + doctor summary (updated)
- Priority response
- Limited family sharing

**Tone:** Justifies value without pressure

---

## 🎨 Design Principles Applied

### "หมอที่อธิบายเก่ง ใจเย็น และไม่ทำให้คนกลัว"

**Calm:**
- Warm gray backgrounds
- Rounded cards
- Generous spacing

**Clear:**
- High-contrast text
- Dark text on light backgrounds
- No yellow text on white

**Honest:**
- Clear medical disclaimers
- Transparent plan features
- No over-alarming

**Never Vague:**
- Specific triage levels
- Clear next actions
- Explicit medication guidance

---

## 📋 Remaining Tasks

### Optional Enhancements:

1. **Smarter Triage Logic**
   - Adapt questions based on initial symptom
   - Avoid repeating questions
   - Ask fewer, smarter questions
   - Stop when confidence threshold reached

2. **UI Polish**
   - Add more rounded corners
   - Improve spacing consistency
   - Add subtle animations

3. **Typography**
   - Ensure large, readable text throughout
   - Verify Thai font rendering

---

## 🧪 Testing Checklist

After rebuilding the app, verify:

- [ ] Triage levels show correct labels (🟢🟡🔴)
- [ ] AppBar is white (not yellow)
- [ ] Text is dark gray (not pure black)
- [ ] Profile page shows all sections in correct order
- [ ] Medication recommendations include "พอเหมาะ ไม่เกินจำเป็น"
- [ ] Yellow only appears as accent (buttons, highlights)
- [ ] No yellow text on white backgrounds
- [ ] Medical states use correct colors (Green/Amber/Red)

---

## 📝 Notes

- All changes maintain backward compatibility
- Database schema unchanged
- API contracts unchanged
- Only UI/UX and text content updated

---

## 🚀 Next Steps

1. Rebuild Flutter app: `flutter clean && flutter pub get && flutter run`
2. Test all UI changes
3. Verify triage labels display correctly
4. Test Profile page navigation
5. Verify medication guidance appears

---

**Status**: ✅ Core updates complete

**Files Changed**: 4 files
- `backend/src/functions/triage/diagnosis.js`
- `mobile/lib/app/theme.dart`
- `mobile/lib/features/home/pages/home_page.dart`
- `mobile/lib/features/profile/pages/profile_page.dart`

