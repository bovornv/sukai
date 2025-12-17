/**
 * Thai Language Normalizer
 * Handles misspellings, slang, and spoken language for SukAI
 * Goal: Understand "meaning" not just correct spelling
 */

// Common misspelling groups (same meaning)
const SPELLING_VARIANTS = {
  // Headache variations
  'ปวดหัว': ['ปวดหัวมาก', 'ปวดหัวๆ', 'ปวดหัวเวียน', 'ปวดหัว', 'ปวดศีรษะ', 'หนักหัว', 'มึนหัว'],
  'เวียนหัว': ['เวียนๆ', 'มึนหัว', 'มึนงง', 'มึนๆ', 'เวียนศีรษะ'],
  
  // Throat pain
  'เจ็บคอ': ['เจบคอ', 'เจ็บคอมาก', 'คอเจบ', 'ร้อนใน', 'คอแห้ง'],
  
  // Fever
  'ไข้': ['ไค้', 'ไข้ขึ้น', 'เป็นไข้', 'ตัวร้อน', 'ร้อนตัว', 'มีไข้'],
  
  // Nausea/Vomiting
  'อาเจียน': ['อ้วก', 'อ๊วก', 'จะอ้วก', 'คลื่นไส้', 'อยากอ้วก'],
  
  // Diarrhea
  'ท้องเสีย': ['ถ่ายเหลว', 'ถ่ายน้ำ', 'วิ่งเข้าห้องน้ำ', 'ท้องร่วง'],
  
  // Chest pain
  'เจ็บหน้าอก': ['แน่นอก', 'เจ็บอก', 'ปวดอก', 'เจ็บทรวงอก'],
  
  // Breathing difficulty
  'หายใจลำบาก': ['หายใจไม่ออก', 'หายใจไม่สะดวก', 'หายใจติดขัด', 'เหนื่อย'],
  
  // Heart palpitations
  'ใจสั่น': ['ใจเต้นผิดปกติ', 'ใจเต้นแรง', 'ใจเต้นเร็ว'],
  
  // Fatigue
  'อ่อนเพลีย': ['เพลียจัด', 'ไม่ไหวละ', 'ไม่มีแรง', 'เหนื่อยมาก'],
  
  // Pain (general)
  'ปวด': ['เจ็บ', 'แสบ', 'เมื่อย'],
  
  // Severe
  'รุนแรง': ['มาก', 'หนัก', 'ทนไม่ไหว', 'ไม่ไหวละ'],
};

// Slang to medical term mapping
const SLANG_MAPPING = {
  // Severity indicators
  'ไม่ไหวละ': 'รุนแรง',
  'ไม่ไหว': 'รุนแรง',
  'ทนไม่ไหว': 'รุนแรง',
  'หนักมาก': 'รุนแรง',
  
  // Fatigue
  'เพลียจัด': 'อ่อนเพลีย',
  'ไม่มีแรง': 'อ่อนเพลีย',
  
  // Headache
  'หนักหัว': 'ปวดหัว',
  'มึนๆ': 'เวียนหัว',
  
  // Chest
  'แน่นอก': 'เจ็บหน้าอก',
  
  // Fever
  'ตัวร้อน': 'ไข้',
  'ร้อนตัว': 'ไข้',
  
  // Throat (context-dependent)
  'ร้อนใน': 'เจ็บคอ', // Default, context may change
  
  // Heart
  'ใจสั่น': 'ใจเต้นผิดปกติ',
};

// Anxiety/worry keywords
const ANXIETY_KEYWORDS = [
  'กลัว',
  'กังวล',
  'ไม่รู้จะทำไง',
  'ไม่รู้จะทำอย่างไร',
  'จะเป็นอะไรไหม',
  'เป็นอะไร',
  'เป็นอะไรมั้ย',
  'เป็นอะไรหรือเปล่า',
  'กังวลมาก',
  'กลัวมาก',
];

// Severity indicators (spoken language)
const SEVERITY_INDICATORS = {
  high: ['รุนแรง', 'มาก', 'หนัก', 'ทนไม่ไหว', 'ไม่ไหว', 'ไม่ไหวละ', 'หนักมาก', 'แย่มาก'],
  medium: ['ปานกลาง', 'พอทน', 'ไม่มาก', 'นิดหน่อย'],
  low: ['เบา', 'เล็กน้อย', 'นิดเดียว'],
};

/**
 * Normalize Thai text
 * Converts misspellings, slang, and spoken language to standard medical terms
 */
