# MVP End-to-End Testing Guide

## Prerequisites

✅ Database SQL fix completed  
✅ Backend deployed on Railway  
✅ Mobile app running  
✅ Supabase configured  

---

## Test 1: Authentication Flow

### 1.1 Sign Up
- [ ] Open app → Should redirect to login page
- [ ] Click "สมัครสมาชิก" (Sign Up)
- [ ] Enter email: `test@example.com`
- [ ] Enter password: `test123456` (min 6 chars)
- [ ] Click "สมัครสมาชิก"
- [ ] **Expected**: Redirects to home page, no error

### 1.2 Sign Out & Sign In
- [ ] Sign out (if logout button exists)
- [ ] Sign in with same credentials
- [ ] **Expected**: Successfully logs in, redirects to home

### 1.3 Invalid Credentials
- [ ] Try wrong password
- [ ] **Expected**: Shows error message in Thai

---

## Test 2: Triage Flow (Complete Session)

### 2.1 Start New Session
- [ ] On home page, click "เริ่มตรวจอาการ" (Start Check)
- [ ] **Expected**: Opens chat page with welcome message

### 2.2 Submit Symptom
- [ ] Type symptom: `ปวดหัว` (headache)
- [ ] Press Enter or Send button
- [ ] **Expected**: 
  - AI responds with question (e.g., "อาการปวดเป็นมานานเท่าไหร่แล้วคะ?")
  - Loading indicator shows briefly

### 2.3 Answer Questions
- [ ] Answer: `2 วัน` (2 days)
- [ ] **Expected**: 
  - AI asks follow-up question OR completes triage
  - No repeated questions
  - Questions are relevant

### 2.4 Complete Triage
- [ ] Continue answering until triage completes
- [ ] **Expected**: 
  - Navigates to summary page automatically
  - Shows diagnosis summary
  - Shows triage level (self_care, pharmacy, gp, emergency, or uncertain)

### 2.5 Verify Summary Page
- [ ] Check summary card shows:
  - [ ] Triage level with color coding
  - [ ] Short diagnosis summary (2-4 lines)
  - [ ] 5 recommendation sections:
    - [ ] วิธีดูแลตัวเอง (Home Care)
    - [ ] ยาที่ควรทาน (OTC Meds)
    - [ ] ควรพบแพทย์เมื่อไหร่ (When to See Doctor)
    - [ ] สัญญาณอันตราย (Danger Signs)
    - [ ] ข้อแนะนำเพิ่มเติม (Additional Advice)
- [ ] **Expected**: All sections populated with bullet points

---

## Test 3: Session History

### 3.1 Verify Session Saved
- [ ] After completing Test 2, go back to home page
- [ ] **Expected**: 
  - Session appears in "ประวัติการตรวจ" (Recent Sessions) list
  - Shows symptom (e.g., "ปวดหัว")
  - Shows date/time
  - Shows triage level icon

### 3.2 Open Past Session
- [ ] Click on a session from the list
- [ ] **Expected**: Opens summary page for that session

### 3.3 Pull to Refresh
- [ ] Pull down on home page to refresh
- [ ] **Expected**: Sessions reload (if multiple exist)

### 3.4 Empty State
- [ ] If no sessions exist, check empty state
- [ ] **Expected**: Shows "ยังไม่มีประวัติการตรวจ" message

---

## Test 4: Follow-up Monitoring

### 4.1 Access Follow-up Page
- [ ] From summary page, navigate to follow-up (if button exists)
- [ ] OR manually navigate: `/followup?sessionId=YOUR_SESSION_ID`
- [ ] **Expected**: Follow-up page loads

### 4.2 Submit Check-in
- [ ] Select status: "ดีขึ้น" (Better)
- [ ] Optionally add notes
- [ ] Click "บันทึก" (Save)
- [ ] **Expected**: 
  - Success message appears
  - Returns to previous page OR shows success

### 4.3 Test All Statuses
- [ ] Test "เท่าเดิม" (Same)
- [ ] Test "แย่ลง" (Worse)
- [ ] **Expected**: All save successfully

### 4.4 Verify Escalation (Worse Status)
- [ ] Submit "แย่ลง" for a non-emergency session
- [ ] **Expected**: 
  - Check-in saves
  - Backend logs escalation (check Railway logs)

---

## Test 5: Error Handling

### 5.1 Network Error
- [ ] Turn off internet/WiFi
- [ ] Try to start new session
- [ ] **Expected**: Shows error message (not crash)

