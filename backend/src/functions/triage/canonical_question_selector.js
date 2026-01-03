/**
 * Canonical Question Selector
 * 
 * Selects questions from the Canonical Question Bank based on:
 * - Symptom group
 * - Question number (determines priority)
 * - Already asked questions
 * - Category alternation rules
 * - Clinical context
 */

import {
  getCanonicalBankForGroup,
  getQuestionsByCategory,
  getCategoriesForGroup,
  getQuestionById
} from './canonical_question_bank_loader.js';

/**
 * Select next question from Canonical Question Bank
 * 
 * @param {Object} params - Selection parameters
 * @param {string} params.symptomGroup - Symptom group
 * @param {number} params.questionNumber - Current question number (3-14)
 * @param {Array} params.questionsAsked - Array of question IDs already asked
 * @param {string} params.lastCategoryId - Last question's category ID
 * @param {string} params.severity - Current severity (mild/moderate/severe)
 * @param {string} params.timeCourse - Current time-course
 * @param {string} params.bodyPart - Body part (if known)
 * @param {number} params.confidenceScore - Current confidence score (0.0-1.0)
 * @param {Object} params.assessmentState - Current assessment state
 * @param {number} params.sessionSeed - Random seed for variation
 * @returns {Object|null} Selected question or null
 */
export function selectQuestionFromCanonicalBank({
  symptomGroup,
  questionNumber = 3,
  questionsAsked = [],
  lastCategoryId = null,
  severity = null,
  timeCourse = null,
  bodyPart = null,
  confidenceScore = 0.0,
  assessmentState = {},
  sessionSeed = Math.random()
}) {
  // Load canonical bank for symptom group
  const canonicalBank = getCanonicalBankForGroup(symptomGroup);
  
  if (!canonicalBank || !canonicalBank.categories) {
    console.warn(`[CANONICAL-SELECTOR] No canonical bank found for symptom group: ${symptomGroup}`);
    return null;
  }
  
  // Determine priority level based on question number
  const priorityLevel = getPriorityForQuestionNumber(questionNumber);
  
  // Get categories matching priority level
  const availableCategories = canonicalBank.categories.filter(cat => 
    priorityLevel.includes(cat.priority)
  );
  
  if (availableCategories.length === 0) {
    console.warn(`[CANONICAL-SELECTOR] No categories found for priority level: ${priorityLevel}`);
    return null;
  }
  
  // Filter categories by exclude conditions
  const filteredCategories = availableCategories.filter(cat => {
    // Check if category should be excluded
    if (cat.questions.length === 0) return false;
    
    // Check exclude conditions for first question in category
    const sampleQuestion = cat.questions[0];
    if (sampleQuestion.exclude_if && sampleQuestion.exclude_if.length > 0) {
      for (const condition of sampleQuestion.exclude_if) {
        if (assessmentState.flags && assessmentState.flags[condition] === true) {
          return false; // Exclude this category
        }
      }
    }
    
    return true;
  });
  
  // Exclude category if same as last question (except red-flag)
  const candidateCategories = filteredCategories.filter(cat => {
    if (lastCategoryId && cat.category_id === lastCategoryId) {
      // Exception: Red-flag questions can be consecutive
      if (cat.category_id === 'red_flag_exclusion') {
        return true;
      }
      return false; // Don't ask same category back-to-back
    }
    return true;
  });
  
  if (candidateCategories.length === 0) {
    console.warn(`[CANONICAL-SELECTOR] No candidate categories after filtering`);
    return null;
  }
  
  // Collect all candidate questions from candidate categories
  const candidateQuestions = [];
  
  candidateCategories.forEach(category => {
    category.questions.forEach(question => {
      // Filter by already asked
      if (wasAsked(question.question_id, questionsAsked)) {
        return; // Skip
      }
      
      // Filter by exclude conditions
      if (shouldExcludeQuestion(question, assessmentState)) {
        return; // Skip
      }
      
      // Filter by body part (if applicable)
      if (question.requires_body_part && !bodyPart) {
        return; // Skip
      }
      
      // Filter by severity/time-course (if applicable)
      if (severity && question.severity_filter) {
        if (!matchesSeverityFilter(question.severity_filter, severity)) {
          return; // Skip
        }
      }
      
      if (timeCourse && question.time_course_filter) {
        if (!question.time_course_filter.includes(timeCourse)) {
          return; // Skip
        }
      }
      
      candidateQuestions.push({
        question,
        category: category.category_id,
        priority: category.priority
      });
    });
  });
  
  if (candidateQuestions.length === 0) {
    console.warn(`[CANONICAL-SELECTOR] No candidate questions after filtering`);
    return null;
  }
  
  // Rank questions by priority
  const rankedQuestions = rankQuestions(
    candidateQuestions,
    questionNumber,
    confidenceScore,
    lastCategoryId,
    sessionSeed
  );
  
  // Select top question
  const selected = rankedQuestions[0];
  
  console.log(`[CANONICAL-SELECTOR] Selected question:`, {
    questionId: selected.question.question_id,
    category: selected.category,
    priority: selected.priority,
    questionNumber: questionNumber,
    availableCount: candidateQuestions.length
  });
  
  return selected.question;
}

