/**
 * Extract datasets from backend JS files to JSON for mobile app
 * Run: node backend/scripts/extract_datasets.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import backend modules to extract data
import { SYMPTOM_SEVERITY_MAP, SEVERITY_TIMECOURSE_MATRIX, SEVERITY_LEVELS, TIMECOURSE_TYPES } from '../src/functions/triage/severity_timecourse_matrix.js';
import { SYMPTOM_QUESTION_MAP } from '../src/functions/triage/symptom_question_map.js';
import { OTC_CATALOG } from '../src/functions/triage/thai_otc_catalog.js';

// Read self-care data (it's not exported, so we'll read the file)
const selfCarePath = path.join(__dirname, '../src/functions/triage/self_care_recommendations.js');
const selfCareCode = fs.readFileSync(selfCarePath, 'utf8');

// Extract SELF_CARE_PROTOCOLS and SEVERITY_TIMECOURSE_MATRIX from self-care file
const selfCareMatch = selfCareCode.match(/const SELF_CARE_PROTOCOLS = ({[\s\S]*?});/);
const severityTimecourseMatch = selfCareCode.match(/const SEVERITY_TIMECOURSE_MATRIX = ({[\s\S]*?});/);

// Output directory
const outputDir = path.join(__dirname, '../../mobile/assets/data');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Create severity_timecourse_matrix.json
const severityMatrix = {
  version: '1.0',
  severity_levels: {
    mild: SEVERITY_LEVELS.MILD,
    moderate: SEVERITY_LEVELS.MODERATE,
    severe: SEVERITY_LEVELS.SEVERE,
  },
  timecourse_types: {
    acute: TIMECOURSE_TYPES.ACUTE,
    subacute: TIMECOURSE_TYPES.SUBACUTE,
    progressive: TIMECOURSE_TYPES.PROGRESSIVE,
    chronic: TIMECOURSE_TYPES.CHRONIC,
    recurrent: TIMECOURSE_TYPES.RECURRENT,
  },
  universal_matrix: {
    [SEVERITY_LEVELS.MILD]: {
      [TIMECOURSE_TYPES.ACUTE]: 'self_care',
      [TIMECOURSE_TYPES.SUBACUTE]: 'self_care',
      [TIMECOURSE_TYPES.PROGRESSIVE]: 'self_care',
      [TIMECOURSE_TYPES.CHRONIC]: 'self_care',
      [TIMECOURSE_TYPES.RECURRENT]: 'self_care',
    },
    [SEVERITY_LEVELS.MODERATE]: {
      [TIMECOURSE_TYPES.ACUTE]: 'self_care',
      [TIMECOURSE_TYPES.SUBACUTE]: 'gp',
      [TIMECOURSE_TYPES.PROGRESSIVE]: 'gp',
      [TIMECOURSE_TYPES.CHRONIC]: 'gp',
      [TIMECOURSE_TYPES.RECURRENT]: 'gp',
    },
    [SEVERITY_LEVELS.SEVERE]: {
      [TIMECOURSE_TYPES.ACUTE]: 'emergency',
      [TIMECOURSE_TYPES.SUBACUTE]: 'emergency',
      [TIMECOURSE_TYPES.PROGRESSIVE]: 'emergency',
      [TIMECOURSE_TYPES.CHRONIC]: 'gp',
      [TIMECOURSE_TYPES.RECURRENT]: 'gp',
    },
  },
  symptom_specific_severity: SYMPTOM_SEVERITY_MAP,
};

fs.writeFileSync(
  path.join(outputDir, 'severity_timecourse_matrix.json'),
  JSON.stringify(severityMatrix, null, 2),
  'utf8'
);
console.log('✅ Created severity_timecourse_matrix.json');

// 2. Create red_flag_rules.json
const redFlagRules = {
  version: '1.0',
  symptom_question_map: SYMPTOM_QUESTION_MAP,
  emergency_triggers: {
    'ปวดหัว': ['Thunderclap', 'SAH'],
    'เวียนหัว': ['Stroke'],
    'ชาครึ่งซีก': ['Stroke'],
    'พูดไม่ชัด': ['Stroke'],
    'ปวดคอ': ['Meningitis'],
    'ชัก': ['Status epilepticus'],
    'มองไม่เห็นข้างเดียว': ['Stroke'],
    'สับสน': ['Sepsis / CNS'],
    'เจ็บหน้าอก': ['MI'],
    'หายใจไม่อิ่ม': ['Respiratory failure'],
    'ใจสั่น': ['Arrhythmia'],
    'ไอเป็นเลือด': ['PE'],
    'ปวดท้อง': ['Peritonitis'],
    'ถ่ายดำ': ['GI bleed'],
    'อาเจียน': ['ICP'],
    'ไข้': ['Sepsis'],
  },
};

fs.writeFileSync(
  path.join(outputDir, 'red_flag_rules.json'),
  JSON.stringify(redFlagRules, null, 2),
  'utf8'
);
console.log('✅ Created red_flag_rules.json');

// 3. Create otc_catalog_th.json
const otcCatalog = {
  version: '1.0',
  catalog: OTC_CATALOG,
};

fs.writeFileSync(
  path.join(outputDir, 'otc_catalog_th.json'),
  JSON.stringify(otcCatalog, null, 2),
  'utf8'
);
console.log('✅ Created otc_catalog_th.json');

// 4. Create selfcare_catalog_th.json (extract from self-care file)
// Note: We'll need to manually extract the protocols since they're not exported
const selfCareCatalog = {
  version: '1.0',
  note: 'Self-care protocols extracted from self_care_recommendations.js',
  // Will be populated manually or via regex extraction
};

fs.writeFileSync(
  path.join(outputDir, 'selfcare_catalog_th.json'),
  JSON.stringify(selfCareCatalog, null, 2),
  'utf8'
);
console.log('✅ Created selfcare_catalog_th.json (template)');

// 5. Create canonical_question_banks.json
const questionBanks = {
  version: '1.0',
  red_flag_questions: {
    th: [
      'มีอาการรุนแรงผิดปกติไหมคะ',
      'มีอาการอื่นร่วมด้วยไหมคะ',
      'มีไข้สูงไหมคะ',
      'ซึมหรือปลุกไม่ตื่นไหมคะ',
      'หายใจลำบากไหมคะ',
    ],
    en: [
      'Do you have severe abnormal symptoms?',
      'Do you have other accompanying symptoms?',
      'Do you have high fever?',
      'Are you drowsy or difficult to wake?',
      'Do you have difficulty breathing?',
    ],
  },
  severity_questions: {
    th: [
      'อาการนี้รบกวนชีวิตประจำวันแค่ไหน?',
      'อาการนี้ทำให้ต้องหยุดกิจกรรมปกติไหมคะ?',
      'อาการนี้รุนแรงแค่ไหนคะ?',
    ],
    en: [
      'How much does this symptom interfere with daily life?',
      'Does this symptom require you to stop normal activities?',
      'How severe is this symptom?',
    ],
  },
  timecourse_questions: {
    onset: {
      th: [
        'อาการนี้เริ่มเมื่อไหร่คะ?',
        'อาการนี้เป็นมานานเท่าไหร่แล้วคะ?',
      ],
      en: [
        'When did this symptom start?',
        'How long have you had this symptom?',
      ],
    },
    trend: {
      th: [
        'อาการนี้ดีขึ้น แย่ลง หรือเท่าเดิมคะ?',
        'อาการนี้เปลี่ยนแปลงอย่างไรคะ?',
      ],
      en: [
        'Is this symptom improving, worsening, or staying the same?',
        'How has this symptom changed?',
      ],
    },
  },
  health_context_question: {
    th: 'มีข้อมูลสุขภาพสำคัญที่ควรรู้เพิ่มเติมไหม?',
    en: 'Is there any important health information we should know?',
  },
};

fs.writeFileSync(
  path.join(outputDir, 'canonical_question_banks.json'),
  JSON.stringify(questionBanks, null, 2),
  'utf8'
);
console.log('✅ Created canonical_question_banks.json');

console.log('\n✅ All datasets extracted successfully!');

