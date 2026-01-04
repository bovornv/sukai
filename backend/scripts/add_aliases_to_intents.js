/**
 * Add aliases to high-frequency symptom intents
 * Run: node backend/scripts/add_aliases_to_intents.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common aliases for top symptoms
const ALIASES_MAP = {
  'ปวดหัว': {
    th: ['ปวดศีรษะ', 'หัวปวด', 'ปวดหัวมาก', 'ปวดหัวตุบๆ', 'ปวดหัวข้างเดียว', 'ปวดหัวสองข้าง'],
    en: ['headache', 'head pain', 'head ache', 'migraine', 'one-sided headache']
  },
  'ไอ': {
    th: ['ไอแห้ง', 'ไอมีเสมหะ', 'ไอถี่', 'ไอมาก', 'ไอเรื้อรัง'],
    en: ['cough', 'dry cough', 'coughing', 'persistent cough']
  },
  'เจ็บหน้าอก': {
    th: ['แน่นหน้าอก', 'เจ็บอก', 'เจ็บหน้าอกรุนแรง', 'เจ็บหน้าอกตอนหายใจ'],
    en: ['chest pain', 'chest tightness', 'chest discomfort', 'painful chest']
  },
  'ปวดท้อง': {
    th: ['ปวดท้องมาก', 'ปวดท้องน้อย', 'ปวดท้องส่วนบน', 'ปวดท้องส่วนล่าง', 'ท้องปวด'],
    en: ['abdominal pain', 'stomach pain', 'belly ache', 'stomachache']
  },
  'เวียนหัว': {
    th: ['บ้านหมุน', 'เวียนหัวหมุน', 'มึนหัว', 'เวียนหัวมาก'],
    en: ['dizziness', 'vertigo', 'dizzy', 'lightheaded']
  },
  'ปวดหลัง': {
    th: ['ปวดหลังมาก', 'ปวดหลังส่วนล่าง', 'ปวดหลังส่วนบน', 'หลังปวด'],
    en: ['back pain', 'lower back pain', 'upper back pain', 'backache']
  },
  'ท้องเสีย': {
    th: ['ถ่ายเหลว', 'ท้องร่วง', 'ถ่ายบ่อย', 'ท้องเสียมาก'],
    en: ['diarrhea', 'loose stool', 'frequent bowel movements', 'diarrhoea']
  },
  'หายใจลำบาก': {
    th: ['หายใจไม่อิ่ม', 'หอบ', 'หายใจไม่สะดวก', 'หายใจติดขัด'],
    en: ['difficulty breathing', 'shortness of breath', 'breathlessness', 'dyspnea']
  },
  'ไข้': {
    th: ['ไข้สูง', 'ไข้ต่ำ', 'มีไข้', 'ตัวร้อน'],
    en: ['fever', 'high fever', 'low-grade fever', 'temperature']
  },
  'เจ็บคอ': {
    th: ['เจ็บคอมาก', 'คอเจ็บ', 'ระคายคอ', 'เจ็บคอเวลากลืน'],
    en: ['sore throat', 'throat pain', 'throat irritation', 'painful throat']
  },
  'คลื่นไส้': {
    th: ['รู้สึกคลื่นไส้', 'อยากอาเจียน', 'มวนท้อง'],
    en: ['nausea', 'feeling nauseous', 'queasy', 'sick to stomach']
  },
  'ใจสั่น': {
    th: ['หัวใจเต้นเร็ว', 'ใจหวิว', 'ใจเต้นแรง'],
    en: ['palpitations', 'rapid heartbeat', 'heart racing', 'irregular heartbeat']
  },
  'ปวดฟัน': {
    th: ['ฟันปวด', 'ปวดฟันมาก', 'ปวดฟันรุนแรง'],
    en: ['toothache', 'tooth pain', 'dental pain', 'tooth hurt']
  },
  'อาเจียน': {
    th: ['อาเจียนมาก', 'อาเจียนบ่อย', 'อ้วก'],
    en: ['vomiting', 'throwing up', 'nausea and vomiting', 'emesis']
  },
  'ปวดคอ': {
    th: ['คอปวด', 'ปวดคอมาก', 'คอตึง'],
    en: ['neck pain', 'sore neck', 'neck stiffness', 'painful neck']
  },
  'หน้ามืด': {
    th: ['รู้สึกหน้ามืด', 'หน้ามืดเป็นลม', 'มึนหัว'],
    en: ['lightheaded', 'feeling faint', 'dizzy', 'woozy']
  },
  'เป็นลม': {
    th: ['หมดสติ', 'เป็นลมหมดสติ', 'ล้มหมดสติ'],
    en: ['fainting', 'syncope', 'passing out', 'loss of consciousness']
  },
  'คัดจมูก': {
    th: ['จมูกตัน', 'หายใจไม่สะดวก', 'จมูกอุดตัน'],
    en: ['nasal congestion', 'stuffy nose', 'blocked nose', 'congested']
  },
  'คัน': {
    th: ['คันมาก', 'คันทั้งตัว', 'คันผิวหนัง'],
    en: ['itching', 'itchy', 'pruritus', 'skin irritation']
  },
  'ชัก': {
    th: ['ชักมาก', 'ชักไม่หยุด', 'ชักรุนแรง'],
    en: ['seizure', 'convulsion', 'epileptic fit', 'seizure activity']
  }
};

// Load JSON file
const jsonPath = path.join(__dirname, '../data/symptom_intents_master.json');
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let updatedCount = 0;

// Add aliases to intents
for (const intent of jsonData.intents) {
  const primarySymptom = intent.primary_symptom;
  
  if (ALIASES_MAP[primarySymptom]) {
    // Only add if aliases don't already exist
    if (!intent.aliases_th && !intent.aliases_en) {
      intent.aliases_th = ALIASES_MAP[primarySymptom].th;
      intent.aliases_en = ALIASES_MAP[primarySymptom].en;
      updatedCount++;
    }
  }
}

// Save updated JSON
fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');

console.log(`✅ Added aliases to ${updatedCount} intents`);
console.log(`📝 Updated: ${jsonPath}`);

// Also update mobile version
const mobileJsonPath = path.join(__dirname, '../../mobile/assets/data/symptom_intents_master.json');
if (fs.existsSync(mobileJsonPath)) {
  fs.writeFileSync(mobileJsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
  console.log(`✅ Updated mobile version: ${mobileJsonPath}`);
}

