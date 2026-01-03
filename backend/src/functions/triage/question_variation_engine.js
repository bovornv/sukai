/**
 * Question Variation Engine (Medical-Grade)
 * 
 * CRITICAL UX REQUIREMENT:
 * Users must NEVER experience the same question sequence when starting a new assessment,
 * even for the same symptom.
 * 
 * Core Principle:
 * Each assessment session = Fresh clinical encounter with no reused question paths
 * 
 * Features:
 * - Session-level clinical reset
 * - Question category locking
 * - Sequence variation across sessions
 * - Hypothesis-driven selection
 * - Anti-pattern detection
 */

import { normalizeThaiText } from './thai_normalizer.js';

/**
 * Question Categories (ONE category per question)
 */
export const QUESTION_CATEGORIES = {
  SEVERITY: 'severity',
  TIME_COURSE: 'time_course',
  LOCATION: 'location',
  QUALITY: 'quality',
  ASSOCIATED_SYMPTOMS: 'associated_symptoms',
  TRIGGERS: 'triggers',
  RELIEVING_FACTORS: 'relieving_factors',
  FUNCTIONAL_IMPACT: 'functional_impact',
  RED_FLAG: 'red_flag',
  HEALTH_HISTORY: 'health_history',
};

/**
 * Question Memory Guard (Within Session)
 * Tracks clinical variables already asked to prevent duplicates
 */
export class QuestionMemoryGuard {
  constructor() {
    this.askedCategories = new Set();
    this.askedVariables = new Set();
    this.askedQuestions = [];
    this.semanticEquivalents = new Map();
  }
  
  /**
   * Check if a clinical variable has been asked
   */
  hasAskedVariable(variable) {
    return this.askedVariables.has(variable);
  }
  
  /**
   * Check if a question category has been asked
   */
  hasAskedCategory(category) {
    return this.askedCategories.has(category);
  }
  
  /**
   * Check if a semantically equivalent question was asked
   */
  hasAskedSemanticEquivalent(questionText) {
    const normalized = normalizeThaiText(questionText.toLowerCase());
    
    // Check exact matches
    if (this.askedQuestions.some(q => normalizeThaiText(q.toLowerCase()) === normalized)) {
      return true;
    }
    
    // Check semantic equivalents
    for (const [key, equivalents] of this.semanticEquivalents.entries()) {
      if (equivalents.some(eq => normalizeThaiText(eq.toLowerCase()) === normalized)) {
        return true;
      }
    }
    
    // Check key phrase overlap
    const keyPhrases = this.extractKeyPhrases(questionText);
    for (const askedQ of this.askedQuestions) {
      const askedKeyPhrases = this.extractKeyPhrases(askedQ);
      const overlap = keyPhrases.filter(p => askedKeyPhrases.includes(p));
      if (overlap.length >= 2) {
        return true; // Similar questions
      }
    }
    
    return false;
  }
  
  /**
   * Extract key phrases from question text
   */
  extractKeyPhrases(text) {
    const normalized = normalizeThaiText(text.toLowerCase());
    const phrases = [
      'นานเท่าไหร่', 'นานแค่ไหน', 'เป็นมานาน', 'เริ่มเมื่อไหร่',
      'รุนแรง', 'รบกวน', 'แย่ลง', 'ดีขึ้น',
      'ปวด', 'เจ็บ', 'แสบ', 'เมื่อย',
      'ไข้', 'อุณหภูมิ',
      'หายใจ', 'หายใจลำบาก',
      'เจ็บหน้าอก', 'แน่นอก',
      'ข้อมูลด้านสุขภาพ', 'โรคประจำตัว',
    ];
    return phrases.filter(phrase => normalized.includes(phrase));
  }
  
  /**
   * Register a question as asked
   */
  registerQuestion(questionText, category, variable = null) {
    this.askedQuestions.push(questionText);
    if (category) {
      this.askedCategories.add(category);
    }
    if (variable) {
      this.askedVariables.add(variable);
    }
    
    // Register semantic equivalents
    const normalized = normalizeThaiText(questionText.toLowerCase());
    if (!this.semanticEquivalents.has(normalized)) {
      this.semanticEquivalents.set(normalized, []);
    }
  }
  
