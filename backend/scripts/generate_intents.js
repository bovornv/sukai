/**
 * Intent Generation Helper Script
 * 
 * Helps generate symptom intents following the 700-intent schema
 * Can be used to expand the dataset incrementally
 * 
 * Usage:
 *   node scripts/generate_intents.js --primary "ปวดหัว" --count 12
 *   node scripts/generate_intents.js --expand-all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Primary symptoms organized by body system
const PRIMARY_SYMPTOMS = {
  neurology: [
    'ปวดหัว', 'เวียนหัว', 'หน้ามืด', 'เป็นลม',
  ],
  respiratory: [
    'ไอ', 'หายใจลำบาก', 'หายใจหอบ', 'หายใจไม่อิ่ม',
  ],
  cardiology: [
    'เจ็บหน้าอก', 'ใจสั่น',
  ],
  gastrointestinal: [
    'ปวดท้อง', 'ท้องเสีย', 'ท้องผูก', 'คลื่นไส้', 'อาเจียน',
  ],
  ent_oral: [
    'เจ็บคอ', 'ปวดฟัน', 'หูอื้อ', 'ปวดหู', 'น้ำมูกไหล', 'คัดจมูก',
  ],
  musculoskeletal: [
    'ปวดหลัง', 'ปวดคอ', 'ปวดบ่า', 'ปวดข้อ', 'ปวดเมื่อย',
  ],
  general_infection: [
    'ไข้', 'อ่อนเพลีย', 'ผื่น', 'บวม', 'หน้าบวม', 'ตาแดง', 'คัน',
  ],
  neurological: [
    'เดินเซ', 'ชา', 'ชัก',
  ],
  other: [
    'เลือดออก', 'แผล', 'น้ำร้อนลวก', 'แผลไหม้', 'นอนไม่หลับ', 'ปวดตา',
  ],
};

// Clinical modifiers templates
const MODIFIERS = {
  severity: ['mild', 'moderate', 'severe'],
  timeCourse: ['acute', 'subacute', 'chronic', 'progressive'],
  location: {
    'ปวดหัว': ['one_side', 'two_sides', 'whole_head', 'radiating_neck'],
    'ปวดท้อง': ['upper_right', 'upper_left', 'lower_right', 'lower_left', 'epigastric', 'whole_abdomen'],
    'เจ็บหน้าอก': ['left_side', 'center', 'radiating_arm', 'radiating_jaw'],
    'ปวดหลัง': ['upper_back', 'lower_back', 'radiating_leg'],
    'ปวดข้อ': ['knee', 'multiple_joints', 'single_joint'],
  },
  trigger: {
    'ปวดหัว': ['morning', 'sleep_deprivation', 'alcohol', 'stress', 'trauma'],
    'ปวดท้อง': ['after_food', 'fasting', 'menstrual'],
    'เจ็บหน้าอก': ['at_rest', 'on_exertion', 'after_meal'],
    'เวียนหัว': ['on_standing', 'position_change'],
  },
  associated: {
    'ปวดหัว': ['อาเจียน', 'ตาพร่า', 'คอแข็ง', 'ไข้'],
    'ไอ': ['เจ็บหน้าอก', 'เจ็บคอ', 'หายใจหอบ', 'ไข้'],
    'ปวดท้อง': ['ไข้', 'อาเจียน', 'ท้องเสีย'],
    'เจ็บหน้าอก': ['เหงื่อออก', 'หายใจลำบาก'],
  },
};

// Red-flag question templates by primary symptom
const RED_FLAG_QUESTIONS = {
  'ปวดหัว': {
    th: 'ปวดหัวรุนแรงที่สุดในชีวิตหรือเกิดขึ้นทันทีไหมคะ?',
    en: 'Is this the worst headache of your life or sudden onset?',
  },
  'เวียนหัว': {
    th: 'มีอาการอ่อนแรง แขนขาชา หรือพูดไม่ชัดร่วมด้วยไหมคะ?',
    en: 'Do you have weakness, numbness, or slurred speech?',
  },
  'เจ็บหน้าอก': {
    th: 'เจ็บหน้าอกรุนแรงทันทีหรือร้าวไปแขนซ้ายไหมคะ?',
    en: 'Is the chest pain sudden and severe or radiating to left arm?',
  },
  'หายใจลำบาก': {
    th: 'หายใจลำบากมากหรือมีอาการเขียวคล้ำไหมคะ?',
    en: 'Is breathing severely difficult or are you turning blue?',
  },
  'ปวดท้อง': {
    th: 'ปวดท้องรุนแรงมากหรือมีไข้สูงร่วมด้วยไหมคะ?',
    en: 'Is the abdominal pain severe or accompanied by high fever?',
  },
  'ไอ': {
    th: 'ไอเป็นเลือดหรือหายใจลำบากมากไหมคะ?',
    en: 'Are you coughing blood or having severe breathing difficulty?',
  },
};

/**
 * Generate intent ID from primary symptom and index
 */
