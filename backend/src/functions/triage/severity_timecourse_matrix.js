/**
 * Severity × Time-course Matrix (Medical-grade)
 * Suk AI Clinical Logic Reference (300+ Symptoms)
 * 
 * 🎯 PRIMARY CLINICAL REASONING REFERENCE
 * Use this file as medical-grade reference similar to ER triage playbook.
 * 
 * Purpose:
 * - ใช้เป็นฐาน Clinical reasoning สำหรับ Suk AI
 * - เลียนแบบการตัดสินใจของ ER triage nurse + แพทย์เวร
 * - ใช้ตัดสิน Emergency ตั้งแต่ "คำถามแรก"
 * - ใช้กำหนดว่าจะถามต่อหรือสรุปได้เมื่อไร
 * 
 * Structure:
 * Each symptom must be evaluated by:
 * 1) Severity (Mild / Moderate / Severe)
 * 2) Time-course (Acute / Progressive / Chronic)
 * 3) Red-flag presence
 * 4) Confidence score
 * 
 * Conclusion is allowed ONLY when confidence ≥ threshold.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚨 CRITICAL CLINICAL RULES (MUST FOLLOW)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Rule 1: Do NOT reuse the same question sequence for the same symptom
 *   - Use variation mechanisms (generateVariationSeed, shuffleArray)
 *   - Track questionsAsked to prevent duplicates
 *   - Rotate question focus based on what's already known
 * 
 * Rule 2: Always evaluate Severity + Time-course before concluding
 *   - MUST have both severity and time-course determined
 *   - Use determineTriageFromMatrix() to get triage level
 *   - Check canStopAndSummarize() with severity + timeCourse
 * 
 * Rule 3: Red flags must be checked from the FIRST question
 *   - First question MUST be symptom-specific red-flag question (from symptom_question_map.js)
 *   - If user answers "ใช่" to red-flag question → Emergency immediately
 *   - Don't proceed to general questions until red flags are screened
 * 
 * Rule 4: If not emergency and confidence < threshold, continue asking
 *   - Low (<60): ❌ Must ask more
 *   - Medium (60-79): ⚠️ Ask clarifying Q (need critical info)
 *   - High (80-89): ✅ Can summarize + OTC / GP
 *   - Very High (≥90): 🚨 Emergency หรือ firm plan
 * 
 * Rule 5: Health context check - REMOVED
 *   - Safety is now ensured by:
 *     • Severity × Time-course logic
 *     • Health profile checks
 *     • Contraindication filtering
 *     • Confidence threshold control
 * 
 * Rule 6: OTC recommendations must include at least 2 suitable options
 *   - Use selectTwoOTCOptions() from thai_otc_catalog.js
 *   - Must have rationale based on severity, age, weight, contraindications
 *   - NO OTC recommendations for emergency cases
 *   - Each option must include: reason, dosage, precautions
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * 📋 EXPECTED OUTCOMES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ✅ ไม่ถาม flow เดิมซ้ำ (variation mechanisms)
 * ✅ ไม่จบที่ paracetamol อย่างเดียว (2+ OTC options with rationale)
 * ✅ Emergency ถูกจับตั้งแต่คำถามแรก (symptom-specific red-flag questions)
 * ✅ Logic ใกล้แพทย์จริง / textbook (medical-grade matrix + confidence scoring)
 * ✅ Suk AI "ดูฉลาดขึ้นทันที" (adaptive questioning, hypothesis-driven)
 */

import { normalizeThaiText } from './thai_normalizer.js';

/**
 * Severity levels
 */
export const SEVERITY_LEVELS = {
  MILD: 'mild',        // รบกวนเล็กน้อย / ใช้ชีวิตได้
  MODERATE: 'moderate', // รบกวนชัดเจน / ต้องพัก
  SEVERE: 'severe',     // ใช้ชีวิตไม่ได้ / เจ็บมาก / alarming
};

/**
 * Time-course types
 */
export const TIMECOURSE_TYPES = {
  ACUTE: 'acute',              // นาที–24 ชม.
  SUBACUTE: 'subacute',        // 2–7 วัน
  PROGRESSIVE: 'progressive',  // แย่ลงต่อเนื่อง
  CHRONIC: 'chronic',          // เป็นนาน
  RECURRENT: 'recurrent',      // เป็น ๆ หาย ๆ
};

/**
 * Symptom-Specific Severity × Time-course Matrix
 * Maps each symptom to its severity definitions and emergency triggers
 * 
 * Format:
 * {
 *   symptom_keyword: {
 *     mild: 'description',
 *     moderate: 'description',
 *     severe: 'description',
 *     emergencyTrigger: 'red flag description',
 *   }
 * }
 */
