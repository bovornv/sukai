# Testing Smart Symptom Expansion

## Test Cases

### Test 1: Thai Input - Base Symptom
**Input**: `น้ำมูกไหล`
**Expected**: 
- Never shows "น้ำมูกไหล" alone
- Shows 8-12 expansions with modifiers
- Each expansion includes "น้ำมูกไหล" as anchor phrase

**Example Expansions**:
- น้ำมูกไหล ใส เหมือนน้ำ
- น้ำมูกไหล ข้น สีเหลืองหรือเขียว
- น้ำมูกไหล ร่วมกับคัดจมูก
- น้ำมูกไหล และจามบ่อย
- น้ำมูกไหล ร่วมกับไข้
- น้ำมูกไหล เป็นมาหลายวัน
- น้ำมูกไหล ตอนเช้าเป็นหลัก
- น้ำมูกไหล หลังโดนฝุ่นหรืออากาศเย็น

### Test 2: Thai Input - Partial Match
**Input**: `ปวด`
**Expected**: 
- Shows expansions for matching symptoms (ปวดหัว, ปวดท้อง, etc.)
- Each expansion preserves "ปวด" as anchor

### Test 3: English Input
**Input**: `headache`
**Expected**:
- Shows English expansions
- Preserves "headache" as anchor phrase
- Uses English modifiers

**Example Expansions**:
- headache on one side
- headache on both sides
- headache severe and sudden
- headache getting worse
- headache every day
- headache comes and goes

### Test 4: Typo/Slang Handling
**Input**: `ปวดหัว` (with aliases)
**Expected**:
- Should match even if user types alias like "หัวปวด" or "ปวดศีรษะ"
- Shows expansions based on matched primary symptom

### Test 5: Multi-language Detection
**Input**: `cough`
**Expected**:
- Detects English input
- Shows English expansions
- Does NOT mix Thai and English

## Running Tests

### Flutter App Test
1. Run Flutter app
2. Navigate to symptom input page
3. Type each test case
4. Verify suggestions match expected behavior

### Backend Test (if needed)
```bash
# Test suggestion service directly
cd mobile
flutter test test/services/symptom_suggestion_service_test.dart
```

## Success Criteria

✅ Base symptom never appears alone when user types it  
✅ 8-12 expansions always shown  
✅ Exact user input preserved as anchor phrase  
✅ Language detection works correctly  
✅ Aliases improve matching accuracy  
✅ Each expansion adds clinical meaning  

