/**
 * Question Selector
 * 
 * Selects questions from the Question Bank dynamically based on:
 * - Symptom group
 * - Body part
 * - Severity × Time-course
 * - Confidence score
 * - Already asked questions
 * - Assessment state
 */

import {
  getQuestionsBySymptomGroup,
  getQuestionsByIntentType,
  getQuestionsByWhenToAsk,
  getQuestionById
} from './question_bank_loader.js';

/**
 * Select next question from Question Bank
 * 
 * @param {Object} params - Selection parameters
 * @param {string} params.symptomGroup - Symptom group
 * @param {string} params.bodyPart - Body part (if known)
 * @param {string} params.severity - Current severity (mild/moderate/severe)
 * @param {string} params.timeCourse - Current time-course (acute/subacute/progressive/recurrent)
 * @param {number} params.confidenceScore - Current confidence score (0.0-1.0)
 * @param {number} params.questionNumber - Current question number (3-14)
 * @param {Array} params.questionsAsked - Array of question IDs already asked
 * @param {Object} params.assessmentState - Current assessment state
 * @param {number} params.sessionSeed - Random seed for variation
 * @returns {Object|null} Selected question or null
 */
export function selectNextQuestionFromBank({
  symptomGroup,
  bodyPart = null,
  severity = null,
  timeCourse = null,
  confidenceScore = 0.0,
  questionNumber = 3,
  questionsAsked = [],
  assessmentState = {},
  sessionSeed = Math.random()
}) {
  // Load questions for this symptom group
  let availableQuestions = getQuestionsBySymptomGroup(symptomGroup);
  
  if (availableQuestions.length === 0) {
    console.warn(`[QUESTION_SELECTOR] No questions found for symptom group: ${symptomGroup}`);
    return null;
  }
  
  // Step 1: Filter by exclude conditions
  availableQuestions = filterQuestionsByExcludeConditions(availableQuestions, assessmentState);
  
  // Step 2: Filter by already asked
  availableQuestions = filterQuestionsByAlreadyAsked(availableQuestions, questionsAsked);
  
  // Step 3: Filter by body part (if applicable)
  if (bodyPart) {
    availableQuestions = filterQuestionsByBodyPart(availableQuestions, bodyPart);
  } else {
    // If body part unknown, exclude body-part-specific questions
    availableQuestions = availableQuestions.filter(q => !q.requires_body_part);
  }
  
  // Step 4: Filter by severity/time-course (if applicable)
  if (severity) {
    availableQuestions = filterQuestionsBySeverity(availableQuestions, severity);
  }
  if (timeCourse) {
    availableQuestions = filterQuestionsByTimeCourse(availableQuestions, timeCourse);
  }
  
  // Step 5: Filter by when to ask (based on question number)
  availableQuestions = filterQuestionsByWhenToAsk(availableQuestions, questionNumber);
  
  // Step 6: Avoid asking same intent type back-to-back
  if (questionsAsked.length > 0) {
    const lastQuestion = getQuestionById(questionsAsked[questionsAsked.length - 1]);
    if (lastQuestion) {
      availableQuestions = availableQuestions.filter(q => 
        q.intent_type !== lastQuestion.intent_type
      );
    }
  }
  
  if (availableQuestions.length === 0) {
    console.warn(`[QUESTION_SELECTOR] No available questions after filtering`);
    return null;
  }
  
  // Step 7: Rank questions by priority
  const rankedQuestions = rankQuestionsByPriority(
    availableQuestions,
    questionNumber,
    confidenceScore,
    severity,
    timeCourse,
    sessionSeed
  );
  
  // Step 8: Select top question
  const selectedQuestion = rankedQuestions[0];
  
  console.log(`[QUESTION_SELECTOR] Selected question:`, {
    questionId: selectedQuestion.question_id,
    intentType: selectedQuestion.intent_type,
    whenToAsk: selectedQuestion.when_to_ask,
    confidenceWeight: selectedQuestion.confidence_weight,
    questionNumber: questionNumber,
    availableCount: availableQuestions.length
  });
  
  return selectedQuestion;
}

/**
 * Filter questions by exclude conditions
 */
function filterQuestionsByExcludeConditions(questions, assessmentState) {
  return questions.filter(question => {
    if (!question.exclude_if || question.exclude_if.length === 0) {
      return true;
    }
    
    // Check each exclude condition
    for (const condition of question.exclude_if) {
      if (assessmentState.flags && assessmentState.flags[condition] === true) {
        return false; // Exclude this question
      }
    }
    
    return true; // Don't exclude
  });
}

/**
 * Filter questions by already asked
 */
function filterQuestionsByAlreadyAsked(questions, questionsAsked) {
  const askedIds = new Set(questionsAsked);
  const askedIntentTypes = new Set();
  
  // Track intent types of asked questions
  questionsAsked.forEach(qId => {
    const q = getQuestionById(qId);
    if (q) {
      askedIntentTypes.add(q.intent_type);
    }
  });
  
  return questions.filter(question => {
    // Exclude if question ID already asked
    if (askedIds.has(question.question_id)) {
      return false;
    }
    
    // Exclude if skip_if_answered conditions met
    if (question.skip_if_answered) {
      for (const skipId of question.skip_if_answered) {
        if (askedIds.has(skipId)) {
          return false;
        }
      }
    }
    
    return true;
  });
}