export function normalizeThaiText(text) {
  if (!text || typeof text !== 'string') return '';
  
  let normalized = text.toLowerCase().trim();
  
  // Step 1: Replace slang with medical terms
  for (const [slang, medicalTerm] of Object.entries(SLANG_MAPPING)) {
    const regex = new RegExp(slang.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    normalized = normalized.replace(regex, medicalTerm);
  }
  
  // Step 2: Normalize spelling variants
  for (const [standard, variants] of Object.entries(SPELLING_VARIANTS)) {
    for (const variant of variants) {
      const regex = new RegExp(variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      normalized = normalized.replace(regex, standard);
    }
  }
  
  return normalized;
}

/**
 * Extract symptoms from text
 * Returns array of normalized symptoms
 */
export function extractSymptoms(text) {
  const normalized = normalizeThaiText(text);
  const symptoms = [];
  
  // Check for known symptom patterns
  const symptomPatterns = [
    'ปวดหัว', 'เวียนหัว', 'เจ็บคอ', 'ไข้', 'อาเจียน', 'ท้องเสีย',
    'เจ็บหน้าอก', 'หายใจลำบาก', 'ใจสั่น', 'อ่อนเพลีย', 'ปวด',
  ];
  
  for (const pattern of symptomPatterns) {
    if (normalized.includes(pattern)) {
      symptoms.push(pattern);
    }
  }
  
  return symptoms.length > 0 ? symptoms : [normalized];
}

/**
 * Check if user is anxious/worried
 */
export function isAnxious(text) {
  const normalized = normalizeThaiText(text);
  return ANXIETY_KEYWORDS.some(keyword => normalized.includes(keyword));
}

/**
 * Detect severity from text
 * Returns: 'high', 'medium', 'low', or null
 */
export function detectSeverity(text) {
  const normalized = normalizeThaiText(text);
  
  // Check for high severity
  if (SEVERITY_INDICATORS.high.some(indicator => normalized.includes(indicator))) {
    return 'high';
  }
  
  // Check for low severity
  if (SEVERITY_INDICATORS.low.some(indicator => normalized.includes(indicator))) {
    return 'low';
  }
  
  // Check for medium severity
  if (SEVERITY_INDICATORS.medium.some(indicator => normalized.includes(indicator))) {
    return 'medium';
  }
  
  return null;
}

/**
 * Extract duration from text
 * Returns: duration in days or null
 */
export function extractDuration(text) {
  const normalized = normalizeThaiText(text);
  
  // Patterns: "2 วัน", "3 วันแล้ว", "เมื่อวาน", "2-3 วัน"
  const durationPatterns = [
    { pattern: /(\d+)\s*วัน/, extract: (match) => parseInt(match[1]) },
    { pattern: /เมื่อวาน/, extract: () => 1 },
    { pattern: /(\d+)\s*-\s*(\d+)\s*วัน/, extract: (match) => Math.ceil((parseInt(match[1]) + parseInt(match[2])) / 2) },
    { pattern: /(\d+)\s*ชั่วโมง/, extract: (match) => Math.ceil(parseInt(match[1]) / 24) },
  ];
  
  for (const { pattern, extract } of durationPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      return extract(match);
    }
  }
  
  return null;
}

/**
 * Check if symptom is worsening
 * Returns: true if text indicates worsening
 */
export function isWorsening(text) {
  const normalized = normalizeThaiText(text);
  const worseningKeywords = [
    'แย่ลง',
    'ไม่ดีขึ้น',
    'ยังไม่หาย',
    'ไม่หาย',
    'แย่กว่าเดิม',
    'หนักขึ้น',
    'มากขึ้น',
  ];
  
  return worseningKeywords.some(keyword => normalized.includes(keyword));
}

/**
 * Check if user tried self-care
 * Returns: true if text indicates self-care attempts
 */
export function triedSelfCare(text) {
  const normalized = normalizeThaiText(text);
  const selfCareKeywords = [
    'กินยา',
    'ใช้ยา',
    'ทานยา',
    'ลอง',
    'ดูแลตัวเอง',
    'พัก',
    'ดื่มน้ำ',
  ];
  
  return selfCareKeywords.some(keyword => normalized.includes(keyword));
}

/**
 * Get reassurance message if user is anxious
 */
export function getReassuranceMessage() {
  const messages = [
    'ไม่ต้องกังวลนะคะ หมอจะช่วยประเมินอาการให้',
    'เข้าใจแล้วค่ะ หมอจะช่วยดูอาการให้อย่างละเอียด',
    'ไม่ต้องกลัวนะคะ หมอจะช่วยประเมินและแนะนำให้',
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

