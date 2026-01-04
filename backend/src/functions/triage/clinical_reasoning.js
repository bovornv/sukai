/**
 * Clinical Reasoning Engine
 * Doctor-level adaptive triage logic
 * Uses risk scoring and conditional questioning instead of fixed question sets
 */

import {
  normalizeThaiText,
  extractDuration,
  detectSeverity,
  isWorsening,
  triedSelfCare,
} from './thai_normalizer.js';
import { getSymptomSpecificQuestion, SYMPTOM_QUESTION_MAP } from './symptom_question_map.js';
import { selectQuestionByInformationGain } from './medical_reasoning.js';

/**
 * Risk scoring system
 * Each answer adds/subtracts risk points
 * Thresholds determine triage level
 */
const RISK_THRESHOLDS = {
  self_care: 0,      // 0-30 points
  gp: 31,            // 31-70 points
  emergency: 71,     // 71+ points
};

/**
 * Risk factors and their scores
 */
const RISK_FACTORS = {
  // Red flags (highest risk)
  red_flags: {
    'หายใจลำบาก': 50,
    'หายใจไม่ออก': 60,
    'เจ็บหน้าอกรุนแรง': 55,
    'หมดสติ': 70,
    'ชัก': 70,
    'ไข้สูงมาก': 40,
    'ซึม': 45,
    'แขนขาอ่อนแรง': 50,
    'พูดไม่ชัด': 50,
  },
  
  // Severity
  severity: {
    'รุนแรง': 30,
    'มาก': 25,
    'ทนไม่ไหว': 35,
    'ไม่ไหว': 30,
    'ปานกลาง': 10,
    'เบา': -5,
    'นิดหน่อย': -10,
  },
  
  // Duration
  duration: {
    'มากกว่า 7 วัน': 15,
    '3-7 วัน': 10,
    '1-3 วัน': 5,
    'น้อยกว่า 1 วัน': 0,
  },
  
  // Trend
  trend: {
    'แย่ลง': 20,
    'เหมือนเดิม': 5,
    'ดีขึ้น': -5,
  },
  
  // Risk groups
  risk_group: {
    'เด็ก (< 2 ปี)': 15,
    'ผู้สูงอายุ (> 65 ปี)': 15,
    'ตั้งครรภ์': 20,
    'โรคประจำตัว': 10,
    'ไม่มี': 0,
  },
  
  // Self-care response
  self_care: {
    'ไม่ดีขึ้น': 15,
    'ดีขึ้น': -5,
    'เหมือนเดิม': 5,
    'ยังไม่ลอง': 0,
  },
  
  // Associated symptoms
  associated: {
    'ไข้สูง': 15,
    'คลื่นไส้': 10,
    'อาเจียน': 10,
    'ใจสั่น': 15,
    'ชา': 15,
    'อ่อนแรง': 20,
    'ไม่มี': 0,
  },
};

/**
 * Clinical question categories
 * Questions organized by clinical importance
 */
export const QUESTION_CATEGORIES = {
  red_flags: {
    name: 'Red Flags',
    priority: 1, // Highest priority
    questions: [
      {
        key: 'breathing',
        text: 'มีหายใจลำบากหรือหายใจไม่ออกไหมคะ?',
        riskFactor: 'red_flags',
      },
      {
        key: 'chest_pain',
        text: 'มีเจ็บหน้าอกรุนแรงไหมคะ?',
        riskFactor: 'red_flags',
      },
      {
        key: 'consciousness',
        text: 'มีหมดสติหรือชักไหมคะ?',
        riskFactor: 'red_flags',
      },
      {
        key: 'fever_severe',
        text: 'มีไข้สูงมากหรือซึมมากไหมคะ?',
        riskFactor: 'red_flags',
      },
    ],
  },
  
  symptom_characterization: {
    name: 'Symptom Characterization',
    priority: 2,
    questions: [
      {
        key: 'location',
        text: 'ปวดตรงไหนคะ? (เช่น หน้าผาก, ขมับ, ท้ายทอย)',
        riskFactor: null, // Contextual - helps differential diagnosis
      },
      {
        key: 'severity',
        text: 'ปวดมากแค่ไหนคะ? (มาก / ปานกลาง / นิดหน่อย)',
        riskFactor: 'severity',
      },
      {
        key: 'quality',
        text: 'ปวดแบบไหนคะ? (ปวดจี๊ด / ปวดตื้อ / แน่น / แสบ)',
        riskFactor: null, // Contextual - helps differentiate conditions
      },
      {
        key: 'aggravating_factors',
        text: 'มีอะไรที่ทำให้อาการแย่ลงไหมคะ? (เช่น แสง, เสียง, การเคลื่อนไหว)',
        riskFactor: null, // Differential diagnosis
      },
      {
        key: 'relieving_factors',
        text: 'มีอะไรที่ทำให้อาการดีขึ้นไหมคะ? (เช่น การพักผ่อน, ยา, การนวด)',
        riskFactor: null, // Differential diagnosis
      },
    ],
  },
  
  timeline: {
    name: 'Timeline',
    priority: 3,
    questions: [
      {
        key: 'duration',
        text: 'อาการนี้เป็นมานานเท่าไหร่แล้วคะ?',
        riskFactor: 'duration',
      },
      {
        key: 'trend',
        text: 'อาการแย่ลง ดีขึ้น หรือเหมือนเดิมคะ?',
        riskFactor: 'trend',
      },
      {
        key: 'pattern',
        text: 'เป็นต่อเนื่องหรือเป็น ๆ หาย ๆ คะ?',
        riskFactor: null, // Contextual
      },
    ],
  },
  
  // MEDICAL-GRADE: Trajectory questions (Priority 1 after first question)
  trajectory: {
    name: 'Trajectory',
    priority: 1,
    questions: [
      {
        key: 'trajectory',
        text: 'อาการแย่ลง ดีขึ้น หรือเหมือนเดิมคะ?',
        riskFactor: 'trend',
      },
    ],
  },
  
  // MEDICAL-GRADE: Impact questions (Priority 3)
  impact: {
    name: 'Impact',
    priority: 3,
    questions: [
      {
        key: 'functional_impact',
        text: 'อาการรบกวนการใช้ชีวิต / นอน / กิน / ทำงานไหมคะ?',
        riskFactor: 'severity',
      },
    ],
  },
  
  // MEDICAL-GRADE: Modifiers questions (Priority 4)
  modifiers: {
    name: 'Modifiers',
    priority: 4,
    questions: [
      {
        key: 'aggravating_factors',
        text: 'มีอะไรที่ทำให้อาการแย่ลงไหมคะ?',
        riskFactor: null,
      },
      {
        key: 'relieving_factors',
        text: 'มีอะไรที่ทำให้อาการดีขึ้นไหมคะ?',
        riskFactor: null,
      },
    ],
  },
  
  associated_symptoms: {
    name: 'Associated Symptoms',
    priority: 4,
    questions: [
      {
        key: 'fever',
        text: 'มีไข้ร่วมด้วยไหมคะ? ถ้ามี ไข้สูงเท่าไหร่คะ?',
        riskFactor: 'associated',
      },
      {
        key: 'nausea',
        text: 'มีคลื่นไส้หรืออาเจียนไหมคะ?',
        riskFactor: 'associated',
      },
      {
        key: 'neurological',
        text: 'มีชา อ่อนแรง หรือพูดไม่ชัดไหมคะ?',
        riskFactor: 'associated',
      },
      {
        key: 'cardiac',
        text: 'มีใจสั่นหรือเจ็บหน้าอกไหมคะ?',
        riskFactor: 'associated',
      },
      {
        key: 'cough',
        text: 'มีไอไหมคะ? ถ้ามี ไอแบบไหนคะ? (แห้ง / มีเสมหะ / เสมหะสีอะไร)',
        riskFactor: 'associated',
      },
      {
        key: 'rash',
        text: 'มีผื่นหรืออาการทางผิวหนังไหมคะ?',
        riskFactor: 'associated',
      },
    ],
  },
  
  patient_context: {
    name: 'Patient Context',
    priority: 5,
    questions: [
      {
        key: 'age',
        text: 'คุณอายุเท่าไหร่คะ?',
        riskFactor: 'risk_group',
      },
      {
        key: 'chronic_disease',
        text: 'มีโรคประจำตัวไหมคะ?',
        riskFactor: 'risk_group',
      },
      {
        key: 'pregnancy',
        text: 'ตั้งครรภ์อยู่ไหมคะ?',
        riskFactor: 'risk_group',
      },
      {
        key: 'medications',
        text: 'ใช้ยาอะไรอยู่บ้างคะ?',
        riskFactor: null, // Contextual
      },
      {
        key: 'allergy',
        text: 'แพ้ยาอะไรไหมคะ?',
        riskFactor: null, // Safety
      },
    ],
  },
  
  // Health context check - REMOVED per user request
  // Health data should be pulled from health profile instead
  // health_context_check: {
  //   name: 'Health Context Check',
  //   priority: 99,
  //   questions: [
  //     {
  //       key: 'health_context',
  //       text: 'ข้อมูลด้านสุขภาพหรืออาการสำคัญที่ยังไม่ได้แจ้งไหมคะ? เช่น โรคประจำตัว ยาที่ทานอยู่ การแพ้ยา การตั้งครรภ์ หรืออาการผิดปกติอื่น',
  //       riskFactor: null,
  //     },
  //   ],
  // },
  
  treatment_response: {
    name: 'Response to Treatment',
    priority: 6,
    questions: [
      {
        key: 'self_care',
        text: 'เคยลองดูแลตัวเองหรือใช้ยาอะไรแล้วไหมคะ?',
        riskFactor: 'self_care',
      },
      {
        key: 'improvement',
        text: 'ดีขึ้นไหมคะ?',
        riskFactor: 'self_care',
      },
      {
        key: 'allergy',
        text: 'แพ้ยาอะไรไหมคะ?',
        riskFactor: null, // Safety
      },
    ],
  },
  
  // OTC Clarifying Questions - Ask until confident we can recommend 2 safe OTC options
  otc_clarifying: {
    name: 'OTC Clarifying Questions',
    priority: 4.5, // After associated symptoms, before patient context
    questions: [
      {
        key: 'duration_hours',
        text: 'อาการนี้เป็นมานานเท่าไหร่แล้วคะ? (ชั่วโมง/วัน)',
        riskFactor: 'duration',
      },
      {
        key: 'fever_temp',
        text: 'มีไข้ไหมคะ? ถ้ามี อุณหภูมิเท่าไหร่คะ?',
        riskFactor: 'associated',
      },
      {
        key: 'main_symptom',
        text: 'อาการหลักคืออะไรคะ? (เลือก): น้ำมูก/คัดจมูก/ไอ/เจ็บคอ/ปวดหัว/ปวดเมื่อย/ท้องเสีย/คลื่นไส้/ผื่นคัน',
        riskFactor: null, // Helps select OTC category
      },
      {
        key: 'cough_type',
        text: 'มีเสมหะไหมคะ? ถ้ามี สีอะไรคะ? (ใส/ขาว/เขียว/เหลือง)',
        riskFactor: 'associated',
      },
      {
        key: 'gi_bleeding',
        text: 'ถ่ายเป็นเลือดหรืออาเจียนมากไหมคะ?',
        riskFactor: 'red_flags',
      },
      {
        key: 'child_weight',
        text: 'เด็กอายุต่ำกว่า 12 ปีหรือไม่คะ? ถ้าใช่ น้ำหนักเท่าไหร่คะ? (จำเป็นสำหรับคำนวณขนาดยา)',
        riskFactor: null, // Required for pediatric dosing
      },
      {
        key: 'current_meds',
        text: 'ตอนนี้กินยาอะไรอยู่แล้วบ้างคะ? (โดยเฉพาะยาละลายลิ่มเลือด/NSAIDs/สเตียรอยด์)',
        riskFactor: null, // Drug interaction check
      },
    ],
  },
};

