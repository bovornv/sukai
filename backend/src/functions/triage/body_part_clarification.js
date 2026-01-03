/**
 * Body-Part Clarification Step
 * 
 * MANDATORY STEP: After first user input, if symptom is location-ambiguous,
 * system MUST ask for body-part location before proceeding.
 * 
 * Purpose:
 * - Narrow symptom intent
 * - Improve Severity × Time-course reasoning
 * - Improve OTC + self-care precision
 * - Make the app feel smart and attentive
 */

import { normalizeThaiText } from './thai_normalizer.js';

/**
 * Check if symptom requires body-part clarification
 * Returns true if symptom is ambiguous without location
 */
export function needsBodyPartClarification(symptom, intent = null) {
  if (!symptom || typeof symptom !== 'string') return false;
  
  const normalized = normalizeThaiText(symptom.toLowerCase());
  
  // Location-ambiguous symptoms that ALWAYS need clarification
  const ambiguousSymptoms = [
    'ปวด', 'เจ็บ', 'แสบ', 'เมื่อย', // Pain (without location)
    'ผื่น', 'คัน', 'แดง', // Rash/itch (without location)
    'ชา', 'อ่อนแรง', 'บวม', // Numbness/weakness/swelling (without location)
    'มีอาการ', 'ไม่สบาย', // Generic symptoms
  ];
  
  // Check if symptom is ambiguous
  const isAmbiguous = ambiguousSymptoms.some(ambiguous => {
    // Exact match or symptom starts with ambiguous word
    return normalized === ambiguous || normalized.startsWith(ambiguous + ' ');
  });
  
  if (isAmbiguous) {
    return true;
  }
  
  // Check if symptom contains location already
  const locationKeywords = [
    'หัว', 'ตา', 'หู', 'จมูก', 'ปาก', 'คอ', 'คาง', 'แก้ม', 'หน้าผาก', // Head/Face
    'หน้าอก', 'อก', 'หัวใจ', 'ปอด', // Chest
    'ท้อง', 'กระเพาะ', 'ตับ', 'ไต', // Abdomen
    'หลัง', 'เอว', 'สะโพก', // Back/Waist/Hip
    'แขน', 'มือ', 'นิ้ว', 'ไหล่', // Arm/Hand/Finger/Shoulder
    'ขา', 'เข่า', 'เท้า', 'ข้อเท้า', // Leg/Knee/Foot/Ankle
    'ผิว', 'หนัง', // Skin
  ];
  
  // General locations that need MORE SPECIFIC clarification
  const generalLocations = ['หน้าอก', 'อก', 'ท้อง', 'หลัง', 'แขน', 'ขา'];
  
  // Check if symptom contains a general location that needs more specific clarification
  const hasGeneralLocation = generalLocations.some(loc => normalized.includes(loc));
  if (hasGeneralLocation) {
    // For general locations like "ปวดหน้าอก", we need MORE SPECIFIC clarification
    // Ask which part of the chest/abdomen/back/etc.
    return true;
  }
  
  // If symptom contains specific location (not general), don't need clarification
  const hasSpecificLocation = locationKeywords.some(loc => 
    normalized.includes(loc) && !generalLocations.includes(loc)
  );
  if (hasSpecificLocation) {
    return false;
  }
  
  // Check intent for location hints
  if (intent) {
    const intentText = (intent.intent_id || intent.intentId || '').toLowerCase();
    const intentHasLocation = locationKeywords.some(loc => intentText.includes(loc));
    if (intentHasLocation) {
      return false;
    }
  }
  
  // Default: if symptom is very short or generic, likely needs clarification
  if (normalized.length < 10 && isAmbiguous) {
    return true;
  }
  
  return false;
}

/**
 * Generate body-part clarification question
 * Returns structured question with location choices
 */
export function generateBodyPartQuestion(symptom, intent = null, language = 'th') {
  const normalized = normalizeThaiText(symptom.toLowerCase());
  
  // Determine question phrasing based on symptom type
  let questionText = '';
  if (language === 'th') {
    if (normalized.includes('ปวด') || normalized.includes('เจ็บ')) {
      questionText = 'ขอทราบตำแหน่งที่ปวด/เจ็บหน่อยค่ะ';
    } else if (normalized.includes('ผื่น') || normalized.includes('คัน')) {
      questionText = 'ขอทราบตำแหน่งที่มีผื่น/คันหน่อยค่ะ';
    } else if (normalized.includes('บวม')) {
      questionText = 'ขอทราบตำแหน่งที่บวมหน่อยค่ะ';
    } else if (normalized.includes('ชา') || normalized.includes('อ่อนแรง')) {
      questionText = 'ขอทราบตำแหน่งที่ชา/อ่อนแรงหน่อยค่ะ';
    } else {
      questionText = 'ขอทราบตำแหน่งที่มีอาการหน่อยค่ะ';
    }
  } else {
    questionText = 'Where is the symptom located?';
  }
  
  // Generate location choices based on symptom hints
  const choices = generateLocationChoices(symptom, intent, language);
  
  return {
    question: questionText,
    choices: choices,
    step: 1.5, // Between step 1 (first question) and step 2 (red-flag)
    stepName: 'body_part_clarification',
    allowMultiSelect: false,
    questionKey: 'body_part_location',
  };
}

