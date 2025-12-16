# Quick Testing Checklist (15 minutes)

## ✅ Step-by-Step Test Flow

### 🔐 1. Authentication (2 min)
- [ ] Sign up with email/password
- [ ] Sign out
- [ ] Sign in again
- [ ] **Result**: ✅ Works / ❌ Broken

### 🏥 2. Complete Triage Session (5 min)
- [ ] Click "เริ่มตรวจอาการ"
- [ ] Type: `ปวดหัว` → Send
- [ ] Answer question: `2 วัน` → Send
- [ ] Continue until summary appears
- [ ] **Result**: ✅ Works / ❌ Broken

### 📋 3. Verify Summary (2 min)
- [ ] Check summary shows:
  - Triage level (color-coded)
  - Diagnosis summary
  - 5 recommendation sections
- [ ] **Result**: ✅ Works / ❌ Broken

### 📚 4. Session History (2 min)
- [ ] Go back to home
- [ ] Check session appears in list
- [ ] Click session → Opens summary
- [ ] **Result**: ✅ Works / ❌ Broken

### 📊 5. Follow-up Check-in (2 min)
- [ ] From summary, go to follow-up
- [ ] Select "ดีขึ้น" → Click "บันทึก"
- [ ] **Result**: ✅ Works / ❌ Broken

### 🗄️ 6. Database Check (2 min)
- [ ] Supabase Dashboard → Table Editor
- [ ] Check `triage_sessions` has your session
- [ ] Check `followup_checkins` has your check-in
- [ ] **Result**: ✅ Works / ❌ Broken

---

## 🎯 Success Criteria

**MVP is complete if:**
- ✅ All 6 tests pass
- ✅ No critical errors
- ✅ Data saves correctly
- ✅ UI displays properly

**If any test fails:**
- Note the issue
- Check error logs
- Fix and retest

---

## 🐛 Common Issues & Fixes

### Issue: Session doesn't appear in history
**Fix**: Check `user_id` is set in `triage_sessions` table

### Issue: Follow-up button doesn't work
**Fix**: Verify `followup_checkins` table exists in Supabase

### Issue: Font warning in console
**Fix**: Ignore it (cosmetic, doesn't affect functionality)

### Issue: 500 error on API calls
**Fix**: Check Railway logs, verify environment variables

---

## 📝 Test Results

**Date**: _______________  
**All tests passed**: [ ] Yes [ ] No

**Issues found**:
1. _________________________________
2. _________________________________

