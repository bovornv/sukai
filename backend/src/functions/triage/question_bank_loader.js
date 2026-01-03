/**
 * Question Bank Loader
 * 
 * Loads and indexes the Master Question Bank (300-500 questions)
 * for dynamic question selection in Suk AI's assessment flow.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for loaded question bank
let questionBankCache = null;

// Indexes for fast lookup
let questionsBySymptomGroup = null;
let questionsByIntentType = null;
let questionsByWhenToAsk = null;

/**
 * Load Question Bank from JSON file
 */
export function loadQuestionBank() {
  if (questionBankCache) {
    return questionBankCache;
  }
  
  try {
    const questionBankPath = path.join(__dirname, '../../../mobile/assets/data/question_bank_master.json');
    const questionBankData = JSON.parse(fs.readFileSync(questionBankPath, 'utf8'));
    questionBankCache = questionBankData;
    
    // Build indexes
    indexQuestionBank(questionBankData);
    
    return questionBankData;
  } catch (error) {
    console.error('[QUESTION_BANK] Error loading question bank:', error.message);
    return null;
  }
}

/**
 * Index questions for fast lookup
 */
function indexQuestionBank(questionBank) {
  if (!questionBank || !questionBank.questions) {
    return;
  }
  
  questionsBySymptomGroup = new Map();
  questionsByIntentType = new Map();
  questionsByWhenToAsk = new Map();
  
  questionBank.questions.forEach(question => {
    // Index by symptom group
    if (!questionsBySymptomGroup.has(question.symptom_group)) {
      questionsBySymptomGroup.set(question.symptom_group, []);
    }
    questionsBySymptomGroup.get(question.symptom_group).push(question);
    
    // Index by intent type
    if (!questionsByIntentType.has(question.intent_type)) {
      questionsByIntentType.set(question.intent_type, []);
    }
    questionsByIntentType.get(question.intent_type).push(question);
    
    // Index by when to ask
    if (!questionsByWhenToAsk.has(question.when_to_ask)) {
      questionsByWhenToAsk.set(question.when_to_ask, []);
    }
    questionsByWhenToAsk.get(question.when_to_ask).push(question);
  });
  
  console.log('[QUESTION_BANK] Indexed questions:', {
    symptomGroups: questionsBySymptomGroup.size,
    intentTypes: questionsByIntentType.size,
    whenToAsk: questionsByWhenToAsk.size
  });
}

/**
 * Get questions by symptom group
 */
export function getQuestionsBySymptomGroup(symptomGroup) {
  if (!questionsBySymptomGroup) {
    loadQuestionBank();
  }
  
  return questionsBySymptomGroup?.get(symptomGroup) || [];
}

/**
 * Get questions by intent type
 */
export function getQuestionsByIntentType(intentType) {
  if (!questionsByIntentType) {
    loadQuestionBank();
  }
  
  return questionsByIntentType?.get(intentType) || [];
}

/**
 * Get questions by when to ask
 */
export function getQuestionsByWhenToAsk(whenToAsk) {
  if (!questionsByWhenToAsk) {
    loadQuestionBank();
  }
  
  return questionsByWhenToAsk?.get(whenToAsk) || [];
}

/**
 * Get question by ID
 */
export function getQuestionById(questionId) {
  const questionBank = loadQuestionBank();
  if (!questionBank || !questionBank.questions) {
    return null;
  }
  
  return questionBank.questions.find(q => q.question_id === questionId) || null;
}

/**
 * Get all questions (for testing/debugging)
 */
export function getAllQuestions() {
  const questionBank = loadQuestionBank();
  return questionBank?.questions || [];
}

/**
 * Clear cache (useful for testing or reloading)
 */
export function clearQuestionBankCache() {
  questionBankCache = null;
  questionsBySymptomGroup = null;
  questionsByIntentType = null;
  questionsByWhenToAsk = null;
}