export const SYMPTOM_SEVERITY_MAP = {
  // 🧠 NEURO / HEAD
  'ปวดหัว': {
    mild: 'ตึง',
    moderate: 'ปวดรบกวนชีวิต',
    severe: 'ปวดที่สุดในชีวิต',
    emergencyTrigger: 'Thunderclap, SAH',
  },
  'เวียนหัว': {
    mild: 'เป็นพัก',
    moderate: 'เดินเซ',
    severe: 'ล้ม',
    emergencyTrigger: 'Stroke',
  },
  'ชาครึ่งซีก': {
    mild: null,
    moderate: 'ชัด',
    severe: 'อ่อนแรง',
    emergencyTrigger: 'Stroke',
  },
  'พูดไม่ชัด': {
    mild: null,
    moderate: 'เป็นช่วง',
    severe: 'ต่อเนื่อง',
    emergencyTrigger: 'Stroke',
  },
  'ปวดคอ': {
    mild: 'ตึง',
    moderate: 'ขยับลำบาก',
    severe: 'คอแข็ง',
    emergencyTrigger: 'Meningitis',
  },
  'ชัก': {
    mild: null,
    moderate: 'ครั้งเดียว',
    severe: 'ซ้ำ',
    emergencyTrigger: 'Status epilepticus',
  },
  'มองไม่เห็นข้างเดียว': {
    mild: null,
    moderate: null,
    severe: 'มี',
    emergencyTrigger: 'Stroke',
  },
  'สับสน': {
    mild: null,
    moderate: 'เป็นพัก',
    severe: 'ซึม',
    emergencyTrigger: 'Sepsis / CNS',
  },
  'ปวดหัวหลังอุบัติเหตุ': {
    mild: 'เล็กน้อย',
    moderate: 'มึน',
    severe: 'แย่ลง',
    emergencyTrigger: 'ICH',
  },
  'หน้ามืดเป็นลม': {
    mild: null,
    moderate: 'ฟื้นเร็ว',
    severe: 'ไม่ฟื้น',
    emergencyTrigger: 'Cardiac',
  },
  
  // ❤️ CARDIO / RESPIRATORY
  'เจ็บหน้าอก': {
    mild: 'ตึง',
    moderate: 'แน่น',
    severe: 'บีบ',
    emergencyTrigger: 'MI',
  },
  'หายใจไม่อิ่ม': {
    mild: 'เหนื่อย',
    moderate: 'หอบ',
    severe: 'พูดไม่ได้',
    emergencyTrigger: 'Respiratory failure',
  },
  'ใจสั่น': {
    mild: 'เครียด',
    moderate: 'บ่อย',
    severe: 'หน้ามืด',
    emergencyTrigger: 'Arrhythmia',
  },
  'ไอเป็นเลือด': {
    mild: null,
    moderate: null,
    severe: 'มี',
    emergencyTrigger: 'PE',
  },
  'แน่นคอร่วมผื่น': {
    mild: null,
    moderate: null,
    severe: 'มี',
    emergencyTrigger: 'Anaphylaxis',
  },
  'หอบกลางคืน': {
    mild: null,
    moderate: 'มี',
    severe: 'ต้องนั่ง',
    emergencyTrigger: 'Heart failure',
  },
  
  // 🫁 GI / ABDOMEN
  'ปวดท้อง': {
    mild: 'แน่น',
    moderate: 'ปวดมาก',
    severe: 'กดเจ็บ',
    emergencyTrigger: 'Peritonitis',
  },
  'ถ่ายดำ': {
    mild: null,
    moderate: null,
    severe: 'มี',
    emergencyTrigger: 'GI bleed',
  },
  'อาเจียน': {
    mild: null,
    moderate: 'บ่อย',
    severe: 'พุ่ง',
    emergencyTrigger: 'ICP',
  },
  'ปวดท้องขวาล่าง': {
    mild: null,
    moderate: 'มี',
    severe: 'กดเจ็บ',
    emergencyTrigger: 'Appendicitis',
  },
  'ตัวเหลือง': {
    mild: null,
    moderate: 'มี',
    severe: 'ซึม',
    emergencyTrigger: 'Liver failure',
  },
  
  // 🤒 INFECTIOUS / GENERAL
  'ไข้': {
    mild: '<38',
    moderate: '>38.5',
    severe: 'ซึม',
    emergencyTrigger: 'Sepsis',
  },
  'หนาวสั่น': {
    mild: null,
    moderate: 'มี',
    severe: 'ซึม',
    emergencyTrigger: 'Sepsis',
  },
  'ผื่น': {
    mild: 'เล็ก',
    moderate: 'ลาม',
    severe: 'เจ็บ',
    emergencyTrigger: 'SJS',
  },
  'ไข้หลังคลอด': {
    mild: null,
    moderate: null,
    severe: 'มี',
    emergencyTrigger: 'Sepsis',
  },
  
  // 🦴 MSK / SKIN / URO / GYN
  'ปวดข้อ': {
    mild: 'ตึง',
    moderate: 'บวม',
    severe: 'แดงร้อน',
    emergencyTrigger: 'Septic arthritis',
  },
  'ปัสสาวะแสบ': {
    mild: null,
    moderate: 'มี',
    severe: 'ไข้',
    emergencyTrigger: 'Pyelonephritis',
  },
  'ปัสสาวะเป็นเลือด': {
    mild: null,
    moderate: 'มี',
    severe: 'ปวด',
    emergencyTrigger: 'Stone',
  },
  'เลือดออกช่องคลอด': {
    mild: null,
    moderate: 'มาก',
    severe: 'หน้ามืด',
    emergencyTrigger: 'Ectopic',
  },
};

