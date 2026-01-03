/**
 * Body-Part Localized Red-Flag Mapping
 * 
 * CRITICAL SAFETY FEATURE: Location-specific emergency detection
 * 
 * Purpose:
 * - Detect life-threatening conditions specific to each body part
 * - Operate automatically after body-part clarification
 * - Similar to ER triage nurse + on-call physician reasoning
 * 
 * Principle:
 * Each body part has its own red-flag set:
 * - High-risk
 * - Low-frequency
 * - High-consequence
 * - Detectable via simple binary questions
 */

import { normalizeThaiText } from './thai_normalizer.js';

/**
 * Body-part → Red-flag question mapping
 * Each body part has 1-3 critical red-flag questions
 * Questions are binary (ใช่/ไม่ใช่) and non-technical
 */
export const BODY_PART_RED_FLAGS = {
  // Head / Neurologic
  'head': {
    questions: [
      {
        text: 'ปวดศีรษะรุนแรงที่สุดในชีวิตหรือปวดร่วมกับแขนขาอ่อนแรง พูดไม่ชัดไหมคะ',
        key: 'head_severe_neurologic',
        emergencyIf: true,
      },
      {
        text: 'มีอาการหมดสติ ชัก หรือคอแข็งไหมคะ',
        key: 'head_consciousness_meningeal',
        emergencyIf: true,
      },
    ],
  },
  'ศีรษะ': {
    questions: [
      {
        text: 'ปวดศีรษะรุนแรงที่สุดในชีวิตหรือปวดร่วมกับแขนขาอ่อนแรง พูดไม่ชัดไหมคะ',
        key: 'head_severe_neurologic',
        emergencyIf: true,
      },
      {
        text: 'มีอาการหมดสติ ชัก หรือคอแข็งไหมคะ',
        key: 'head_consciousness_meningeal',
        emergencyIf: true,
      },
    ],
  },
  
  // Chest / Cardiac / Respiratory
  'chest': {
    questions: [
      {
        text: 'เจ็บแน่นอกรุนแรงหรือร้าวไปแขนซ้าย กราม หรือหลังไหมคะ',
        key: 'chest_cardiac_radiation',
        emergencyIf: true,
      },
      {
        text: 'เจ็บอกร่วมกับหายใจลำบาก เหนื่อยเฉียบพลัน หรือเหงื่อออกมากไหมคะ',
        key: 'chest_respiratory_distress',
        emergencyIf: true,
      },
      {
        text: 'เจ็บอกขณะพักหรือเจ็บรุนแรงทันทีไหมคะ',
        key: 'chest_rest_pain',
        emergencyIf: true,
      },
    ],
  },
  'หน้าอก': {
    questions: [
      {
        text: 'เจ็บแน่นอกรุนแรงหรือร้าวไปแขนซ้าย กราม หรือหลังไหมคะ',
        key: 'chest_cardiac_radiation',
        emergencyIf: true,
      },
      {
        text: 'เจ็บอกร่วมกับหายใจลำบาก เหนื่อยเฉียบพลัน หรือเหงื่อออกมากไหมคะ',
        key: 'chest_respiratory_distress',
        emergencyIf: true,
      },
      {
        text: 'เจ็บอกขณะพักหรือเจ็บรุนแรงทันทีไหมคะ',
        key: 'chest_rest_pain',
        emergencyIf: true,
      },
    ],
  },
  'อก': {
    questions: [
      {
        text: 'เจ็บแน่นอกรุนแรงหรือร้าวไปแขนซ้าย กราม หรือหลังไหมคะ',
        key: 'chest_cardiac_radiation',
        emergencyIf: true,
      },
      {
        text: 'เจ็บอกร่วมกับหายใจลำบาก เหนื่อยเฉียบพลัน หรือเหงื่อออกมากไหมคะ',
        key: 'chest_respiratory_distress',
        emergencyIf: true,
      },
    ],
  },
  'หัวใจ': {
    questions: [
      {
        text: 'เจ็บแน่นอกรุนแรงหรือร้าวไปแขนซ้าย กราม หรือหลังไหมคะ',
        key: 'chest_cardiac_radiation',
        emergencyIf: true,
      },
      {
        text: 'เจ็บอกร่วมกับหายใจลำบาก เหนื่อยเฉียบพลัน หรือเหงื่อออกมากไหมคะ',
        key: 'chest_respiratory_distress',
        emergencyIf: true,
      },
    ],
  },
  
  // Abdomen
  'abdomen': {
    questions: [
      {
        text: 'ปวดท้องรุนแรงเฉียบพลันหรือกดเจ็บมาก ท้องแข็งไหมคะ',
        key: 'abdomen_severe_peritonitis',
        emergencyIf: true,
      },
      {
        text: 'ปวดร่วมกับอาเจียนเป็นเลือด ถ่ายเป็นเลือด หรือถ่ายดำไหมคะ',
        key: 'abdomen_bleeding',
        emergencyIf: true,
      },
      {
        text: 'ปวดท้องร่วมกับไข้สูง หนาวสั่น หรือซึมไหมคะ',
        key: 'abdomen_sepsis',
        emergencyIf: true,
      },
    ],
  },
  'ท้อง': {
    questions: [
      {
        text: 'ปวดท้องรุนแรงเฉียบพลันหรือกดเจ็บมาก ท้องแข็งไหมคะ',
        key: 'abdomen_severe_peritonitis',
        emergencyIf: true,
      },
      {
        text: 'ปวดร่วมกับอาเจียนเป็นเลือด ถ่ายเป็นเลือด หรือถ่ายดำไหมคะ',
        key: 'abdomen_bleeding',
        emergencyIf: true,
      },
      {
        text: 'ปวดท้องร่วมกับไข้สูง หนาวสั่น หรือซึมไหมคะ',
        key: 'abdomen_sepsis',
        emergencyIf: true,
      },
    ],
  },
  'ท้องบน': {
    questions: [
      {
        text: 'ปวดท้องรุนแรงเฉียบพลันหรือกดเจ็บมาก ท้องแข็งไหมคะ',
        key: 'abdomen_severe_peritonitis',
        emergencyIf: true,
      },
      {
        text: 'ปวดร่วมกับอาเจียนเป็นเลือด ถ่ายเป็นเลือด หรือถ่ายดำไหมคะ',
        key: 'abdomen_bleeding',
        emergencyIf: true,
      },
    ],
  },
  'ท้องล่าง': {
    questions: [
      {
        text: 'ปวดท้องรุนแรงเฉียบพลันหรือกดเจ็บมาก ท้องแข็งไหมคะ',
        key: 'abdomen_severe_peritonitis',
        emergencyIf: true,
      },
      {
        text: 'ปวดร่วมกับอาเจียนเป็นเลือด ถ่ายเป็นเลือด หรือถ่ายดำไหมคะ',
        key: 'abdomen_bleeding',
        emergencyIf: true,
      },
      {
        text: 'ปวดท้องน้อยร่วมกับไข้สูงหรือปัสสาวะแสบมากไหมคะ',
        key: 'abdomen_uti_sepsis',
        emergencyIf: true,
      },
    ],
  },
  
  // Back
  'back': {
    questions: [
      {
        text: 'ปวดหลังรุนแรงเฉียบพลันหรือปวดร่วมกับแขนขาอ่อนแรง ชาไหมคะ',
        key: 'back_severe_neurologic',
        emergencyIf: true,
      },
      {
        text: 'ปวดหลังร่วมกับไข้สูง หนาวสั่น หรือปัสสาวะแสบมากไหมคะ',
        key: 'back_infection',
        emergencyIf: true,
      },
    ],
  },
  'หลัง': {
    questions: [
      {
        text: 'ปวดหลังรุนแรงเฉียบพลันหรือปวดร่วมกับแขนขาอ่อนแรง ชาไหมคะ',
        key: 'back_severe_neurologic',
        emergencyIf: true,
      },
      {
        text: 'ปวดหลังร่วมกับไข้สูง หนาวสั่น หรือปัสสาวะแสบมากไหมคะ',
        key: 'back_infection',
        emergencyIf: true,
      },
    ],
  },
  
  // Urinary
  'urinary': {
    questions: [
      {
        text: 'ปัสสาวะเป็นเลือดร่วมกับปวดรุนแรงหรือไข้สูงไหมคะ',
        key: 'urinary_hematuria_severe',
        emergencyIf: true,
      },
      {
        text: 'ปัสสาวะไม่ออกเลยหรือปวดมากจนทนไม่ไหวไหมคะ',
        key: 'urinary_retention_severe',
        emergencyIf: true,
      },
    ],
  },
  
  // Skin / Dermatologic
  'skin': {
    questions: [
      {
        text: 'ผื่นร่วมกับหายใจลำบาก หรือบวมที่หน้า/ปาก/ลิ้นไหมคะ',
        key: 'skin_anaphylaxis',
        emergencyIf: true,
      },
      {
        text: 'ผื่นลามเร็วมากร่วมกับไข้สูง หรือผิวหนังลอกเจ็บแสบมากไหมคะ',
        key: 'skin_severe_infection',
        emergencyIf: true,
      },
    ],
  },
  'ผิว': {
    questions: [
      {
        text: 'ผื่นร่วมกับหายใจลำบาก หรือบวมที่หน้า/ปาก/ลิ้นไหมคะ',
        key: 'skin_anaphylaxis',
        emergencyIf: true,
      },
      {
        text: 'ผื่นลามเร็วมากร่วมกับไข้สูง หรือผิวหนังลอกเจ็บแสบมากไหมคะ',
        key: 'skin_severe_infection',
        emergencyIf: true,
      },
    ],
  },
  
  // Eye
  'eye': {
    questions: [
      {
        text: 'ตามัวเฉียบพลันหรือเห็นแสงวาบ เงาดำเคลื่อนที่ไหมคะ',
        key: 'eye_vision_loss',
        emergencyIf: true,
      },
      {
        text: 'ปวดตารุนแรงร่วมกับแพ้แสงมาก หรือตาแดงมากไหมคะ',
        key: 'eye_severe_pain_inflammation',
        emergencyIf: true,
      },
    ],
  },
  'ตา': {
    questions: [
      {
        text: 'ตามัวเฉียบพลันหรือเห็นแสงวาบ เงาดำเคลื่อนที่ไหมคะ',
        key: 'eye_vision_loss',
        emergencyIf: true,
      },
      {
        text: 'ปวดตารุนแรงร่วมกับแพ้แสงมาก หรือตาแดงมากไหมคะ',
        key: 'eye_severe_pain_inflammation',
        emergencyIf: true,
      },
    ],
  },
  
  // Leg / Lower limb
  'leg': {
    questions: [
      {
        text: 'ปวดขารุนแรงร่วมกับขาบวมมาก สีเปลี่ยน หรือขาเย็น/ชาไหมคะ',
        key: 'leg_vascular_compromise',
        emergencyIf: true,
      },
      {
        text: 'ปวดขาหลังอุบัติเหตุหรือขาเคลื่อนไหวไม่ได้ไหมคะ',
        key: 'leg_trauma_fracture',
        emergencyIf: true,
      },
    ],
  },
  'ขา': {
    questions: [
      {
        text: 'ปวดขารุนแรงร่วมกับขาบวมมาก สีเปลี่ยน หรือขาเย็น/ชาไหมคะ',
        key: 'leg_vascular_compromise',
        emergencyIf: true,
      },
      {
        text: 'ปวดขาหลังอุบัติเหตุหรือขาเคลื่อนไหวไม่ได้ไหมคะ',
        key: 'leg_trauma_fracture',
        emergencyIf: true,
      },
    ],
  },
  
  // Arm / Upper limb
  'arm': {
    questions: [
      {
        text: 'ปวดแขนรุนแรงร่วมกับแขนบวมมาก สีเปลี่ยน หรือแขนเย็น/ชาไหมคะ',
        key: 'arm_vascular_compromise',
        emergencyIf: true,
      },
      {
        text: 'ปวดแขนหลังอุบัติเหตุหรือแขนเคลื่อนไหวไม่ได้ไหมคะ',
        key: 'arm_trauma_fracture',
        emergencyIf: true,
      },
    ],
  },
  'แขน': {
    questions: [
      {
        text: 'ปวดแขนรุนแรงร่วมกับแขนบวมมาก สีเปลี่ยน หรือแขนเย็น/ชาไหมคะ',
        key: 'arm_vascular_compromise',
        emergencyIf: true,
      },
      {
        text: 'ปวดแขนหลังอุบัติเหตุหรือแขนเคลื่อนไหวไม่ได้ไหมคะ',
        key: 'arm_trauma_fracture',
        emergencyIf: true,
      },
    ],
  },
};

