/**
 * Confidence Calculator
 * 
 * Calculates clinical confidence scores throughout the assessment
 * to determine when to stop asking questions and provide recommendations.
 */

/**
 * Calculate confidence score based on answers and assessment state
 * 
 * @param {Object} params - Calculation parameters
 * @param {Object} params.answers - User answers
 * @param {Array} params.questionsAsked - Array of question IDs asked
 * @param {string} params.severity - Current severity (mild/moderate/severe)
 * @param {string} params.timeCourse - Current time-course (acute/subacute/progressive/recurrent)
 * @param {string} params.bodyPart - Body part (if known)
 * @param {Object} params.questionBank - Question bank (for question metadata)
 * @returns {number} Confidence score (0.0-1.0)
 */
export function calculateConfidence({
  answers = {},
  questionsAsked = [],
  severity = null,
  timeCourse = null,
  bodyPart = null,
  questionBank = null
}) {
  let confidence = 0.0;
  
  // Base confidence from Question 1 (Intent Resolution)
  if (answers.selected_symptom || answers.original_symptom) {
    confidence += 0.10;
  }
  
  // Base confidence from Question 2 (Body-Part Clarification)
  if (bodyPart && bodyPart !== 'uncertain' && bodyPart !== 'multiple') {
    confidence += 0.10;
  }
  
  // Confidence from answered questions
  if (questionBank && questionBank.questions) {
    questionsAsked.forEach(questionId => {
      const question = questionBank.questions.find(q => q.question_id === questionId);
      if (question) {
        const answer = answers[questionId];
        if (answer && question.choice_mapping && question.choice_mapping[answer]) {
          const mapping = question.choice_mapping[answer];
          confidence += mapping.confidence_boost || 0;
        } else {
          // Default confidence boost from question weight
          confidence += question.confidence_weight * 0.5; // Reduced if no answer mapping
        }
      }
    });
  } else {
    // Fallback: estimate confidence from question count
    const questionCount = questionsAsked.length;
    confidence += Math.min(questionCount * 0.05, 0.50); // Max 0.50 from questions
  }
  
  // Severity clarity bonus
  if (severity) {
    confidence += 0.10; // Severity is clear
  }
  
  // Time-course clarity bonus
  if (timeCourse) {
    confidence += 0.10; // Time-course is clear
  }
  
  // Red-flag exclusion bonus (if no red flags detected)
  if (answers.red_flag_screening_passed !== false && 
      answers.red_flag_positive !== true) {
    confidence += 0.05; // Red flags ruled out
  }
  
  // Body-part clarity bonus
  if (bodyPart && bodyPart !== 'uncertain' && bodyPart !== 'multiple') {
    confidence += 0.05; // Body part is clear
  }
  
  // Cap at 1.0
  confidence = Math.min(confidence, 1.0);
  
  return Math.round(confidence * 100) / 100;
}

/**
 * Update confidence after answering a question
 * 
 * @param {number} currentConfidence - Current confidence score
 * @param {Object} question - Question object
 * @param {string} answer - User's answer
 * @param {Object} previousAnswers - Previous answers
 * @returns {number} Updated confidence score
 */
export function updateConfidenceAfterAnswer(currentConfidence, question, answer, previousAnswers = {}) {
  if (!question || !answer) {
    return currentConfidence;
  }
  
  let confidenceBoost = 0;
  
  // Get confidence boost from choice mapping
  if (question.choice_mapping && question.choice_mapping[answer]) {
    const mapping = question.choice_mapping[answer];
    confidenceBoost = mapping.confidence_boost || 0;
  } else {
    // Fallback: use question's confidence weight
    confidenceBoost = question.confidence_weight * 0.5;
  }
  
  // Additional boost for high-value questions
  if (question.intent_type === 'red_flag_exclusion' && answer === 'ไม่') {
    confidenceBoost += 0.05; // Red flag ruled out
  }
  
  if (question.intent_type === 'severity' && answer !== 'ไม่แน่ใจ') {
    confidenceBoost += 0.03; // Severity clarified
  }
  
  if (question.intent_type === 'time_course' && answer !== 'ไม่แน่ใจ') {
    confidenceBoost += 0.03; // Time-course clarified
  }
  
  const newConfidence = currentConfidence + confidenceBoost;
  return Math.min(newConfidence, 1.0);
}

/**
 * Check if confidence threshold is met
 * 
 * @param {number} confidenceScore - Current confidence score
 * @param {number} threshold - Target threshold (default: 0.80)
 * @returns {boolean} True if threshold met
 */
export function isConfidenceThresholdMet(confidenceScore, threshold = 0.80) {
  return confidenceScore >= threshold;
}

/**
 * Check if minimum questions reached
 * 
 * @param {number} questionNumber - Current question number
 * @param {number} minimum - Minimum questions required (default: 10)
 * @returns {boolean} True if minimum reached
 */
export function isMinimumQuestionsReached(questionNumber, minimum = 10) {
  return questionNumber >= minimum;
}

/**
 * Check if maximum questions reached
 * 
 * @param {number} questionNumber - Current question number
 * @param {number} maximum - Maximum questions allowed (default: 14)
 * @returns {boolean} True if maximum reached
 */
export function isMaximumQuestionsReached(questionNumber, maximum = 14) {
  return questionNumber >= maximum;
}

/**
 * Determine if assessment should continue
 * 
 * @param {Object} params - Decision parameters
 * @param {number} params.confidenceScore - Current confidence score
 * @param {number} params.questionNumber - Current question number
 * @param {boolean} params.emergencyDetected - Whether emergency detected
 * @param {number} params.confidenceThreshold - Target threshold (default: 0.80)
 * @param {number} params.minimumQuestions - Minimum questions (default: 10)
 * @param {number} params.maximumQuestions - Maximum questions (default: 14)
 * @returns {Object} Decision result
 */
export function shouldContinueAssessment({
  confidenceScore,
  questionNumber,
  emergencyDetected = false,
  confidenceThreshold = 0.80,
  minimumQuestions = 10,
  maximumQuestions = 14
}) {
  // Emergency: stop immediately
  if (emergencyDetected) {
    return {
      shouldContinue: false,
      reason: 'emergency_detected'
    };
  }
  
  // Maximum questions reached: stop
  if (questionNumber >= maximumQuestions) {
    return {
      shouldContinue: false,
      reason: 'maximum_questions_reached',
      confidenceScore
    };
  }
  
  // Confidence threshold met AND minimum questions reached: stop
  if (confidenceScore >= confidenceThreshold && questionNumber >= minimumQuestions) {
    return {
      shouldContinue: false,
      reason: 'confidence_threshold_met',
      confidenceScore
    };
  }
  
  // Continue asking
  return {
    shouldContinue: true,
    reason: 'continue_assessment',
    confidenceScore
  };
}