/**
 * Universal Severity × Time-course Decision Matrix
 * Fallback matrix when symptom-specific mapping is not available
 * Matrix[row][col] = triage decision
 */
export const SEVERITY_TIMECOURSE_MATRIX = {
  [SEVERITY_LEVELS.MILD]: {
    [TIMECOURSE_TYPES.ACUTE]: 'self_care',      // Self-care / Observe
    [TIMECOURSE_TYPES.SUBACUTE]: 'self_care',  // Self-care + monitor
    [TIMECOURSE_TYPES.PROGRESSIVE]: 'self_care', // Self-care with monitoring (watch for worsening)
    [TIMECOURSE_TYPES.CHRONIC]: 'self_care',   // Lifestyle / Non-urgent
    [TIMECOURSE_TYPES.RECURRENT]: 'self_care', // Lifestyle / Non-urgent
  },
  [SEVERITY_LEVELS.MODERATE]: {
    [TIMECOURSE_TYPES.ACUTE]: 'self_care',       // Self-care with OTC (monitor closely)
    [TIMECOURSE_TYPES.SUBACUTE]: 'gp',          // Consult doctor / OPD
    [TIMECOURSE_TYPES.PROGRESSIVE]: 'gp',       // 🚨 High risk - see GP
    [TIMECOURSE_TYPES.CHRONIC]: 'gp',           // GP / Review meds
    [TIMECOURSE_TYPES.RECURRENT]: 'gp',         // GP / Review meds
  },
  [SEVERITY_LEVELS.SEVERE]: {
    [TIMECOURSE_TYPES.ACUTE]: 'emergency',      // 🚨 Emergency
    [TIMECOURSE_TYPES.SUBACUTE]: 'emergency',   // 🚨 Emergency
    [TIMECOURSE_TYPES.PROGRESSIVE]: 'emergency', // 🚨 Emergency
    [TIMECOURSE_TYPES.CHRONIC]: 'gp',           // ⚠️ Specialist
    [TIMECOURSE_TYPES.RECURRENT]: 'gp',         // ⚠️ Specialist
  },
};

/**
 * Get symptom-specific severity definitions
 * @param {string} symptomKeyword - Normalized symptom keyword
 * @returns {object|null} Severity definitions or null if not found
 */
