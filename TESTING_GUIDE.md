# Comprehensive Testing Guide - SukAI MVP

## 🎯 Current Status

✅ **Completed:**
- Backend fixes (500 error, error handling)
- Medical intelligence improvements (severity, WHY, medications, follow-up)
- UI/UX improvements (contrast, typography, icons, spacing)
- Yellow text fixes (buttons, icons)
- 3-menu navigation
- Profile page restructure

⏳ **Next Steps:**
- Rebuild app
- Test all features
- Verify improvements

---

## 📋 Step-by-Step Testing Process

### Step 1: Rebuild Flutter App 🔨

**Run these commands:**
```bash
cd mobile
flutter clean
flutter pub get
flutter run -d chrome
```

**Expected:**
- ✅ App compiles without errors
- ✅ App launches successfully
- ✅ No yellow text on white backgrounds
- ✅ All UI improvements visible

---

### Step 2: Test Authentication 🔐

**Test Flow:**
1. **Sign Up**
   - Click "ยังไม่มีบัญชี? สมัครสมาชิก"
   - Enter email: `test@example.com`
   - Enter password: `test123456`
   - Click "สมัครสมาชิก"
   - ✅ Should redirect to home page
   - ✅ Button text should be dark (not yellow)

2. **Sign Out**
   - Go to Profile page
   - Click "ออกจากระบบ"
   - ✅ Should redirect to login page

3. **Sign In**
   - Enter same credentials
   - Click "เข้าสู่ระบบ"
   - ✅ Should redirect to home page
   - ✅ Button text should be dark (not yellow)

**Expected Results:**
- ✅ All buttons readable (dark text)
- ✅ Authentication works smoothly
- ✅ No errors in console

---

### Step 3: Test Triage Flow 🏥

**Test Flow:**
1. **Start Session**
   - Click "เริ่มตรวจอาการ" on home page
   - ✅ Should open chat page with welcome message

2. **Submit Symptom**
   - Type: `ปวดหัว`
   - Press Enter or Send
   - ✅ AI responds with question
   - ✅ Loading indicator shows briefly

3. **Answer Questions**
   - Answer: `2 วัน` (when asked about duration)
   - Continue answering until triage completes
   - ✅ Should ask at least 4 questions
   - ✅ No repeated questions
   - ✅ Questions are relevant

4. **Complete Triage**
   - Continue until summary appears automatically
   - ✅ Navigates to summary page
   - ✅ No 500 errors

**Expected Results:**
- ✅ At least 4 questions asked
- ✅ Smooth navigation to summary
- ✅ No errors

---

### Step 4: Verify Summary Page Features 📋

**Check Each Feature:**

#### 4.1 Severity Statement
- [ ] Traffic light emoji (🟢🟡🔴) shows prominently
- [ ] Severity text is large and bold (24px)
- [ ] WHY explanation appears in info box below
- [ ] Text is clear and reassuring

#### 4.2 Medication Guidance
- [ ] Shows 1 main OTC medication option
- [ ] Shows 1 alternative option
- [ ] Usage instructions visible ("วิธีใช้: ...")
- [ ] Warnings displayed ("ข้อควรระวัง: ...")
- [ ] "พอเหมาะ ไม่เกินจำเป็น" appears
- [ ] "ควรถามเภสัชกร" when appropriate

#### 4.3 Follow-up Reminder Card
- [ ] Card appears with yellow-tinted background
- [ ] Icon is dark (not yellow) for visibility
- [ ] Shows timing: "24–48 ชม."
- [ ] Shows watch signs
- [ ] "บันทึกการติดตามอาการ" button works

#### 4.4 Premium Doctor Card (GP Cases Only)
- [ ] Appears only for GP-level triage
- [ ] Message: "แพทย์ช่วยตรวจซ้ำจากข้อมูลที่ AI สรุปแล้ว"
- [ ] Links to Profile page correctly

#### 4.5 Recommendation Sections
- [ ] All 5 sections show:
  - Home care (green icon)
  - OTC meds (amber icon - not yellow)
  - When to see doctor (amber icon)
  - Danger signs (red icon)
  - Additional advice (amber icon)
- [ ] Icons are clearly visible (dark/amber, not yellow)
- [ ] Text is readable

**Expected Results:**
- ✅ All features display correctly
- ✅ No yellow text/icons on white
- ✅ High contrast throughout

---

### Step 5: Test Session History 📚

**Test Flow:**
1. **Complete a Session**
   - Finish triage and view summary
   - Go back to home page

2. **Check History**
   - ✅ Session appears in list
   - ✅ Shows symptom, date, triage level
   - ✅ Icon matches triage level

3. **Open Session**
   - Click on session in list
   - ✅ Opens summary page
   - ✅ Shows all details correctly

**Expected Results:**
- ✅ Sessions save correctly
- ✅ History displays properly
- ✅ Navigation works smoothly

---

### Step 6: Test Follow-up Check-in 📊

**Test Flow:**
1. **Navigate to Follow-up**
   - From summary page, click "บันทึกการติดตามอาการ"
   - ✅ Opens follow-up page

2. **Submit Check-in**
   - Select status: "ดีขึ้น" (green), "เท่าเดิม" (amber), or "แย่ลง" (red)
   - Add optional notes
   - Click "บันทึก"
   - ✅ Success message appears
   - ✅ Returns to previous page

