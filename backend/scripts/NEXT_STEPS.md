# Next Steps: Expanding to 700 Symptom Intents

## ✅ Completed

1. ✅ Created data models (`SymptomIntent`, `SymptomSuggestion`)
2. ✅ Created schema files (CSV + JSON templates)
3. ✅ Updated Flutter app to use structured intents
4. ✅ Updated backend to support intent_id mapping
5. ✅ Created generation scripts

## 🚀 Immediate Next Steps

### Step 1: Expand Initial Dataset (Priority: High)

**Goal**: Expand from 3 example intents to ~100-150 intents covering all major symptom categories

**Actions**:
```bash
# Option A: Use Python script (recommended)
cd backend
python scripts/expand_intents.py --expand-all

# Option B: Use Node.js script
node scripts/generate_intents.js --expand-all

# Option C: Manual expansion using CSV
# 1. Open backend/data/symptom_intents_master.csv in Google Sheets
# 2. Use the Cursor prompt provided by user to generate rows
# 3. Export and convert to JSON
```

**Target**: Generate 10-12 intents per primary symptom for:
- 🧠 Neurology: ปวดหัว, เวียนหัว, หน้ามืด, เป็นลม (40-48 intents)
- 🫁 Respiratory: ไอ, หายใจลำบาก (20-24 intents)
- ❤️ Cardiology: เจ็บหน้าอก, ใจสั่น (20-24 intents)
- 🍽️ GI: ปวดท้อง, ท้องเสีย, คลื่นไส้, อาเจียน (40-48 intents)

**Total**: ~120-144 intents initially

### Step 2: Medical Review Process

**Goal**: Ensure clinical accuracy and safety

**Actions**:
1. **Export CSV for Review**:
   ```bash
   # Convert JSON to CSV for medical review
   python scripts/json_to_csv.py symptom_intents_master.json
   ```

2. **Review Checklist**:
   - [ ] Every intent has a red-flag question
   - [ ] Emergency intents have `confidence_weight ≥ 0.12`
   - [ ] Non-emergency intents have `confidence_weight 0.03-0.08`
   - [ ] OTC groups don't conflict with contraindications
   - [ ] Thai text is natural (not textbook)
   - [ ] No duplicate semantic meanings

3. **Medical Reviewer Workflow**:
   - Open CSV in Google Sheets
   - Review each intent row
   - Mark `status` as `active`, `draft`, or `deprecated`
   - Add `notes_medical` for important clinical considerations

### Step 3: Backend Integration Enhancement

**Goal**: Better utilize structured intent data in triage logic

**Current Status**: Basic intent_id → red-flag question mapping

**Enhancements Needed**:

1. **Use Confidence Weights**:
   ```javascript
   // In assess.js, use intent confidence weight
   const intent = resolveSymptomIntent(symptom);
   if (intent) {
     const confidenceWeight = getConfidenceWeight(intent);
     // Use in confidence calculation
   }
   ```

2. **Use OTC/Self-Care Groups**:
   ```javascript
   // In OTC recommendation logic
   const otcGroups = getOtcGroups(intent);
   const selfCareGroups = getSelfCareGroups(intent);
   // Map to actual recommendations
   ```

3. **Use Clinical Context**:
   ```javascript
   // Use severity, time_course, location from intent
   const severity = intent.clinical_context?.severity;
   const timeCourse = intent.clinical_context?.time_course;
   // Use in triage decision
   ```

**Files to Update**:
- `backend/src/functions/triage/assess.js` - Use intent data in triage logic
- `backend/src/functions/triage/thai_otc_catalog.js` - Map OTC groups to actual drugs
- `backend/src/functions/triage/self_care_recommendations.js` - Map self-care groups

### Step 4: Generate Full 700-Intent Dataset

**Goal**: Complete dataset covering all symptom variations

**Method**: Use the Cursor prompt provided by user

**Process**:
1. **Prepare Cursor Prompt**:
   - Copy the prompt from user's specification
   - Ensure CSV schema matches exactly
   - Set target: 700 intents (±5%)

2. **Generate in Batches**:
   - Generate 100-150 intents at a time
   - Review each batch before proceeding
   - Merge into master dataset

3. **Quality Assurance**:
   ```bash
   # Run QA script
   python scripts/qa_intents.py symptom_intents_master.json
   ```

**QA Checklist**:
- [ ] ~700 intents total (±5%)
- [ ] All intents have red-flag questions
- [ ] No duplicate intent_id
- [ ] No duplicate semantic meaning
- [ ] Emergency intents properly flagged
- [ ] OTC groups valid
- [ ] Age ranges appropriate
- [ ] Thai text natural

### Step 5: Flutter App Testing

**Goal**: Ensure app works correctly with expanded dataset

**Test Cases**:
1. **Empty Input**: Shows default suggestions (10 common symptoms)
2. **Partial Input**: Shows matching suggestions (8-12 items)
3. **Intent Selection**: Sends intent_id to backend
4. **Backend Response**: Receives correct red-flag question
5. **Fallback**: Works if JSON file missing (legacy system)

**Commands**:
```bash
cd mobile
flutter run -d chrome  # Test web
flutter run -d ios      # Test iOS
flutter run -d android  # Test Android
```

### Step 6: Performance Optimization

**Goal**: Ensure fast loading and searching with 700 intents

**Optimizations**:
1. **Lazy Loading**: Load intents on-demand, not all at once
2. **Search Indexing**: Pre-build search indexes for fast lookup
3. **Caching**: Cache frequently accessed intents
4. **Compression**: Compress JSON file if needed

**Measure**:
- Intent loading time: Target < 100ms
- Search time: Target < 50ms
- Memory usage: Target < 10MB for 700 intents

## 📋 Long-Term Roadmap

### Phase 1: Foundation (Current)
- ✅ Schema design
- ✅ Basic implementation
- 🔄 Initial dataset (100-150 intents)

### Phase 2: Expansion (Next 2-4 weeks)
- Generate full 700-intent dataset
- Medical review and approval
- Backend integration enhancement

### Phase 3: Optimization (Next 1-2 months)
- Performance optimization
- Advanced search features
- Analytics and monitoring

### Phase 4: Advanced Features (Future)
- Machine learning for intent matching
- User feedback integration
- Continuous improvement based on usage data

## 🛠️ Tools Created

1. **`generate_intents.js`** - Node.js script for generating intents
2. **`expand_intents.py`** - Python script for expanding dataset
3. **`intent_loader.js`** - Backend loader with enhanced features
4. **`README_SYMPTOM_INTENTS.md`** - Complete documentation

## 📝 Notes

- **Backward Compatibility**: System falls back to legacy text-based system if intents fail to load
- **Incremental Expansion**: Can add intents gradually, no need to generate all 700 at once
- **Medical Safety**: Every intent must be reviewed before marking as `active`
- **Version Control**: Keep track of intent versions and changes in `notes_medical`

## 🎯 Success Metrics

- **Dataset Size**: 700 intents (±5%)
- **Coverage**: All primary symptoms have 10-12 variations
- **Quality**: 100% medical review approval
- **Performance**: < 100ms intent loading, < 50ms search
- **Usage**: Intent_id used in > 80% of assessments