/**
 * Calculate risk score from answers and symptom
 */
export function calculateRiskScore(symptom, answers) {
  let riskScore = 0;
  const normalizedSymptom = normalizeThaiText(symptom);
  
  // Check for red flags in symptom text
  for (const [flag, score] of Object.entries(RISK_FACTORS.red_flags)) {
    if (normalizedSymptom.includes(flag)) {
      riskScore += score;
    }
  }
  
  // Add risk from severity
  const detectedSeverity = detectSeverity(symptom);
  if (detectedSeverity === 'high') {
    riskScore += RISK_FACTORS.severity['รุนแรง'];
  } else if (detectedSeverity === 'low') {
    riskScore += RISK_FACTORS.severity['เบา'];
  }
  
  // Add risk from duration
  // CRITICAL: extractDuration returns a NUMBER (days), not a string
  const extractedDuration = extractDuration(symptom);
  if (extractedDuration !== null && typeof extractedDuration === 'number') {
    const durationDays = extractedDuration;
    if (durationDays > 7) {
      riskScore += RISK_FACTORS.duration['มากกว่า 7 วัน'];
    } else if (durationDays >= 3) {
      riskScore += RISK_FACTORS.duration['3-7 วัน'];
    } else if (durationDays >= 1) {
      riskScore += RISK_FACTORS.duration['1-3 วัน'];
    }
  }
  
  // Add risk from answers
  if (answers.severity && RISK_FACTORS.severity[answers.severity]) {
    riskScore += RISK_FACTORS.severity[answers.severity];
  }
  
  if (answers.trend && RISK_FACTORS.trend[answers.trend]) {
    riskScore += RISK_FACTORS.trend[answers.trend];
  }
  
  if (answers.risk_group && RISK_FACTORS.risk_group[answers.risk_group]) {
    riskScore += RISK_FACTORS.risk_group[answers.risk_group];
  }
  
  if (answers.self_care_response && RISK_FACTORS.self_care[answers.self_care_response]) {
    riskScore += RISK_FACTORS.self_care[answers.self_care_response];
  }
  
  if (answers.associated_symptoms) {
    const associated = answers.associated_symptoms.toLowerCase();
    for (const [symptom, score] of Object.entries(RISK_FACTORS.associated)) {
      if (associated.includes(symptom.toLowerCase())) {
        riskScore += score;
      }
    }
  }
  
  return Math.max(0, riskScore); // Don't go below 0
}

/**
 * Determine triage level from risk score
 */
export function determineTriageFromRisk(riskScore) {
  if (riskScore >= RISK_THRESHOLDS.emergency) {
    return 'emergency';
  } else if (riskScore >= RISK_THRESHOLDS.gp) {
    return 'gp';
  } else {
    return 'self_care';
  }
}

/**
 * Check if question changes triage level
 * Only ask questions that would change the recommendation
 */
export function wouldQuestionChangeTriage(currentRiskScore, questionRiskFactor, answerValue) {
  if (!questionRiskFactor || !RISK_FACTORS[questionRiskFactor]) {
    return true; // Ask contextual questions
  }
  
  // Calculate risk with this answer
  const answerRisk = RISK_FACTORS[questionRiskFactor][answerValue] || 0;
  const newRiskScore = currentRiskScore + answerRisk;
  
  // Check if triage level would change
  const currentTriage = determineTriageFromRisk(currentRiskScore);
  const newTriage = determineTriageFromRisk(newRiskScore);
  
  return currentTriage !== newTriage;
}

/**
 * Check if mandatory health context check is needed
 * MANDATORY: Must ask AND get answer before summarizing (unless emergency)
 * This is a catch-all question to ensure no important health info is missed
 * Even if we have mandatory health data, we still ask this as a final check
 */
export function needsHealthContextCheck(answers, questionCount, triageLevel, questionsAsked = []) {
  // Health context check - REMOVED per user request
  // Always return false to disable this question
  return false;
}