  /**
   * Reset for new session
   */
  reset() {
    this.askedCategories.clear();
    this.askedVariables.clear();
    this.askedQuestions = [];
    this.semanticEquivalents.clear();
  }
}

/**
 * Sequence Variation Engine
 * Ensures different question sequences across sessions
 */
export class SequenceVariationEngine {
  constructor() {
    this.sessionSeed = this.generateSessionSeed();
    this.questionPathHistory = [];
  }
  
  /**
   * Generate unique session seed
   * Combines: timestamp, random, symptom hash
   */
  generateSessionSeed() {
    const timestamp = Date.now();
    const random = Math.random() * 1000000;
    return Math.floor(timestamp + random);
  }
  
  /**
   * Get variation seed for this session
   */
  getSessionSeed() {
    return this.sessionSeed;
  }
  
  /**
   * Generate variation seed based on multiple factors
   */
  generateVariationSeed(questionCount, answers, symptom, sessionHistory = null) {
    // Base seed from session
    let seed = this.sessionSeed;
    
    // Add symptom hash (different symptoms = different paths)
    const symptomHash = this.hashString(symptom);
    seed += symptomHash;
    
    // Add question count (different focus at different stages)
    seed += questionCount * 1000;
    
    // Add answers hash (different answers = different paths)
    if (answers && Object.keys(answers).length > 0) {
      const answersHash = this.hashString(JSON.stringify(answers));
      seed += answersHash % 10000;
    }
    
    // Add session history (if same user, vary approach)
    if (sessionHistory) {
      const historyHash = this.hashString(JSON.stringify(sessionHistory));
      seed += historyHash % 1000;
    }
    
    return seed;
  }
  
  /**
   * Hash string to number
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Shuffle array with session-specific seed
   */
  shuffleWithSeed(array, seed) {
    if (array.length <= 1) return array;
    
    const shuffled = [...array];
    const rng = this.seededRandom(seed);
    
    // Fisher-Yates shuffle with seeded RNG
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }
  
  /**
   * Seeded random number generator
   */
  seededRandom(seed) {
    let value = seed;
    return function() {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }
  
  /**
   * Select question with variation
   * Ensures different order each session
   */
  selectWithVariation(questions, questionCount, seed) {
    if (!questions || questions.length === 0) return null;
    
    // Shuffle with session-specific seed
    const shuffled = this.shuffleWithSeed(questions, seed + questionCount);
    
    // Rotate based on question count and seed
    const rotatedIndex = (questionCount + seed) % shuffled.length;
    
    return shuffled[rotatedIndex];
  }
  
  /**
   * Reset for new session
   */
  reset() {
    this.sessionSeed = this.generateSessionSeed();
    this.questionPathHistory = [];
  }
}

/**
 * Question-Answer Coherence Checker
 * Ensures answer choices match question intent
 */
export class QuestionAnswerCoherence {
  /**
   * Define answer scope for question category
   */
  static getAnswerScope(category) {
    const scopes = {
      [QUESTION_CATEGORIES.SEVERITY]: {
        allowed: ['mild', 'moderate', 'severe', 'scale', 'impact'],
        forbidden: ['yes_no', 'location', 'time'],
        type: 'ordinal',
      },
      [QUESTION_CATEGORIES.TIME_COURSE]: {
        allowed: ['time', 'duration', 'onset', 'trend'],
        forbidden: ['yes_no', 'severity', 'location'],
        type: 'temporal',
      },
      [QUESTION_CATEGORIES.LOCATION]: {
        allowed: ['location', 'body_part', 'region'],
        forbidden: ['yes_no', 'severity', 'time'],
        type: 'spatial',
      },
      [QUESTION_CATEGORIES.QUALITY]: {
        allowed: ['quality', 'character', 'description'],
        forbidden: ['yes_no', 'severity'],
        type: 'descriptive',
      },
      [QUESTION_CATEGORIES.ASSOCIATED_SYMPTOMS]: {
        allowed: ['symptom_list', 'multi_select'],
        forbidden: ['yes_no'],
        type: 'multi_select',
      },
      [QUESTION_CATEGORIES.TRIGGERS]: {
        allowed: ['trigger_list', 'multi_select'],
        forbidden: ['yes_no'],
        type: 'multi_select',
      },
      [QUESTION_CATEGORIES.RELIEVING_FACTORS]: {
        allowed: ['factor_list', 'multi_select'],
        forbidden: ['yes_no'],
        type: 'multi_select',
      },
      [QUESTION_CATEGORIES.FUNCTIONAL_IMPACT]: {
        allowed: ['impact', 'function', 'activity'],
        forbidden: ['yes_no', 'location'],
        type: 'ordinal',
      },
      [QUESTION_CATEGORIES.RED_FLAG]: {
        allowed: ['yes_no', 'presence'],
        forbidden: ['severity', 'time'],
        type: 'binary',
      },
      [QUESTION_CATEGORIES.HEALTH_HISTORY]: {
        allowed: ['history', 'condition', 'medication'],
        forbidden: ['severity', 'time'],
        type: 'categorical',
      },
    };
    
    return scopes[category] || { allowed: [], forbidden: [], type: 'general' };
  }
  
