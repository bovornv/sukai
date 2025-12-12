/**
 * Triage assessment logic
 * Follows prompts_clinical_triage_v2.md and PROBLEM_DRIVEN_IMPLEMENTATION.md strictly
 * Problem 1: Must reduce uncertainty - every interaction ends with clear triage, next action, safety boundary
 * Forbidden: vague advice without criteria, "may be multiple things"
 */

// Red flag keywords (life-threatening symptoms)
const RED_FLAGS = [
  'หายใจไม่ออก',
  'หายใจลำบาก',
  'เจ็บหน้าอก',
  'หมดสติ',
  'ชัก',
  'เลือดออกมาก',
  'แขนขาอ่อนแรง',
  'พูดไม่ชัด',
  'มองไม่เห็น',
];

// Emergency keywords
const EMERGENCY_KEYWORDS = [
  'ฉุกเฉิน',
  'รุนแรงมาก',
  'ทนไม่ไหว',
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
 */
function checkRedFlags(symptom) {
  const lowerSymptom = symptom.toLowerCase();
  return RED_FLAGS.some(flag => lowerSymptom.includes(flag.toLowerCase()));
}

/**
 * Check for emergency keywords
 */
function checkEmergency(symptom) {
  const lowerSymptom = symptom.toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword => lowerSymptom.includes(keyword.toLowerCase()));
}

/**
 * Determine next question based on priority and what's already asked
 */
function getNextQuestion(questionsAsked, answers, questionCount) {
  // Max 6 questions
  if (questionCount >= 6) {
    return null;
  }

  // Priority 1: Duration (if not asked)
  if (!questionsAsked.some(q => q.includes('นานเท่าไหร่'))) {
    if (!answers.duration) {
      return QUESTION_TEMPLATES.duration;
    }
  }

  // Priority 2: Severity trend (if not asked)
  if (!questionsAsked.some(q => q.includes('แย่ลง'))) {
    if (!answers.severity_trend) {
      return QUESTION_TEMPLATES.severity_trend;
    }
  }

  // Priority 3: Risk group (if not asked)
  if (!questionsAsked.some(q => q.includes('กลุ่มเสี่ยง'))) {
    if (!answers.risk_group) {
      return QUESTION_TEMPLATES.risk_group;
    }
  }

  // Priority 4: Self-care response (if not asked)
  if (!questionsAsked.some(q => q.includes('ดูแลตัวเอง'))) {
    if (!answers.self_care_response) {
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
 */
function determineTriageLevel(symptom, answers, questionCount) {
  // Emergency check (highest priority)
  if (checkRedFlags(symptom) || checkEmergency(symptom)) {
    return 'emergency';
  }

  // If we have enough info, determine level
  if (questionCount >= 3 || answers.duration) {
    const lowerSymptom = symptom.toLowerCase();

    // High severity indicators → GP
    if (
      lowerSymptom.includes('ปวดมาก') ||
      lowerSymptom.includes('รุนแรง') ||
      lowerSymptom.includes('ไม่ดีขึ้น') ||
      (answers.severity_trend && answers.severity_trend.includes('แย่ลง'))
    ) {
      return 'gp';
    }

    // Moderate symptoms → Pharmacy
    if (
      lowerSymptom.includes('ปวด') ||
      lowerSymptom.includes('ไข้') ||
      lowerSymptom.includes('น้ำมูก') ||
      lowerSymptom.includes('ไอ')
    ) {
      return 'pharmacy';
    }

    // Mild symptoms → Self care
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
 */
export async function assessSymptomLogic({
  symptom,
  previousAnswers,
  questionsAsked,
  questionCount,
}) {
  // Check for red flags first (highest priority) - provides clear safety boundary
  if (checkRedFlags(symptom) || checkEmergency(symptom)) {
    return {
      needMoreInfo: false,
      nextQuestion: null,
      triageLevel: 'emergency', // Clear result: emergency
    };
  }

  // Determine current triage level
  const triageLevel = determineTriageLevel(symptom, previousAnswers, questionCount);

  // Calculate confidence
  const confidence = calculateConfidence(previousAnswers, questionCount);

  // Stop conditions (from docs):
  // - emergency detected (already handled above)
  // - gp/pharmacy threshold reached (clear result)
  // - confidence ≥ 80% (clear result)
  // PROBLEM_DRIVEN_IMPLEMENTATION.md: Must stop when we have clear triage
  const shouldStop =
    triageLevel === 'gp' ||
    triageLevel === 'pharmacy' ||
    triageLevel === 'self_care' ||
    confidence >= 80 ||
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
    };
  }

  // Need more info - get next question (reduces uncertainty)
  const nextQuestion = getNextQuestion(questionsAsked, previousAnswers, questionCount);

  return {
    needMoreInfo: nextQuestion !== null,
    nextQuestion,
    triageLevel: triageLevel === 'uncertain' ? 'uncertain' : triageLevel,
  };
}