/**
 * Check if mandatory health data is complete before OTC recommendation
 * Medical-grade gate: must have all required health data
 */
export function hasMandatoryHealthData(healthProfile, answers) {
  // Required fields:
  // - เพศ (gender)
  // - วันเดือนปีเกิด (birth_date -> age)
  // - น้ำหนัก (weight_kg)
  // - ส่วนสูง (height_cm) - optional but preferred
  // - โรคประจำตัว (chronic_diseases) - can be empty array (but must be defined)
  // - ประวัติแพ้ยา (drug_allergies) - can be empty array (but must be defined)
  // - ตั้งครรภ์/ให้นมบุตร (pregnancy/breastfeeding) - only for females
  
  const hasGender = healthProfile?.gender || answers.gender;
  const hasAge = (healthProfile?.age !== null && healthProfile?.age !== undefined) || 
    (answers.age !== null && answers.age !== undefined) ||
    healthProfile?.birthDate || answers.birth_date;
  const hasWeight = (healthProfile?.weightKg !== null && healthProfile?.weightKg !== undefined) ||
    (answers.weight_kg !== null && answers.weight_kg !== undefined) ||
    (answers.child_weight !== null && answers.child_weight !== undefined);
  
  // Check if chronic diseases is defined (can be empty array)
  const hasChronicDiseases = Array.isArray(healthProfile?.chronicDiseases) ||
    healthProfile?.chronicDiseases !== undefined ||
    answers.chronic_disease !== undefined ||
    answers.chronic_diseases !== undefined;
  
  // Check if drug allergies is defined (can be empty array)
  const hasDrugAllergies = Array.isArray(healthProfile?.drugAllergies) ||
    healthProfile?.drugAllergies !== undefined ||
    answers.allergy !== undefined ||
    answers.drug_allergies !== undefined;
  
  // Pregnancy/breastfeeding: Check health profile or answers
  // Health context question removed, so we rely on health profile data
  const isFemale = healthProfile?.gender === 'female' || answers.gender === 'female';
  const hasHealthContext = !isFemale || // Males don't need this
    healthProfile?.pregnancy !== undefined || // Check health profile first
    healthProfile?.breastfeeding !== undefined ||
    answers.pregnancy !== undefined ||
    answers.breastfeeding !== undefined ||
    answers.health_context !== undefined; // If user mentioned it in answers, use it
  
  return hasGender && hasAge && hasWeight && hasChronicDiseases && hasDrugAllergies && hasHealthContext;
}

/**
 * Check if we can confidently recommend 2 OTC options
 * Returns true if we have enough info, false if we need more questions
 * Medical-grade: Must have mandatory health data + symptom info
 */
export function canRecommendOTCs(symptom, answers, triageLevel, healthProfile) {
  // Don't need OTCs for emergency
  if (triageLevel === 'emergency') {
    return true; // Not applicable
  }
  
  // MANDATORY: Must have all health data before recommending OTCs
  if (!hasMandatoryHealthData(healthProfile, answers)) {
    return false;
  }
  
  // For self_care, we need enough info to select 2 safe OTCs
  if (triageLevel === 'self_care') {
    const normalizedSymptom = normalizeThaiText(symptom.toLowerCase());
    
    // Check if we have main symptom identified
    const hasMainSymptom = answers.main_symptom || 
      normalizedSymptom.includes('ปวด') ||
      normalizedSymptom.includes('ไข้') ||
      normalizedSymptom.includes('เจ็บคอ') ||
      normalizedSymptom.includes('ไอ') ||
      normalizedSymptom.includes('น้ำมูก') ||
      normalizedSymptom.includes('คัดจมูก') ||
      normalizedSymptom.includes('ท้องเสีย') ||
      normalizedSymptom.includes('คลื่นไส้');
    
    // Check if we have duration
    const hasDuration = answers.duration || answers.duration_hours;
    
    // Check if we have fever info (if relevant)
    const hasFeverInfo = answers.fever !== undefined || answers.fever_temp !== undefined || 
      !normalizedSymptom.includes('ไข้');
    
    // For children, we need weight for dosing
    const isChild = (healthProfile?.age && healthProfile.age < 15) || 
      (answers.age && answers.age < 15);
    const hasChildWeight = !isChild || (isChild && (healthProfile?.weightKg || answers.child_weight));
    
    // We need: main symptom + duration + (fever info if relevant) + (weight if child)
    return hasMainSymptom && hasDuration && hasFeverInfo && hasChildWeight;
  }
  
  return true; // For GP level, OTCs are optional
}

/**
 * Get question for missing mandatory health data
 * REMOVED per user request - Health data should come from health profile
 * This function is disabled but kept for reference
 */
export function getMissingHealthDataQuestion(healthProfile, answers, questionsAsked) {
  // REMOVED: Health data questions should not be asked
  // Health data (chronic diseases, allergies, pregnancy) should be pulled from health profile
  return null; // Always return null - never ask health data questions
  const wasAsked = (key) => {
    if (!Array.isArray(questionsAsked)) return false;
    return questionsAsked.some(q => {
      if (typeof q === 'string') {
        return q.includes(key);
      }
      return false;
    });
  };
  
  // Priority order: gender, age/birth_date, weight, chronic diseases, drug allergies, pregnancy/breastfeeding
  
  if (!healthProfile?.gender && !answers.gender && !wasAsked('เพศ')) {
    return 'กรุณาแจ้งเพศของคุณค่ะ (ชาย/หญิง/อื่นๆ)';
  }
  
  if ((healthProfile?.age === null || healthProfile?.age === undefined) && 
      !answers.age && 
      !healthProfile?.birthDate && 
      !answers.birth_date && 
      !wasAsked('อายุ') && 
      !wasAsked('วันเกิด')) {
    return 'กรุณาแจ้งอายุหรือวันเดือนปีเกิดของคุณค่ะ (จำเป็นสำหรับคำนวณขนาดยา)';
  }
  
  if ((healthProfile?.weightKg === null || healthProfile?.weightKg === undefined) && 
      !answers.weight_kg && 
      !answers.child_weight && 
      !wasAsked('น้ำหนัก')) {
    return 'กรุณาแจ้งน้ำหนักของคุณค่ะ (กก.) (จำเป็นสำหรับคำนวณขนาดยา)';
  }
  
  if (healthProfile?.chronicDiseases === undefined && 
      answers.chronic_disease === undefined && 
      answers.chronic_diseases === undefined && 
      !wasAsked('โรคประจำตัว')) {
    return 'คุณมีโรคประจำตัวไหมคะ? (ถ้าไม่มีให้ตอบ "ไม่มี")';
  }
  
  if (healthProfile?.drugAllergies === undefined && 
      answers.allergy === undefined && 
      answers.drug_allergies === undefined && 
      !wasAsked('แพ้ยา')) {
    return 'คุณแพ้ยาอะไรไหมคะ? (ถ้าไม่มีให้ตอบ "ไม่มี")';
  }
  
  // Check pregnancy/breastfeeding (especially for females)
  const isFemale = healthProfile?.gender === 'female' || answers.gender === 'female';
  if (isFemale && 
      answers.pregnancy === undefined && 
      answers.breastfeeding === undefined && 
      (!answers.health_context || (!answers.health_context.includes('ตั้งครรภ์') && !answers.health_context.includes('ให้นม'))) &&
      !wasAsked('ตั้งครรภ์') && 
      !wasAsked('ให้นม')) {
    return 'คุณตั้งครรภ์หรือให้นมบุตรอยู่ไหมคะ? (ถ้าไม่มีให้ตอบ "ไม่มี")';
  }
  
  return null; // All health data present
}

/**
 * Get next OTC clarifying question
 * Returns question text or null if no more needed
 * PRIORITY: Ask for missing health data FIRST
 */
