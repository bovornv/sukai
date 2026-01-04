# Next Steps Implementation Summary

## ✅ What Was Completed

### 1. Generation Tools Created
- ✅ **`generate_intents.js`** - Node.js script for generating intents programmatically
- ✅ **`expand_intents.py`** - Python script for expanding dataset incrementally
- ✅ Both scripts support:
  - Generating intents for a single symptom: `--add-symptom "ปวดหัว" --count 12`
  - Expanding all symptoms: `--expand-all`
  - Automatic intent_id generation
  - Clinical modifier application

### 2. Backend Enhancements
- ✅ Enhanced `intent_loader.js` with:
  - Confidence weight extraction
  - OTC group mapping
  - Self-care group mapping
  - Primary symptom indexing
  - Emergency detection

### 3. Documentation
- ✅ **`NEXT_STEPS.md`** - Complete roadmap for expanding to 700 intents
- ✅ **`README_SYMPTOM_INTENTS.md`** - Schema documentation
- ✅ Generation scripts with usage examples

## 🚀 Ready to Use

### Quick Start: Expand Dataset

```bash
# Generate intents for one symptom
cd backend
python scripts/expand_intents.py --add-symptom "ปวดหัว" --count 12

# Generate for all primary symptoms (100-150 intents)
python scripts/expand_intents.py --expand-all

# Use Node.js alternative
node scripts/generate_intents.js --expand-all
```

### Current Status

- **Base Dataset**: 3 example intents (HEADACHE_001, HEADACHE_003, HEADACHE_005)
- **Expanded Dataset**: 15 intents for "ปวดหัว" (ready to merge)
- **Target**: 700 intents covering all symptom categories

## 📋 Next Actions

### Immediate (Today)
1. **Review Generated Intents**: Check `data/symptom_intents_expanded.json`
2. **Merge to Master**: Copy expanded intents to `symptom_intents_master.json`
3. **Test Flutter App**: Ensure app loads and displays new intents correctly

### Short-term (This Week)
1. **Expand High-Priority Symptoms**:
   - ไอ (cough) - 12 intents
   - เจ็บหน้าอก (chest pain) - 12 intents
   - ปวดท้อง (abdominal pain) - 12 intents
   - หายใจลำบาก (breathing difficulty) - 12 intents

2. **Medical Review**: 
   - Export CSV for medical professionals
   - Review red-flag questions
   - Verify emergency logic
   - Check OTC recommendations

### Medium-term (Next 2-4 Weeks)
1. **Generate Full 700-Intent Dataset**:
   - Use Cursor prompt provided by user
   - Generate in batches of 100-150
   - Review each batch before proceeding

2. **Backend Integration**:
   - Use confidence weights in triage logic
   - Map OTC groups to actual medications
   - Use clinical context (severity, time-course) in decisions

3. **Performance Testing**:
   - Test loading time with 700 intents
   - Optimize search if needed
   - Monitor memory usage

## 🛠️ Tools Available

### Generation Scripts
- **Python**: `backend/scripts/expand_intents.py` (recommended)
- **Node.js**: `backend/scripts/generate_intents.js`

### Data Files
- **CSV**: `backend/data/symptom_intents_master.csv` (for medical review)
- **JSON**: `backend/data/symptom_intents_master.json` (for app/backend)
- **Expanded**: `backend/data/symptom_intents_expanded.json` (newly generated)

### Documentation
- **Schema**: `backend/data/README_SYMPTOM_INTENTS.md`
- **Roadmap**: `backend/scripts/NEXT_STEPS.md`

## 📊 Progress Tracking

| Category | Target | Current | Progress |
|----------|--------|---------|----------|
| Neurology | 40-48 | 15 | 31-38% |
| Respiratory | 20-24 | 0 | 0% |
| Cardiology | 20-24 | 0 | 0% |
| GI | 40-48 | 0 | 0% |
| ENT/Oral | 60-72 | 0 | 0% |
| Musculoskeletal | 50-60 | 0 | 0% |
| General/Infection | 50-60 | 0 | 0% |
| **Total** | **700** | **15** | **2%** |

## 🎯 Success Criteria

- [ ] 700 intents generated (±5%)
- [ ] All intents medically reviewed
- [ ] 100% have red-flag questions
- [ ] Emergency intents properly flagged
- [ ] OTC groups validated
- [ ] App loads intents < 100ms
- [ ] Search works < 50ms
- [ ] Backend uses intent data in triage

## 💡 Tips

1. **Incremental Expansion**: Don't try to generate all 700 at once. Expand gradually, review, then continue.

2. **Medical Review**: Every batch should be reviewed before marking as `active`.

3. **Testing**: Test app after each expansion to catch issues early.

4. **Version Control**: Keep track of changes in `notes_medical` field.

5. **Backward Compatibility**: System falls back to legacy if intents fail to load, so safe to experiment.
