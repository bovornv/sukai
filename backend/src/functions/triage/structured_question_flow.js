/**
 * Structured Clinical Question Flow (7-Step Mandatory Flow)
 * 
 * This module implements the master prompt's 7-step clinical reasoning flow:
 * 
 * STEP 1: Intent Lock-In (Implicit)
 * STEP 2: Red-Flag Screening (MAX 2 questions)
 * STEP 3: Severity Calibration (2-3 questions)
 * STEP 4: Time-Course Disambiguation (2-3 questions)
 * STEP 5: Hypothesis-Targeted Symptoms (2-4 questions)
 * STEP 6: Health Context Safety Check - REMOVED (safety ensured by health profile + contraindication filtering)
 * STEP 7: Confidence Calculation & Stop Rule
 * 
 * Each step generates questions with standardized answer choices:
 * - 4-6 choices per question
 * - Always include "ไม่แน่ใจ / Not sure"
 * - Multiple-choice only (no free text after Page 1)
 */

import { normalizeThaiText } from './thai_normalizer.js';
import {
  QuestionMemoryGuard,
  SequenceVariationEngine,
  QUESTION_CATEGORIES,
} from './question_variation_engine.js';
import { getRedFlagQuestionForSymptom } from './intent_loader.js';
import { getSymptomSpecificQuestion } from './symptom_question_map.js';
import {
  selectQuestionVariant,
  QUESTION_INTENTS,
} from './question_variation_system.js';

/**
 * STEP 2: Red-Flag Screening Questions
 * Goal: Emergency detection ≤3 total questions
 * Rules: Binary or near-binary, high-risk focused
 */
export async function generateRedFlagQuestion(symptom, intent, language = 'th') {
  // Try to get red-flag question from intent first
  let question = null;
  if (intent) {
    question = intent.red_flag_question_th || intent.red_flag_question_en;
    if (language === 'en' && intent.red_flag_question_en) {
      question = intent.red_flag_question_en;
    }
  }
  
  // Fallback to symptom-specific question map
  if (!question) {
    question = await getRedFlagQuestionForSymptom(symptom, language);
  }
  
  if (!question) {
    question = getSymptomSpecificQuestion(symptom);
  }
  
  // Standardized answer choices for red-flag questions
  const choices = language === 'th' 
    ? ['มีอาการชัดเจน', 'มีเล็กน้อย', 'ไม่มี', 'ไม่แน่ใจ']
    : ['Clear symptoms', 'Mild symptoms', 'No', 'Not sure'];
  
  return {
    question,
    choices,
    step: 2,
    stepName: 'red_flag_screening',
  };
}

/**
 * STEP 3: Severity Calibration Questions
 * Goal: Refine severity_level (mild / moderate / severe)
 * Rules: Prefer functional impact over numeric pain scores
 */
