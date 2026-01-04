/**
 * Canonical Question Bank Loader
 * 
 * Loads and indexes the Canonical Question Bank (650 questions)
 * organized by symptom group and canonical categories.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for loaded canonical bank
let canonicalBankCache = null;

// Indexes for fast lookup
let questionsBySymptomGroup = null;
let questionsByCategory = null;
let categoriesBySymptomGroup = null;

/**
 * Load Canonical Question Bank from JSON file
 */
export function loadCanonicalQuestionBank() {
  if (canonicalBankCache) {
    return canonicalBankCache;
  }
  
  try {
    // Try multiple possible paths (for different deployment scenarios)
    const possiblePaths = [
      path.join(__dirname, '../../../data/canonical_question_bank.json'), // backend/data/ (Railway deployment)
      path.join(__dirname, '../../../mobile/assets/data/canonical_question_bank.json'), // mobile/assets/data/ (local dev)
      path.join(process.cwd(), 'data/canonical_question_bank.json'), // root/data/ (alternative)
      '/app/data/canonical_question_bank.json', // Direct Railway path
    ];
    
    let canonicalBankPath = null;
    for (const testPath of possiblePaths) {
      try {
        fs.readFileSync(testPath, 'utf8'); // Test if file exists
        canonicalBankPath = testPath;
        console.log(`[CANONICAL-BANK] ✅ Found canonical bank file at: ${canonicalBankPath}`);
        break;
      } catch (err) {
        // File doesn't exist at this path, try next
        continue;
      }
    }
    
    if (!canonicalBankPath) {
      console.warn(`[CANONICAL-BANK] Canonical bank file not found. Tried paths:`, possiblePaths);
      return null; // Return null instead of throwing - allows fallback logic
    }
    
    const canonicalBankData = JSON.parse(fs.readFileSync(canonicalBankPath, 'utf8'));
    canonicalBankCache = canonicalBankData;
    
    // Build indexes
    indexCanonicalBank(canonicalBankData);
    
    return canonicalBankData;
  } catch (error) {
    console.error('[CANONICAL-BANK] Error loading canonical question bank:', error.message);
    return null;
  }
}

/**
 * Index canonical bank for fast lookup
 */
function indexCanonicalBank(canonicalBank) {
  if (!canonicalBank || !canonicalBank.question_banks) {
    return;
  }
  
  questionsBySymptomGroup = new Map();
  questionsByCategory = new Map();
  categoriesBySymptomGroup = new Map();
  
  Object.entries(canonicalBank.question_banks).forEach(([symptomGroup, bank]) => {
    // Index all questions by symptom group
    const allQuestions = [];
    const categories = [];
    
    bank.categories.forEach(category => {
      categories.push(category);
      allQuestions.push(...category.questions);
      
      // Index by category
      const categoryKey = `${symptomGroup}:${category.category_id}`;
      if (!questionsByCategory.has(categoryKey)) {
        questionsByCategory.set(categoryKey, []);
      }
      questionsByCategory.get(categoryKey).push(...category.questions);
    });
    
    questionsBySymptomGroup.set(symptomGroup, allQuestions);
    categoriesBySymptomGroup.set(symptomGroup, categories);
  });
  
  console.log('[CANONICAL-BANK] Indexed questions:', {
    symptomGroups: questionsBySymptomGroup.size,
    categories: questionsByCategory.size
  });
}

/**
 * Get canonical bank for a symptom group
 */
export function getCanonicalBankForGroup(symptomGroup) {
  if (!canonicalBankCache) {
    loadCanonicalQuestionBank();
  }
  
  return canonicalBankCache?.question_banks?.[symptomGroup] || null;
}

/**
 * Get all questions for a symptom group
 */
export function getQuestionsBySymptomGroup(symptomGroup) {
  if (!questionsBySymptomGroup) {
    loadCanonicalQuestionBank();
  }
  
  return questionsBySymptomGroup?.get(symptomGroup) || [];
}

/**
 * Get questions by category for a symptom group
 */
export function getQuestionsByCategory(symptomGroup, categoryId) {
  if (!questionsByCategory) {
    loadCanonicalQuestionBank();
  }
  
  const categoryKey = `${symptomGroup}:${categoryId}`;
  return questionsByCategory?.get(categoryKey) || [];
}

/**
 * Get categories for a symptom group
 */
export function getCategoriesForGroup(symptomGroup) {
  if (!categoriesBySymptomGroup) {
    loadCanonicalQuestionBank();
  }
  
  return categoriesBySymptomGroup?.get(symptomGroup) || [];
}

/**
 * Get question by ID
 */
export function getQuestionById(questionId) {
  const canonicalBank = loadCanonicalQuestionBank();
  if (!canonicalBank || !canonicalBank.question_banks) {
    return null;
  }
  
  for (const bank of Object.values(canonicalBank.question_banks)) {
    for (const category of bank.categories) {
      const question = category.questions.find(q => q.question_id === questionId);
      if (question) {
        return question;
      }
    }
  }
  
  return null;
}

/**
 * Get all questions (for testing/debugging)
 */
export function getAllQuestions() {
  const canonicalBank = loadCanonicalQuestionBank();
  if (!canonicalBank || !canonicalBank.question_banks) {
    return [];
  }
  
  const allQuestions = [];
  Object.values(canonicalBank.question_banks).forEach(bank => {
    bank.categories.forEach(category => {
      allQuestions.push(...category.questions);
    });
  });
  
  return allQuestions;
}

/**
 * Clear cache (useful for testing or reloading)
 */
export function clearCanonicalBankCache() {
  canonicalBankCache = null;
  questionsBySymptomGroup = null;
  questionsByCategory = null;
  categoriesBySymptomGroup = null;
}