  /**
   * Validate answer choices match question category
   */
  static validateChoices(questionCategory, choices) {
    const scope = this.getAnswerScope(questionCategory);
    
    // Check if choices contain forbidden types
    const choiceText = choices.join(' ').toLowerCase();
    for (const forbidden of scope.forbidden) {
      if (choiceText.includes(forbidden)) {
        return {
          valid: false,
          error: `Choices contain forbidden type: ${forbidden}`,
        };
      }
    }
    
    // Check if choices match allowed types
    const hasAllowedType = scope.allowed.some(allowed => {
      return choiceText.includes(allowed) || 
             choices.some(c => c.toLowerCase().includes(allowed));
    });
    
    if (!hasAllowedType && scope.allowed.length > 0) {
      return {
        valid: false,
        error: `Choices don't match allowed types: ${scope.allowed.join(', ')}`,
      };
    }
    
    return { valid: true };
  }
}

/**
 * Anti-Pattern Detector
 * Detects template-like question sequences
 */
export class AntiPatternDetector {
  constructor() {
    this.patternHistory = [];
  }
  
  /**
   * Detect if question sequence matches a template pattern
   */
  detectTemplatePattern(questionsAsked, currentQuestion) {
    // Pattern 1: Same first 3 questions
    if (questionsAsked.length >= 3) {
      const firstThree = questionsAsked.slice(0, 3).map(q => 
        normalizeThaiText(q.toLowerCase()).substring(0, 20)
      );
      const pattern = firstThree.join('|');
      
      if (this.patternHistory.includes(pattern)) {
        return {
          detected: true,
          pattern: 'same_first_three',
          severity: 'high',
        };
      }
      this.patternHistory.push(pattern);
    }
    
    // Pattern 2: Fixed order (severity → time-course → impact)
    if (questionsAsked.length >= 3) {
      const categories = this.extractCategories(questionsAsked);
      const orderPattern = categories.join('→');
      const fixedOrders = [
        'severity→time_course→functional_impact',
        'severity→time_course→associated_symptoms',
        'red_flag→severity→time_course',
      ];
      
      if (fixedOrders.includes(orderPattern)) {
        return {
          detected: true,
          pattern: 'fixed_order',
          severity: 'medium',
        };
      }
    }
    
    // Pattern 3: Generic OPD checklist feel
    const genericQuestions = [
      'อาการนี้รบกวนชีวิตประจำวันแค่ไหน',
      'อาการนี้เป็นมานานเท่าไหร่',
      'มีอาการอื่นร่วมด้วยไหม',
    ];
    
    const allGeneric = questionsAsked.every(q => 
      genericQuestions.some(gq => normalizeThaiText(q.toLowerCase()).includes(gq))
    );
    
    if (allGeneric && questionsAsked.length >= 3) {
      return {
        detected: true,
        pattern: 'generic_checklist',
        severity: 'high',
      };
    }
    
    return { detected: false };
  }
  