export function generateSeverityQuestion(symptom, questionsAsked = [], language = 'th', sessionSeed = null, questionCount = 0, symptomGroup = null) {
  // Use question variation system for natural variation
  // Try different severity intents in order of priority
  const severityIntents = [
    QUESTION_INTENTS.SEVERITY_IMPACT,
    QUESTION_INTENTS.SEVERITY_COMPARISON,
    QUESTION_INTENTS.SEVERITY_FUNCTIONAL,
  ];
  
  // Check which severity intents have been asked (by checking if any variant was asked)
  const wasAskedIntent = (intentId) => {
    // Try to get a variant to check its wording
    const testVariant = selectQuestionVariant(intentId, language, 0, 0, []);
    if (!testVariant) return false;
    
    // Check if any question with similar key phrases was asked
    const keyPhrases = language === 'th' 
      ? ['รบกวน', 'รุนแรง', 'เทียบ', 'ประเมิน', 'ไม่สบาย']
      : ['interfere', 'severe', 'compare', 'rate', 'uncomfortable'];
    
    return questionsAsked.some(q => {
      if (typeof q !== 'string') return false;
      const normalizedQ = normalizeThaiText(q.toLowerCase().trim());
      return keyPhrases.some(phrase => normalizedQ.includes(phrase));
    });
  };
  
  // Find unasked intent
  let selectedIntent = null;
  for (const intentId of severityIntents) {
    if (!wasAskedIntent(intentId)) {
      selectedIntent = intentId;
      break;
    }
  }
  
  // If all intents asked, use first one (will reuse wording but that's okay)
  if (!selectedIntent) {
    selectedIntent = severityIntents[0];
  }
  
  // Select variant using variation system (with symptom group for customization)
  const variant = selectQuestionVariant(selectedIntent, language, sessionSeed, questionCount, questionsAsked, symptomGroup);
  
  if (variant && variant.question) {
    console.log(`[SEVERITY-Q] Using variation system - Intent: ${selectedIntent}, Question: "${variant.question.substring(0, 50)}..."`);
    return {
      question: variant.question,
      choices: variant.choices,
      step: 3,
      stepName: 'severity_calibration',
      intent_id: variant.intent_id, // Store intent_id for tracking
    };
  }
  
  // Fallback to legacy system if variation system fails (should not happen)
  console.warn(`[SEVERITY-Q] Variation system returned null, using fallback. Intent: ${selectedIntent}, sessionSeed: ${sessionSeed}`);
  const questions = language === 'th' 
    ? [
        'อาการนี้รบกวนชีวิตประจำวันแค่ไหน?',
        'อาการนี้ทำให้คุณทำกิจกรรมปกติได้ยากแค่ไหน?',
        'อาการนี้รุนแรงแค่ไหนเมื่อเทียบกับปกติ?',
      ]
    : [
        'How much does this symptom interfere with your daily life?',
        'How difficult is it to do normal activities because of this symptom?',
        'How severe is this symptom compared to normal?',
      ];
  
  const choices = language === 'th'
    ? ['แทบไม่รบกวน', 'รบกวนบ้าง', 'รบกวนมาก', 'รุนแรงผิดปกติ', 'ไม่แน่ใจ']
    : ['Hardly interferes', 'Somewhat interferes', 'Interferes a lot', 'Abnormally severe', 'Not sure'];
  
  // Use sessionSeed with strong variation for fallback too
  const seed = sessionSeed || Math.floor(Math.random() * 1000000);
  const selectedIndex = Math.floor(seed % questions.length);
  
  console.log(`[SEVERITY-Q] Fallback selected index: ${selectedIndex}/${questions.length}, question: "${questions[selectedIndex]}"`);
  
  return {
    question: questions[selectedIndex],
    choices,
    step: 3,
    stepName: 'severity_calibration',
  };
}

/**
 * STEP 4: Time-Course Disambiguation Questions
 * Goal: Lock trajectory (onset timing + symptom trend)
 * Rules: Ask BOTH onset timing AND symptom trend
 */
export function generateTimeCourseQuestion(symptom, questionsAsked = [], language = 'th', sessionSeed = null, questionCount = 0, symptomGroup = null) {
  // Use question variation system for natural variation
  // Check if duration/onset questions were asked
  const wasAskedDuration = () => {
    if (!Array.isArray(questionsAsked) || questionsAsked.length === 0) return false;
    const keyPhrases = language === 'th' 
      ? ['เมื่อไหร่', 'เริ่ม', 'นานเท่าไหร่', 'นานแค่ไหน', 'เป็นมานาน']
      : ['when', 'start', 'how long', 'onset', 'began'];
    return questionsAsked.some(q => {
      if (typeof q !== 'string') return false;
      const normalizedQ = normalizeThaiText(q.toLowerCase().trim());
      return keyPhrases.some(phrase => normalizedQ.includes(phrase));
    });
  };
  
  // Check if trend questions were asked
  const wasAskedTrend = () => {
    if (!Array.isArray(questionsAsked) || questionsAsked.length === 0) return false;
    const keyPhrases = language === 'th' 
      ? ['ดีขึ้น', 'แย่ลง', 'เปลี่ยนแปลง', 'เป็นอย่างไร', 'แนวโน้ม']
      : ['better', 'worse', 'change', 'progress', 'trend'];
    return questionsAsked.some(q => {
      if (typeof q !== 'string') return false;
      const normalizedQ = normalizeThaiText(q.toLowerCase().trim());
      return keyPhrases.some(phrase => normalizedQ.includes(phrase));
    });
  };
  
  // Onset timing question (priority: DURATION_ONSET, then DURATION_LENGTH)
  if (!wasAskedDuration()) {
    const durationIntents = [
      QUESTION_INTENTS.DURATION_ONSET,
      QUESTION_INTENTS.DURATION_LENGTH,
    ];
    
    // Try each intent until we find one that hasn't been asked
    for (const intentId of durationIntents) {
      const variant = selectQuestionVariant(intentId, language, sessionSeed, questionCount, questionsAsked, symptomGroup);
      if (variant) {
        return {
          question: variant.question,
          choices: variant.choices,
          step: 4,
          stepName: 'time_course_onset',
          intent_id: variant.intent_id,
        };
      }
    }
  }
  
  // Trend question (priority: TREND_CHANGE, then TREND_PROGRESSION)
  if (!wasAskedTrend()) {
    const trendIntents = [
      QUESTION_INTENTS.TREND_CHANGE,
      QUESTION_INTENTS.TREND_PROGRESSION,
    ];
    
    // Try each intent until we find one that hasn't been asked
    for (const intentId of trendIntents) {
      const variant = selectQuestionVariant(intentId, language, sessionSeed, questionCount + 1, questionsAsked, symptomGroup);
      if (variant) {
        return {
          question: variant.question,
          choices: variant.choices,
          step: 4,
          stepName: 'time_course_trend',
          intent_id: variant.intent_id,
        };
      }
    }
  }
  
  // Both questions asked
  return null;
}

