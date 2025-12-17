# Thai Language Understanding Improvements

## 🎯 Overview

Enhanced SukAI's Thai language understanding to handle:
- Misspellings and typos
- Slang and spoken language
- Context-based understanding
- Smart clarification
- Confidence-aware responses

---

## ✅ Improvements Implemented

### 1. Thai Text Normalization (`thai_normalizer.js`)

**Features:**
- ✅ Spelling variant normalization (ปวดหัว/ปวดหัวมาก/ปวดหัวๆ → ปวดหัว)
- ✅ Slang to medical term mapping (ไม่ไหวละ → รุนแรง, หนักหัว → ปวดหัว)
- ✅ Context extraction (duration, severity, worsening, self-care attempts)
- ✅ Anxiety detection
- ✅ Reassurance message generation

**Key Functions:**
- `normalizeThaiText()` - Normalizes misspellings and slang
- `extractSymptoms()` - Extracts symptoms from text
- `extractDuration()` - Extracts duration (e.g., "2 วัน", "เมื่อวาน")
- `detectSeverity()` - Detects severity (high/medium/low)
- `isWorsening()` - Checks if symptom is worsening
- `triedSelfCare()` - Checks if user tried self-care
- `isAnxious()` - Detects anxious/worried users
- `getReassuranceMessage()` - Returns reassuring message

---

### 2. Enhanced Triage Logic (`assess.js`)

**Improvements:**

#### 2.1 Text Normalization Before Processing
- All symptom text is normalized before checking red flags
- Handles misspellings: "ไค้" → "ไข้", "อ๊วก" → "อาเจียน"
- Handles slang: "ไม่ไหวละ" → "รุนแรง", "หนักหัว" → "ปวดหัว"

#### 2.2 Context Extraction
- Automatically extracts duration from text: "2 วันแล้ว" → duration: "2 วัน"
- Detects severity: "รุนแรงมาก" → severity: "high"
- Detects worsening: "แย่ลง" → severity_trend: "แย่ลง"
- Detects self-care attempts: "กินยาแล้ว" → self_care_response: "เคยลองแล้ว"

#### 2.3 Smart Clarification
- **Before**: Always asked "อาการนี้เป็นมานานเท่าไหร่แล้วคะ?"
- **After**: Only asks if duration not found in text
- **Before**: Always asked "อาการแย่ลง ดีขึ้น หรือเหมือนเดิมคะ?"
- **After**: Only asks if worsening not detected in text
- **Before**: Always asked "เคยลองดูแลตัวเองหรือใช้ยาอะไรแล้วไหมคะ?"
- **After**: Only asks if self-care attempts not detected in text

#### 2.4 Confidence Boost
- Extracted context boosts confidence score
- Duration found: +10 confidence
- Severity detected: +10 confidence
- Worsening/self-care detected: +10 confidence
- Reduces unnecessary questions

#### 2.5 Anxiety-Aware Responses
- Detects anxious users: "กลัว", "กังวล", "ไม่รู้จะทำไง"
- Adds reassurance message: "ไม่ต้องกังวลนะคะ หมอจะช่วยประเมินอาการให้"
- Includes reassurance in question if user is anxious

---

### 3. Spelling Variant Groups

**Common Misspellings Handled:**

| Standard Term | Variants |
|--------------|----------|
| ปวดหัว | ปวดหัวมาก, ปวดหัวๆ, ปวดหัวเวียน, ปวดศีรษะ, หนักหัว, มึนหัว |
| เวียนหัว | เวียนๆ, มึนหัว, มึนงง, มึนๆ, เวียนศีรษะ |
| เจ็บคอ | เจบคอ, เจ็บคอมาก, คอเจบ, ร้อนใน, คอแห้ง |
| ไข้ | ไค้, ไข้ขึ้น, เป็นไข้, ตัวร้อน, ร้อนตัว, มีไข้ |
| อาเจียน | อ้วก, อ๊วก, จะอ้วก, คลื่นไส้, อยากอ้วก |
| ท้องเสีย | ถ่ายเหลว, ถ่ายน้ำ, วิ่งเข้าห้องน้ำ, ท้องร่วง |
| เจ็บหน้าอก | แน่นอก, เจ็บอก, ปวดอก, เจ็บทรวงอก |
| หายใจลำบาก | หายใจไม่ออก, หายใจไม่สะดวก, หายใจติดขัด, เหนื่อย |
| ใจสั่น | ใจเต้นผิดปกติ, ใจเต้นแรง, ใจเต้นเร็ว |
| อ่อนเพลีย | เพลียจัด, ไม่ไหวละ, ไม่มีแรง, เหนื่อยมาก |

---

### 4. Slang to Medical Term Mapping

**Examples:**

| Slang | Medical Term |
|-------|-------------|
| ไม่ไหวละ | รุนแรง |
| เพลียจัด | อ่อนเพลีย |
| หนักหัว | ปวดหัว |
| มึนๆ | เวียนหัว |
| แน่นอก | เจ็บหน้าอก |
| ตัวร้อน | ไข้ |
| ร้อนใน | เจ็บคอ |

---

### 5. Context Understanding Examples

**Example 1: Duration Extraction**
```
Input: "ปวดหัวตั้งแต่เมื่อวาน"
Extracted: duration = 1 วัน
Result: Skips duration question
```

**Example 2: Worsening Detection**
```
Input: "ปวดหัว 2 วันแล้ว ยังไม่หาย กินยาแล้วก็ไม่ดีขึ้น"
Extracted: 
- duration = 2 วัน
- severity_trend = แย่ลง
- self_care_response = เคยลองแล้ว
Result: Skips 3 questions, higher triage level (GP)
```