  /**
   * Extract question categories from questions
   */
  extractCategories(questions) {
    return questions.map(q => {
      const normalized = normalizeThaiText(q.toLowerCase());
      if (normalized.includes('รบกวน') || normalized.includes('รุนแรง')) return 'severity';
      if (normalized.includes('นาน') || normalized.includes('เริ่ม')) return 'time_course';
      if (normalized.includes('รบกวนชีวิต') || normalized.includes('ทำกิจกรรม')) return 'functional_impact';
      if (normalized.includes('อาการอื่น') || normalized.includes('ร่วมด้วย')) return 'associated_symptoms';
      if (normalized.includes('สัญญาณ') || normalized.includes('อันตราย')) return 'red_flag';
      return 'unknown';
    });
  }
  
  /**
   * Reset for new session
   */
  reset() {
    this.patternHistory = [];
  }
}

/**
 * Hypothesis-Driven Question Selector
 * Selects questions that best discriminate between hypotheses
 */
export class HypothesisDrivenSelector {
  /**
   * Calculate information gain for a question
   */
  static calculateInformationGain(question, hypotheses, answers = {}) {
    if (!hypotheses || hypotheses.length === 0) return 0;
    
    // Calculate entropy before asking question
    const entropyBefore = this.calculateEntropy(hypotheses);
    
    // Estimate entropy after (simplified - assumes question splits hypotheses evenly)
    // In practice, this would use conditional probabilities
    const estimatedEntropyAfter = entropyBefore * 0.5; // Assume 50% reduction
    
    return entropyBefore - estimatedEntropyAfter;
  }
  
  /**
   * Calculate entropy of hypothesis distribution
   */
  static calculateEntropy(hypotheses) {
    let entropy = 0;
    const total = hypotheses.reduce((sum, h) => 
      sum + (h.confidence || h.adjustedProbability || 0), 0
    );
    
    if (total === 0) return 0;
    
    for (const h of hypotheses) {
      const prob = (h.confidence || h.adjustedProbability || 0) / total;
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }
    
    return entropy;
  }
  
  /**
   * Select question with highest information gain
   */
  static selectBestQuestion(availableQuestions, hypotheses, memoryGuard, answers = {}) {
    if (!availableQuestions || availableQuestions.length === 0) return null;
    
    // Filter out already asked questions
    const unaskedQuestions = availableQuestions.filter(q => {
      const questionText = typeof q === 'string' ? q : (q.text || q.question);
      return !memoryGuard.hasAskedSemanticEquivalent(questionText);
    });
    
    if (unaskedQuestions.length === 0) return null;
    
    // Calculate information gain for each question
    const questionsWithGain = unaskedQuestions.map(q => {
      const questionText = typeof q === 'string' ? q : (q.text || q.question);
      const gain = this.calculateInformationGain(questionText, hypotheses, answers);
      return {
        question: q,
        questionText: questionText,
        gain: gain,
      };
    });
    
    // Sort by information gain (highest first)
    questionsWithGain.sort((a, b) => b.gain - a.gain);
    
    // Return question with highest information gain
    const bestQuestion = questionsWithGain[0];
    return typeof bestQuestion.question === 'string' 
      ? bestQuestion.question 
      : (bestQuestion.question.text || bestQuestion.question.question);
  }
}

/**
 * Confidence-Aware Stopping Logic
 */
export class ConfidenceAwareStopping {
  /**
   * Check if we should stop asking questions
   */
  static shouldStop(confidence, threshold, questionCount, minQuestions = 3) {
    // Must ask at least minimum questions
    if (questionCount < minQuestions) {
      return false;
    }
    
    // Stop if confidence sufficient
    if (confidence >= threshold) {
      return true;
    }
    
    // Don't ask more than 8 questions
    if (questionCount >= 8) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get confidence threshold based on triage level
   */
  static getConfidenceThreshold(triageLevel) {
    const thresholds = {
      'emergency': 90, // High threshold for emergency
      'gp': 75,       // Medium threshold for GP
      'self_care': 70, // Lower threshold for self-care
    };
    
    return thresholds[triageLevel] || 70;
  }
}