/**
 * Get priority level(s) for question number
 */
function getPriorityForQuestionNumber(questionNumber) {
  if (questionNumber <= 3) {
    return [1]; // Red-flag + Body-part
  } else if (questionNumber <= 5) {
    return [2]; // Severity + Time-course
  } else if (questionNumber <= 9) {
    return [3]; // Character + Associated + Functional
  } else {
    return [4]; // Triggers + Risk + Previous
  }
}

/**
 * Check if question was already asked
 */
function wasAsked(questionId, questionsAsked) {
  if (!Array.isArray(questionsAsked)) {
    return false;
  }
  
  return questionsAsked.some(asked => {
    if (typeof asked === 'string') {
      return asked === questionId;
    }
    // If asked is an object with question_id
    if (asked && asked.question_id) {
      return asked.question_id === questionId;
    }
    return false;
  });
}

/**
 * Check if question should be excluded
 */
function shouldExcludeQuestion(question, assessmentState) {
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

/**
 * Check if severity matches filter
 */
function matchesSeverityFilter(filter, severity) {
  if (!filter) return true;
  
  const severityOrder = { mild: 1, moderate: 2, severe: 3 };
  const currentSeverity = severityOrder[severity] || 2;
  
  if (filter.min && severityOrder[filter.min] > currentSeverity) {
    return false;
  }
  if (filter.max && severityOrder[filter.max] < currentSeverity) {
    return false;
  }
  
  return true;
}

/**
 * Rank questions by priority and other factors
 */
function rankQuestions(candidateQuestions, questionNumber, confidenceScore, lastCategoryId, sessionSeed) {
  return candidateQuestions.map(item => {
    let priorityScore = 0;
    
    // Base priority (from category)
    priorityScore += (5 - item.priority) * 20; // Higher priority = higher score
    
    // Confidence weight
    priorityScore += item.question.confidence_weight * 100;
    
    // Category alternation bonus (prefer different category)
    if (lastCategoryId && item.category !== lastCategoryId) {
      priorityScore += 15; // Bonus for different category
    }
    
    // Question number alignment
    const categoryConfig = getCategoryConfig(item.category);
    if (categoryConfig && categoryConfig.when_to_ask) {
      const expectedQ = `Q${questionNumber}`;
      if (categoryConfig.when_to_ask.includes(expectedQ)) {
        priorityScore += 20; // Bonus for being asked at right time
      }
    }
    
    // Confidence gap bonus (prioritize high-weight questions if confidence low)
    if (confidenceScore < 0.70) {
      priorityScore += item.question.confidence_weight * 50;
    }
    
    // Randomization (within same priority level)
    priorityScore += Math.random() * 10 * sessionSeed;
    
    return {
      ...item,
      priorityScore
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore)
    .map(item => item.question);
}

/**
 * Get category configuration
 */
function getCategoryConfig(categoryId) {
  const configs = {
    'body_part_localization': { priority: 1, when_to_ask: ['Q2', 'Q3'] },
    'red_flag_exclusion': { priority: 1, when_to_ask: ['Q1', 'Q2', 'Q3'] },
    'severity_assessment': { priority: 2, when_to_ask: ['Q3', 'Q4', 'Q5'] },
    'time_course_duration': { priority: 2, when_to_ask: ['Q3', 'Q4', 'Q5'] },
    'symptom_character': { priority: 3, when_to_ask: ['Q4', 'Q5', 'Q6', 'Q7'] },
    'associated_symptoms': { priority: 3, when_to_ask: ['Q5', 'Q6', 'Q7', 'Q8', 'Q9'] },
    'functional_impact': { priority: 3, when_to_ask: ['Q5', 'Q6', 'Q7', 'Q8'] },
    'triggers_relieving_factors': { priority: 4, when_to_ask: ['Q6', 'Q7', 'Q8', 'Q9', 'Q10'] },
    'risk_factors_history': { priority: 4, when_to_ask: ['Q8', 'Q9', 'Q10', 'Q11', 'Q12'] },
    'previous_episodes': { priority: 4, when_to_ask: ['Q9', 'Q10', 'Q11', 'Q12', 'Q13', 'Q14'] }
  };
  
  return configs[categoryId] || null;
}