function generateIntentId(primarySymptom, index) {
  const prefix = primarySymptom
    .replace(/[^\u0E00-\u0E7F]/g, '') // Remove non-Thai chars
    .toUpperCase()
    .replace(/\s+/g, '_')
    .substring(0, 10);
  
  // Map common Thai symptoms to English prefixes
  const prefixMap = {
    'ปวดหัว': 'HEADACHE',
    'เวียนหัว': 'DIZZINESS',
    'หน้ามืด': 'FAINTNESS',
    'เป็นลม': 'SYNCOPE',
    'ไอ': 'COUGH',
    'หายใจลำบาก': 'DYSPNEA',
    'เจ็บหน้าอก': 'CHEST_PAIN',
    'ใจสั่น': 'PALPITATION',
    'ปวดท้อง': 'ABDOMINAL_PAIN',
    'ท้องเสีย': 'DIARRHEA',
    'คลื่นไส้': 'NAUSEA',
    'อาเจียน': 'VOMITING',
    'เจ็บคอ': 'SORE_THROAT',
    'ปวดฟัน': 'TOOTHACHE',
    'ปวดหลัง': 'BACK_PAIN',
    'ไข้': 'FEVER',
  };
  
  const mappedPrefix = prefixMap[primarySymptom] || prefix;
  return `${mappedPrefix}_${String(index).padStart(3, '0')}`;
}

/**
 * Generate display text from modifiers
 */
function generateDisplayText(primarySymptom, modifiers, language) {
  const th = language === 'th';
  
  // Base text
  let text = primarySymptom;
  
  // Add location modifier
  if (modifiers.location) {
    const locationMap = {
      one_side: th ? 'ข้างเดียว' : 'one-sided',
      two_sides: th ? 'สองข้าง' : 'bilateral',
      whole_head: th ? 'ทั้งหัว' : 'whole head',
      upper_right: th ? 'ขวาบน' : 'upper right',
      lower_right: th ? 'ขวาล่าง' : 'lower right',
      lower_back: th ? 'ส่วนล่าง' : 'lower back',
    };
    text = `${text} ${locationMap[modifiers.location] || modifiers.location}`;
  }
  
  // Add severity modifier
  if (modifiers.severity === 'severe') {
    text = th ? `${text}รุนแรง` : `severe ${text}`;
  } else if (modifiers.severity === 'mild') {
    text = th ? `${text}เล็กน้อย` : `mild ${text}`;
  }
  
  // Add time course modifier
  if (modifiers.timeCourse === 'acute') {
    text = th ? `${text}ทันที` : `sudden ${text}`;
  } else if (modifiers.timeCourse === 'chronic') {
    text = th ? `${text}เรื้อรัง` : `chronic ${text}`;
  } else if (modifiers.timeCourse === 'progressive') {
    text = th ? `${text}มากขึ้นเรื่อย ๆ` : `worsening ${text}`;
  }
  
  // Add associated symptoms
  if (modifiers.associated && modifiers.associated.length > 0) {
    const associatedText = modifiers.associated.join(th ? ' ' : ' ');
    text = th ? `${text}ร่วมกับ${associatedText}` : `${text} with ${associatedText}`;
  }
  
  return text;
}

/**
 * Generate a single intent
 */