export function getSymptomSeverity(symptomKeyword) {
  if (!symptomKeyword) return null;
  
  const normalized = symptomKeyword.toLowerCase().trim();
  
  // Direct match
  if (SYMPTOM_SEVERITY_MAP[normalized]) {
    return SYMPTOM_SEVERITY_MAP[normalized];
  }
  
  // Partial match (find first matching key)
  for (const [key, value] of Object.entries(SYMPTOM_SEVERITY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Determine triage level from Severity × Time-course Matrix
 * Uses symptom-specific mapping if available, otherwise falls back to universal matrix
 * @param {string} severity - Severity level (mild/moderate/severe)
 * @param {string} timeCourse - Time-course type (acute/subacute/progressive/chronic/recurrent)
 * @param {string} symptomKeyword - Optional symptom keyword for symptom-specific logic
 * @returns {string|null} Triage level or null
 */
export function determineTriageFromMatrix(severity, timeCourse, symptomKeyword = null) {
  if (!severity || !timeCourse) {
    return null; // Cannot determine without both
  }
  
  // CRITICAL: Severe + Acute = Emergency always (universal rule)
  if (severity === SEVERITY_LEVELS.SEVERE && timeCourse === TIMECOURSE_TYPES.ACUTE) {
    return 'emergency';
  }
  
  // Use universal matrix
  const matrixRow = SEVERITY_TIMECOURSE_MATRIX[severity];
  if (!matrixRow) {
    return null;
  }
  
  return matrixRow[timeCourse] || null;
}

/**
 * Clinical Confidence Thresholds by Triage Level
 * Updated thresholds based on medical-grade requirements
 */
export const CONFIDENCE_THRESHOLDS = {
  emergency: 90,    // Emergency: ≥ 90%
  gp: 75,          // GP / OPD: ≥ 75%
  self_care: 65,   // Self-care: ≥ 65%
  // Legacy severity-based thresholds (for backward compatibility)
  [SEVERITY_LEVELS.MILD]: 65,    // Mild → ≥65%
  [SEVERITY_LEVELS.MODERATE]: 75, // Moderate → ≥75%
  [SEVERITY_LEVELS.SEVERE]: 90,   // Severe → ≥90% (or Emergency)
};

/**
 * Get confidence threshold for triage level or severity
 * @param {string} triageLevelOrSeverity - Triage level (emergency/gp/self_care) or severity (mild/moderate/severe)
 * @returns {number} Confidence threshold (0-100)
 */
export function getConfidenceThreshold(triageLevelOrSeverity) {
  return CONFIDENCE_THRESHOLDS[triageLevelOrSeverity] || 75; // Default 75%
}

/**
 * Check if we have sufficient information to stop asking and summarize
 * Returns: { canStop: boolean, reason: string }
 * 
 * Clinical Rules:
 * - ถ้ามี Red flag → Emergency flow ทันที
 * - ถ้าไม่ emergency → ต้องประเมิน:
 *   - Severity trajectory (ดีขึ้น / แย่ลง)
 *   - Time-course (acute / progressive / chronic)
 * - ถ้า confidence < threshold → ต้องถามต่อ
 * - Health context check - REMOVED per user request
 */
export function canStopAndSummarize({
  severity,
  timeCourse,
  trajectory,
  redFlagsScreened,
  differentialCount,
  confidence,
  hasComorbidity,
  hasRiskAge,
  hasNewSymptoms,
  canRecommendOTC,
  healthContextAnswered,
  triageLevel, // Optional: use triage level for threshold if available
}) {
  // Health context check - REMOVED per user request
  // Always allow stopping (health context question removed)
  
  // Check if severity is clear
  if (!severity || severity === 'unknown') {
    return {
      canStop: false,
      reason: 'Severity not clear',
    };
  }
  
  // Check if time-course is clear
  if (!timeCourse || timeCourse === 'unknown') {
    return {
      canStop: false,
      reason: 'Time-course not clear',
    };
  }
  
  // Check if trajectory is worsening (must ask more)
  if (trajectory === 'worsening') {
    return {
      canStop: false,
      reason: 'Symptoms worsening - need more assessment',
    };
  }
  
  // Check if red flags have been screened
  if (!redFlagsScreened && severity !== SEVERITY_LEVELS.MILD && triageLevel !== 'emergency') {
    return {
      canStop: false,
      reason: 'Red flags not screened',
    };
  }
  
  // Check differential count (should be ≤ 2-3 for OTC/GP)
  if (differentialCount && differentialCount > 3 && severity !== SEVERITY_LEVELS.SEVERE && triageLevel !== 'emergency') {
    return {
      canStop: false,
      reason: 'Differential too broad',
    };
  }
  
  // Check confidence threshold (use triage level if available, otherwise severity)
  const threshold = triageLevel 
    ? getConfidenceThreshold(triageLevel)
    : getConfidenceThreshold(severity);
  
  // MEDICAL-GRADE: Use threshold levels based on confidence score
  // Low (<60): ❌ ต้องถามเพิ่ม
  // Medium (60-79): ⚠️ Ask clarifying Q
  // High (80-89): ✅ สรุป + OTC / GP
  // Very High (≥90): 🚨 Emergency หรือ firm plan
  if (confidence < 60) {
    return {
      canStop: false,
      reason: `Confidence ${confidence}% < 60% (Low) - must ask more questions`,
    };
  }
  
  if (confidence < threshold) {
    return {
      canStop: false,
      reason: `Confidence ${confidence}% < threshold ${threshold}% for ${triageLevel || severity}`,
    };
  }
  
  // For medium confidence (60-79), allow stopping only if all other criteria met
  if (confidence >= 60 && confidence < 80 && triageLevel !== 'emergency') {
    // Check if we have all critical information
    if (!redFlagsScreened || !trajectory) {
      return {
        canStop: false,
        reason: `Confidence ${confidence}% (Medium) - need critical information before summarizing`,
      };
    }
  }
  
  // Check for high-risk factors (must ask more)
  if (hasComorbidity && severity !== SEVERITY_LEVELS.MILD && triageLevel !== 'emergency') {
    return {
      canStop: false,
      reason: 'Comorbidity present - need more assessment',
    };
  }
  
  if (hasRiskAge && severity !== SEVERITY_LEVELS.MILD && triageLevel !== 'emergency') {
    return {
      canStop: false,
      reason: 'High-risk age group - need more assessment',
    };
  }
  
  if (hasNewSymptoms) {
    return {
      canStop: false,
      reason: 'New symptoms detected - need reassessment',
    };
  }
  
  // For self_care level, must be able to recommend OTC
  if ((severity === SEVERITY_LEVELS.MILD || severity === SEVERITY_LEVELS.MODERATE || triageLevel === 'self_care') && !canRecommendOTC) {
    return {
      canStop: false,
      reason: 'Cannot confidently recommend OTC',
    };
  }
  
  // All conditions met - can stop and summarize
  return {
    canStop: true,
    reason: `All conditions met: severity=${severity}, timeCourse=${timeCourse}, confidence=${confidence}%`,
  };
}

/**
 * Medical-Grade Confidence Scoring Formula (0-100)
 * 
 * Score = Sum of 5 axes (each 0-20 points):
 * 1. Symptom clarity (0-20)
 * 2. Severity certainty (0-20)
 * 3. Time-course certainty (0-20)
 * 4. Red flag exclusion (0-20)
 * 5. Patient context completeness (0-20)
 * 
 * Threshold Levels:
 * - Low (<60): ❌ ต้องถามเพิ่ม
 * - Medium (60-79): ⚠️ Ask clarifying Q
 * - High (80-89): ✅ สรุป + OTC / GP
 * - Very High (≥90): 🚨 Emergency หรือ firm plan
 * 
 * @param {object} params - Confidence calculation parameters
 * @param {string} params.symptom - User's symptom description
 * @param {object} params.answers - Enriched answers object
 * @param {string} params.severity - Severity level (mild/moderate/severe)
 * @param {string} params.timeCourse - Time-course type (acute/subacute/progressive/chronic/recurrent)
 * @param {string} params.trajectory - Trajectory (worsening/stable/improving)
 * @param {boolean} params.redFlagsScreened - Whether red flags have been screened
 * @param {object} params.healthProfile - User's health profile (age, gender, chronic diseases, allergies)
 * @param {boolean} params.healthContextAnswered - Whether mandatory health context question was answered
 * @returns {object} { score: number, breakdown: object, level: string }
 */
/**
 * Calculate medical-grade confidence score
 * Enhanced with intent confidence_weight from 700-intent dataset
 * 
 * @param {Object} params
 * @param {string} params.symptom - Symptom text or intent_id
 * @param {Object} params.answers - Previous answers
 * @param {string} params.severity - Severity level (mild/moderate/severe)
 * @param {string} params.timeCourse - Time-course type
 * @param {string} params.trajectory - Trajectory (improving/worsening/stable)
 * @param {boolean} params.redFlagsScreened - Whether red flags were screened
 * @param {Object} params.healthProfile - Health profile
 * @param {boolean} params.healthContextAnswered - Whether health context was answered
 * @param {Object} params.intent - Optional intent object from 700-intent dataset
 * @returns {Object} { score: number, breakdown: Object }
 */
export function calculateMedicalGradeConfidence({
  symptom,
  answers,
  severity,
  timeCourse,
  trajectory,
  redFlagsScreened,
  healthProfile,
  healthContextAnswered,
  intent, // Optional intent object from 700-intent dataset
}) {
  let breakdown = {
    symptomClarity: 0,
    severityCertainty: 0,
    timeCourseCertainty: 0,
    redFlagExclusion: 0,
    contextCompleteness: 0,
  };
  
  // 1. Symptom clarity (0-20)
  // - อธิบายชัด / มี location / quality
  if (symptom && symptom.trim().length > 0) {
    breakdown.symptomClarity += 10; // Basic symptom provided
    
    // Check for location/quality descriptors
    const hasLocation = /ที่|บริเวณ|ข้าง|ซ้าย|ขวา|บน|ล่าง/.test(symptom);
    const hasQuality = /ปวด|เจ็บ|แสบ|คัน|ร้อน|เย็น|ตึง|บีบ/.test(symptom);
    const hasDuration = /เป็น|มานาน|เมื่อ|วัน|ชั่วโมง/.test(symptom);
    
    if (hasLocation) breakdown.symptomClarity += 3;
    if (hasQuality) breakdown.symptomClarity += 4;
    if (hasDuration) breakdown.symptomClarity += 3;
  }
  
  // 2. Severity certainty (0-20)
  // - ผู้ใช้ระบุความรุนแรงได้ชัด
  // - Impact ต่อชีวิตประจำวัน
  if (severity && severity !== 'unknown') {
    breakdown.severityCertainty += 10; // Severity level determined
    
    // Check if user explicitly described severity
    const severityKeywords = {
      mild: ['เล็กน้อย', 'นิดหน่อย', 'เบา', 'ไม่มาก'],
      moderate: ['ปานกลาง', 'พอทน', 'รบกวน'],
      severe: ['รุนแรง', 'มาก', 'ทนไม่ไหว', 'ไม่ไหว', 'ที่สุด'],
    };
    
    const symptomLower = symptom.toLowerCase();
    const severityKey = severity === 'mild' ? 'mild' : severity === 'moderate' ? 'moderate' : 'severe';
    if (severityKeywords[severityKey]?.some(kw => symptomLower.includes(kw))) {
      breakdown.severityCertainty += 5; // User explicitly described severity
    }
    
    // Impact on daily life
    if (answers.impact || answers.functional_impact) {
      breakdown.severityCertainty += 5;
    } else if (/รบกวน|ใช้ชีวิต|นอน|กิน|ทำงาน/.test(symptom)) {
      breakdown.severityCertainty += 3;
    }
  }
  
  // 3. Time-course certainty (0-20)
  // - onset + trajectory (ดีขึ้น / แย่ลง)
  if (timeCourse && timeCourse !== 'unknown') {
    breakdown.timeCourseCertainty += 10; // Time-course determined
    
    // Check for onset information
    if (answers.duration || answers.onset) {
      breakdown.timeCourseCertainty += 5;
    }
    
    // Check for trajectory
    if (trajectory && trajectory !== 'unknown') {
      breakdown.timeCourseCertainty += 5;
    } else if (answers.severity_trend || answers.trend) {
      breakdown.timeCourseCertainty += 3;
    }
  }
  
  // 4. Red flag exclusion (0-20)
  // - คำถาม red flag ถูกถามและปฏิเสธครบ
  if (redFlagsScreened) {
    breakdown.redFlagExclusion += 15; // Red flags screened
    
    // Additional points if explicitly answered "no" to red flags
    if (answers.redFlagScreeningPassed === true) {
      breakdown.redFlagExclusion += 5;
    }
  } else if (answers.redFlagScreeningStarted) {
    breakdown.redFlagExclusion += 5; // Screening started but not completed
  }
  
  // 5. Patient context completeness (0-20)
  // - อายุ / โรคประจำตัว / ยา / แพ้ยา
  let contextScore = 0;
  
  // Age
  if (healthProfile?.age !== null && healthProfile?.age !== undefined) {
    contextScore += 5;
  } else if (answers.age) {
    contextScore += 5;
  }
  
  // Chronic diseases
  if (healthProfile?.chronicDiseases?.length > 0) {
    contextScore += 5;
  } else if (answers.chronic_disease || answers.health_context?.includes('โรค')) {
    contextScore += 3;
  }
  
  // Medications
  if (healthProfile?.medications?.length > 0) {
    contextScore += 5;
  } else if (answers.medications || answers.health_context?.includes('ยา')) {
    contextScore += 3;
  }
  
  // Allergies
  if (healthProfile?.allergies?.length > 0) {
    contextScore += 5;
  } else if (answers.allergies || answers.health_context?.includes('แพ้')) {
    contextScore += 3;
  }
  
  // Mandatory health context question answered
  if (healthContextAnswered) {
    contextScore += 5; // Critical: must answer before summarizing
  }
  
  breakdown.contextCompleteness = Math.min(contextScore, 20);
  
  // Calculate total score
  let totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  
  // CRITICAL IMPROVEMENT: Add intent confidence_weight boost (from 700-intent dataset)
  // Intent confidence_weight ranges from 0.02-0.15, multiply by 100 to get percentage boost
  if (intent) {
    // Extract confidence_weight from intent object (supports both snake_case and camelCase)
    const intentWeight = intent.confidence_weight || intent.confidenceWeight || intent.confidence?.weight || 0;
    if (intentWeight > 0) {
      const intentConfidenceBoost = Math.min(intentWeight * 100, 15); // Convert 0.05 -> 5%, cap at 15 points
      totalScore += intentConfidenceBoost;
      breakdown.intentConfidenceBoost = intentConfidenceBoost;
      console.log(`[CONFIDENCE-CALC] Intent confidence_weight: ${intentWeight} → +${intentConfidenceBoost}% boost`);
    }
  }
  
  // Determine confidence level
  let level = 'low';
  if (totalScore >= 90) {
    level = 'very_high';
  } else if (totalScore >= 80) {
    level = 'high';
  } else if (totalScore >= 60) {
    level = 'medium';
  } else {
    level = 'low';
  }
  
  return {
    score: Math.min(totalScore, 100),
    breakdown,
    level,
  };
}

/**
 * Get next question priority based on what's missing
 * IMPROVED: Adaptive with randomization within priority tiers
 * 
 * Priority tiers (can randomize within each tier):
 * Tier 1: Trajectory (ดีขึ้น / แย่ลง) - Critical for triage
 * Tier 2: Time anchor (เริ่มเมื่อไหร่) - Critical for diagnosis
 * Tier 3: Impact, Modifiers - Important for treatment
 * Tier 4: Context - Safety check
 * 
 * NEW: Randomizes order within tiers to avoid robotic sequences
 */
export function getNextQuestionPriority({
  severity,
  timeCourse,
  trajectory,
  hasDuration,
  hasImpact,
  hasModifiers,
  hasContext,
  questionsAsked = [],
  answers = {},
  symptom = null, // NEW: Add symptom for context-aware adaptation
  hypotheses = null, // NEW: Add hypotheses for information gain
}) {
  // Helper: Check if question was already asked (context-aware)
  const wasAsked = (questionText) => {
    if (!Array.isArray(questionsAsked) || questionsAsked.length === 0) return false;
    return questionsAsked.some(q => {
      if (typeof q !== 'string') return false;
      const normalizedQ = normalizeThaiText(q.toLowerCase());
      const normalizedText = normalizeThaiText(questionText.toLowerCase());
      return normalizedQ.includes(normalizedText.substring(0, 15)) || 
             normalizedText.includes(normalizedQ.substring(0, 15));
    });
  };
  
  // Helper: Extract context from answers to skip redundant questions
  const extractContextFromAnswers = (answers) => {
    const context = {
      hasTrajectory: false,
      hasDuration: false,
      hasImpact: false,
      hasModifiers: false,
    };
    
    // Check if trajectory info already provided
    if (answers.severity_trend || answers.severity_trajectory || 
        (answers.trend && typeof answers.trend === 'string' && 
         (answers.trend.includes('ดีขึ้น') || answers.trend.includes('แย่ลง') || answers.trend.includes('เหมือนเดิม')))) {
      context.hasTrajectory = true;
    }
    
    // Check if duration info already provided
    if (answers.duration || answers.duration_hours || answers.onset || 
        (answers.time_course && answers.time_course !== 'unknown')) {
      context.hasDuration = true;
    }
    
    // Check if impact info already provided
    if (answers.impact || answers.functional_impact || 
        (symptom && typeof symptom === 'string' && (symptom.includes('นอนไม่หลับ') || symptom.includes('ทำงานไม่ได้')))) {
      context.hasImpact = true;
    }
    
    // Check if modifiers info already provided
    if (answers.aggravating_factors || answers.relieving_factors || answers.modifiers ||
        (symptom && typeof symptom === 'string' && (symptom.includes('เมื่อ') || symptom.includes('เวลา')))) {
      context.hasModifiers = true;
    }
    
    return context;
  };
  
  const extractedContext = extractContextFromAnswers(answers);
  
  // Generate variation seed for randomization within tiers
  const variationSeed = (questionsAsked?.length || 0) * 7 + 
                       (symptom && typeof symptom === 'string' ? symptom.length : 0) * 11 + 
                       Date.now() % 1000;
  
  // Tier 1: Critical questions (Trajectory, Time) - Randomize order
  const tier1Questions = [];
  
  if (!trajectory && !extractedContext.hasTrajectory && !wasAsked('ดีขึ้น')) {
    tier1Questions.push({
      priority: 1,
      category: 'trajectory',
      question: 'อาการแย่ลง ดีขึ้น หรือเหมือนเดิมคะ?',
      informationGain: 0.8, // High gain for triage decision
    });
  }
  
  const wasAskedDuration = Array.isArray(questionsAsked) && questionsAsked.some(q => 
    typeof q === 'string' && (
      q.includes('นานเท่าไหร่') || 
      q.includes('เริ่มเมื่อไหร่') || 
      q.includes('เป็นมานาน') ||
      q.includes('เมื่อไหร่') ||
      q.includes('เปลี่ยนเมื่อไหร่')
    )
  );
  const hasDurationAnswer = hasDuration || answers.duration || answers.duration_hours || answers.onset;
  
  if ((!hasDuration || !timeCourse) && !wasAskedDuration && !hasDurationAnswer && !extractedContext.hasDuration) {
    // Vary duration question phrasing for less robotic feel
    const durationQuestions = [
      'อาการนี้เริ่มเมื่อไหร่คะ?',
      'อาการนี้เป็นมานานเท่าไหร่แล้วคะ?',
      'อาการนี้เกิดขึ้นเมื่อไหร่คะ?',
    ];
    const selectedDurationQ = durationQuestions[variationSeed % durationQuestions.length];
    
    tier1Questions.push({
      priority: 1,
      category: 'time_anchor',
      question: selectedDurationQ,
      informationGain: 0.7, // High gain for diagnosis
    });
  }
  
  // Randomize within Tier 1 if multiple questions available
  if (tier1Questions.length > 0) {
    // If hypotheses available, prioritize by information gain
    if (hypotheses && Array.isArray(hypotheses) && hypotheses.length > 0) {
      tier1Questions.sort((a, b) => b.informationGain - a.informationGain);
    } else {
      // Randomize order within tier
      const shuffled = [...tier1Questions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = (variationSeed + i) % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled[0];
    }
    return tier1Questions[0];
  }
  
  // Tier 2: Important questions (Impact, Modifiers) - Randomize order
  const tier2Questions = [];
  
  if (!hasImpact && !extractedContext.hasImpact && !wasAsked('รบกวน')) {
    tier2Questions.push({
      priority: 2,
      category: 'impact',
      question: 'อาการรบกวนการใช้ชีวิต / นอน / กิน / ทำงานไหมคะ?',
      informationGain: 0.5,
    });
  }
  
  if (!hasModifiers && !extractedContext.hasModifiers && !wasAsked('ทำให้')) {
    // Clear, specific modifier questions (replaced confusing "มีปัจจัยอะไรที่ส่งผลต่ออาการไหมคะ?")
    // These questions are easier to understand and answer
    const modifierQuestions = [
      'มีอะไรที่ทำให้อาการแย่ลงไหมคะ?', // What makes symptoms worse? (Clear, specific)
      'มีอะไรที่ทำให้อาการดีขึ้นไหมคะ?', // What makes symptoms better? (Clear, specific)
    ];
    const selectedModifierQ = modifierQuestions[variationSeed % modifierQuestions.length];
    
    tier2Questions.push({
      priority: 2,
      category: 'modifiers',
      question: selectedModifierQ,
      informationGain: 0.4,
    });
  }
  
  // Randomize within Tier 2
  if (tier2Questions.length > 0) {
    const shuffled = [...tier2Questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (variationSeed + i) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled[0];
  }
  
  // Tier 3: Safety check (Context) - Always last
  // Health context check - REMOVED per user request
  // Health data (chronic diseases, allergies, pregnancy) should be pulled from health profile
  // if (!hasContext) {
  //   return {
  //     priority: 3,
  //     category: 'context',
  //     question: 'ข้อมูลด้านสุขภาพหรืออาการสำคัญที่ยังไม่ได้แจ้งไหมคะ? เช่น โรคประจำตัว ยาที่ทานอยู่ การแพ้ยา',
  //     informationGain: 0.3,
  //   };
  // }
  
  return null; // All information collected
}

/**
 * Check if symptom has emergency trigger (red flag)
 * @param {string} symptomKeyword - Symptom keyword
 * @returns {boolean} True if symptom has emergency trigger
 */
export function hasEmergencyTrigger(symptomKeyword) {
  const severityDef = getSymptomSeverity(symptomKeyword);
  return severityDef && severityDef.emergencyTrigger !== null && severityDef.emergencyTrigger !== undefined;
}

/**
 * Get emergency trigger description for symptom
 * @param {string} symptomKeyword - Symptom keyword
 * @returns {string|null} Emergency trigger description or null
 */
export function getEmergencyTrigger(symptomKeyword) {
  const severityDef = getSymptomSeverity(symptomKeyword);
  return severityDef ? severityDef.emergencyTrigger : null;
}
