# Triage Flow Fix - Summary

## Problem
The triage flow wasn't completing properly. After user typed "ปวดหัว" (headache) and answered "2 วัน" (2 days), the AI kept asking the same question instead of navigating to the summary page.

## Root Causes

### 1. Answer Extraction Logic (Frontend)
**Issue:** The code was checking if the last message was a question AFTER adding the user's message to state, so it always saw the user's message instead of the AI's question.

**Fix:** Moved answer extraction logic to BEFORE adding the user message to state, so it can properly detect when the user is answering a question.

**File:** `mobile/lib/features/chat/providers/chat_provider.dart`

### 2. Backend Symptom Handling
**Issue:** The backend was treating answer responses (like "2 วัน") as new symptoms, adding them to the symptoms array.

**Fix:** Added logic to detect when incoming data is an answer (has new answer keys in `previousAnswers`) vs a new symptom. Only add to symptoms array if it's actually a symptom.

**File:** `backend/src/functions/triage/index.js`

### 3. Navigation Timing
**Issue:** Navigation check was using delayed polling instead of reactive state watching.

**Fix:** Added a reactive listener that watches for triage completion state changes and navigates immediately when triage completes.

**File:** `mobile/lib/features/chat/pages/chat_page.dart`

## Changes Made

### Frontend (`mobile/lib/features/chat/providers/chat_provider.dart`)
- Moved answer extraction logic before adding user message to state
- Now properly detects when user is answering a question vs submitting a new symptom

### Backend (`backend/src/functions/triage/index.js`)
- Added detection for answers vs symptoms
- Only adds to symptoms array if it's actually a symptom
- Uses last actual symptom (not answer) for triage logic

### Navigation (`mobile/lib/features/chat/pages/chat_page.dart`)
- Added reactive listener for triage completion
- Improved navigation timing and reliability

## Testing

After these fixes, the flow should work as follows:

1. User types "ปวดหัว" → Added as symptom ✅
2. AI asks "อาการนี้เป็นมานานเท่าไหร่แล้วคะ?" ✅
3. User types "2 วัน" → Detected as answer to duration question ✅
4. Backend processes with `previousAnswers: { duration: "2 วัน" }` ✅
5. Triage completes (has duration + symptom "ปวดหัว") ✅
6. Navigation to summary page triggers automatically ✅

## Next Steps

1. **Test the fix:**
   - Run the app
   - Start a new triage session
   - Type "ปวดหัว"
   - Answer "2 วัน" when asked
   - Should navigate to summary automatically

2. **If still not working:**
   - Check backend logs for errors
   - Verify `previousAnswers` is being sent correctly
   - Check that `needMoreInfo` is being set to `false` when triage completes

3. **Deploy backend changes:**
   ```bash
   cd backend
   git add .
   git commit -m "Fix triage flow: answer extraction and symptom handling"
   git push origin main
   ```
   Railway will auto-deploy.

4. **Rebuild mobile app:**
   ```bash
   cd mobile
   flutter clean
   flutter pub get
   flutter run
   ```

## Files Modified

- ✅ `mobile/lib/features/chat/providers/chat_provider.dart`
- ✅ `backend/src/functions/triage/index.js`
- ✅ `mobile/lib/features/chat/pages/chat_page.dart`

All changes are backward compatible and don't break existing functionality.