function generateIntent(primarySymptom, index, modifiers = {}) {
  const intentId = generateIntentId(primarySymptom, index);
  const bodySystem = Object.keys(PRIMARY_SYMPTOMS).find(system =>
    PRIMARY_SYMPTOMS[system].includes(primarySymptom)
  ) || 'general';
  
  const severity = modifiers.severity || 'moderate';
  const timeCourse = modifiers.timeCourse || 'acute';
  const location = modifiers.location || null;
  const trigger = modifiers.trigger || null;
  const associated = modifiers.associated || [];
  
  // Determine emergency level
  const isEmergency = severity === 'severe' && timeCourse === 'acute';
  const emergencyLevel = isEmergency ? 'immediate' : (severity === 'severe' ? 'urgent' : 'none');
  const triageIfNo = isEmergency ? null : (severity === 'mild' ? 'self_care' : 'gp');
  
  // Confidence weight
  const confidenceWeight = isEmergency ? 0.12 + Math.random() * 0.03 : 
                          severity === 'severe' ? 0.08 + Math.random() * 0.02 :
                          0.03 + Math.random() * 0.03;
  
  // Red flag question
  const redFlagQ = RED_FLAG_QUESTIONS[primarySymptom] || {
    th: 'มีอาการรุนแรงหรือฉุกเฉินไหมคะ?',
    en: 'Are there severe or emergency symptoms?',
  };
  
  // OTC and self-care groups
  const otcGroup = severity === 'mild' && !isEmergency ? ['analgesic_basic'] : [];
  const selfCareGroup = ['rest_hydration'];
  
  const displayTh = generateDisplayText(primarySymptom, modifiers, 'th');
  const displayEn = generateDisplayText(primarySymptom, modifiers, 'en');
  
  return {
    intent_id: intentId,
    primary_symptom: primarySymptom,
    display_text_th: displayTh,
    display_text_en: displayEn,
    body_system: bodySystem,
    severity_level: severity,
    time_course: timeCourse,
    location: location,
    trigger: trigger,
    associated_symptoms: associated.join('|'),
    red_flag_question_th: redFlagQ.th,
    red_flag_question_en: redFlagQ.en,
    red_flag_if_yes: isEmergency,
    emergency_level: emergencyLevel,
    triage_if_no: triageIfNo,
    confidence_weight: parseFloat(confidenceWeight.toFixed(3)),
    otc_group: otcGroup.join(','),
    self_care_group: selfCareGroup.join(','),
    contraindications: '',
    age_min: 18,
    age_max: 99,
    requires_health_profile: isEmergency || severity === 'severe',
    notes_medical: `Generated intent for ${primarySymptom}`,
    status: 'active',
  };
}

/**
 * Generate intents for a primary symptom
 */
function generateIntentsForSymptom(primarySymptom, count = 12) {
  const intents = [];
  const availableModifiers = {
    severity: MODIFIERS.severity,
    timeCourse: MODIFIERS.timeCourse,
    location: MODIFIERS.location[primarySymptom] || [],
    trigger: MODIFIERS.trigger[primarySymptom] || [],
    associated: MODIFIERS.associated[primarySymptom] || [],
  };
  
  // Generate base variations
  for (let i = 0; i < count; i++) {
    const modifiers = {
      severity: availableModifiers.severity[i % availableModifiers.severity.length],
      timeCourse: availableModifiers.timeCourse[i % availableModifiers.timeCourse.length],
      location: availableModifiers.location.length > 0 
        ? availableModifiers.location[i % availableModifiers.location.length] 
        : null,
      trigger: availableModifiers.trigger.length > 0 && i % 3 === 0
        ? availableModifiers.trigger[i % availableModifiers.trigger.length]
        : null,
      associated: i % 4 === 0 && availableModifiers.associated.length > 0
        ? [availableModifiers.associated[i % availableModifiers.associated.length]]
        : [],
    };
    
    intents.push(generateIntent(primarySymptom, i + 1, modifiers));
  }
  
  return intents;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--expand-all')) {
    // Generate intents for all primary symptoms
    const allIntents = [];
    let globalIndex = 1;
    
    for (const [system, symptoms] of Object.entries(PRIMARY_SYMPTOMS)) {
      for (const symptom of symptoms) {
        const intents = generateIntentsForSymptom(symptom, 10);
        allIntents.push(...intents);
      }
    }
    
    console.log(`Generated ${allIntents.length} intents`);
    
    // Write to CSV
    const csvPath = path.join(__dirname, '../data/symptom_intents_generated.csv');
    const headers = Object.keys(allIntents[0]).join(',');
    const rows = allIntents.map(intent => Object.values(intent).map(v => 
      typeof v === 'string' && v.includes(',') ? `"${v}"` : v
    ).join(','));
    
    fs.writeFileSync(csvPath, [headers, ...rows].join('\n'), 'utf8');
    console.log(`Written to ${csvPath}`);
    
  } else if (args.includes('--primary')) {
    const primaryIndex = args.indexOf('--primary');
    const primarySymptom = args[primaryIndex + 1];
    const countIndex = args.indexOf('--count');
    const count = countIndex >= 0 ? parseInt(args[countIndex + 1]) : 12;
    
    if (!primarySymptom) {
      console.error('Usage: node generate_intents.js --primary "ปวดหัว" --count 12');
      process.exit(1);
    }
    
    const intents = generateIntentsForSymptom(primarySymptom, count);
    console.log(JSON.stringify(intents, null, 2));
    
  } else {
    console.log('Usage:');
    console.log('  node generate_intents.js --primary "ปวดหัว" --count 12');
    console.log('  node generate_intents.js --expand-all');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateIntent, generateIntentsForSymptom, PRIMARY_SYMPTOMS };
