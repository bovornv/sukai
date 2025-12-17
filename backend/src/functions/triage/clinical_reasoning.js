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

/**
 * Risk scoring system
 * Each answer adds/subtracts risk points
 * Thresholds determine triage level
 */
const RISK_THRESHOLDS = {
  self_care: 0,      // 0-20 points
  pharmacy: 21,      // 21-40 points
  gp: 41,            // 41-70 points
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
        riskFactor: null, // Contextual
      },
      {
        key: 'severity',
        text: 'ปวดมากแค่ไหนคะ? (มาก / ปานกลาง / นิดหน่อย)',
        riskFactor: 'severity',
      },
      {
        key: 'quality',
        text: 'ปวดแบบไหนคะ? (ปวดจี๊ด / ปวดตื้อ / แน่น / แสบ)',
        riskFactor: null, // Contextual
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
  
  associated_symptoms: {
    name: 'Associated Symptoms',
    priority: 4,
    questions: [
      {
        key: 'fever',
        text: 'มีไข้ร่วมด้วยไหมคะ?',
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
    ],
  },
  
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
  const extractedDuration = extractDuration(symptom);
  if (extractedDuration) {
    // Extract numeric value from duration string (e.g., "2 วัน" -> 2)
    const durationMatch = extractedDuration.match(/(\d+)/);
    if (durationMatch) {
      const durationDays = parseInt(durationMatch[1], 10);
      if (durationDays > 7) {
        riskScore += RISK_FACTORS.duration['มากกว่า 7 วัน'];
      } else if (durationDays >= 3) {
        riskScore += RISK_FACTORS.duration['3-7 วัน'];
      } else if (durationDays >= 1) {
        riskScore += RISK_FACTORS.duration['1-3 วัน'];
      }
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
  } else if (riskScore >= RISK_THRESHOLDS.pharmacy) {
    return 'pharmacy';
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
 * Select next question adaptively
 * Based on current risk, symptom, and what's already asked
 * Only asks questions that would change triage level
 */
export function selectNextQuestion(symptom, answers, questionsAsked, questionCount) {
  // Max 6 questions (doctor-like: ask few but relevant)
  if (questionCount >= 6) {
    return null;
  }
  
  const normalizedSymptom = normalizeThaiText(symptom);
  const currentRiskScore = calculateRiskScore(symptom, answers);
  
  // Helper: Check if question was already asked
  const wasAsked = (questionText) => {
    if (!Array.isArray(questionsAsked)) return false;
    return questionsAsked.some(q => {
      if (typeof q === 'string') {
        return q.includes(questionText) || questionText.includes(q);
      }
      return false;
    });
  };
  
  // Priority 1: Red flags (always check first)
  if (!wasAsked('หายใจ') && !wasAsked('เจ็บหน้าอก') && !wasAsked('หมดสติ')) {
    // Check if red flags already present in symptom text
    const hasRedFlags = Object.keys(RISK_FACTORS.red_flags).some(flag => 
      normalizedSymptom.includes(flag)
    );
    
    if (!hasRedFlags) {
      // Ask red flag questions
      const redFlagQuestions = QUESTION_CATEGORIES.red_flags.questions;
      for (const question of redFlagQuestions) {
        if (!wasAsked(question.text)) {
          return question.text;
        }
      }
    }
  }
  
  // Priority 2: Symptom characterization (if not clear)
  if (questionCount < 3 && !answers.severity && !wasAsked('มากแค่ไหน')) {
    const severityQuestion = QUESTION_CATEGORIES.symptom_characterization.questions.find(
      q => q.key === 'severity'
    );
    if (severityQuestion) {
      return severityQuestion.text;
    }
  }
  
  // Priority 3: Timeline (if not extracted from text)
  const extractedDuration = extractDuration(symptom);
  if (!extractedDuration && !answers.duration && !wasAsked('นานเท่าไหร่')) {
    const durationQuestion = QUESTION_CATEGORIES.timeline.questions.find(q => q.key === 'duration');
    if (durationQuestion) {
      return durationQuestion.text;
    }
  }
  
  // Check if worsening mentioned
  const isWorseningFromText = isWorsening(symptom);
  if (!isWorseningFromText && !answers.trend && !wasAsked('แย่ลง')) {
    const trendQuestion = QUESTION_CATEGORIES.timeline.questions.find(q => q.key === 'trend');
    if (trendQuestion) {
      return trendQuestion.text;
    }
  }
  
  // Priority 4: Associated symptoms (if risk is medium-high)
  if (currentRiskScore >= RISK_THRESHOLDS.pharmacy && !answers.associated_symptoms) {
    const associatedQuestions = QUESTION_CATEGORIES.associated_symptoms.questions;
    for (const question of associatedQuestions) {
      if (!wasAsked(question.text)) {
        return question.text;
      }
    }
  }
  
  // Priority 5: Risk group (if not asked)
  if (!answers.risk_group && !wasAsked('กลุ่มเสี่ยง') && !wasAsked('อายุ')) {
    const riskGroupQuestion = QUESTION_CATEGORIES.patient_context.questions.find(q => q.key === 'age');
    if (riskGroupQuestion) {
      return riskGroupQuestion.text;
    }
  }
  
  // Priority 6: Self-care response (if not detected from text)
  const triedSelfCareFromText = triedSelfCare(symptom);
  if (!triedSelfCareFromText && !answers.self_care_response && !wasAsked('ดูแลตัวเอง')) {
    const selfCareQuestion = QUESTION_CATEGORIES.treatment_response.questions.find(q => q.key === 'self_care');
    if (selfCareQuestion) {
      return selfCareQuestion.text;
    }
  }
  
  return null;
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
  
  if (currentTriage === 'pharmacy' && riskScore >= RISK_THRESHOLDS.pharmacy + margin && riskScore < RISK_THRESHOLDS.gp - margin) {
    return true; // Clear pharmacy case
  }
  
  if (currentTriage === 'self_care' && riskScore < RISK_THRESHOLDS.pharmacy - margin) {
    return true; // Clear self-care case
  }
  
  // If we have key information, we can stop
  if (questionCount >= 4 && (answers.duration || answers.trend || answers.severity)) {
    return true;
  }
  
  return false;
}