/**
 * STEP 5: Hypothesis-Targeted Symptoms Questions
 * Goal: Increase confidence efficiently
 * Rules: Pull questions dynamically from intent hypothesis set
 */
export function generateHypothesisQuestion(symptom, intent, hypotheses = [], questionsAsked = [], language = 'th', sessionSeed = null, questionCount = 0, symptomGroup = null) {
  // Use question variation system for natural variation
  // Check if associated symptoms questions were asked
  const wasAskedAssociated = () => {
    if (!Array.isArray(questionsAsked) || questionsAsked.length === 0) return false;
    const keyPhrases = language === 'th' 
      ? ['อาการอื่น', 'ร่วมด้วย', 'อื่นๆ', 'มีอาการเหล่านี้']
      : ['other symptoms', 'associated', 'along with', 'any of these'];
    return questionsAsked.some(q => {
      if (typeof q !== 'string') return false;
      const normalizedQ = normalizeThaiText(q.toLowerCase().trim());
      return keyPhrases.some(phrase => normalizedQ.includes(phrase));
    });
  };
  
  if (wasAskedAssociated()) {
    return null; // Already asked
  }
  
  // Use variation system for associated symptoms
  const associatedIntents = [
    QUESTION_INTENTS.ASSOCIATED_SYMPTOMS,
    QUESTION_INTENTS.ASSOCIATED_CONTEXT,
  ];
  
  // Try each intent
  for (const intentId of associatedIntents) {
    const variant = selectQuestionVariant(intentId, language, sessionSeed, questionCount, questionsAsked, symptomGroup);
    if (variant) {
      // Get associated symptoms from intent if available
      let associatedSymptoms = [];
      if (intent && intent.associated_symptoms) {
        const symptoms = typeof intent.associated_symptoms === 'string' 
          ? intent.associated_symptoms.split(',').map(s => s.trim())
          : intent.associated_symptoms;
        associatedSymptoms = symptoms.slice(0, 3); // Max 3 options
      }
      
      // Fallback to symptom-specific associated symptoms
      if (associatedSymptoms.length === 0) {
        // TODO: Map symptom to common associated symptoms
        associatedSymptoms = ['ไข้', 'คลื่นไส้', 'อ่อนเพลีย']; // Placeholder
      }
      
      const choices = language === 'th'
        ? [...associatedSymptoms, 'ไม่มีอาการอื่น', 'ไม่แน่ใจ']
        : [...associatedSymptoms, 'No other symptoms', 'Not sure'];
      
      return {
        question: variant.question,
        choices,
        step: 5,
        stepName: 'hypothesis_targeted',
        intent_id: variant.intent_id,
        allowMultiSelect: true, // Allow multi-select for associated symptoms
      };
    }
  }
  
  // Fallback to legacy system if variation system fails
  const associatedQuestions = language === 'th'
    ? [
        'มีอาการเหล่านี้ร่วมด้วยไหม?',
        'คุณมีอาการอื่นๆ ร่วมด้วยหรือไม่?',
        'นอกจากนี้แล้ว มีอาการอื่นๆ อีกไหม?',
      ]
    : [
        'Do you have any of these associated symptoms?',
        'Are there any other symptoms you\'re experiencing?',
        'Besides this, do you have any other symptoms?',
      ];
  
  const seed = sessionSeed || Math.random() * 10000;
  const selectedIndex = Math.floor(seed % associatedQuestions.length);
  const question = associatedQuestions[selectedIndex];
  
  let associatedSymptoms = [];
  if (intent && intent.associated_symptoms) {
    const symptoms = typeof intent.associated_symptoms === 'string' 
      ? intent.associated_symptoms.split(',').map(s => s.trim())
      : intent.associated_symptoms;
    associatedSymptoms = symptoms.slice(0, 3);
  }
  
  if (associatedSymptoms.length === 0) {
    associatedSymptoms = ['ไข้', 'คลื่นไส้', 'อ่อนเพลีย'];
  }
  
  const choices = language === 'th'
    ? [...associatedSymptoms, 'ไม่มีอาการอื่น', 'ไม่แน่ใจ']
    : [...associatedSymptoms, 'No other symptoms', 'Not sure'];
  
  return {
    question,
    choices,
    step: 5,
    stepName: 'hypothesis_targeted',
    allowMultiSelect: true,
  };
}