/**
 * Generate location choices based on symptom context
 * Groups logically: Head/Face → Chest → Abdomen → Back → Limbs → Skin
 */
function generateLocationChoices(symptom, intent = null, language = 'th') {
  const normalized = normalizeThaiText(symptom.toLowerCase());
  
  // Base location options (grouped logically)
  const locationGroups = {
    head_face: ['ศีรษะ', 'ใบหน้า', 'ตา', 'หู', 'จมูก', 'ปาก', 'คอ', 'คาง'],
    chest: ['หน้าอก', 'อก', 'หัวใจ', 'ปอด'],
    abdomen: ['ท้องบน', 'ท้องล่าง', 'ท้อง', 'กระเพาะ', 'ตับ', 'ไต'],
    back: ['หลัง', 'เอว', 'สะโพก'],
    upper_limbs: ['แขน', 'มือ', 'นิ้ว', 'ไหล่', 'ข้อมือ', 'ข้อศอก'],
    lower_limbs: ['ขา', 'เข่า', 'เท้า', 'ข้อเท้า', 'น่อง', 'ต้นขา'],
    skin: ['ทั่วตัว', 'เฉพาะจุด', 'ผิวหนัง'],
  };
  
  // Context-aware narrowing: If symptom hints at a region, prioritize those options
  let prioritizedChoices = [];
  
  // CRITICAL: If symptom already mentions a general location, ask for MORE SPECIFIC parts
  // Example: "ปวดหน้าอก" → ask which part of chest (left, right, center, heart area, lung area)
  if (normalized.includes('หน้าอก') || normalized.includes('อก')) {
    // Chest pain - ask for specific chest location
    prioritizedChoices = [
      'ด้านซ้ายของหน้าอก',
      'ด้านขวาของหน้าอก',
      'ตรงกลางหน้าอก',
      'บริเวณหัวใจ',
      'บริเวณปอด',
      'ร้าวไปแขนซ้าย',
      'ร้าวไปกราม',
      'ร้าวไปหลัง',
      'ทั่วหน้าอก',
      'ไม่แน่ใจ',
    ];
  } else if (normalized.includes('ท้อง')) {
    // Abdominal pain - ask for specific abdominal location
    prioritizedChoices = [
      'ท้องบน',
      'ท้องล่าง',
      'ท้องด้านขวา',
      'ท้องด้านซ้าย',
      'ตรงกลางท้อง',
      'บริเวณกระเพาะ',
      'บริเวณตับ',
      'บริเวณไต',
      'ทั่วท้อง',
      'ไม่แน่ใจ',
    ];
  } else if (normalized.includes('หลัง')) {
    // Back pain - ask for specific back location
    prioritizedChoices = [
      'หลังส่วนบน',
      'หลังส่วนล่าง',
      'ตรงกลางหลัง',
      'ร้าวลงขา',
      'ร้าวไปแขน',
      'บริเวณเอว',
      'บริเวณสะโพก',
      'ทั่วหลัง',
      'ไม่แน่ใจ',
    ];
  } else if (normalized.includes('แขน')) {
    // Arm pain - ask for specific arm location
    prioritizedChoices = [
      'แขนซ้าย',
      'แขนขวา',
      'ไหล่',
      'ข้อศอก',
      'ข้อมือ',
      'มือ',
      'นิ้ว',
      'ทั้งแขน',
      'ไม่แน่ใจ',
    ];
  } else if (normalized.includes('ขา')) {
    // Leg pain - ask for specific leg location
    prioritizedChoices = [
      'ขาซ้าย',
      'ขาขวา',
      'เข่า',
      'ข้อเท้า',
      'น่อง',
      'ต้นขา',
      'เท้า',
      'ทั้งขา',
      'ไม่แน่ใจ',
    ];
  }
  // Pain-related symptoms - all body parts possible
  else if (normalized.includes('ปวด') || normalized.includes('เจ็บ') || normalized.includes('เมื่อย')) {
    prioritizedChoices = [
      ...locationGroups.head_face,
      ...locationGroups.chest,
      ...locationGroups.abdomen,
      ...locationGroups.back,
      ...locationGroups.upper_limbs,
      ...locationGroups.lower_limbs,
    ];
  }
  // Rash/itch - prioritize skin, but can be anywhere
  else if (normalized.includes('ผื่น') || normalized.includes('คัน') || normalized.includes('แดง')) {
    prioritizedChoices = [
      ...locationGroups.skin,
      ...locationGroups.head_face,
      ...locationGroups.chest,
      ...locationGroups.abdomen,
      ...locationGroups.back,
      ...locationGroups.upper_limbs,
      ...locationGroups.lower_limbs,
    ];
  }
  // Swelling - all body parts possible
  else if (normalized.includes('บวม')) {
    prioritizedChoices = [
      ...locationGroups.head_face,
      ...locationGroups.chest,
      ...locationGroups.abdomen,
      ...locationGroups.back,
      ...locationGroups.upper_limbs,
      ...locationGroups.lower_limbs,
      ...locationGroups.skin,
    ];
  }
  // Numbness/weakness - prioritize limbs and head
  else if (normalized.includes('ชา') || normalized.includes('อ่อนแรง')) {
    prioritizedChoices = [
      ...locationGroups.head_face,
      ...locationGroups.upper_limbs,
      ...locationGroups.lower_limbs,
      ...locationGroups.back,
    ];
  }
  // Generic - include all
  else {
    prioritizedChoices = [
      ...locationGroups.head_face,
      ...locationGroups.chest,
      ...locationGroups.abdomen,
      ...locationGroups.back,
      ...locationGroups.upper_limbs,
      ...locationGroups.lower_limbs,
      ...locationGroups.skin,
    ];
  }
  
  // Limit to 12 options maximum (UX requirement)
  const limitedChoices = prioritizedChoices.slice(0, 12);
  
  // Add "ไม่แน่ใจ" and "หลายตำแหน่ง" options
  if (language === 'th') {
    limitedChoices.push('หลายตำแหน่ง');
    limitedChoices.push('ไม่แน่ใจ');
  } else {
    limitedChoices.push('Multiple locations');
    limitedChoices.push('Not sure');
  }
  
  return limitedChoices;
}