/**
 * Map body-part location to red-flag category
 * Handles both Thai and English body-part names
 */
export function mapBodyPartToRedFlagCategory(bodyPartLocation) {
  if (!bodyPartLocation || typeof bodyPartLocation !== 'string') {
    return null;
  }
  
  const normalized = normalizeThaiText(bodyPartLocation.toLowerCase());
  
  // Direct mapping
  if (BODY_PART_RED_FLAGS[normalized]) {
    return normalized;
  }
  
  // Partial matching for specific locations
  // Chest variations
  if (normalized.includes('หน้าอก') || normalized.includes('อก') || 
      normalized.includes('หัวใจ') || normalized.includes('ปอด') ||
      normalized.includes('chest') || normalized.includes('heart') || normalized.includes('lung')) {
    return 'chest';
  }
  
  // Abdomen variations
  if (normalized.includes('ท้อง') || normalized.includes('กระเพาะ') ||
      normalized.includes('abdomen') || normalized.includes('stomach')) {
    if (normalized.includes('บน') || normalized.includes('upper')) {
      return 'ท้องบน';
    }
    if (normalized.includes('ล่าง') || normalized.includes('lower') || normalized.includes('น้อย')) {
      return 'ท้องล่าง';
    }
    return 'ท้อง';
  }
  
  // Back variations
  if (normalized.includes('หลัง') || normalized.includes('back')) {
    return 'หลัง';
  }
  
  // Head variations
  if (normalized.includes('ศีรษะ') || normalized.includes('หัว') ||
      normalized.includes('head') || normalized.includes('skull')) {
    return 'ศีรษะ';
  }
  
  // Leg variations
  if (normalized.includes('ขา') || normalized.includes('เข่า') ||
      normalized.includes('leg') || normalized.includes('knee')) {
    return 'ขา';
  }
  
  // Arm variations
  if (normalized.includes('แขน') || normalized.includes('arm')) {
    return 'แขน';
  }
  
  // Skin variations
  if (normalized.includes('ผิว') || normalized.includes('skin') ||
      normalized.includes('ทั่วตัว') || normalized.includes('whole_body')) {
    return 'skin';
  }
  
  // Eye variations
  if (normalized.includes('ตา') || normalized.includes('eye')) {
    return 'ตา';
  }
  
  return null;
}

