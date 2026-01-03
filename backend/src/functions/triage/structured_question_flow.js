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

/**
 * STEP 2: Red-Flag Screening Questions
 * Goal: Emergency detection ≤3 total questions
 * Rules: Binary or near-binary, high-risk focused
 */
export function generateRedFlagQuestion(symptom, intent, language = 'th') {
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
    question = getRedFlagQuestionForSymptom(symptom, language);
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
export function generateSeverityQuestion(symptom, questionsAsked = [], language = 'th') {
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
  
  // Check which questions have been asked
  const wasAsked = (text) => {
    return questionsAsked.some(q => {
      if (typeof q !== 'string') return false;
      const normalizedQ = normalizeThaiText(q.toLowerCase().trim());
      const normalizedText = normalizeThaiText(text.toLowerCase().trim());
      return normalizedQ.includes(normalizedText) || normalizedText.includes(normalizedQ);
    });
  };
  
  // Find unasked questions
  const unaskedQuestions = questions.filter((q, index) => {
    const keyPhrases = ['รบกวน', 'รุนแรง', 'interfere', 'severe'];
    return !keyPhrases.some(phrase => wasAsked(phrase));
  });
  
  // Select question with variation (rotate based on symptom hash + time)
  let selectedQuestion = questions[0]; // Default
  if (unaskedQuestions.length > 0) {
    // Use symptom hash + time for variation
    const symptomHash = symptom.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const timeComponent = Date.now() % 1000;
    const variationIndex = (symptomHash + timeComponent) % unaskedQuestions.length;
    selectedQuestion = unaskedQuestions[variationIndex];
  } else {
    // All similar questions asked - use variation to select different phrasing
    const variationIndex = (Date.now() % questions.length);
    selectedQuestion = questions[variationIndex];
  }
  
  return {
    question: selectedQuestion,
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
export function generateTimeCourseQuestion(symptom, questionsAsked = [], language = 'th') {
  // Enhanced duplicate detection - check semantic similarity
  const wasAsked = (text) => {
    if (!Array.isArray(questionsAsked) || questionsAsked.length === 0) return false;
    return questionsAsked.some(q => {
      if (typeof q !== 'string') return false;
      const normalizedQ = normalizeThaiText(q.toLowerCase().trim());
      const normalizedText = normalizeThaiText(text.toLowerCase().trim());
      
      // Exact match
      if (normalizedQ === normalizedText) return true;
      
      // Substring match (one contains the other)
      if (normalizedQ.includes(normalizedText) || normalizedText.includes(normalizedQ)) {
        // Only consider similar if both are substantial (> 10 chars)
        if (normalizedQ.length > 10 && normalizedText.length > 10) return true;
      }
      
      return false;
    });
  };
  
  // Check if onset question was asked (check for key phrases)
  const onsetAsked = wasAsked('เมื่อไหร่') || wasAsked('เริ่ม') || wasAsked('onset') || 
                     wasAsked('อาการนี้เริ่มเมื่อไหร่') || wasAsked('When did this symptom start');
  
  // Check if trend question was asked (check for key phrases)
  const trendAsked = wasAsked('ดีขึ้น') || wasAsked('แย่ลง') || wasAsked('trend') || 
                     wasAsked('เปลี่ยนแปลง') || wasAsked('How has this symptom changed');
  
  // Onset timing question
  if (!onsetAsked) {
    const question = language === 'th'
      ? 'อาการนี้เริ่มเมื่อไหร่?'
      : 'When did this symptom start?';
    
    const choices = language === 'th'
      ? ['วันนี้', 'เมื่อวาน', '2-3 วัน', '1 สัปดาห์', 'เป็นๆ หายๆ', 'ไม่แน่ใจ']
      : ['Today', 'Yesterday', '2-3 days', '1 week', 'Comes and goes', 'Not sure'];
    
    return {
      question,
      choices,
      step: 4,
      stepName: 'time_course_onset',
    };
  }
  
  // Symptom trend question
  if (!trendAsked) {
    const question = language === 'th'
      ? 'อาการนี้เปลี่ยนแปลงอย่างไร?'
      : 'How has this symptom changed?';
    
    const choices = language === 'th'
      ? ['ดีขึ้น', 'เท่าเดิม', 'แย่ลง', 'ขึ้นๆ ลงๆ', 'ไม่แน่ใจ']
      : ['Getting better', 'Same', 'Getting worse', 'Up and down', 'Not sure'];
    
    return {
      question,
      choices,
      step: 4,
      stepName: 'time_course_trend',
    };
  }
  
  return null; // Both questions already asked
}

/**
 * STEP 5: Hypothesis-Targeted Symptoms Questions
 * Goal: Increase confidence efficiently
 * Rules: Pull questions dynamically from intent hypothesis set
 */
export function generateHypothesisQuestion(symptom, intent, hypotheses = [], questionsAsked = [], language = 'th') {
  // TODO: Generate questions based on intent's associated_symptoms or hypotheses
  // For now, use generic associated symptom question
  
  // Enhanced duplicate detection - check semantic similarity
  const wasAsked = (text) => {
    if (!Array.isArray(questionsAsked) || questionsAsked.length === 0) return false;
    return questionsAsked.some(q => {
      if (typeof q !== 'string') return false;
      const normalizedQ = normalizeThaiText(q.toLowerCase().trim());
      const normalizedText = normalizeThaiText(text.toLowerCase().trim());
      
      // Exact match
      if (normalizedQ === normalizedText) return true;
      
      // Substring match (one contains the other)
      if (normalizedQ.includes(normalizedText) || normalizedText.includes(normalizedQ)) {
        // Only consider similar if both are substantial (> 10 chars)
        if (normalizedQ.length > 10 && normalizedText.length > 10) return true;
      }
      
      return false;
    });
  };
  
  // Check if associated symptoms question was asked (check for key phrases)
  const associatedAsked = wasAsked('อาการอื่น') || wasAsked('associated') || 
                          wasAsked('มีอาการเหล่านี้') || wasAsked('Do you have any of these');
  
  if (associatedAsked) {
    return null; // Already asked
  }
  
  const question = language === 'th'
    ? 'มีอาการเหล่านี้ร่วมด้วยไหม?'
    : 'Do you have any of these associated symptoms?';
  
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
    question,
    choices,
    step: 5,
    stepName: 'hypothesis_targeted',
    allowMultiSelect: true, // Allow multi-select for associated symptoms
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
export function generateNextStructuredQuestion({
  symptom,
  intent,
  questionCount,
  questionsAsked = [],
  answers = {},
  hypotheses = [],
  language = 'th',
}) {
  const redFlagScreeningPassed = answers.redFlagScreeningPassed === true;
  const currentStep = getCurrentStep(questionCount, answers, redFlagScreeningPassed);
  
  // STEP 2: Red-Flag Screening
  if (currentStep === 2) {
    return generateRedFlagQuestion(symptom, intent, language);
  }
  
  // STEP 3: Severity Calibration
  if (currentStep === 3) {
    return generateSeverityQuestion(symptom, questionsAsked, language);
  }
  
  // STEP 4: Time-Course Disambiguation
  if (currentStep === 4) {
    const timeCourseQ = generateTimeCourseQuestion(symptom, questionsAsked, language);
    if (timeCourseQ) return timeCourseQ;
    // If both time-course questions asked, move to next step
  }
  
  // STEP 5: Hypothesis-Targeted
  if (currentStep === 5) {
    const hypothesisQ = generateHypothesisQuestion(symptom, intent, hypotheses, questionsAsked, language);
    if (hypothesisQ) return hypothesisQ;
  }
  
  // STEP 6: Health Context - REMOVED per user request
  
  // STEP 7: Confidence check - no more questions needed
  return null;
}