### 5.2 Invalid Input
- [ ] Submit empty symptom
- [ ] **Expected**: Validation prevents submission OR shows error

### 5.3 Backend Down
- [ ] Stop backend (or use wrong URL)
- [ ] Try API call
- [ ] **Expected**: Graceful error handling, fallback if available

---

## Test 6: UI/UX Polish

### 6.1 Loading States
- [ ] Check loading indicators appear during API calls
- [ ] **Expected**: Spinner or "กำลังพิมพ์..." message

### 6.2 Thai Font Display
- [ ] Check all Thai text renders correctly
- [ ] **Expected**: No missing characters, proper font

### 6.3 Navigation Flow
- [ ] Test back button behavior
- [ ] **Expected**: Returns to previous page correctly

### 6.4 Responsive Design
- [ ] Test on different screen sizes (if possible)
- [ ] **Expected**: UI adapts properly

---

## Test 7: Billing/Subscription (If Implemented)

### 7.1 View Plans
- [ ] Navigate to billing page
- [ ] **Expected**: Shows Free, Pro, Premium Doctor plans

### 7.2 Subscribe (Test Mode)
- [ ] Try subscribing to a plan
- [ ] **Expected**: 
  - Subscription saved (check Supabase)
  - Success message
  - Plan status updates

---

## Test 8: Database Verification

### 8.1 Check Supabase Tables
- [ ] Go to Supabase Dashboard → Table Editor
- [ ] Verify data exists in:
  - [ ] `triage_sessions` - Has your test session
  - [ ] `diagnoses` - Has diagnosis for your session
  - [ ] `followup_checkins` - Has your check-ins
  - [ ] `auth.users` - Has your test user

### 8.2 Verify User ID Linking
- [ ] Check `triage_sessions.user_id` matches your user ID
- [ ] **Expected**: All sessions linked to correct user

---

## Test 9: Backend API Verification

### 9.1 Health Check
```bash
curl https://sukai-production.up.railway.app/health
```
- [ ] **Expected**: Returns `{"status":"ok","timestamp":"..."}`

### 9.2 Check Railway Logs
- [ ] Go to Railway Dashboard → Service "sukai" → Logs
- [ ] **Expected**: 
  - No errors
  - API requests logged
  - Database queries successful

---

## Test 10: Edge Cases

### 10.1 Multiple Sessions
- [ ] Create 3-4 different sessions
- [ ] **Expected**: All appear in history, newest first

### 10.2 Long Symptom Text
- [ ] Enter very long symptom description
- [ ] **Expected**: Handles gracefully, doesn't break UI

### 10.3 Special Characters
- [ ] Enter symptom with emojis or special chars
- [ ] **Expected**: Handles correctly

### 10.4 Rapid Interactions
- [ ] Click buttons rapidly
- [ ] **Expected**: No duplicate submissions, no crashes

---

## Test Results Summary

**Date**: _______________  
**Tester**: _______________

### Passed Tests
- [ ] Test 1: Authentication
- [ ] Test 2: Triage Flow
- [ ] Test 3: Session History
- [ ] Test 4: Follow-up Monitoring
- [ ] Test 5: Error Handling
- [ ] Test 6: UI/UX
- [ ] Test 7: Billing (if applicable)
- [ ] Test 8: Database
- [ ] Test 9: Backend API
- [ ] Test 10: Edge Cases

### Failed Tests
List any failures:

1. _________________________________
2. _________________________________
3. _________________________________

### Critical Bugs Found
1. _________________________________
2. _________________________________
3. _________________________________

---

## Quick Test Script (5 minutes)

If you're short on time, run this minimal test:

1. ✅ Sign up → Sign in
2. ✅ Start session → Enter "ปวดหัว" → Answer questions → Complete triage
3. ✅ Go back to home → Verify session appears
4. ✅ Open session → Go to follow-up → Submit check-in
5. ✅ Check Supabase → Verify data saved

**If all 5 pass → MVP is functional! ✅**

---

## Next Steps After Testing

1. **Fix Critical Bugs**: Address any blocking issues
2. **Document Issues**: Create GitHub issues for non-critical bugs
3. **Performance Check**: Verify response times are acceptable
4. **Security Review**: Ensure no sensitive data exposed
5. **Deploy Final Version**: Push any fixes to production

---

## Need Help?

If you encounter issues:
1. Check Railway logs for backend errors
2. Check browser console for frontend errors
3. Check Supabase logs for database errors
4. Verify environment variables are set correctly

