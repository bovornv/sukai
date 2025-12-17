/**
 * Adaptive Clinical Triage Engine
 * Doctor-level reasoning with risk scoring and conditional questioning
 * 
 * Key Principles:
 * - Ask questions that change triage level (not fixed set)
 * - Use risk scoring instead of binary logic
 * - Adaptive questioning based on symptom and answers
 * - Clinical reasoning, not rigid decision tree
 * 
 * Enhanced with:
 * - Thai language understanding (misspellings, slang)
 * - Context extraction
 * - Smart clarification
 * - Anxiety-aware responses
 */
import {
  normalizeThaiText,
  extractSymptoms,
  isAnxious,
  detectSeverity,
  extractDuration,
  isWorsening,
  triedSelfCare,
  getReassuranceMessage,
} from './thai_normalizer.js';
import {
  calculateRiskScore,
  determineTriageFromRisk,
  selectNextQuestion,
  hasEnoughInfo,
} from './clinical_reasoning.js';

// Red flag keywords (life-threatening symptoms)
// These will be normalized before checking
const RED_FLAGS = [
  'หายใจไม่ออก',
  'หายใจลำบาก',
  'หายใจไม่สะดวก',
  'หายใจติดขัด',
  'เจ็บหน้าอก',
  'แน่นอก',
  'หมดสติ',
  'ชัก',
  'เลือดออกมาก',
  'แขนขาอ่อนแรง',
  'พูดไม่ชัด',
  'มองไม่เห็น',
];

// Emergency keywords
// These will be normalized before checking (includes slang like "ไม่ไหวละ")
const EMERGENCY_KEYWORDS = [
  'ฉุกเฉิน',
  'รุนแรงมาก',
  'ทนไม่ไหว',
  'ไม่ไหวละ',
  'ไม่ไหว',
  'เป็นลม',
  'หมดสติ',
];

// Question templates by priority
const QUESTION_TEMPLATES = {
  duration: 'อาการนี้เป็นมานานเท่าไหร่แล้วคะ?',
  severity_trend: 'อาการแย่ลง ดีขึ้น หรือเหมือนเดิมคะ?',
  risk_group: 'คุณอยู่ในกลุ่มเสี่ยงไหมคะ? (เด็ก, ผู้สูงอายุ, หญิงตั้งครรภ์)',
  self_care_response: 'เคยลองดูแลตัวเองหรือใช้ยาอะไรแล้วไหมคะ?',
  associated_symptoms: 'มีอาการอื่นๆ ร่วมด้วยไหมคะ? (เช่น ไข้, ปวดหัว)',
};

/**
 * Check for red flags in symptom text
 * Uses normalized text to handle misspellings and slang
 */
function checkRedFlags(symptom) {
  const normalized = normalizeThaiText(symptom);
  return RED_FLAGS.some(flag => normalized.includes(normalizeThaiText(flag)));
}

/**
 * Check for emergency keywords
 * Uses normalized text to handle misspellings and slang
 */
function checkEmergency(symptom) {
  const normalized = normalizeThaiText(symptom);
  return EMERGENCY_KEYWORDS.some(keyword => normalized.includes(normalizeThaiText(keyword)));
}

/**
 * Get next question using adaptive clinical reasoning
 * Uses risk scoring to determine which questions matter
 * Only asks questions that would change triage level
 */
function getNextQuestionAdaptive(symptom, answers, questionsAsked, questionCount) {
  // Use clinical reasoning to select next question
  return selectNextQuestion(symptom, answers, questionsAsked, questionCount);
}

/**
 * Determine triage level using risk scoring
 * Doctor-level clinical reasoning with risk accumulation
 */
function determineTriageLevel(symptom, answers, questionCount) {
  // Normalize symptom text first
  const normalizedSymptom = normalizeThaiText(symptom);
  
  // Emergency check (highest priority) - uses normalized text
  if (checkRedFlags(normalizedSymptom) || checkEmergency(normalizedSymptom)) {
    return 'emergency';
  }

  // Calculate risk score using clinical reasoning
  const riskScore = calculateRiskScore(symptom, answers);
  
  // Determine triage from risk score
  const triageLevel = determineTriageFromRisk(riskScore);
  
  // If we have enough info, return triage level
  if (hasEnoughInfo(riskScore, questionCount, answers)) {
    return triageLevel;
  }

  // Not enough info yet
  return 'uncertain';
}

/**
 * Calculate confidence level (0-100)
 */