export function getNextOTCQuestion(symptom, answers, questionsAsked, healthProfile) {
  const wasAsked = (key) => {
    if (!Array.isArray(questionsAsked)) return false;
    return questionsAsked.some(q => {
      if (typeof q === 'string') {
        return q.includes(key) || q.includes(QUESTION_CATEGORIES.otc_clarifying.questions.find(q => q.key === key)?.text || '');
      }
      return false;
    });
  };
  
  // Health data questions - REMOVED per user request
  // Health data (chronic diseases, allergies, pregnancy) should be pulled from health profile
  // const missingHealthDataQuestion = getMissingHealthDataQuestion(healthProfile, answers, questionsAsked);
  // if (missingHealthDataQuestion) {
  //   return missingHealthDataQuestion;
  // }
  
  const normalizedSymptom = normalizeThaiText(symptom.toLowerCase());
  const isChild = (healthProfile?.age && healthProfile.age < 15) || 
    (answers.age && answers.age < 15);
  
  // Then: Ask symptom-specific clarifying questions
  // Priority order for OTC clarifying questions
  if (!answers.duration_hours && !answers.duration && !wasAsked('duration_hours')) {
    return QUESTION_CATEGORIES.otc_clarifying.questions.find(q => q.key === 'duration_hours')?.text;
  }
  
  if ((normalizedSymptom.includes('ไข้') || answers.fever) && 
      !answers.fever_temp && !wasAsked('fever_temp')) {
    return QUESTION_CATEGORIES.otc_clarifying.questions.find(q => q.key === 'fever_temp')?.text;
  }
  
  if (!answers.main_symptom && !wasAsked('main_symptom')) {
    return QUESTION_CATEGORIES.otc_clarifying.questions.find(q => q.key === 'main_symptom')?.text;
  }
  
  if ((normalizedSymptom.includes('ไอ') || answers.cough) && 
      !answers.cough_type && !wasAsked('cough_type')) {
    return QUESTION_CATEGORIES.otc_clarifying.questions.find(q => q.key === 'cough_type')?.text;
  }
  
  if (isChild && !healthProfile?.weightKg && !answers.child_weight && !wasAsked('child_weight')) {
    return QUESTION_CATEGORIES.otc_clarifying.questions.find(q => q.key === 'child_weight')?.text;
  }
  
  if (!answers.current_meds && !wasAsked('current_meds')) {
    return QUESTION_CATEGORIES.otc_clarifying.questions.find(q => q.key === 'current_meds')?.text;
  }
  
  return null; // No more OTC questions needed
}

/**
 * Select next question adaptively with VARIATION
 * Core Principle: NEVER ask the same sequence for the same symptom
 * Uses clinical reasoning + variation to simulate doctor-like behavior
 * 
 * Variation mechanisms:
 * 1. Rotate question focus based on what's already answered
 * 2. Add randomization within priority levels
 * 3. Ask deeper questions when uncertain
 * 4. Reference previous answers to avoid repetition
 */
/**
 * Detect symptom type from text
 * Returns: 'pain', 'fever', 'cough', 'diarrhea', 'rash', 'nausea', 'headache', 'sore_throat', 'other'
 */
function detectSymptomType(normalizedSymptom) {
  // Check for specific symptom types (order matters - more specific first)
  if (normalizedSymptom.includes('ปวดหัว') || normalizedSymptom.includes('ปวดศีรษะ')) {
    return 'headache';
  }
  if (normalizedSymptom.includes('ไข้') || normalizedSymptom.includes('ตัวร้อน')) {
    return 'fever';
  }
  if (normalizedSymptom.includes('ไอ')) {
    return 'cough';
  }
  if (normalizedSymptom.includes('เจ็บคอ') || normalizedSymptom.includes('คอเจ็บ')) {
    return 'sore_throat';
  }
  if (normalizedSymptom.includes('ท้องเสีย') || normalizedSymptom.includes('ถ่ายเหลว')) {
    return 'diarrhea';
  }
  if (normalizedSymptom.includes('คลื่นไส้') || normalizedSymptom.includes('อาเจียน')) {
    return 'nausea';
  }
  if (normalizedSymptom.includes('ผื่น') || normalizedSymptom.includes('คัน')) {
    return 'rash';
  }
  if (normalizedSymptom.includes('ปวด') || normalizedSymptom.includes('เจ็บ')) {
    return 'pain';
  }
  return 'other';
}

/**
 * Select next question using adaptive clinical reasoning
 * 
 * 🎯 PRIMARY CLINICAL REASONING REFERENCE: severity_timecourse_matrix.js
 * CRITICAL RULE 1: Do NOT reuse the same question sequence for the same symptom
 *   - Use variation mechanisms (generateVariationSeed, shuffleArray)
 *   - Track questionsAsked to prevent duplicates
 *   - Rotate question focus based on what's already known
 */
