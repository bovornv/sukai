/**
 * Triage assessment logic
 * Follows prompts_clinical_triage_v2.md and PROBLEM_DRIVEN_IMPLEMENTATION.md strictly
 * Problem 1: Must reduce uncertainty - every interaction ends with clear triage, next action, safety boundary
 * Forbidden: vague advice without criteria, "may be multiple things"
 * 
 * Enhanced with Thai language understanding:
 * - Handles misspellings and slang
 * - Context-based understanding
 * - Smart clarification
 * - Confidence-aware responses
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
 * Determine next question based on priority and what's already asked
 * Smart clarification: Only ask if not already understood from context
 */
function getNextQuestion(questionsAsked, answers, questionCount, symptomText = '') {
  // Max 6 questions
  if (questionCount >= 6) {
    return null;
  }

  const normalizedSymptom = normalizeThaiText(symptomText);

  // Priority 1: Duration (if not asked and not extracted from text)
  if (!questionsAsked.some(q => q.includes('นานเท่าไหร่'))) {
    if (!answers.duration) {
      // Try to extract duration from symptom text first
      const extractedDuration = extractDuration(symptomText);
      if (extractedDuration) {
        // Duration found in text, don't ask
        return null;
      }
      return QUESTION_TEMPLATES.duration;
    }
  }

  // Priority 2: Severity trend (if not asked and not detected from text)
  if (!questionsAsked.some(q => q.includes('แย่ลง'))) {
    if (!answers.severity_trend) {
      // Check if worsening is mentioned in text
      if (isWorsening(symptomText)) {
        // Worsening detected, don't ask
        return null;
      }
      return QUESTION_TEMPLATES.severity_trend;
    }
  }

  // Priority 3: Risk group (if not asked)
  if (!questionsAsked.some(q => q.includes('กลุ่มเสี่ยง'))) {
    if (!answers.risk_group) {
      return QUESTION_TEMPLATES.risk_group;
    }
  }

  // Priority 4: Self-care response (if not asked and not detected from text)
  if (!questionsAsked.some(q => q.includes('ดูแลตัวเอง'))) {
    if (!answers.self_care_response) {
      // Check if self-care attempts mentioned in text
      if (triedSelfCare(symptomText)) {
        // Self-care detected, don't ask
        return null;
      }
      return QUESTION_TEMPLATES.self_care_response;
    }
  }

  // Priority 5: Associated symptoms (if not asked)
  if (!questionsAsked.some(q => q.includes('อาการอื่น'))) {
    if (!answers.associated_symptoms) {
      return QUESTION_TEMPLATES.associated_symptoms;
    }
  }

  return null;
}

/**
 * Determine triage level based on symptoms and answers
 * Uses normalized text and context understanding
 */
function determineTriageLevel(symptom, answers, questionCount) {
  // Normalize symptom text first
  const normalizedSymptom = normalizeThaiText(symptom);
  
  // Emergency check (highest priority) - uses normalized text
  if (checkRedFlags(normalizedSymptom) || checkEmergency(normalizedSymptom)) {
    return 'emergency';
  }

  // Extract context from text
  const detectedSeverity = detectSeverity(symptom);
  const isWorseningFromText = isWorsening(symptom);
  const triedSelfCareFromText = triedSelfCare(symptom);

  // If we have enough info, determine level
  // Require at least 4 questions before determining triage (unless emergency)
  if (questionCount >= 4) {
    // High severity indicators → GP
    if (
      detectedSeverity === 'high' ||
      normalizedSymptom.includes('ปวดมาก') ||
      normalizedSymptom.includes('รุนแรง') ||
      normalizedSymptom.includes('ไม่ดีขึ้น') ||
      isWorseningFromText ||
      (triedSelfCareFromText && isWorseningFromText) || // Tried self-care but not improving
      (answers.severity_trend && answers.severity_trend.includes('แย่ลง'))
    ) {
      return 'gp';
    }

    // Moderate symptoms → Pharmacy
    if (
      normalizedSymptom.includes('ปวด') ||
      normalizedSymptom.includes('ไข้') ||
      normalizedSymptom.includes('น้ำมูก') ||
      normalizedSymptom.includes('ไอ') ||
      detectedSeverity === 'medium'
    ) {
      return 'pharmacy';
    }

    // Mild symptoms → Self care
    if (detectedSeverity === 'low') {
      return 'self_care';
    }

    // Default based on symptom patterns
    if (
      normalizedSymptom.includes('ปวด') ||
      normalizedSymptom.includes('ไข้') ||
      normalizedSymptom.includes('น้ำมูก') ||
      normalizedSymptom.includes('ไอ')
    ) {
      return 'pharmacy';
    }

    return 'self_care';
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

  // Need more info - get next question (smart clarification, avoids redundant questions)
  const nextQuestion = getNextQuestion(questionsAsked, enrichedAnswers, questionCount, symptom);

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