/**
 * STEP 6: Health Context Safety Check - REMOVED per user request
 * Health data (chronic diseases, allergies, pregnancy) should be pulled from health profile
 */
export function generateHealthContextQuestion(language = 'th') {
  // REMOVED: This question is no longer asked
  // Health data should come from user's health profile
  return null;
}

/**
 * Determine which step we're currently in based on question count and answers
 */
export function getCurrentStep(questionCount, answers, redFlagScreeningPassed) {
  // STEP 2: Red-Flag Screening (questions 0-1)
  if (!redFlagScreeningPassed && questionCount < 2) {
    return 2;
  }
  
  // STEP 3: Severity Calibration (questions 2-4)
  if (redFlagScreeningPassed && questionCount >= 2 && questionCount < 5 && !answers.severity_level) {
    return 3;
  }
  
  // STEP 4: Time-Course Disambiguation (questions 3-5)
  if (redFlagScreeningPassed && questionCount >= 3 && questionCount < 6 && !answers.time_course) {
    return 4;
  }
  
  // STEP 5: Hypothesis-Targeted (questions 4-7)
  if (redFlagScreeningPassed && questionCount >= 4 && questionCount < 8) {
    return 5;
  }
  
  // STEP 6: Health Context - REMOVED per user request
  
  // STEP 7: Confidence check (after all steps)
  return 7;
}

/**
 * Generate next question based on current step
 */
export async function generateNextStructuredQuestion({
  symptom,
  intent,
  questionCount,
  questionsAsked = [],
  answers = {},
  hypotheses = [],
  language = 'th',
  sessionSeed = null, // Session seed for variation
  symptomGroup = null, // Symptom group for group-specific variations
}) {
  const redFlagScreeningPassed = answers.redFlagScreeningPassed === true;
  const currentStep = getCurrentStep(questionCount, answers, redFlagScreeningPassed);
  
  // STEP 2: Red-Flag Screening
  if (currentStep === 2) {
    return await generateRedFlagQuestion(symptom, intent, language);
  }
  
  // STEP 3: Severity Calibration
  if (currentStep === 3) {
    return generateSeverityQuestion(symptom, questionsAsked, language, sessionSeed, questionCount, symptomGroup);
  }
  
  // STEP 4: Time-Course Disambiguation
  if (currentStep === 4) {
    const timeCourseQ = generateTimeCourseQuestion(symptom, questionsAsked, language, sessionSeed, questionCount, symptomGroup);
    if (timeCourseQ) return timeCourseQ;
    // If both time-course questions asked, move to next step
  }
  
  // STEP 5: Hypothesis-Targeted
  if (currentStep === 5) {
    const hypothesisQ = generateHypothesisQuestion(symptom, intent, hypotheses, questionsAsked, language, sessionSeed, questionCount, symptomGroup);
    if (hypothesisQ) return hypothesisQ;
    
    // If no hypothesis question, try other question types (frequency, triggers, impact)
    // These are asked when confidence is still low
    const frequencyQ = generateFrequencyQuestion(symptom, questionsAsked, language, sessionSeed, questionCount, symptomGroup);
    if (frequencyQ) return frequencyQ;
    
    const triggerQ = generateTriggerQuestion(symptom, questionsAsked, language, sessionSeed, questionCount, symptomGroup);
    if (triggerQ) return triggerQ;
    
    const impactQ = generateImpactQuestion(symptom, questionsAsked, language, sessionSeed, questionCount, symptomGroup);
    if (impactQ) return impactQ;
  }
  
  // STEP 6: Health Context - REMOVED per user request
  
  // STEP 7: Confidence check - no more questions needed
  return null;
}

/**
 * Generate frequency question using variation system
 */