function calculateConfidence(answers, questionCount) {
  let confidence = 0;

  // Each answer adds confidence
  if (answers.duration) confidence += 20;
  if (answers.severity_trend) confidence += 20;
  if (answers.risk_group) confidence += 15;
  if (answers.self_care_response) confidence += 15;
  if (answers.associated_symptoms) confidence += 15;

  // Question count bonus
  confidence += Math.min(questionCount * 3, 15);

  return Math.min(confidence, 100);
}

/**
 * Main assessment logic
 * PROBLEM_DRIVEN_IMPLEMENTATION.md: Must always end with clear triage result, next action, safety boundary
 * Never return vague "uncertain" without clear next steps
 * 
 * Enhanced with Thai language understanding:
 * - Normalizes misspellings and slang
 * - Extracts context from text
 * - Smart clarification (avoids redundant questions)
 * - Confidence-aware responses
 */
export async function assessSymptomLogic({
  symptom,
  previousAnswers,
  questionsAsked,
  questionCount,
}) {
  // Normalize symptom text first
  const normalizedSymptom = normalizeThaiText(symptom);
  
  // Extract context from text (before asking questions)
  const extractedDuration = extractDuration(symptom);
  const detectedSeverity = detectSeverity(symptom);
  const isWorseningFromText = isWorsening(symptom);
  const triedSelfCareFromText = triedSelfCare(symptom);
  const isAnxiousUser = isAnxious(symptom);

  // Merge extracted context into answers (if not already present)
  const enrichedAnswers = { ...previousAnswers };
  if (extractedDuration && !enrichedAnswers.duration) {
    enrichedAnswers.duration = `${extractedDuration} วัน`;
  }
  if (isWorseningFromText && !enrichedAnswers.severity_trend) {
    enrichedAnswers.severity_trend = 'แย่ลง';
  }
  if (triedSelfCareFromText && !enrichedAnswers.self_care_response) {
    enrichedAnswers.self_care_response = 'เคยลองแล้ว';
  }

  // Check for red flags first (highest priority) - uses normalized text
  if (checkRedFlags(normalizedSymptom) || checkEmergency(normalizedSymptom)) {
    return {
      needMoreInfo: false,
      nextQuestion: null,
      triageLevel: 'emergency', // Clear result: emergency
      reassurance: isAnxiousUser ? getReassuranceMessage() : null,
    };
  }

  // Determine current triage level (uses normalized text and context)
  const triageLevel = determineTriageLevel(normalizedSymptom, enrichedAnswers, questionCount);

  // Calculate confidence (enhanced with extracted context)
  let confidence = calculateConfidence(enrichedAnswers, questionCount);
  
  // Boost confidence if we extracted context from text
  if (extractedDuration) confidence += 10;
  if (detectedSeverity) confidence += 10;
  if (isWorseningFromText || triedSelfCareFromText) confidence += 10;
  
  // Cap at 100
  confidence = Math.min(confidence, 100);

  // Stop conditions (from docs):
  // - emergency detected (already handled above)
  // - gp/pharmacy threshold reached (clear result) BUT only after minimum 4 questions
  // - confidence ≥ 80% (clear result) BUT only after minimum 4 questions
  // PROBLEM_DRIVEN_IMPLEMENTATION.md: Must stop when we have clear triage
  // REQUIREMENT: Must ask at least 4 questions before completing (unless emergency)
  const shouldStop =
    (triageLevel === 'gp' && questionCount >= 4) ||
    (triageLevel === 'pharmacy' && questionCount >= 4) ||
    (triageLevel === 'self_care' && questionCount >= 4) ||
    (confidence >= 80 && questionCount >= 4) ||
    questionCount >= 6;

  if (shouldStop) {
    // Ensure we never return uncertain without clear next action
    const finalTriage = triageLevel === 'uncertain' && confidence >= 60 
      ? 'gp' // If uncertain but have some confidence, default to GP for safety
      : triageLevel;
    
    return {
      needMoreInfo: false,
      nextQuestion: null,
      triageLevel: finalTriage, // Clear result with next action in diagnosis
      reassurance: isAnxiousUser ? getReassuranceMessage() : null,
    };
  }

  // Need more info - get next question using adaptive clinical reasoning
  // Only asks questions that would change triage level
  const nextQuestion = getNextQuestionAdaptive(symptom, enrichedAnswers, questionsAsked, questionCount);

  // Add reassurance if user is anxious
  let questionWithReassurance = nextQuestion;
  if (isAnxiousUser && nextQuestion) {
    questionWithReassurance = `${getReassuranceMessage()}\n\n${nextQuestion}`;
  }

  return {
    needMoreInfo: nextQuestion !== null,
    nextQuestion: questionWithReassurance,
    triageLevel: triageLevel === 'uncertain' ? 'uncertain' : triageLevel,
    reassurance: isAnxiousUser ? getReassuranceMessage() : null,
  };
}