**Expected Results:**
- ✅ Check-in saves successfully
- ✅ Status colors are amber (not yellow) for better contrast
- ✅ No errors

---

### Step 7: Test Profile Page 👤

**Check Each Section:**

#### 7.1 User Card
- [ ] Avatar shows user initial
- [ ] Name and email display correctly
- [ ] Current plan badge shows (if subscribed)

#### 7.2 Health Profile
- [ ] Icon is dark and visible
- [ ] "แก้ไขข้อมูลสุขภาพ" button has dark text (not yellow)
- [ ] Helpful note appears with lightbulb icon

#### 7.3 My Plan
- [ ] All 3 plans display
- [ ] Pro plan uses amber accent (not yellow)
- [ ] Current plan highlighted

#### 7.4 Privacy & PDPA
- [ ] Shield icon is dark
- [ ] All 3 items listed
- [ ] Professional tone

#### 7.5 Medical Disclaimer
- [ ] Info icon is dark
- [ ] Text is clear and calm
- [ ] Not scary or alarming

#### 7.6 Help Center
- [ ] Help icon is dark
- [ ] All 3 items listed
- [ ] Easy to understand

**Expected Results:**
- ✅ All sections display correctly
- ✅ No yellow text on white
- ✅ Professional appearance

---

### Step 8: Test 3-Menu Navigation 🧭

**Test Each Menu:**

1. **Home Menu**
   - Click home icon
   - ✅ Navigates to home page
   - ✅ Icon is dark when active

2. **Chat Menu**
   - Click chat icon
   - ✅ Starts new session
   - ✅ Icon is dark when active

3. **Profile Menu**
   - Click profile icon
   - ✅ Opens profile page
   - ✅ Icon is dark when active

**Expected Results:**
- ✅ Navigation works on all pages
- ✅ Active state is clear (dark icon)
- ✅ Inactive state is subtle (gray icon)
- ✅ Consistent across all pages

---

### Step 9: Database Verification 🗄️

**Check Supabase Dashboard:**

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Check Tables:**
   - [ ] `triage_sessions` - Has your test session
   - [ ] `diagnoses` - Has diagnosis for your session
   - [ ] `followup_checkins` - Has your check-in (if submitted)
   - [ ] `auth.users` - Has your test user

3. **Verify Data:**
   - [ ] `user_id` is set correctly
   - [ ] `session_id` matches
   - [ ] Data is complete

**Expected Results:**
- ✅ All data saves correctly
- ✅ User IDs linked properly
- ✅ No missing data

---

### Step 10: UI/UX Verification 🎨

**Check Visual Improvements:**

1. **Colors & Contrast**
   - [ ] No yellow text on white backgrounds
   - [ ] All text is dark and readable
   - [ ] Icons are clearly visible
   - [ ] Buttons have good contrast

2. **Typography**
   - [ ] Text is properly sized
   - [ ] Line height is comfortable
   - [ ] Font weights are appropriate

3. **Spacing**
   - [ ] Generous padding in cards
   - [ ] Comfortable spacing between elements
   - [ ] Not cramped

4. **Icons**
   - [ ] All icons are dark (not yellow)
   - [ ] Consistent size (24px for headers)
   - [ ] Clear and meaningful

**Expected Results:**
- ✅ Professional appearance
- ✅ High readability
- ✅ Consistent design

---

## 🎯 Success Criteria

**MVP is Complete When:**
- ✅ All 10 test steps pass
- ✅ No critical errors
- ✅ Data saves correctly
- ✅ UI displays properly
- ✅ No yellow text on white backgrounds
- ✅ All improvements visible

---

## 🐛 Common Issues & Fixes

### Issue: Yellow text still appears
**Fix**: Hot reload or restart app (`flutter run`)

### Issue: Session doesn't appear in history
**Fix**: Check `user_id` is set in `triage_sessions` table

### Issue: 500 error on API calls
**Fix**: Check Railway logs, verify backend is deployed

### Issue: Buttons not readable
**Fix**: Verify theme changes are applied (restart app)

### Issue: Icons not visible
**Fix**: Check icon colors are dark (not yellow)

---

## 📝 Test Results Template

**Date**: _______________

**Test Results:**
- [ ] Step 1: Rebuild App - ✅ / ❌
- [ ] Step 2: Authentication - ✅ / ❌
- [ ] Step 3: Triage Flow - ✅ / ❌
- [ ] Step 4: Summary Features - ✅ / ❌
- [ ] Step 5: Session History - ✅ / ❌
- [ ] Step 6: Follow-up Check-in - ✅ / ❌
- [ ] Step 7: Profile Page - ✅ / ❌
- [ ] Step 8: Navigation - ✅ / ❌
- [ ] Step 9: Database - ✅ / ❌
- [ ] Step 10: UI/UX - ✅ / ❌

**Issues Found:**
1. _________________________________
2. _________________________________
3. _________________________________

**Overall Status**: ✅ MVP Complete / ❌ Needs Fixes

---

## 🚀 After Testing

If all tests pass:
1. ✅ MVP is complete!
2. Document any remaining issues
3. Plan next phase improvements

If tests fail:
1. Note specific issues
2. Check error logs
3. Fix issues and retest

---

**Good luck with testing! 🎉**