**Example 3: Severity Detection**
```
Input: "ปวดหัวมาก ทนไม่ไหว"
Extracted: severity = high
Result: Higher triage level (GP)
```

**Example 4: Anxiety Detection**
```
Input: "ปวดหัว กลัวมาก ไม่รู้จะทำไง"
Detected: anxious = true
Response: "ไม่ต้องกังวลนะคะ หมอจะช่วยประเมินอาการให้\n\nอาการปวดเป็นมานานเท่าไหร่แล้วคะ?"
```

---

### 6. Smart Question Reduction

**Before Enhancement:**
- Always asked 4-6 questions
- Asked even if info already in text
- Redundant questions

**After Enhancement:**
- Asks only necessary questions
- Skips if info extracted from text
- Reduces to 2-4 questions typically
- More efficient, less frustrating

**Example Flow:**

**Before:**
1. "อาการปวดเป็นมานานเท่าไหร่แล้วคะ?" ← Asked even if "2 วันแล้ว" in text
2. "อาการแย่ลง ดีขึ้น หรือเหมือนเดิมคะ?" ← Asked even if "ไม่ดีขึ้น" in text
3. "เคยลองดูแลตัวเองหรือใช้ยาอะไรแล้วไหมคะ?" ← Asked even if "กินยาแล้ว" in text
4. "คุณอยู่ในกลุ่มเสี่ยงไหมคะ?"
5. "มีอาการอื่นๆ ร่วมด้วยไหมคะ?"

**After:**
1. Skips duration (extracted: "2 วันแล้ว")
2. Skips severity trend (detected: "ไม่ดีขึ้น" = แย่ลง)
3. Skips self-care (detected: "กินยาแล้ว")
4. "คุณอยู่ในกลุ่มเสี่ยงไหมคะ?"
5. "มีอาการอื่นๆ ร่วมด้วยไหมคะ?"

**Result**: 2 questions instead of 5!

---

## 📊 Expected Results

### User Experience Improvements

**Before:**
- ❌ "ปวดหัว" → Asked "อาการปวดเป็นมานานเท่าไหร่แล้วคะ?"
- ❌ "ปวดหัว 2 วันแล้ว" → Still asked duration question
- ❌ "ไม่ไหวละ" → System didn't understand severity
- ❌ "อ๊วก" → System didn't recognize as "อาเจียน"

**After:**
- ✅ "ปวดหัว" → Understands correctly
- ✅ "ปวดหัว 2 วันแล้ว" → Extracts duration, skips question
- ✅ "ไม่ไหวละ" → Understands as "รุนแรง"
- ✅ "อ๊วก" → Normalizes to "อาเจียน"
- ✅ "กลัวมาก" → Adds reassurance message
- ✅ "กินยาแล้วไม่ดีขึ้น" → Detects worsening + self-care, elevates triage

---

## 🎯 Key Benefits

1. **Better Understanding**
   - Handles typos and misspellings
   - Understands slang and spoken language
   - Extracts context from text

2. **Fewer Questions**
   - Smart clarification
   - Only asks necessary questions
   - Reduces user frustration

3. **Better Triage**
   - More accurate severity detection
   - Better context awareness
   - Higher confidence scores

4. **User-Friendly**
   - Reassurance for anxious users
   - Natural language understanding
   - Works for all ages

---

## 📝 Files Modified

1. **`backend/src/functions/triage/thai_normalizer.js`** (NEW)
   - Thai text normalization
   - Context extraction
   - Slang mapping

2. **`backend/src/functions/triage/assess.js`**
   - Integrated Thai normalizer
   - Enhanced triage logic
   - Smart clarification
   - Anxiety-aware responses

---

## 🧪 Testing Examples

### Test Case 1: Misspelling
```
Input: "ปวดหัว 2 วันแล้ว ไค้ขึ้น"
Normalized: "ปวดหัว 2 วันแล้ว ไข้ขึ้น"
Extracted: duration = 2 วัน, symptom = ไข้
Result: Skips duration question, understands fever
```

### Test Case 2: Slang
```
Input: "หนักหัวมาก ไม่ไหวละ"
Normalized: "ปวดหัวมาก รุนแรง"
Extracted: severity = high
Result: Higher triage level (GP)
```

### Test Case 3: Context Extraction
```
Input: "ปวดหัวตั้งแต่เมื่อวาน กินยาแล้วไม่ดีขึ้น"
Extracted:
- duration = 1 วัน
- severity_trend = แย่ลง
- self_care_response = เคยลองแล้ว
Result: Skips 3 questions, elevates to GP level
```

### Test Case 4: Anxiety
```
Input: "ปวดหัว กลัวมาก"
Detected: anxious = true
Response: "ไม่ต้องกังวลนะคะ หมอจะช่วยประเมินอาการให้\n\nอาการปวดเป็นมานานเท่าไหร่แล้วคะ?"
```

---

## 🚀 Next Steps

1. **Test with real users**
   - Collect misspelling examples
   - Collect slang examples
   - Refine mappings

2. **Continuous Learning** (Future)
   - Track user corrections
   - Learn from user feedback
   - Improve mappings over time

3. **Expand Coverage**
   - Add more spelling variants
   - Add more slang terms
   - Add regional variations

---

**Status**: ✅ Complete

**Impact**:
- Better understanding of Thai text
- Fewer redundant questions
- More accurate triage
- Better user experience for all ages