/**
 * Filter questions by body part
 */
function filterQuestionsByBodyPart(questions, bodyPart) {
  return questions.filter(question => {
    // If question requires body part but doesn't specify which, include it
    if (question.requires_body_part && 
        (!question.body_part_specific || question.body_part_specific.length === 0)) {
      return true;
    }
    
    // If question has body_part_specific, check if bodyPart matches
    if (question.body_part_specific && question.body_part_specific.length > 0) {
      return question.body_part_specific.includes(bodyPart);
    }
    
    // If question doesn't require body part, include it
    return !question.requires_body_part;
  });
}

/**
 * Filter questions by severity
 */
function filterQuestionsBySeverity(questions, severity) {
  return questions.filter(question => {
    if (!question.severity_filter) {
      return true; // No filter, include
    }
    
    const filter = question.severity_filter;
    const severityOrder = { mild: 1, moderate: 2, severe: 3 };
    const currentSeverity = severityOrder[severity] || 2;
    
    if (filter.min && severityOrder[filter.min] > currentSeverity) {
      return false; // Below minimum
    }
    if (filter.max && severityOrder[filter.max] < currentSeverity) {
      return false; // Above maximum
    }
    
    return true;
  });
}

/**
 * Filter questions by time-course
 */
function filterQuestionsByTimeCourse(questions, timeCourse) {
  return questions.filter(question => {
    if (!question.time_course_filter || question.time_course_filter.length === 0) {
      return true; // No filter, include
    }
    
    return question.time_course_filter.includes(timeCourse);
  });
}

/**
 * Filter questions by when to ask (based on question number)
 */
function filterQuestionsByWhenToAsk(questions, questionNumber) {
  let preferredWhenToAsk = [];
  
  if (questionNumber >= 3 && questionNumber <= 5) {
    preferredWhenToAsk = ['early'];
  } else if (questionNumber >= 6 && questionNumber <= 10) {
    preferredWhenToAsk = ['mid', 'early'];
  } else if (questionNumber >= 11 && questionNumber <= 14) {
    preferredWhenToAsk = ['late', 'mid'];
  }
  
  // Prioritize preferred when_to_ask, but don't exclude others
  return questions.sort((a, b) => {
    const aPreferred = preferredWhenToAsk.includes(a.when_to_ask);
    const bPreferred = preferredWhenToAsk.includes(b.when_to_ask);
    
    if (aPreferred && !bPreferred) return -1;
    if (!aPreferred && bPreferred) return 1;
    return 0;
  });
}

/**
 * Rank questions by priority
 */
function rankQuestionsByPriority(questions, questionNumber, confidenceScore, severity, timeCourse, sessionSeed) {
  return questions.map(question => {
    let priorityScore = 0;
    
    // Base priority (from question metadata)
    priorityScore += (6 - question.priority) * 20; // Higher priority = higher score
    
    // Confidence weight
    priorityScore += question.confidence_weight * 100;
    
    // Timing bonus
    if (questionNumber >= 3 && questionNumber <= 5 && question.when_to_ask === 'early') {
      priorityScore += 20;
    } else if (questionNumber >= 6 && questionNumber <= 10 && question.when_to_ask === 'mid') {
      priorityScore += 10;
    } else if (questionNumber >= 11 && questionNumber <= 14 && question.when_to_ask === 'late') {
      priorityScore += 5;
    }
    
    // Intent type priority
    const intentPriority = {
      'red_flag_exclusion': 50,
      'severity': 40,
      'time_course': 40,
      'body_part_detail': 30,
      'associated_symptom': 20,
      'trigger': 20,
      'functional_impact': 15,
      'relieving_factor': 10,
      'risk_factor': 10
    };
    priorityScore += intentPriority[question.intent_type] || 0;
    
    // Confidence gap bonus (prioritize high-weight questions if confidence low)
    if (confidenceScore < 0.70) {
      priorityScore += question.confidence_weight * 50;
    }
    
    // Progressive symptoms → prioritize red-flag questions
    if (timeCourse === 'progressive' && question.intent_type === 'red_flag_exclusion') {
      priorityScore += 30;
    }
    
    // Randomization (within same priority level)
    priorityScore += Math.random() * 10 * sessionSeed;
    
    return {
      question,
      priorityScore
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore)
    .map(item => item.question);
}

/**
 * Check if question should be excluded based on assessment state
 */
export function shouldExcludeQuestion(question, assessmentState) {
  if (!question.exclude_if || question.exclude_if.length === 0) {
    return false;
  }
  
  for (const condition of question.exclude_if) {
    if (assessmentState.flags && assessmentState.flags[condition] === true) {
      return true; // Exclude
    }
  }
  
  return false; // Don't exclude
}