export function selectNextQuestion(symptom, answers, questionsAsked, questionCount, sessionHistory = null) {
  // Max 6 questions (doctor-like: ask few but relevant)
  if (questionCount >= 6) {
    return null;
  }
  
  const normalizedSymptom = normalizeThaiText(symptom);
  const symptomType = detectSymptomType(normalizedSymptom); // Detect symptom type FIRST
  const currentRiskScore = calculateRiskScore(symptom, answers);
  const currentTriage = determineTriageFromRisk(currentRiskScore);
  
  // CRITICAL DEBUG: Log all parameters
  console.log(`[SELECT-NEXT-Q] symptom: "${symptom}", questionCount: ${questionCount}, questionsAsked.length: ${questionsAsked?.length || 0}, answers keys: ${Object.keys(answers).join(',')}`);
  
  // Helper: Check if question was already asked (enhanced similarity detection)
  // CRITICAL RULE 1: Prevent duplicate questions - check both exact match and semantic similarity
  const wasAsked = (questionText) => {
    if (!Array.isArray(questionsAsked) || questionsAsked.length === 0) return false;
    if (!questionText || typeof questionText !== 'string') return false;
    
    // Normalize for comparison
    const normalizedText = normalizeThaiText(questionText.toLowerCase().trim());
    if (normalizedText.length === 0) return false;
    
    // Key phrases that indicate similar questions (semantic similarity)
    // CRITICAL: Group duration-related phrases together to prevent duplicate duration questions
    const keyPhrases = [
      // Duration questions (GROUPED - all mean the same thing)
      'นานเท่าไหร่', 'นานแค่ไหน', 'เป็นมานาน', 'เริ่มเมื่อไหร่', 'เมื่อไหร่', 'เปลี่ยนเมื่อไหร่',
      'แย่ลง', 'ดีขึ้น', 'เหมือนเดิม', 'อาการเป็นอย่างไร',
      'ปวด', 'เจ็บ', 'แสบ', 'เมื่อย',
      'ไข้', 'อุณหภูมิ', 'ตัวร้อน',
      'หายใจ', 'หายใจลำบาก', 'หายใจไม่สะดวก',
      'เจ็บหน้าอก', 'แน่นอก',
      'ข้อมูลด้านสุขภาพ', 'โรคประจำตัว', 'ยาที่ทาน', 'แพ้ยา',
      'ตั้งครรภ์', 'ให้นม',
      'อายุ', 'น้ำหนัก', 'เพศ',
    ];
    
    // Extract key phrases from current question
    const currentKeyPhrases = keyPhrases.filter(phrase => normalizedText.includes(phrase));
    
    return questionsAsked.some(q => {
      if (typeof q !== 'string') return false;
      
      const normalizedQ = normalizeThaiText(q.toLowerCase().trim());
      if (normalizedQ.length === 0) return false;
      
      // 1. Exact match (after normalization)
      if (normalizedQ === normalizedText) return true;
      
      // 2. Substring match (one contains the other)
      if (normalizedQ.includes(normalizedText) || normalizedText.includes(normalizedQ)) {
        // But only if significant length (> 10 chars to avoid false positives)
        if (normalizedText.length > 10 || normalizedQ.length > 10) return true;
      }
      
      // 3. Key phrase match (semantic similarity)
      if (currentKeyPhrases.length > 0) {
        const qKeyPhrases = keyPhrases.filter(phrase => normalizedQ.includes(phrase));
        // If both questions share at least 2 key phrases, they're similar
        const sharedPhrases = currentKeyPhrases.filter(phrase => qKeyPhrases.includes(phrase));
        if (sharedPhrases.length >= 2) return true;
        // CRITICAL: Duration questions - if both contain duration-related phrases, they're the same
        const durationPhrases = ['นานเท่าไหร่', 'นานแค่ไหน', 'เป็นมานาน', 'เริ่มเมื่อไหร่', 'เมื่อไหร่', 'เปลี่ยนเมื่อไหร่'];
        const currentHasDuration = durationPhrases.some(phrase => normalizedText.includes(phrase));
        const qHasDuration = durationPhrases.some(phrase => normalizedQ.includes(phrase));
        if (currentHasDuration && qHasDuration) return true; // Both are duration questions
        // If they share 1 key phrase AND both are > 15 chars, likely similar
        if (sharedPhrases.length >= 1 && normalizedText.length > 15 && normalizedQ.length > 15) return true;
      }
      
      // 4. First 10 characters match (for very similar questions)
      if (normalizedText.length > 10 && normalizedQ.length > 10) {
        const textStart = normalizedText.substring(0, 10);
        const qStart = normalizedQ.substring(0, 10);
        if (textStart === qStart) return true;
      }
      
      return false;
    });
  };
  
  // VARIATION MECHANISM: Generate a variation seed based on:
  // - Question count (different focus at different stages)
  // - Current answers (rotate based on what's known)
  // - Session history (if same user/symptom, vary approach)
  // - Symptom type (different symptoms = different seed)
  const variationSeed = generateVariationSeed(questionCount, answers, sessionHistory, normalizedSymptom);
  
  // Helper: Shuffle array (for randomization within priority levels)
  // CRITICAL: Use proper Fisher-Yates shuffle with variation seed for reproducibility
  // But add extra entropy from time to ensure different sequences
  const shuffleArray = (array) => {
    if (array.length <= 1) return array;
    const shuffled = [...array];
    // Add extra entropy from current time (microseconds) to ensure variation
    const timeEntropy = Date.now() % 10000; // 0-9999
    const combinedSeed = variationSeed + timeEntropy + questionCount;
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Use proper Fisher-Yates with combined seed
      const j = Math.floor((combinedSeed * (i + 1) + i) % (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // Helper: Select question with variation (rotate focus)
  const selectWithVariation = (questions, focusKey = null) => {
    if (!questions || questions.length === 0) return null;
    
    // Filter out already asked questions (including similar ones)
    const unaskedQuestions = questions.filter(q => {
      if (!q || !q.text) return false;
      return !wasAsked(q.text);
    });
    
    // CRITICAL: If all questions are similar to already asked ones, return null
    // This prevents asking duplicate/similar questions
    if (unaskedQuestions.length === 0) {
      console.log(`[SELECT-NEXT-Q] All questions in this category already asked or similar. Skipping.`);
      return null;
    }
    
    // If focusKey specified, prioritize questions matching that focus
    if (focusKey) {
      const focused = unaskedQuestions.filter(q => q.key === focusKey);
      if (focused.length > 0) {
        // Still apply variation even when focusing
        const shuffledFocused = shuffleArray(focused);
        return shuffledFocused[0].text;
      }
    }
    
    // CRITICAL: Shuffle questions before selecting to ensure variation
    // This ensures same symptom gets different question order each time
    const shuffledQuestions = shuffleArray(unaskedQuestions);
    
    // Apply variation: rotate based on question count and variation seed
    const rotatedIndex = (variationSeed + questionCount) % shuffledQuestions.length;
    return shuffledQuestions[rotatedIndex].text;
  };
  
  // PRIORITY 0: SYMPTOM-SPECIFIC RED-FLAG QUESTIONS FIRST (Medical-Grade)
  // CRITICAL: Medical-grade red flag mapping - Each symptom has specific red flag checklist
  // CRITICAL: First question must screen for danger first (ER triage nurse + แพทย์เวร approach)
  // CRITICAL: This must come BEFORE red flags, health context, or OTC questions
  // CRITICAL: System must remember it passed red flag screening
  const isFirstQuestion = questionCount === 0 || (Array.isArray(questionsAsked) && questionsAsked.length === 0);
  
  if (isFirstQuestion) {
    console.log(`[SYMPTOM-SPECIFIC] FIRST QUESTION DETECTED - questionCount: ${questionCount}, questionsAsked.length: ${questionsAsked?.length || 0}`);
    console.log(`[SYMPTOM-SPECIFIC] Symptom: "${symptom}", Normalized: "${normalizedSymptom}"`);
    console.log(`[RED-FLAG-SCREENING] Starting red flag screening for symptom: "${symptom}"`);
    
    // CRITICAL: Use medical-grade symptom-question map FIRST
    // This ensures perfect matching - longest/most specific keyword wins
    // CRITICAL: First question = Red flag screening question (1 question = check most critical red flag)
    // Try both original symptom and normalized symptom for better matching
    let symptomSpecificQuestion = getSymptomSpecificQuestion(symptom);
    if (!symptomSpecificQuestion && normalizedSymptom !== symptom) {
      symptomSpecificQuestion = getSymptomSpecificQuestion(normalizedSymptom);
    }
    
    if (symptomSpecificQuestion) {
      console.log(`[SYMPTOM-SPECIFIC] ✅ Returning MEDICAL-GRADE red-flag question: "${symptomSpecificQuestion}"`);
      console.log(`[RED-FLAG-SCREENING] Red flag screening question asked - waiting for answer`);
      return symptomSpecificQuestion;
    }
    
    // Fallback: If no match in map, use old detection logic
    // CRITICAL: Check symptom map FIRST before falling back to generic patterns
    // This prevents "ไข้สูง" from matching generic "ไข้" pattern
    const symptomType = detectSymptomType(normalizedSymptom);
    console.log(`[SYMPTOM-SPECIFIC] ⚠️ No match in map, using fallback detection (type: ${symptomType})`);
    
    // CRITICAL: Check if symptom contains keywords that ARE in the map
    // If so, don't use generic fallback - let it fall through to duration/severity
    const hasSpecificKeyword = Object.keys(SYMPTOM_QUESTION_MAP).some(keyword => 
      symptom.includes(keyword) || normalizedSymptom.includes(keyword)
    );
    
    if (hasSpecificKeyword) {
      console.log(`[SYMPTOM-SPECIFIC] ⚠️ Symptom contains keywords in map but didn't match - skipping generic fallback`);
      // Don't use generic fallback - go to duration/severity instead
    } else {
      // Only use generic fallback for symptoms NOT in the map at all
      if (normalizedSymptom.includes('ไข้') || symptom.includes('ไข้')) {
        const feverQuestion = QUESTION_CATEGORIES.otc_clarifying.questions.find(q => q.key === 'fever_temp');
        if (feverQuestion) {
          console.log(`[SYMPTOM-SPECIFIC] ⚠️ Using FALLBACK fever question (symptom not in map)`);
          return feverQuestion.text;
        }
      }
    }
    
    if (normalizedSymptom.includes('ไอ') || symptom.includes('ไอ')) {
      const coughQuestion = QUESTION_CATEGORIES.otc_clarifying.questions.find(q => q.key === 'cough_type');
      if (coughQuestion) return coughQuestion.text;
    }
    
    if (normalizedSymptom.includes('เจ็บคอ') || symptom.includes('เจ็บคอ')) {
      return 'เจ็บคอมากแค่ไหนคะ? (มาก / ปานกลาง / นิดหน่อย)';
    }
    
    if (normalizedSymptom.includes('ท้องเสีย') || symptom.includes('ท้องเสีย')) {
      const severityQuestion = QUESTION_CATEGORIES.symptom_characterization.questions.find(q => q.key === 'severity');
      if (severityQuestion) return severityQuestion.text.replace('ปวด', 'ท้องเสีย');
    }
    
    if (normalizedSymptom.includes('ปวดหัว') || symptom.includes('ปวดหัว')) {
      const locationQuestion = QUESTION_CATEGORIES.symptom_characterization.questions.find(q => q.key === 'location');
      if (locationQuestion) return locationQuestion.text;
    }
    
    // Final fallback: Duration question
    const durationQuestion = QUESTION_CATEGORIES.timeline.questions.find(q => q.key === 'duration');
    if (durationQuestion) {
      console.log(`[SYMPTOM-SPECIFIC] ✅ Returning FALLBACK duration question`);
      return durationQuestion.text;
    }
    
    console.log(`[SYMPTOM-SPECIFIC] ❌ CRITICAL ERROR: No question available!`);
  }
  
  // For questionCount 1-2, still try symptom-specific map FIRST before fallback
  // CRITICAL: Check symptom map even for later questions to ensure red-flag questions are asked
  if (questionCount >= 1 && questionCount <= 2) {
    // CRITICAL: Check symptom map FIRST before falling back to old logic
    let symptomSpecificQuestion = getSymptomSpecificQuestion(symptom);
    if (!symptomSpecificQuestion && normalizedSymptom !== symptom) {
      symptomSpecificQuestion = getSymptomSpecificQuestion(normalizedSymptom);
    }
    
    if (symptomSpecificQuestion) {
      // Check if this question was already asked
      const wasAskedThis = wasAsked(symptomSpecificQuestion);
      if (!wasAskedThis) {
        console.log(`[SYMPTOM-SPECIFIC] ✅ Returning MEDICAL-GRADE question (questionCount: ${questionCount}): "${symptomSpecificQuestion}"`);
        return symptomSpecificQuestion;
      }
    }
    
    // Fallback to old logic only if symptom map didn't match or was already asked
    const symptomType = detectSymptomType(normalizedSymptom);
    
    // Similar checks but with wasAsked conditions
    if ((normalizedSymptom.includes('ไข้') || symptom.includes('ไข้')) && !wasAsked('อุณหภูมิ') && !answers.fever_temp) {
      const feverQuestion = QUESTION_CATEGORIES.otc_clarifying.questions.find(q => q.key === 'fever_temp');
      if (feverQuestion) return feverQuestion.text;
    }
    
    if ((normalizedSymptom.includes('ไอ') || symptom.includes('ไอ')) && !wasAsked('เสมหะ') && !answers.cough_type) {
      const coughQuestion = QUESTION_CATEGORIES.otc_clarifying.questions.find(q => q.key === 'cough_type');
      if (coughQuestion) return coughQuestion.text;
    }
    
    if ((normalizedSymptom.includes('ปวดหัว') || symptom.includes('ปวดหัว')) && !wasAsked('ปวดตรงไหน') && !answers.location) {
      const locationQuestion = QUESTION_CATEGORIES.symptom_characterization.questions.find(q => q.key === 'location');
      if (locationQuestion) return locationQuestion.text;
    }
  }
  
  // MANDATORY: Health context check before summarizing (unless emergency)
  // This MUST be asked and answered before summarizing (unless emergency)
  // Check if question was asked
  const wasAskedHealthContext = wasAsked('ข้อมูลด้านสุขภาพ');
  // Check if question was answered
  // CRITICAL: "ไม่มี" (no) is a valid answer - user explicitly said they have no additional health info
  // The check !== '' will already catch "ไม่มี" since it's not an empty string
  const hasHealthContextAnswer = answers.health_context !== undefined && 
    answers.health_context !== null &&
    answers.health_context !== '';
  
  // Health context check - REMOVED per user request
  // if (needsHealthContextCheck(answers, questionCount, currentTriage, questionsAsked)) {
  //   ... removed ...
  // }
  
  // OTC Clarifying Questions: Ask until we can confidently recommend 2 OTC options
  // Only for self_care level (non-emergency)
  // Note: Symptom-specific questions are already asked above, so this handles health data
  if (currentTriage !== 'emergency' && currentTriage === 'self_care') {
    // Check if we need more OTC clarifying questions
    // Note: healthProfile is passed via answers.healthProfile if available
    const healthProfile = answers.healthProfile || null;
    
    if (!canRecommendOTCs(symptom, answers, currentTriage, healthProfile)) {
      // Only ask health data questions after we've asked at least 2 symptom-specific questions
      // This ensures symptom-specific questions come first
      if (questionCount >= 2) {
        const nextOTCQuestion = getNextOTCQuestion(symptom, answers, questionsAsked, healthProfile);
        if (nextOTCQuestion) {
          // Handle both structured and plain text questions
          const questionText = typeof nextOTCQuestion === 'object' && nextOTCQuestion.question 
            ? nextOTCQuestion.question 
            : nextOTCQuestion;
          
          // Check if this question was already asked
          const wasAskedOTC = wasAsked(questionText.split('?')[0]); // Check first part of question
          if (!wasAskedOTC) {
            // If already structured, return as-is
            if (typeof nextOTCQuestion === 'object' && nextOTCQuestion.question) {
              return nextOTCQuestion;
            }
            
            // Return plain text - will be converted to structured format in assess.js
            // (Can't use async import here in synchronous function)
            return questionText;
          }
        }
      }
    }
  }
  
  // Priority 1: Red flags (safety-critical, but AFTER symptom-specific questions)
  // CRITICAL: Medical-grade red flag mapping - check if red flag screening already passed
  // CRITICAL: System must remember it passed red flag screening - don't ask again
  const redFlagScreeningPassed = answers.redFlagScreeningPassed === true;
  
  if (redFlagScreeningPassed) {
    console.log(`[RED-FLAGS] SKIPPED - Red flag screening already passed (questionCount: ${questionCount})`);
  } else {
    // CRITICAL: NEVER ask red flags on first question (questionCount === 0)
    // Red flags should only be asked AFTER we've asked at least one symptom-specific question
    const isFirstQuestionCheck = questionCount === 0 || (Array.isArray(questionsAsked) && questionsAsked.length === 0);
    
    if (!isFirstQuestionCheck && !wasAsked('หายใจ') && !wasAsked('เจ็บหน้าอก') && !wasAsked('หมดสติ')) {
      // Check if red flags already present in symptom text
      const hasRedFlags = Object.keys(RISK_FACTORS.red_flags).some(flag => 
        normalizedSymptom.includes(flag)
      );
      
      if (!hasRedFlags) {
        // Ask red flag questions (safety-critical, no variation)
        const redFlagQuestions = QUESTION_CATEGORIES.red_flags.questions;
        for (const question of redFlagQuestions) {
          if (!wasAsked(question.text)) {
            console.log(`[RED-FLAGS] Returning red flag question (questionCount: ${questionCount}, isFirstQuestion: ${isFirstQuestionCheck})`);
            return question.text;
          }
        }
      }
    } else if (isFirstQuestionCheck) {
      console.log(`[RED-FLAGS] SKIPPED - First question detected (questionCount: ${questionCount}, questionsAsked.length: ${questionsAsked?.length || 0})`);
    }
  }
  
  // Priority 2: Symptom-specific characterization (ADAPTIVE based on symptom type)
  // CRITICAL: Check symptom map FIRST before falling back to generic characterization
  // This ensures red-flag questions are prioritized over generic location/severity questions
  let symptomSpecificQuestion = getSymptomSpecificQuestion(symptom);
  if (!symptomSpecificQuestion && normalizedSymptom !== symptom) {
    symptomSpecificQuestion = getSymptomSpecificQuestion(normalizedSymptom);
  }
  
  // If symptom map has a question and it hasn't been asked, use it
  if (symptomSpecificQuestion && !wasAsked(symptomSpecificQuestion)) {
    console.log(`[SYMPTOM-SPECIFIC] ✅ Returning MEDICAL-GRADE question (Priority 2): "${symptomSpecificQuestion}"`);
    return symptomSpecificQuestion;
  }
  
  // Only proceed to generic symptom characterization if symptom map doesn't have a match
  // or if the symptom-specific question was already asked
  const symptomCharQuestions = QUESTION_CATEGORIES.symptom_characterization.questions;
  const unaskedSymptomChar = symptomCharQuestions.filter(q => !wasAsked(q.text));
  
  // Only use symptom characterization for pain-related symptoms
  // For fever, cough, diarrhea, etc. - skip to timeline questions
  const shouldAskSymptomChar = symptomType === 'headache' || symptomType === 'pain' || symptomType === 'sore_throat';
  
  if (shouldAskSymptomChar && unaskedSymptomChar.length > 0 && questionCount <= 3) {
    // SYMPTOM-SPECIFIC QUESTION SELECTION
    // Ask different first questions based on symptom type
    
    let candidateKeys = [];
    
    // Headache: Ask location, severity, quality first
    if (symptomType === 'headache') {
      if (!answers.location && !wasAsked('ปวดตรงไหน')) candidateKeys.push('location');
      if (!answers.severity && !wasAsked('มากแค่ไหน')) candidateKeys.push('severity');
      if (!answers.quality && !wasAsked('ปวดแบบไหน')) candidateKeys.push('quality');
    }
    // Sore throat: Ask severity, location first
    else if (symptomType === 'sore_throat') {
      if (!answers.severity && !wasAsked('มากแค่ไหน')) candidateKeys.push('severity');
      if (!answers.location && !wasAsked('เจ็บตรงไหน')) candidateKeys.push('location');
    }
    // Pain (general): Ask location, severity, quality first
    else if (symptomType === 'pain') {
      if (!answers.location && !wasAsked('ปวดตรงไหน')) candidateKeys.push('location');
      if (!answers.severity && !wasAsked('มากแค่ไหน')) candidateKeys.push('severity');
      if (!answers.quality && !wasAsked('ปวดแบบไหน')) candidateKeys.push('quality');
    }
    
    // If we have symptom-specific candidates, prioritize them
    if (candidateKeys.length > 0) {
      const shuffledQuestions = shuffleArray(unaskedSymptomChar);
      const timeEntropy = Date.now() % 1000;
      const selectedKeyIndex = (variationSeed + questionCount + timeEntropy) % candidateKeys.length;
      const focusKey = candidateKeys[selectedKeyIndex];
      
      const focusedQuestion = shuffledQuestions.find(q => q.key === focusKey);
      if (focusedQuestion) {
        return focusedQuestion.text;
      }
    }
    
    // Fallback: Use variation for remaining questions
    const shuffledQuestions = shuffleArray(unaskedSymptomChar);
    const timeEntropy = Date.now() % 1000;
    const rotatedIndex = (variationSeed + questionCount + timeEntropy) % shuffledQuestions.length;
    return shuffledQuestions[rotatedIndex].text;
  }
  
  // For later questions (questionCount > 3), use general symptom characterization (only for pain)
  if (shouldAskSymptomChar && unaskedSymptomChar.length > 0 && questionCount > 3) {
    const shuffledQuestions = shuffleArray(unaskedSymptomChar);
    const timeEntropy = Date.now() % 1000;
    const rotatedIndex = (variationSeed + questionCount + timeEntropy) % shuffledQuestions.length;
    return shuffledQuestions[rotatedIndex].text;
  }
  
  // MEDICAL-GRADE: Use information gain-driven questioning if hypotheses are available
  // CRITICAL: After first question, use hypothesis-driven questioning instead of checklist
  if (questionCount > 0 && answers.hypotheses && Array.isArray(answers.hypotheses) && answers.hypotheses.length > 0) {
    // Collect all available questions from different categories
    const allAvailableQuestions = [
      ...QUESTION_CATEGORIES.timeline.questions,
      ...QUESTION_CATEGORIES.symptom_characterization.questions,
      ...QUESTION_CATEGORIES.associated_symptoms.questions,
    ];
    
    // Use information gain to select best question
    const bestQuestion = selectQuestionByInformationGain(
      allAvailableQuestions,
      answers.hypotheses,
      questionsAsked,
      answers
    );
    
    if (bestQuestion) {
      console.log(`[INFORMATION-GAIN] Selected question with highest information gain: "${bestQuestion.substring(0, 60)}..."`);
      return bestQuestion;
    }
  }
  
  // Priority 3: Timeline (WITH VARIATION - rotate focus)
  // CRITICAL: For non-pain symptoms (fever, cough, diarrhea), prioritize timeline questions
  // These are universally applicable and more relevant than pain-specific questions
  const timelineQuestions = QUESTION_CATEGORIES.timeline.questions;
  const unaskedTimeline = timelineQuestions.filter(q => !wasAsked(q.text));
  
  // For non-pain symptoms, prioritize timeline questions earlier
  const shouldPrioritizeTimeline = !shouldAskSymptomChar && questionCount <= 2;
  
  if (unaskedTimeline.length > 0) {
    // VARIATION: Rotate based on what's already known
    const extractedDuration = extractDuration(symptom);
    const isWorseningFromText = isWorsening(symptom);
    
    let focusKey = null;
    // CRITICAL: Check if duration question was already asked (using enhanced wasAsked)
    const wasAskedDuration = wasAsked('นานเท่าไหร่') || wasAsked('เริ่มเมื่อไหร่') || wasAsked('เป็นมานาน') || wasAsked('เมื่อไหร่');
    const hasDurationAnswer = extractedDuration || answers.duration || answers.duration_hours || answers.onset;
    
    // Symptom-specific timeline focus
    if (symptomType === 'fever' || symptomType === 'cough' || symptomType === 'diarrhea') {
      // For these symptoms, duration is most important first
      // CRITICAL: Don't ask duration if already asked OR answered
      if (!hasDurationAnswer && !wasAskedDuration) {
        focusKey = 'duration';
      } else if (!isWorseningFromText && !answers.trend && !wasAsked('แย่ลง')) {
        focusKey = 'trend';
      }
    } else {
      // For pain symptoms, use general logic
      // CRITICAL: Don't ask duration if already asked OR answered
      if (!hasDurationAnswer && !wasAskedDuration) {
        focusKey = 'duration';
      } else if (!isWorseningFromText && !answers.trend && !wasAsked('แย่ลง')) {
        focusKey = 'trend';
      } else if (!answers.pattern && !wasAsked('เป็น ๆ หาย ๆ')) {
        focusKey = 'pattern';
      }
    }
    
    // If we should prioritize timeline (non-pain symptoms), return immediately
    if (shouldPrioritizeTimeline && focusKey) {
      const focusedQuestion = unaskedTimeline.find(q => q.key === focusKey);
      if (focusedQuestion) {
        return focusedQuestion.text;
      }
    }
    
    const selected = selectWithVariation(unaskedTimeline, focusKey);
    if (selected) return selected;
  }
  
  // Priority 4: Associated symptoms (SYMPTOM-SPECIFIC prioritization)
  // CRITICAL: Ask different associated symptoms based on main symptom type
  if (currentRiskScore >= RISK_THRESHOLDS.gp || questionCount >= 2) {
    const associatedQuestions = QUESTION_CATEGORIES.associated_symptoms.questions;
    const unaskedAssociated = associatedQuestions.filter(q => !wasAsked(q.text));
    
    if (unaskedAssociated.length > 0) {
      // SYMPTOM-SPECIFIC: Ask relevant associated symptoms first
      let focusKey = null;
      let priorityKeys = [];
      
      // Headache: Ask about neurological symptoms, nausea, fever
      if (symptomType === 'headache') {
        if (!wasAsked('ชา') && !wasAsked('อ่อนแรง')) priorityKeys.push('neurological');
        if (!wasAsked('คลื่นไส้')) priorityKeys.push('nausea');
        if (!wasAsked('ไข้')) priorityKeys.push('fever');
      }
      // Fever: Ask about cough, sore throat, rash
      else if (symptomType === 'fever') {
        if (!wasAsked('ไอ')) priorityKeys.push('cough');
        if (!wasAsked('เจ็บคอ')) priorityKeys.push('sore_throat'); // Note: might need to add this
        if (!wasAsked('ผื่น')) priorityKeys.push('rash');
      }
      // Cough: Ask about fever, sore throat, chest symptoms
      else if (symptomType === 'cough') {
        if (!wasAsked('ไข้')) priorityKeys.push('fever');
        if (!wasAsked('เจ็บหน้าอก')) priorityKeys.push('cardiac');
      }
      // Sore throat: Ask about fever, cough, rash
      else if (symptomType === 'sore_throat') {
        if (!wasAsked('ไข้')) priorityKeys.push('fever');
        if (!wasAsked('ไอ')) priorityKeys.push('cough');
        if (!wasAsked('ผื่น')) priorityKeys.push('rash');
      }
      // Diarrhea: Ask about fever, nausea, pain
      else if (symptomType === 'diarrhea') {
        if (!wasAsked('ไข้')) priorityKeys.push('fever');
        if (!wasAsked('คลื่นไส้')) priorityKeys.push('nausea');
      }
      // Pain: Ask about fever, nausea, location-specific
      else if (symptomType === 'pain') {
        if (!wasAsked('ไข้')) priorityKeys.push('fever');
        if (!wasAsked('คลื่นไส้')) priorityKeys.push('nausea');
      }
      
      // Select from priority keys with variation
      if (priorityKeys.length > 0) {
        const timeEntropy = Date.now() % 1000;
        const selectedKeyIndex = (variationSeed + questionCount + timeEntropy) % priorityKeys.length;
        focusKey = priorityKeys[selectedKeyIndex];
      }
      
      // Apply variation: rotate if no specific focus
      const selected = selectWithVariation(unaskedAssociated, focusKey);
      if (selected) return selected;
    }
  }
  
  // Priority 5: Patient context - REMOVED per user request
  // Health data (chronic diseases, allergies, pregnancy, medications) should be pulled from health profile
  // const patientContextQuestions = QUESTION_CATEGORIES.patient_context.questions;
  // const unaskedPatientContext = patientContextQuestions.filter(q => !wasAsked(q.text));
  // 
  // if (unaskedPatientContext.length > 0) {
  //   ... removed ...
  // }
  
  // Priority 6: Treatment response (WITH VARIATION)
  const treatmentResponseQuestions = QUESTION_CATEGORIES.treatment_response.questions;
  const unaskedTreatment = treatmentResponseQuestions.filter(q => !wasAsked(q.text));
  
  if (unaskedTreatment.length > 0) {
    const triedSelfCareFromText = triedSelfCare(symptom);
    
    let focusKey = null;
    if (!triedSelfCareFromText && !answers.self_care_response && !wasAsked('ดูแลตัวเอง')) {
      focusKey = 'self_care';
    } else if (!answers.improvement && !wasAsked('ดีขึ้น')) {
      focusKey = 'improvement';
    }
    
    const selected = selectWithVariation(unaskedTreatment, focusKey);
    if (selected) return selected;
  }
  
  // CONFIDENCE-DRIVEN QUESTIONING: Ask deeper questions when uncertain
  // If confidence is low, ask more detailed characterization questions
  if (needsDeeperQuestions(currentRiskScore, questionCount, answers)) {
    // Ask deeper symptom characterization questions
    const deeperSymptomChar = QUESTION_CATEGORIES.symptom_characterization.questions.filter(q => 
      !wasAsked(q.text) && 
      (q.key === 'aggravating_factors' || q.key === 'relieving_factors' || q.key === 'location')
    );
    
    if (deeperSymptomChar.length > 0) {
      const rotatedIndex = (variationSeed + questionCount) % deeperSymptomChar.length;
      return deeperSymptomChar[rotatedIndex].text;
    }
    
    // Ask deeper associated symptoms
    const deeperAssociated = QUESTION_CATEGORIES.associated_symptoms.questions.filter(q => 
      !wasAsked(q.text) && 
      (q.key === 'neurological' || q.key === 'cardiac' || q.key === 'rash')
    );
    
    if (deeperAssociated.length > 0) {
      const rotatedIndex = (variationSeed + questionCount) % deeperAssociated.length;
      return deeperAssociated[rotatedIndex].text;
    }
  }
  
  return null;
}

/**
 * Generate variation seed for non-repeating question sequences
 * Ensures same symptom gets different question focus each time
 * CRITICAL: Must vary even when same symptom, same answers, same question count
 */
function generateVariationSeed(questionCount, answers, sessionHistory, normalizedSymptom) {
  // Base seed from question count (different stages = different focus)
  let seed = questionCount * 7;
  
  // Add variation based on what's already answered (rotate focus)
  if (answers.severity) seed += 3;
  if (answers.duration) seed += 5;
  if (answers.trend) seed += 11;
  if (answers.quality) seed += 13;
  if (answers.location) seed += 17;
  if (answers.aggravating_factors) seed += 19;
  if (answers.relieving_factors) seed += 23;
  
  // Add variation based on symptom type (different symptoms = different approach)
  // Use symptom type detection for more accurate variation
  const symptomType = detectSymptomType(normalizedSymptom);
  const symptomTypeSeeds = {
    'headache': 29,
    'fever': 31,
    'cough': 41,
    'sore_throat': 37,
    'diarrhea': 47,
    'nausea': 53,
    'rash': 59,
    'pain': 61,
    'other': 67,
  };
  seed += symptomTypeSeeds[symptomType] || 67;
  
  // Also add variation based on specific keywords (for more granular variation)
  if (normalizedSymptom.includes('ปวดหัว')) seed += 29;
  if (normalizedSymptom.includes('ไข้')) seed += 31;
  if (normalizedSymptom.includes('เจ็บคอ')) seed += 37;
  if (normalizedSymptom.includes('ไอ')) seed += 41;
  if (normalizedSymptom.includes('น้ำมูก')) seed += 43;
  if (normalizedSymptom.includes('ท้องเสีย')) seed += 47;
  
  // Add variation from session history (if same user/symptom, vary approach)
  if (sessionHistory && sessionHistory.previousSessions) {
    seed += sessionHistory.previousSessions.length * 53;
  }
  
  // CRITICAL: Strong time-based variation to ensure different sequences
  // Use milliseconds + microseconds for stronger variation
  const timeComponent = Date.now() % 10000; // 0-9999 (more range)
  seed += timeComponent;
  
  // Add random component (even if subtle, helps break patterns)
  // Use symptom hash + time for pseudo-randomness
  const symptomHash = normalizedSymptom.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  seed += (symptomHash * 7) % 1000; // Increased range
  
  // CRITICAL: Add session ID or request ID if available for uniqueness
  // This ensures even same symptom at same time gets different seed
  if (answers.sessionId) {
    const sessionHash = String(answers.sessionId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    seed += (sessionHash * 11) % 500;
  }
  
  return seed;
}

/**
 * Check if we have enough information for triage
 */
export function hasEnoughInfo(riskScore, questionCount, answers) {
  // Minimum 3 questions (unless emergency detected)
  if (questionCount < 3 && riskScore < RISK_THRESHOLDS.emergency) {
    return false;
  }
  
  // If risk score is clear (far from threshold), we can stop
  const currentTriage = determineTriageFromRisk(riskScore);
  const margin = 15; // Margin of safety
  
  if (currentTriage === 'emergency') {
    return true; // Always stop for emergency
  }
  
  if (currentTriage === 'gp' && riskScore >= RISK_THRESHOLDS.gp + margin) {
    return true; // Clear GP case
  }
  
  if (currentTriage === 'self_care' && riskScore < RISK_THRESHOLDS.gp - margin) {
    return true; // Clear self-care case
  }
  
  // If we have key information, we can stop
  if (questionCount >= 4 && (answers.duration || answers.trend || answers.severity)) {
    return true;
  }
  
  return false;
}

