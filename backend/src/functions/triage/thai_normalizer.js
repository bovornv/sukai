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
// EXPANDED: More comprehensive severity detection to catch "bad" symptoms
const SEVERITY_INDICATORS = {
  high: [
    'รุนแรง', 'มาก', 'หนัก', 'ทนไม่ไหว', 'ไม่ไหว', 'ไม่ไหวละ', 'หนักมาก', 'แย่มาก',
    'รบกวนมาก', 'รุนแรงผิดปกติ', 'ใช้ชีวิตไม่ได้', 'ทำอะไรไม่ได้', 'แย่', 'แย่มาก',
    'รบกวนชีวิต', 'ทนไม่ได้', 'ไม่ทน', 'รุนแรงมาก', 'หนักมากๆ', 'แย่ที่สุด',
    'รบกวนมากๆ', 'รบกวนชีวิตประจำวัน', 'ทำกิจกรรมไม่ได้', 'ทำอะไรไม่ได้เลย',
  ],
  medium: ['ปานกลาง', 'พอทน', 'ไม่มาก', 'นิดหน่อย', 'รบกวนบ้าง', 'รบกวนปานกลาง'],
  low: ['เบา', 'เล็กน้อย', 'นิดเดียว', 'แทบไม่รบกวน', 'ไม่รบกวน'],
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
 * Detect severity trajectory (แนวโน้มความรุนแรง)
 * Returns: 'worsening' | 'stable' | 'improving' | null
 * Medical-grade: Assess symptom trajectory, not just current severity
 */
export function detectSeverityTrajectory(text) {
  const normalized = normalizeThaiText(text);
  
  // Worsening indicators
  const worseningKeywords = [
    'แย่ลง', 'ไม่ดีขึ้น', 'แย่กว่าเดิม', 'หนักขึ้น', 'มากขึ้น',
    'แย่ลงเร็ว', 'แย่ลงทุกวัน', 'ไม่หาย', 'ยังไม่หาย',
  ];
  
  // Improving indicators
  const improvingKeywords = [
    'ดีขึ้น', 'ดีกว่าเดิม', 'เบาลง', 'หายขึ้น', 'ดีขึ้นเรื่อยๆ',
    'ดีขึ้นแล้ว', 'หายไปบ้าง', 'ดีขึ้นมาก',
  ];
  
  // Stable indicators
  const stableKeywords = [
    'เหมือนเดิม', 'คงที่', 'ไม่เปลี่ยน', 'เหมือนเดิมทุกวัน',
    'ไม่ดีขึ้นไม่แย่ลง',
  ];
  
  if (worseningKeywords.some(keyword => normalized.includes(keyword))) {
    return 'worsening';
  }
  
  if (improvingKeywords.some(keyword => normalized.includes(keyword))) {
    return 'improving';
  }
  
  if (stableKeywords.some(keyword => normalized.includes(keyword))) {
    return 'stable';
  }
  
  return null;
}

/**
 * Classify time-course of symptom
 * Returns: 'acute' | 'subacute' | 'progressive' | 'chronic' | 'recurrent' | null
 * Medical-grade: Classify symptom by time-course for differential diagnosis
 */
export function classifyTimeCourse(durationDays, trajectory, answers = {}) {
  // If we have explicit trajectory info, use it
  if (trajectory === 'worsening') {
    // Progressive: getting worse over time
    if (durationDays && durationDays <= 7) {
      return 'progressive'; // Acute progressive
    }
    return 'progressive';
  }
  
  // Duration-based classification
  if (durationDays === null || durationDays === undefined) {
    return null; // Unknown
  }
  
  if (durationDays <= 2) {
    return 'acute'; // Hours to 2 days
  }
  
  if (durationDays <= 7) {
    // Check if it's progressive or subacute
    if (trajectory === 'worsening') {
      return 'progressive';
    }
    return 'subacute'; // 3-7 days
  }
  
  if (durationDays <= 30) {
    // Check if recurrent pattern
    if (answers.recurrent === true || answers.pattern === 'recurrent') {
      return 'recurrent';
    }
    return 'chronic'; // More than a week
  }
  
  // More than 30 days
  if (answers.recurrent === true || answers.pattern === 'recurrent') {
    return 'recurrent';
  }
  
  return 'chronic';
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

/**
 * Detect if answer is affirmative (yes) in Thai
 * Returns: true if answer indicates yes/affirmative
 * CRITICAL: Used for red-flag detection - if user answers "ใช่" to red-flag question → Emergency
 */
export function isAffirmativeAnswer(text) {
  if (!text || typeof text !== 'string') return false;
  
  const normalized = normalizeThaiText(text);
  
  // CRITICAL: Check for negative words FIRST (including "ไม่มาก", "ไม่รุนแรง", etc.)
  // These MUST be checked before checking for severity indicators
  const negativeKeywords = [
    'ไม่ใช่', 'ไม่มี', 'ไม่เป็น', 'ไม่', 
    'ไม่มีค่ะ', 'ไม่ใช่ค่ะ', 'ไม่เป็นค่ะ',
    'ไม่มีครับ', 'ไม่ใช่ครับ', 'ไม่เป็นครับ',
    'ไม่มาก', 'ไม่รุนแรง', 'ไม่หนัก', 'ไม่ทนไม่ไหว',
    'ไม่มากค่ะ', 'ไม่รุนแรงค่ะ', 'ไม่มากครับ', 'ไม่รุนแรงครับ',
    'ไม่มากเลย', 'ไม่รุนแรงเลย', 'ไม่มากเท่าไหร่', 'ไม่รุนแรงเท่าไหร่',
  ];
  
  // Check if text contains any negative keyword (must check for "ไม่มาก" BEFORE checking for "มาก")
  for (const keyword of negativeKeywords) {
    if (normalized === keyword || 
        normalized.startsWith(keyword + ' ') || 
        normalized.startsWith(keyword + 'ค่ะ') ||
        normalized.startsWith(keyword + 'ครับ') ||
        normalized.includes(' ' + keyword + ' ') ||
        normalized.includes(' ' + keyword + 'ค่ะ') ||
        normalized.includes(' ' + keyword + 'ครับ')) {
      return false; // Negative answer - NOT affirmative
    }
  }
  
  // Affirmative keywords (exact matches or starts with)
  const affirmativeKeywords = [
    'ใช่',
    'ใช่ค่ะ',
    'ใช่ครับ',
    'ใช่แล้ว',
    'ใช่เลย',
    'มี',
    'เป็น',
    'มีค่ะ',
    'เป็นค่ะ',
    'มีครับ',
    'เป็นครับ',
  ];
  
  // Check for exact affirmative match
  if (affirmativeKeywords.some(keyword => normalized === keyword || normalized.startsWith(keyword))) {
    return true;
  }
  
  // Check for "ใช่" followed by other words (e.g., "ใช่ มี", "ใช่ เป็น")
  if (normalized.startsWith('ใช่ ')) {
    return true;
  }
  
  // Check for severity indicators that indicate positive (severe symptoms)
  // BUT ONLY if we've already confirmed it's NOT a negative answer
  const severeIndicators = ['รุนแรง', 'มาก', 'หนัก', 'ทนไม่ไหว', 'ไม่ไหว', 'ไม่ไหวละ'];
  if (severeIndicators.some(indicator => normalized.includes(indicator))) {
    // Double-check: exclude if it says "ไม่รุนแรง" or "ไม่มาก" (should already be caught above, but extra safety)
    if (!normalized.includes('ไม่รุนแรง') && !normalized.includes('ไม่มาก') && !normalized.includes('ไม่หนัก')) {
      return true;
    }
  }
  
  return false;
}