export function generateFrequencyQuestion(symptom, questionsAsked = [], language = 'th', sessionSeed = null, questionCount = 0, symptomGroup = null) {
  const wasAskedFrequency = () => {
    if (!Array.isArray(questionsAsked) || questionsAsked.length === 0) return false;
    const keyPhrases = language === 'th' 
      ? ['บ่อย', 'ถี่', 'กี่ครั้ง', 'เป็นบ่อย', 'เกิดขึ้น']
      : ['often', 'frequent', 'how many', 'occur', 'happens'];
    return questionsAsked.some(q => {
      if (typeof q !== 'string') return false;
      const normalizedQ = normalizeThaiText(q.toLowerCase().trim());
      return keyPhrases.some(phrase => normalizedQ.includes(phrase));
    });
  };
  
  if (wasAskedFrequency()) {
    return null;
  }
  
  const frequencyIntents = [
    QUESTION_INTENTS.FREQUENCY_OCCURRENCE,
    QUESTION_INTENTS.FREQUENCY_PATTERN,
  ];
  
  for (const intentId of frequencyIntents) {
    const variant = selectQuestionVariant(intentId, language, sessionSeed, questionCount, questionsAsked, symptomGroup);
    if (variant) {
      return {
        question: variant.question,
        choices: variant.choices,
        step: 5,
        stepName: 'frequency',
        intent_id: variant.intent_id,
      };
    }
  }
  
  return null;
}

/**
 * Generate trigger/relieving factor question using variation system
 */
export function generateTriggerQuestion(symptom, questionsAsked = [], language = 'th', sessionSeed = null, questionCount = 0, symptomGroup = null) {
  const wasAskedTrigger = () => {
    if (!Array.isArray(questionsAsked) || questionsAsked.length === 0) return false;
    const keyPhrases = language === 'th' 
      ? ['ทำให้', 'แย่ลง', 'ดีขึ้น', 'บรรเทา', 'ปัจจัย']
      : ['makes', 'worse', 'better', 'relieve', 'trigger'];
    return questionsAsked.some(q => {
      if (typeof q !== 'string') return false;
      const normalizedQ = normalizeThaiText(q.toLowerCase().trim());
      return keyPhrases.some(phrase => normalizedQ.includes(phrase));
    });
  };
  
  if (wasAskedTrigger()) {
    return null;
  }
  
  // Try aggravating first, then relieving
  const triggerIntents = [
    QUESTION_INTENTS.TRIGGER_AGGRAVATING,
    QUESTION_INTENTS.TRIGGER_RELIEVING,
    QUESTION_INTENTS.TRIGGER_CONTEXT,
  ];
  
  for (const intentId of triggerIntents) {
    const variant = selectQuestionVariant(intentId, language, sessionSeed, questionCount, questionsAsked, symptomGroup);
    if (variant) {
      return {
        question: variant.question,
        choices: variant.choices,
        step: 5,
        stepName: 'triggers',
        intent_id: variant.intent_id,
      };
    }
  }
  
  return null;
}

/**
 * Generate impact question using variation system
 */
export function generateImpactQuestion(symptom, questionsAsked = [], language = 'th', sessionSeed = null, questionCount = 0, symptomGroup = null) {
  const wasAskedImpact = () => {
    if (!Array.isArray(questionsAsked) || questionsAsked.length === 0) return false;
    const keyPhrases = language === 'th' 
      ? ['รบกวน', 'ส่งผล', 'ทำอะไร', 'นอน', 'ทำงาน', 'ใช้ชีวิต']
      : ['interfere', 'affect', 'activities', 'sleep', 'work', 'daily'];
    return questionsAsked.some(q => {
      if (typeof q !== 'string') return false;
      const normalizedQ = normalizeThaiText(q.toLowerCase().trim());
      return keyPhrases.some(phrase => normalizedQ.includes(phrase));
    });
  };
  
  if (wasAskedImpact()) {
    return null;
  }
  
  const impactIntents = [
    QUESTION_INTENTS.IMPACT_DAILY_LIFE,
    QUESTION_INTENTS.IMPACT_SLEEP,
    QUESTION_INTENTS.IMPACT_WORK,
  ];
  
  for (const intentId of impactIntents) {
    const variant = selectQuestionVariant(intentId, language, sessionSeed, questionCount, questionsAsked, symptomGroup);
    if (variant) {
      return {
        question: variant.question,
        choices: variant.choices,
        step: 5,
        stepName: 'impact',
        intent_id: variant.intent_id,
      };
    }
  }
  
  return null;
}