/**
 * Extract body part from answer
 * Normalizes user's location answer to standard body part
 */
export function extractBodyPart(answer) {
  if (!answer || typeof answer !== 'string') return null;
  
  const normalized = normalizeThaiText(answer.toLowerCase());
  
  // Map common variations to standard body parts
  const bodyPartMap = {
    // Head/Face
    'ศีรษะ': 'head',
    'หัว': 'head',
    'ใบหน้า': 'face',
    'หน้า': 'face',
    'ตา': 'eye',
    'หู': 'ear',
    'จมูก': 'nose',
    'ปาก': 'mouth',
    'คอ': 'throat',
    'คาง': 'chin',
    'หน้าผาก': 'forehead',
    
    // Chest
    'หน้าอก': 'chest',
    'อก': 'chest',
    'หัวใจ': 'heart',
    'ปอด': 'lung',
    
    // Abdomen
    'ท้อง': 'abdomen',
    'ท้องบน': 'upper_abdomen',
    'ท้องล่าง': 'lower_abdomen',
    'กระเพาะ': 'stomach',
    'ตับ': 'liver',
    'ไต': 'kidney',
    
    // Back
    'หลัง': 'back',
    'เอว': 'waist',
    'สะโพก': 'hip',
    
    // Upper limbs
    'แขน': 'arm',
    'มือ': 'hand',
    'นิ้ว': 'finger',
    'ไหล่': 'shoulder',
    'ข้อมือ': 'wrist',
    'ข้อศอก': 'elbow',
    
    // Lower limbs
    'ขา': 'leg',
    'เข่า': 'knee',
    'เท้า': 'foot',
    'ข้อเท้า': 'ankle',
    'น่อง': 'calf',
    'ต้นขา': 'thigh',
    
    // Skin
    'ผิว': 'skin',
    'ผิวหนัง': 'skin',
    'ทั่วตัว': 'whole_body',
    'เฉพาะจุด': 'localized',
  };
  
  // Check for exact match
  if (bodyPartMap[normalized]) {
    return bodyPartMap[normalized];
  }
  
  // Check for partial match
  for (const [thai, english] of Object.entries(bodyPartMap)) {
    if (normalized.includes(thai) || thai.includes(normalized)) {
      return english;
    }
  }
  
  // Special cases
  if (normalized.includes('หลาย') || normalized.includes('หลายตำแหน่ง')) {
    return 'multiple';
  }
  
  if (normalized.includes('ไม่แน่ใจ') || normalized.includes('ไม่รู้')) {
    return 'uncertain';
  }
  
  return null;
}

/**
 * Check if body part has been clarified
 */
export function hasBodyPartClarified(answers) {
  return !!(answers.body_part_location || answers.body_part || answers.location);
}