/**
 * Get red-flag questions for a body part
 * Returns array of red-flag questions (1-3 questions max)
 */
export function getBodyPartRedFlagQuestions(bodyPartLocation, language = 'th') {
  const category = mapBodyPartToRedFlagCategory(bodyPartLocation);
  
  if (!category || !BODY_PART_RED_FLAGS[category]) {
    return [];
  }
  
  const redFlagSet = BODY_PART_RED_FLAGS[category];
  return redFlagSet.questions || [];
}

/**
 * Check if body-part red flags have been screened
 * Returns true if all red-flag questions for this body part have been asked
 */
export function hasBodyPartRedFlagsScreened(bodyPartLocation, questionsAsked = []) {
  const redFlagQuestions = getBodyPartRedFlagQuestions(bodyPartLocation);
  
  if (redFlagQuestions.length === 0) {
    return true; // No red flags for this body part
  }
  
  // Check if all red-flag questions have been asked
  const askedKeys = new Set();
  questionsAsked.forEach(q => {
    if (typeof q === 'string') {
      const normalizedQ = normalizeThaiText(q.toLowerCase());
      redFlagQuestions.forEach(rf => {
        const normalizedRF = normalizeThaiText(rf.text.toLowerCase());
        // Check if question matches red-flag question (substring match)
        if (normalizedQ.includes(normalizedRF.substring(0, 20)) || 
            normalizedRF.includes(normalizedQ.substring(0, 20))) {
          askedKeys.add(rf.key);
        }
      });
    }
  });
  
  return askedKeys.size >= redFlagQuestions.length;
}

/**
 * Check if answer to body-part red-flag question indicates emergency
 * Returns true if answer is positive (ใช่/มี/เคย/กำลังเป็น)
 */
export function isBodyPartRedFlagPositive(answer, redFlagKey) {
  if (!answer || typeof answer !== 'string') {
    return false;
  }
  
  const normalized = normalizeThaiText(answer.toLowerCase());
  
  // Affirmative answers
  const affirmativeKeywords = [
    'ใช่', 'มี', 'เคย', 'กำลังเป็น', 'เป็น',
    'ใช่ค่ะ', 'มีค่ะ', 'เคยค่ะ',
    'ใช่ครับ', 'มีครับ', 'เคยครับ',
    'yes', 'have', 'had', 'has',
  ];
  
  return affirmativeKeywords.some(keyword => normalized.includes(keyword));
}

