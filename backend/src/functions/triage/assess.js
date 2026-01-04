/**
 * Hybrid Medical-Grade Clinical Triage Engine
 * Combines: ER nurse triage speed + Medical textbook-level reasoning + Confidence-based decision making
 * 
 * 🎯 POSITIONING: "AI Doctor for Thai families — fast, clear, safe, and clinically guided"
 * Hybrid of: Ada-style accuracy + ER triage realism + Medical textbook depth + Thai healthcare context
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔹 PRODUCTION-READY HYBRID FLOW (6 Steps - Mandatory)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 🔴 STEP 1: First Question = Emergency Screening (Mandatory)
 *    Rule: First question MUST be symptom-specific red-flag question
 *    - Each symptom keyword maps to one red-flag question
 *    - Question style: ER triage nurse + On-call physician practice
 *    - Answers "ใช่ / มี / เคย / กำลังเป็น" → Emergency immediately, stop questioning
 *    - Answers "No" → Proceed to Step 2
 *    Purpose: Rapidly answer "ต้องไปโรงพยาบาลตอนนี้ไหม?"
 * 
 * 🟠 STEP 2: Non-Emergency → Severity × Time-course Logic
 *    If not emergency, evaluate using Severity × Time-course Matrix:
 *    - Severity: Mild / Moderate / Severe (non-emergency only)
 *    - Time-course: Acute / Subacute / Progressive-Worsening / Recurrent-Chronic
 *    Use matrix to:
 *    - Narrow hypotheses
 *    - Assign tentative triage level (Self-care / GP / Urgent non-ER)
 *    Question Strategy:
 *    - Adapt dynamically based on: Improving vs worsening trajectory, Duration, Pattern
 *    - This replaces fixed question trees completely
 * 
 * 🟡 STEP 3: Confidence-based Question Loop (Medical-grade)
 *    Maintain confidence score for clinical conclusion
 *    Confidence inputs:
 *    - Red flags ruled out (20 points)
 *    - Symptom consistency (20 points)
 *    - Severity stability (20 points)
 *    - Time-course clarity (20 points)
 *    - Health profile context: Age, Weight, Chronic diseases, Drug allergies (20 points)
 *    Threshold: 0.80–0.85 (80-85%)
 *    Logic:
 *    - If confidence < threshold: Ask hypothesis-targeted questions
 *    - Questions must reduce uncertainty, not repeat prior logic
 *    - Never conclude prematurely (behaves like cautious real doctor)
 * 
 * 🟢 STEP 4: Mandatory Health Context Check (Before Final Conclusion)
 *    Before ANY non-emergency conclusion, MUST ask:
 *    "ข้อมูลด้านสุขภาพหรืออาการสำคัญที่ยังไม่ได้แจ้งไหมคะ"
 *    Rules:
 *    - This question is MANDATORY
 *    - User MUST answer (including "ไม่มี") before:
 *      • Recommending medication
 *      • Finalizing triage level
 *      • Showing summary card
 *    Purpose: Simulates real doctor's final safety check
 * 
 * 🔵 STEP 5: OTC Medication Mapping (Severity × Time-course)
 *    OTC recommendations follow clinical discussion logic between:
 *    - Senior medical specialist
 *    - Senior pharmacist
 *    Rules:
 *    - Never recommend only one drug
 *    - Recommend ≥ 2 suitable OTC options when appropriate
 *    Selection must consider:
 *    - Severity, Time-course, Age, Weight, Contraindications, Thai OTC availability
 *    Dose logic:
 *    - Weight-based dose ranges, Age-adjusted, Max daily dose, Dosing interval
 *    - If confidence insufficient → Ask more questions before recommending meds
 * 
 * 🔵 STEP 5: Dual Recommendation Layer (Self-care + OTC Medication Mapping)
 *    For every non-emergency conclusion, Suk AI must generate TWO parallel recommendation layers:
 *    
 *    🏠 5A. Self-Care at Home (Mandatory)
 *       - Must be symptom-specific (not generic)
 *       - Based on medical textbooks + hospital OPD practice
 *       - Adapted to: Severity, Time-course, Age, Weight, Chronic conditions
 *       - Written in simple Thai, short bullet points, 3–5 items only
 *       - Self-care domains: Rest, Hydration, Nutrition, Positioning, Temperature, Sleep, Environment
 *       - CRITICAL: Self-care must be shown even if OTC meds are recommended
 *    
 *    💊 5B. OTC Medication (When Appropriate)
 *       - Never recommend only one drug
 *       - Recommend ≥ 2 suitable OTC options when appropriate
 *       - Selection must consider: Severity, Time-course, Age, Weight, Contraindications, Thai OTC availability
 *       - Dose logic: Weight-based, Age-adjusted, Max daily dose, Dosing interval
 *       - If confidence insufficient → Ask more questions before recommending meds
 *    
 *    📌 Self-care ≠ medication - Both must coexist, not replace each other
 * 
 * 🔷 STEP 6: Final Summary & Safety Framing
 *    Final output must always include 5 clearly separated sections:
 *    1. สรุปการประเมิน (triage level + reason)
 *    2. วิธีดูแลตัวเองที่บ้าน (3–5 short items)
 *    3. ยาที่ควรใช้ (ถ้าจำเป็น) (≥2 options)
 *    4. สัญญาณอันตรายที่ต้องไปโรงพยาบาล
 *    5. ควรติดตามอาการ / พบแพทย์เมื่อไร
 *    Style: Short, Clear, Emoji-assisted, No paragraphs, Easy for kids → elderly
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * 🧠 EXPECTED BEHAVIORAL OUTCOMES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ✅ Never reuse the same question sequence twice
 * ✅ Headache cases will not always end with only paracetamol
 * ✅ OTC recommendations include ≥2 suitable alternatives based on:
 *    - Severity, Time-course, Weight/age, Contraindications
 * ✅ System behaves like: ER first → OPD reasoning → Senior doctor confirmation
 * 
 * Enhanced with:
 * - Thai language understanding (misspellings, slang)
 * - Context extraction
 * - Smart clarification
 * - Anxiety-aware responses
 * - Hypothesis-driven questioning
 * - Information gain-based question selection
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
  isAffirmativeAnswer,
  detectSeverityTrajectory,
  classifyTimeCourse
} from './thai_normalizer.js';
import {
  translateQuestion
} from './language_helper.js';
import {
  calculateRiskScore,
  determineTriageFromRisk,
  selectNextQuestion,
  hasEnoughInfo,
  canRecommendOTCs,
  hasMandatoryHealthData,
  QUESTION_CATEGORIES,
} from './clinical_reasoning.js';
import { getSymptomSpecificQuestion } from './symptom_question_map.js';
import {
  resolveSymptomIntent,
  getRedFlagQuestionForSymptom,
  checkEmergencyFromIntent,
  getPrimarySymptomFromIntent,
  getSeverityFromIntent,
  getTimeCourseFromIntent,
  getClinicalContextFromIntent,
  getConfidenceWeight,
  getOtcGroups,
  getSelfCareGroups,
  findIntentBySymptomText,
} from './intent_loader.js';
import { generateNextStructuredQuestion } from './structured_question_flow.js';
import {
  determineTriageFromMatrix,
  canStopAndSummarize,
  getConfidenceThreshold,
  getNextQuestionPriority,
  calculateMedicalGradeConfidence,
  SEVERITY_LEVELS,
  TIMECOURSE_TYPES,
} from './severity_timecourse_matrix.js';
import { getHypotheses, calculateInformationGain } from './hypothesis_map.js';
import {
  QuestionMemoryGuard,
  SequenceVariationEngine,
  QuestionAnswerCoherence,
  AntiPatternDetector,
  HypothesisDrivenSelector,
  ConfidenceAwareStopping,
  QUESTION_CATEGORIES as VARIATION_QUESTION_CATEGORIES,
} from './question_variation_engine.js';
import {
  needsBodyPartClarification,
  generateBodyPartQuestion,
  extractBodyPart,
  hasBodyPartClarified,
} from './body_part_clarification.js';
import {
  getBodyPartRedFlagQuestions,
  hasBodyPartRedFlagsScreened,
  isBodyPartRedFlagPositive,
  mapBodyPartToRedFlagCategory,
} from './body_part_red_flags.js';
import {
  selectRedFlagFromExpandedDataset,
} from './body_part_redflags_loader.js';
import {
  updateHypothesisConfidence,
  normalizeConfidences,
  assessTrajectoryRisk,
  assessTimeCourseRisk,
} from './medical_reasoning.js';

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
 * Get next question using adaptive clinical reasoning
 * Uses risk scoring to determine which questions matter
 * Only asks questions that would change triage level
 */
function getNextQuestionAdaptive(symptom, answers, questionsAsked, questionCount, sessionHistory = null) {
  // Use clinical reasoning to select next question with variation
  return selectNextQuestion(symptom, answers, questionsAsked, questionCount, sessionHistory);
}

/**
 * Determine triage level using risk scoring
 * Doctor-level clinical reasoning with risk accumulation
 */
function determineTriageLevel(symptom, answers, questionCount) {
  // Normalize symptom text first
  const normalizedSymptom = normalizeThaiText(symptom);
  
  // Emergency check (highest priority) - uses normalized text
  if (checkRedFlags(normalizedSymptom) || checkEmergency(normalizedSymptom)) {
    return 'emergency';
  }

  // Calculate risk score using clinical reasoning
  const riskScore = calculateRiskScore(symptom, answers);
  
  // Determine triage from risk score
  const triageLevel = determineTriageFromRisk(riskScore);
  
  // If we have enough info, return triage level
  if (hasEnoughInfo(riskScore, questionCount, answers)) {
    return triageLevel;
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
// Session-level variation engines (one per session)
const sessionVariationEngines = new Map();
const sessionMemoryGuards = new Map();
const sessionAntiPatternDetectors = new Map();

/**
 * Get or create session-level variation engine
 */
function getSessionVariationEngine(sessionId) {
  if (!sessionVariationEngines.has(sessionId)) {
    const engine = new SequenceVariationEngine();
    sessionVariationEngines.set(sessionId, engine);
  }
  return sessionVariationEngines.get(sessionId);
}

/**
 * Get or create session-level memory guard
 */
function getSessionMemoryGuard(sessionId) {
  if (!sessionMemoryGuards.has(sessionId)) {
    const guard = new QuestionMemoryGuard();
    sessionMemoryGuards.set(sessionId, guard);
  }
  return sessionMemoryGuards.get(sessionId);
}

/**
 * Get or create session-level anti-pattern detector
 */
function getSessionAntiPatternDetector(sessionId) {
  if (!sessionAntiPatternDetectors.has(sessionId)) {
    const detector = new AntiPatternDetector();
    sessionAntiPatternDetectors.set(sessionId, detector);
  }
  return sessionAntiPatternDetectors.get(sessionId);
}

/**
 * Reset session-level engines (for new assessment)
 */
function resetSessionEngines(sessionId) {
  if (sessionVariationEngines.has(sessionId)) {
    sessionVariationEngines.get(sessionId).reset();
  }
  if (sessionMemoryGuards.has(sessionId)) {
    sessionMemoryGuards.get(sessionId).reset();
  }
  if (sessionAntiPatternDetectors.has(sessionId)) {
    sessionAntiPatternDetectors.get(sessionId).reset();
  }
}

export async function assessSymptomLogic({
  symptom,
  previousAnswers,
  questionsAsked,
  questionCount,
  healthProfile = null, // Optional health profile for clinical reasoning
  language = 'th', // Language code ('th' or 'en'), defaults to 'th'
  sessionId = null, // Session ID for variation engine
}) {
  // Check if symptom is an intent_id (structured intent)
  // If yes, use structured data; if no, use legacy text-based mapping
  let intent = await resolveSymptomIntent(symptom);
  
  // CRITICAL IMPROVEMENT: If not resolved as intent_id, try to find by symptom text
  // This enables using intent data even when user types symptom text instead of intent_id
  if (!intent) {
    intent = await findIntentBySymptomText(symptom, language);
    if (intent) {
      console.log(`[INTENT-MATCH] Found intent by text match: ${intent.intent_id || intent.id}`);
    }
  }
  
  const primarySymptom = intent ? await getPrimarySymptomFromIntent(symptom) : symptom;
  
  // Normalize symptom text first (for backward compatibility)
  const normalizedSymptom = normalizeThaiText(primarySymptom);
  
  // CRITICAL IMPROVEMENT: Extract clinical context from intent if available
  // This uses structured intent data (severity_level, time_course) instead of text extraction
  const intentClinicalContext = intent ? getClinicalContextFromIntent(intent) : null;
  const intentSeverity = intentClinicalContext?.severity;
  const intentTimeCourse = intentClinicalContext?.timeCourse;
  
  if (intentSeverity) {
    console.log(`[INTENT-CONTEXT] Using intent severity: ${intentSeverity} (from 700-intent dataset)`);
  }
  if (intentTimeCourse) {
    console.log(`[INTENT-CONTEXT] Using intent time_course: ${intentTimeCourse} (from 700-intent dataset)`);
  }
  
  // Extract context from text (before asking questions)
  // BUT: Prefer intent data over text extraction when available (more accurate)
  const extractedDuration = extractDuration(symptom);
  const detectedSeverity = intentSeverity ? null : detectSeverity(symptom); // Skip text extraction if intent has severity
  const isWorseningFromText = isWorsening(symptom);
  const triedSelfCareFromText = triedSelfCare(symptom);
  const isAnxiousUser = isAnxious(symptom);

  // Merge extracted context into answers (if not already present)
  // CRITICAL: Initialize enrichedAnswers FIRST before red flag check
  // CRITICAL: Track red flag screening status for medical-grade triage
  const enrichedAnswers = { ...previousAnswers };
  
  // CRITICAL: Extract answers from user input when responding to questions
  // Professional behavior: Understand both "yes" and "no" answers, don't ask again (like a real doctor)
  // This works for ALL questions, not just health context
  if (questionCount > 0 && Array.isArray(questionsAsked) && questionsAsked.length > 0) {
    const lastQuestion = questionsAsked[questionsAsked.length - 1];
    if (lastQuestion && typeof lastQuestion === 'string') {
      const normalizedInput = normalizeThaiText(symptom).trim();
      
      // Comprehensive list of negative answers (all variations of "no")
      const negativeKeywords = [
        'ไม่มี', 'ไม่', 'ไม่ใช่', 'ไม่เป็น', 
        'ไม่มีค่ะ', 'ไม่ใช่ค่ะ', 'ไม่เป็นค่ะ',
        'ไม่มีครับ', 'ไม่ใช่ครับ', 'ไม่เป็นครับ',
        'ไม่ค่ะ', 'ไม่ครับ',
        'ไม่มีอะไร', 'ไม่มีเลย',
      ];
      
      // Comprehensive list of affirmative answers (all variations of "yes")
      const affirmativeKeywords = [
        'ใช่', 'ใช่ค่ะ', 'ใช่ครับ', 'ใช่แล้ว', 'ใช่เลย',
        'มี', 'เป็น', 'มีค่ะ', 'เป็นค่ะ', 'มีครับ', 'เป็นครับ',
      ];
      
      // Check if user said any variation of "no" or "yes"
      const isNegativeAnswer = negativeKeywords.some(keyword => {
        if (normalizedInput === keyword) return true;
        if (normalizedInput.startsWith(keyword + ' ') || normalizedInput.startsWith(keyword + 'ค่ะ') || normalizedInput.startsWith(keyword + 'ครับ')) return true;
        return false;
      });
      
      const isAffirmativeAnswer = affirmativeKeywords.some(keyword => {
        if (normalizedInput === keyword) return true;
        if (normalizedInput.startsWith(keyword + ' ') || normalizedInput.startsWith(keyword + 'ค่ะ') || normalizedInput.startsWith(keyword + 'ครับ')) return true;
        return false;
      });
      
      // Health context question - REMOVED per user request
      // Health data (chronic diseases, allergies, pregnancy) should be pulled from health profile
      // No need to handle health_context answers anymore
      
      // Handle other yes/no questions (store answer to prevent asking again)
      // Extract question key from question text to store answer
      if (isNegativeAnswer || isAffirmativeAnswer) {
        // Try to identify question type from question text
        let questionKey = null;
        
        if (lastQuestion.includes('ไข้') || lastQuestion.includes('อุณหภูมิ')) {
          questionKey = 'has_fever';
        } else if (lastQuestion.includes('ไอ')) {
          questionKey = 'has_cough';
        } else if (lastQuestion.includes('เจ็บ') || lastQuestion.includes('ปวด')) {
          questionKey = 'has_pain';
        } else if (lastQuestion.includes('หายใจ')) {
          questionKey = 'has_breathing_difficulty';
        } else if (lastQuestion.includes('อาเจียน')) {
          questionKey = 'has_vomiting';
        } else if (lastQuestion.includes('ท้องเสีย')) {
          questionKey = 'has_diarrhea';
        }
        
        // Store answer if we identified the question
        if (questionKey) {
          enrichedAnswers[questionKey] = isAffirmativeAnswer ? 'ใช่' : 'ไม่';
          console.log(`[ANSWER-EXTRACTION] ✅ Question "${questionKey}": User answered "${symptom}" (${isAffirmativeAnswer ? 'yes' : 'no'}) - stored - will NOT ask again`);
        }
      }
      
      // MEDICAL-GRADE: Update hypothesis confidences based on answer
      // Bayesian updating: adjust hypothesis probabilities based on new evidence
      if (enrichedAnswers.hypotheses && Array.isArray(enrichedAnswers.hypotheses) && enrichedAnswers.hypotheses.length > 0) {
        enrichedAnswers.hypotheses = updateHypothesisConfidence(
          enrichedAnswers.hypotheses,
          symptom,
          lastQuestion,
          enrichedAnswers
        );
        enrichedAnswers.hypotheses = normalizeConfidences(enrichedAnswers.hypotheses);
        
        const topHypothesis = enrichedAnswers.hypotheses.sort((a, b) => 
          (b.confidence || b.adjustedProbability || 0) - (a.confidence || a.adjustedProbability || 0)
        )[0];
        console.log(`[BAYESIAN-UPDATE] Updated hypothesis confidences. Top: ${topHypothesis.name} (${((topHypothesis.confidence || topHypothesis.adjustedProbability || 0) * 100).toFixed(1)}%)`);
      }
    }
  }
  
  // Mark red flag screening status if first question was from symptom map
  // CRITICAL: System must remember it passed red flag screening
  // Support both intent_id and text-based symptom mapping
  if (questionCount === 0 && Array.isArray(questionsAsked) && questionsAsked.length === 0) {
    // Try structured intent first
    let firstQuestion = await getRedFlagQuestionForSymptom(symptom, language);
    
    // Fallback to legacy text-based mapping
    if (!firstQuestion) {
      firstQuestion = getSymptomSpecificQuestion(primarySymptom);
    }
    
    if (firstQuestion) {
      enrichedAnswers.redFlagScreeningStarted = true;
      enrichedAnswers.redFlagScreeningPassed = false; // Will be set to true after screening completes
      console.log(`[RED-FLAG-SCREENING] First question is red-flag focused: "${firstQuestion.substring(0, 50)}..."`);
      if (intent) {
        console.log(`[RED-FLAG-SCREENING] Using structured intent: ${intent.intent_id || intent.intentId}`);
      }
    }
  }
  
  // CRITICAL: If red flag screening already passed, don't ask red flag questions again
  if (enrichedAnswers.redFlagScreeningPassed === true) {
    console.log(`[RED-FLAG-SCREENING] Red flag screening already passed - proceeding to clinical reasoning`);
  }

  // CRITICAL: FIRST-GATE TRIAGE - Red Flag Detection
  // Medical-grade red flag mapping: Each symptom has specific red flag checklist
  // If user answers "ใช่" to red-flag question → Emergency immediately
  // CRITICAL: This check MUST happen BEFORE any other processing
  // CRITICAL: System must remember it passed red flag screening
  
  // Check if this is an answer to a red-flag question
  if (questionCount > 0 && Array.isArray(questionsAsked) && questionsAsked.length > 0) {
    const lastQuestion = questionsAsked[questionsAsked.length - 1];
    
    if (lastQuestion && typeof lastQuestion === 'string') {
      // Check if last question was a red-flag question from symptom map
      const { SYMPTOM_QUESTION_MAP } = await import('./symptom_question_map.js');
      const isRedFlagQuestion = Object.values(SYMPTOM_QUESTION_MAP).some(question => {
        // Check if last question matches or contains the red-flag question
        const normalizedLastQ = normalizeThaiText(lastQuestion);
        const normalizedRedFlagQ = normalizeThaiText(question);
        return normalizedLastQ === normalizedRedFlagQ || 
               normalizedLastQ.includes(normalizedRedFlagQ.substring(0, 15));
      });
      
      // Also check if it's a known red-flag question pattern (medical-grade patterns)
      const redFlagPatterns = [
        'ขาอ่อนแรง', 'กลั้นไม่ได้', 'หายใจลำบาก', 'หมดสติ', 'ชัก',
        'เลือดออก', 'พูดไม่ชัด', 'หน้าเบี้ยว', 'ซึม', 'สับสน',
        'รุนแรง', 'เฉียบพลัน', 'อาเจียน', 'ไข้สูง', 'หนาวสั่น',
        'ผื่นจ้ำเลือด', 'คอแข็ง', 'เห็นภาพซ้อน', 'เดินเซ',
        'อ่อนแรง', 'บวม', 'เขียว', 'เป็นลม', 'ชา',
      ];
      const normalizedLastQ = normalizeThaiText(lastQuestion);
      const matchesRedFlagPattern = redFlagPatterns.some(pattern => 
        normalizedLastQ.includes(pattern)
      );
      
      // CRITICAL: Check if user answered affirmatively (YES) or negatively (NO) to red-flag question
      // Only trigger emergency if answer is AFFIRMATIVE (yes/has/severe)
      // If answer is NEGATIVE (no/not much/not severe), proceed to normal triage flow
      const isAffirmative = isAffirmativeAnswer(symptom);
      const isNegative = !isAffirmative && (
        symptom.includes('ไม่') || 
        symptom.includes('ไม่มี') || 
        symptom.includes('ไม่ใช่') ||
        symptom.includes('ไม่มาก') ||
        symptom.includes('ไม่รุนแรง')
      );
      
      if ((isRedFlagQuestion || matchesRedFlagPattern)) {
        if (isAffirmative) {
          // User answered YES/AFFIRMATIVE to red-flag question → EMERGENCY
          console.log(`[RED-FLAG-DETECTED] ✅ User answered AFFIRMATIVE ("${symptom}") to red-flag question: "${lastQuestion}"`);
          
          // CRITICAL: Consider risk factors (age, gender, chronic diseases)
          // Lower threshold for high-risk groups (children, elderly, chronic diseases)
          let shouldTriggerEmergency = true;
          
          if (healthProfile) {
            // Children and elderly have lower threshold
            if (healthProfile.age !== null) {
              if (healthProfile.age < 2 || healthProfile.age > 65) {
                console.log(`[RED-FLAG-DETECTED] High-risk age group (${healthProfile.age} years) - Lower threshold`);
              }
            }
            
            // Chronic diseases lower threshold
            if (healthProfile.chronicDiseases && healthProfile.chronicDiseases.length > 0) {
              console.log(`[RED-FLAG-DETECTED] Chronic diseases present: ${healthProfile.chronicDiseases.join(', ')} - Lower threshold`);
            }
          }
          
          if (shouldTriggerEmergency) {
            // Extract which red flag was detected for clear explanation
            const detectedRedFlag = redFlagPatterns.find(pattern => normalizedLastQ.includes(pattern)) || 
                                   'สัญญาณอันตราย';
            
            console.log(`[RED-FLAG-DETECTED] Detected red flag: "${detectedRedFlag}"`);
            console.log(`[RED-FLAG-DETECTED] Answer: "${symptom}" → EMERGENCY FLOW`);
            console.log(`[RED-FLAG-DETECTED] Red flag screening: PASSED → Emergency`);
            
            // Store red flag info in answers for diagnosis generation
            enrichedAnswers.redFlagDetected = detectedRedFlag;
            enrichedAnswers.redFlagScreeningPassed = true;
            
            return {
              needMoreInfo: false,
              nextQuestion: null,
              triageLevel: 'emergency', // CRITICAL: Emergency flow immediately
              redFlagDetected: detectedRedFlag, // Track which red flag was detected
              redFlagScreeningPassed: true, // System remembers it passed red flag screening
              reassurance: isAnxiousUser ? getReassuranceMessage() : null,
              healthContextAnswer: enrichedAnswers.health_context,
            };
          }
        } else if (isNegative) {
          // User answered NO/NEGATIVE to red-flag question → NO EMERGENCY, proceed to normal triage
          console.log(`[RED-FLAG-SCREENING] ✅ User answered NEGATIVE ("${symptom}") to red-flag question: "${lastQuestion}"`);
          console.log(`[RED-FLAG-SCREENING] No emergency detected - proceeding to normal triage flow`);
          
          // Mark that red flag screening was completed (negative answer = no red flag)
          enrichedAnswers.redFlagScreeningPassed = true;
          enrichedAnswers.redFlagDetected = null; // No red flag detected
          
          // Continue to normal triage flow (don't return emergency)
          // The code will continue below to evaluate Severity + Time-course
        } else {
          // Ambiguous answer - mark screening as done but don't trigger emergency
          console.log(`[RED-FLAG-SCREENING] ⚠️ Ambiguous answer ("${symptom}") to red-flag question - treating as negative, proceeding to normal triage`);
          enrichedAnswers.redFlagScreeningPassed = true;
        }
      }
      
      // Mark that red flag screening was done (even if answer was negative or ambiguous)
      if ((isRedFlagQuestion || matchesRedFlagPattern) && !enrichedAnswers.redFlagScreeningPassed) {
        enrichedAnswers.redFlagScreeningPassed = true;
        console.log(`[RED-FLAG-SCREENING] Red flag question asked and answered`);
      }
    }
  }
  
  // CRITICAL: Mark red flag screening status if first question was from symptom map
  // CRITICAL: System must remember it passed red flag screening
  // This ensures we don't ask red flag questions again after screening
  if (questionCount === 0 && Array.isArray(questionsAsked) && questionsAsked.length === 0) {
    const firstQuestion = getSymptomSpecificQuestion(symptom);
    if (firstQuestion) {
      enrichedAnswers.redFlagScreeningStarted = true;
      enrichedAnswers.redFlagScreeningPassed = false; // Will be set to true after screening completes
      console.log(`[RED-FLAG-SCREENING] First question is red-flag focused: "${firstQuestion.substring(0, 50)}..."`);
    }
  }
  
  // CRITICAL: If red flag screening already passed, don't ask red flag questions again
  if (enrichedAnswers.redFlagScreeningPassed === true) {
    console.log(`[RED-FLAG-SCREENING] Red flag screening already passed - proceeding to clinical reasoning`);
  }
  
  // Merge extracted context into answers (if not already present)
  if (extractedDuration && !enrichedAnswers.duration) {
    enrichedAnswers.duration = `${extractedDuration} วัน`;
  }
  if (isWorseningFromText && !enrichedAnswers.severity_trend) {
    enrichedAnswers.severity_trend = 'แย่ลง';
  }
  
  // CRITICAL: Extract trajectory answer (ดีขึ้น/แย่ลง/เหมือนเดิม) from user's answer
  // This must happen BEFORE any emergency checks to prevent false positives
  // Store trajectory answer early so it can be used to skip emergency checks
  let trajectoryFromAnswer = detectSeverityTrajectory(symptom);
  if (trajectoryFromAnswer && !enrichedAnswers.severity_trend) {
    // Map trajectory to Thai answer format
    if (trajectoryFromAnswer === 'improving') {
      enrichedAnswers.severity_trend = 'ดีขึ้น';
    } else if (trajectoryFromAnswer === 'worsening') {
      enrichedAnswers.severity_trend = 'แย่ลง';
    } else if (trajectoryFromAnswer === 'stable') {
      enrichedAnswers.severity_trend = 'เหมือนเดิม';
    }
    console.log(`[TRAJECTORY-EXTRACTED] Extracted trajectory from answer: "${symptom}" → ${trajectoryFromAnswer} (${enrichedAnswers.severity_trend})`);
  }
  
  if (triedSelfCareFromText && !enrichedAnswers.self_care_response) {
    enrichedAnswers.self_care_response = 'เคยลองแล้ว';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔹 STEP 1: First Question = Emergency Screening (Mandatory)
  // ═══════════════════════════════════════════════════════════════════════════
  // CRITICAL: For first question (questionCount === 0), ALWAYS ask symptom-specific question FIRST
  // This question is designed to detect life-threatening red flags immediately
  // 
  // Rules:
  // - First question MUST be symptom-specific red-flag question
  // - Each symptom keyword maps to red-flag question (ER triage nurse + on-call physician practice)
  // - If user answers "Yes / มี / เคย / กำลังเป็น" → Emergency immediately, stop questioning
  // - If "No" → Proceed to Step 2
  // 
  // Purpose: Rapidly answer user's fear: "ต้องไปโรงพยาบาลตอนนี้ไหม?"
  // 
  // Don't check red flags or stop conditions until AFTER first question is asked
  // This ensures "เดินเซ" gets "เดินเซร่วมกับพูดไม่ชัดไหมคะ" instead of going straight to conclusion
  if (questionCount === 0 && (!Array.isArray(questionsAsked) || questionsAsked.length === 0)) {
    const firstQuestion = getSymptomSpecificQuestion(symptom);
    if (firstQuestion) {
      // Translate first question if language is English
      const translatedQuestion = translateQuestion(firstQuestion, language);
      console.log(`[STEP-1-EMERGENCY-SCREENING] ✅ First question (Emergency screening): "${firstQuestion}" (translated: "${translatedQuestion}")`);
      return {
        needMoreInfo: true,
        nextQuestion: translatedQuestion, // Return translated question
        triageLevel: 'uncertain', // Will be determined after first answer
        reassurance: isAnxiousUser ? getReassuranceMessage() : null,
        healthContextAnswer: enrichedAnswers.health_context,
      };
    } else {
      // CRITICAL: If no symptom-specific question found, ask generic red flag question
      // This prevents immediate conclusion for symptoms not in the map
      // Check for common red flag patterns in the symptom
      const normalizedSymptomLower = normalizedSymptom.toLowerCase();
      let genericRedFlagQuestion = null;
      
      // Check for swelling-related symptoms (หน้าบวม, บวมหน้า, etc.)
      if (normalizedSymptomLower.includes('บวม') && 
          (normalizedSymptomLower.includes('หน้า') || normalizedSymptomLower.includes('ปาก') || normalizedSymptomLower.includes('ลิ้น') || normalizedSymptomLower.includes('คอ'))) {
        genericRedFlagQuestion = 'บวมร่วมกับหายใจหรือกลืนลำบากไหมคะ';
      } else if (normalizedSymptomLower.includes('บวม')) {
        genericRedFlagQuestion = 'บวมมากหรือหายใจลำบากไหมคะ';
      } else if (normalizedSymptomLower.includes('ปวด') && normalizedSymptomLower.includes('รุนแรง')) {
        genericRedFlagQuestion = 'ปวดรุนแรงมากหรือมีอาการอื่นร่วมด้วยไหมคะ';
      } else if (normalizedSymptomLower.includes('ไข้') && normalizedSymptomLower.includes('สูง')) {
        genericRedFlagQuestion = 'ไข้สูงร่วมกับซึมหรือชักไหมคะ';
      } else {
        // Generic red flag question for unknown symptoms
        genericRedFlagQuestion = 'มีอาการรุนแรงหรือหายใจลำบากไหมคะ';
      }
      
      console.log(`[STEP-1-EMERGENCY-SCREENING] ⚠️ No symptom-specific question found for "${symptom}", using generic red flag question: "${genericRedFlagQuestion}"`);
      return {
        needMoreInfo: true,
        nextQuestion: genericRedFlagQuestion,
        triageLevel: 'uncertain', // Will be determined after first answer
        reassurance: isAnxiousUser ? getReassuranceMessage() : null,
        healthContextAnswer: enrichedAnswers.health_context,
      };
    }
  }

  // Check if user answered "ใช่" to red-flag question (Emergency detected)
  // CRITICAL: This check happens AFTER first question has been asked and answered
  // CRITICAL: BUT skip this check if we've already processed a red flag question answer
  // (The red flag question answer processing above already handles emergency detection)
  // Only check raw symptom text for red flags if we haven't processed a red flag question yet
  const hasProcessedRedFlagAnswer = enrichedAnswers.redFlagScreeningPassed === true || 
                                     enrichedAnswers.redFlagDetected !== undefined;
  
  // CRITICAL: Skip emergency check if user's answer is a trajectory answer (ดีขึ้น/แย่ลง/เหมือนเดิม)
  // Trajectory answers should NEVER trigger emergency - they're just describing symptom progression
  const isTrajectoryAnswer = trajectoryFromAnswer !== null && trajectoryFromAnswer !== undefined;
  
  if (questionCount > 0 && !hasProcessedRedFlagAnswer && !isTrajectoryAnswer &&
      (checkRedFlags(normalizedSymptom) || checkEmergency(normalizedSymptom))) {
    console.log(`[STEP-1-EMERGENCY-SCREENING] 🚨 Emergency detected from raw symptom text`);
    return {
      needMoreInfo: false,
      nextQuestion: null,
      triageLevel: 'emergency', // Clear result: emergency
      reassurance: isAnxiousUser ? getReassuranceMessage() : null,
      healthContextAnswer: enrichedAnswers.health_context,
    };
  }
  
  // CRITICAL: If we've already processed a red flag question answer and it was negative,
  // skip the raw text check (user answered "ไม่มาก" = no emergency, don't check text again)
  if (hasProcessedRedFlagAnswer && enrichedAnswers.redFlagDetected === null) {
    console.log(`[STEP-1-EMERGENCY-SCREENING] ✅ Red flag screening completed (negative answer) - skipping raw text check`);
  }
  
  // CRITICAL: If user answered trajectory question (ดีขึ้น/แย่ลง/เหมือนเดิม), skip emergency check
  if (isTrajectoryAnswer) {
    console.log(`[TRAJECTORY-ANSWER] User answered trajectory question: "${symptom}" → ${trajectoryFromAnswer} - skipping emergency check`);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔹 STEP 1.5: Body-Part Clarification (MANDATORY - After First Question)
  // ═══════════════════════════════════════════════════════════════════════════
  // CRITICAL: After first question (red-flag screening), if symptom is location-ambiguous,
  // MUST ask for body-part location BEFORE proceeding to severity/time-course questions.
  // 
  // This MUST happen IMMEDIATELY after first question is answered (questionCount === 1)
  // BEFORE any other question selection logic runs.
  
  // Extract body part from current answer if user is answering the body-part question
  if (questionCount > 0 && Array.isArray(questionsAsked) && questionsAsked.length > 0) {
    const lastQuestion = questionsAsked[questionsAsked.length - 1];
    if (lastQuestion && typeof lastQuestion === 'string') {
      const normalizedLastQ = normalizeThaiText(lastQuestion.toLowerCase());
      
      // Check if last question was body-part clarification question
      if (normalizedLastQ.includes('ตำแหน่ง') || 
          normalizedLastQ.includes('ส่วนไหน') ||
          normalizedLastQ.includes('location') ||
          normalizedLastQ.includes('ร่างกาย')) {
        // Extract body part from answer
        const bodyPart = extractBodyPart(symptom);
        if (bodyPart) {
          enrichedAnswers.body_part_location = bodyPart;
          enrichedAnswers.body_part = bodyPart; // Also store as body_part for compatibility
          enrichedAnswers.location = bodyPart; // Also store as location for compatibility
          console.log(`[BODY-PART-CLARIFICATION] ✅ Body part extracted: "${symptom}" → ${bodyPart}`);
        } else {
          // User might have said "ไม่แน่ใจ" or "หลายตำแหน่ง"
          enrichedAnswers.body_part_location = 'uncertain';
          console.log(`[BODY-PART-CLARIFICATION] ⚠️ Body part unclear or multiple locations`);
        }
      }
    }
  }
  
  // Determine base triage level first (before hypothesis generation)
  // CRITICAL: For first question, don't determine triage level yet - just ask symptom-specific question
  // Only determine triage level after first question has been asked
  let baseTriageLevel = questionCount === 0 ? 'uncertain' : determineTriageLevel(normalizedSymptom, enrichedAnswers, questionCount);
  
  // CRITICAL: Body-part clarification MUST happen as SECOND question (questionCount === 1)
  // This happens IMMEDIATELY after first question is answered, BEFORE any other logic
  // Check if this is exactly the second question (first question was answered)
  const isSecondQuestion = questionCount === 1 && 
                           Array.isArray(questionsAsked) && 
                           questionsAsked.length === 1;
  
  // Use the original symptom from session or current input for body-part check
  // CRITICAL: When questionCount === 1, 'symptom' parameter is the ANSWER to first question (e.g., "ไม่")
  // We need to get the ORIGINAL symptom from previousAnswers
  // Priority order:
  // 1. original_symptom from enrichedAnswers (stored in index.js from session.symptoms)
  // 2. symptom from enrichedAnswers (also stored from session.symptoms)
  // 3. primarySymptom (but only if questionCount === 0, otherwise it's the answer)
  // 4. normalizedSymptom (fallback)
  const originalSymptom = enrichedAnswers.original_symptom || 
                          enrichedAnswers.symptom || 
                          (questionCount === 0 ? primarySymptom : null) ||
                          (questionCount === 0 ? symptom : null) ||
                          normalizedSymptom;
  
  // CRITICAL: Use the ORIGINAL symptom text, not the current answer
  // If we still don't have it, log a warning
  const symptomForBodyPart = originalSymptom;
  
  // Debug logging for body-part clarification
  if (isSecondQuestion) {
    console.log(`[BODY-PART-CLARIFICATION] 🔍 Original symptom retrieval:`);
    console.log(`[BODY-PART-CLARIFICATION]   - questionCount: ${questionCount}`);
    console.log(`[BODY-PART-CLARIFICATION]   - symptom param (current): "${symptom}"`);
    console.log(`[BODY-PART-CLARIFICATION]   - enrichedAnswers.original_symptom: "${enrichedAnswers.original_symptom}"`);
    console.log(`[BODY-PART-CLARIFICATION]   - enrichedAnswers.symptom: "${enrichedAnswers.symptom}"`);
    console.log(`[BODY-PART-CLARIFICATION]   - primarySymptom: "${primarySymptom}"`);
    console.log(`[BODY-PART-CLARIFICATION]   - normalizedSymptom: "${normalizedSymptom}"`);
    console.log(`[BODY-PART-CLARIFICATION]   - originalSymptom (final): "${originalSymptom}"`);
    console.log(`[BODY-PART-CLARIFICATION]   - symptomForBodyPart: "${symptomForBodyPart}"`);
  }
  
  if (!symptomForBodyPart || (questionCount === 1 && symptomForBodyPart === symptom)) {
    console.warn(`[BODY-PART-CLARIFICATION] ⚠️ Could not retrieve original symptom! Using fallback. questionCount: ${questionCount}, symptom param: "${symptom}", originalSymptom: "${originalSymptom}", enrichedAnswers.original_symptom: "${enrichedAnswers.original_symptom}"`);
  }
  
  // Trigger body-part clarification if needed
  // CRITICAL: Only ask if:
  // 1. This is the second question (after first red-flag question answered)
  // 2. Body-part hasn't been clarified yet
  // 3. Symptom needs body-part clarification
  // 4. NOT emergency (emergency already handled)
  // 5. Red-flag screening completed (either passed or failed, but not still in progress)
  if (isSecondQuestion && 
      !hasBodyPartClarified(enrichedAnswers) &&
      baseTriageLevel !== 'emergency') {
    
    // Check if symptom needs body-part clarification
    const needsClarification = needsBodyPartClarification(symptomForBodyPart, intent);
    
    console.log(`[BODY-PART-CLARIFICATION] 🔍 Checking if needed:`);
    console.log(`[BODY-PART-CLARIFICATION]   - questionCount: ${questionCount}`);
    console.log(`[BODY-PART-CLARIFICATION]   - questionsAsked.length: ${questionsAsked.length}`);
    console.log(`[BODY-PART-CLARIFICATION]   - symptomForBodyPart: "${symptomForBodyPart}"`);
    console.log(`[BODY-PART-CLARIFICATION]   - needsBodyPartClarification: ${needsClarification}`);
    console.log(`[BODY-PART-CLARIFICATION]   - hasBodyPartClarified: ${hasBodyPartClarified(enrichedAnswers)}`);
    console.log(`[BODY-PART-CLARIFICATION]   - baseTriageLevel: ${baseTriageLevel}`);
    console.log(`[BODY-PART-CLARIFICATION]   - redFlagScreeningPassed: ${enrichedAnswers.redFlagScreeningPassed}`);
    
    if (needsClarification) {
      const bodyPartQuestion = generateBodyPartQuestion(symptomForBodyPart, intent, language);
      
      if (bodyPartQuestion) {
        console.log(`[BODY-PART-CLARIFICATION] ✅ Asking body-part clarification: "${bodyPartQuestion.question}"`);
        console.log(`[BODY-PART-CLARIFICATION] Choices: ${bodyPartQuestion.choices.join(', ')}`);
        
        // Format body-part question using question_formatter for consistency
        const { formatQuestionAsStructured } = await import('./question_formatter.js');
        const formattedBodyPartQuestion = formatQuestionAsStructured(
          bodyPartQuestion.question,
          bodyPartQuestion.questionKey,
          language,
          bodyPartQuestion.step,
          bodyPartQuestion.stepName,
          bodyPartQuestion.allowMultiSelect || false
        );
        
        // Override choices with body-part specific choices
        if (formattedBodyPartQuestion && bodyPartQuestion.choices) {
          formattedBodyPartQuestion.choices = bodyPartQuestion.choices;
        }
        
        return {
          needMoreInfo: true,
          nextQuestion: bodyPartQuestion.question,
          structuredQuestion: formattedBodyPartQuestion || bodyPartQuestion, // Return structured question with choices
          triageLevel: 'uncertain', // Will be determined after body-part clarification
          reassurance: isAnxiousUser ? getReassuranceMessage() : null,
          healthContextAnswer: enrichedAnswers.health_context,
        };
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 STEP 2.5: Body-Part Localized Red-Flag Screening (MANDATORY)
  // ═══════════════════════════════════════════════════════════════════════════
  // CRITICAL: After body-part is confirmed, screen for location-specific red flags
  // This happens AFTER body-part clarification, BEFORE severity/time-course questions
  // 
  // Principle: Each body part has its own red-flag set (high-risk, low-frequency, high-consequence)
  // If ANY red flag is positive → Emergency immediately, stop all questioning
  // 
  // This logic operates automatically and transparently, similar to ER triage nurse reasoning
  
  // Check if body-part has been clarified
  const bodyPartLocation = enrichedAnswers.body_part_location || enrichedAnswers.body_part || enrichedAnswers.location;
  
  // DEBUG: Log body-part red-flag check
  console.log(`[BODY-PART-RED-FLAG] 🔍 Checking conditions:`);
  console.log(`[BODY-PART-RED-FLAG]   - questionCount: ${questionCount}`);
  console.log(`[BODY-PART-RED-FLAG]   - bodyPartLocation: "${bodyPartLocation}"`);
  console.log(`[BODY-PART-RED-FLAG]   - baseTriageLevel: "${baseTriageLevel}"`);
  console.log(`[BODY-PART-RED-FLAG]   - questionsAsked.length: ${questionsAsked?.length || 0}`);
  
  // CRITICAL: Only screen body-part red flags if:
  // 1. Body-part has been clarified
  // 2. Not already emergency
  // 3. Body-part red flags haven't been screened yet
  // 4. We're past the body-part clarification question (questionCount >= 2)
  // NOTE: questionCount === 2 means user just answered the body-part clarification question
  if (bodyPartLocation && 
      bodyPartLocation !== 'uncertain' &&
      bodyPartLocation !== 'multiple' &&
      baseTriageLevel !== 'emergency' &&
      questionCount >= 2 && // After body-part clarification (questionCount === 1) and answer (questionCount === 2)
      !hasBodyPartRedFlagsScreened(bodyPartLocation, questionsAsked)) {
    
    console.log(`[BODY-PART-RED-FLAG] ✅ Conditions met, proceeding to screen red flags for: "${bodyPartLocation}"`);
    
    // STEP 1: Try expanded dataset first
    const expandedRedFlag = selectRedFlagFromExpandedDataset(
      bodyPartLocation,
      normalizedSymptom, // Use normalized symptom keyword
      questionsAsked,
      {
        age: enrichedAnswers.age || (healthProfile && healthProfile.age) || null,
        gender: enrichedAnswers.gender || (healthProfile && healthProfile.gender) || null,
        isPregnant: enrichedAnswers.isPregnant || (healthProfile && healthProfile.isPregnant) || null,
        chronicDiseases: enrichedAnswers.chronicDiseases || (healthProfile && healthProfile.chronicDiseases) || [],
      }
    );
    
    if (expandedRedFlag) {
      console.log(`[BODY-PART-RED-FLAG] ✅ Using expanded dataset question: "${expandedRedFlag.question.substring(0, 50)}..."`);
      
      // Check if user is answering this expanded red-flag question
      if (questionCount > 1 && Array.isArray(questionsAsked) && questionsAsked.length > 0) {
        const lastQuestion = questionsAsked[questionsAsked.length - 1];
        if (lastQuestion && typeof lastQuestion === 'string') {
          const normalizedLastQ = normalizeThaiText(lastQuestion.toLowerCase());
          const normalizedExpandedQ = normalizeThaiText(expandedRedFlag.question.toLowerCase());
          
          // Check if last question matches expanded red-flag question
          if (normalizedLastQ.includes(normalizedExpandedQ.substring(0, 20)) ||
              normalizedExpandedQ.includes(normalizedLastQ.substring(0, 20))) {
            // User answered expanded red-flag question
            const isPositive = isBodyPartRedFlagPositive(symptom, expandedRedFlag.key);
            
            if (isPositive && expandedRedFlag.emergencyIfYes) {
              // CRITICAL: Positive red flag → Emergency immediately
              console.log(`[BODY-PART-RED-FLAG] 🚨 EMERGENCY detected (expanded dataset): "${expandedRedFlag.key}" = positive`);
              console.log(`[BODY-PART-RED-FLAG] Rationale: ${expandedRedFlag.rationale}`);
              
              // Store red-flag detection
              enrichedAnswers.body_part_red_flag_detected = expandedRedFlag.key;
              enrichedAnswers.redFlagDetected = true;
              enrichedAnswers.redFlagScreeningPassed = false;
              
              return {
                needMoreInfo: false,
                nextQuestion: null,
                triageLevel: 'emergency', // Immediate emergency
                redFlagDetected: true,
                redFlagScreeningPassed: false,
                bodyPartRedFlagDetected: expandedRedFlag.key,
                redFlagRationale: expandedRedFlag.rationale,
                reassurance: isAnxiousUser ? getReassuranceMessage() : null,
                healthContextAnswer: enrichedAnswers.health_context,
              };
            } else if (!isPositive) {
              // Negative answer - mark this red flag as screened
              console.log(`[BODY-PART-RED-FLAG] ✅ Red flag "${expandedRedFlag.key}" = negative`);
              enrichedAnswers[`body_part_red_flag_${expandedRedFlag.key}`] = false;
              // Continue to ask next red flag or proceed to severity/time-course
            }
          }
        }
      }
      
      // Ask expanded red-flag question
      console.log(`[BODY-PART-RED-FLAG] 🔍 Asking expanded dataset red-flag question: "${expandedRedFlag.question}"`);
      
      // Format red-flag question with Yes/No choices
      const { formatQuestionAsStructured } = await import('./question_formatter.js');
      const formattedRedFlagQuestion = formatQuestionAsStructured(
        expandedRedFlag.question,
        expandedRedFlag.key,
        language,
        2.5, // Step 2.5 (between body-part clarification and severity)
        'body_part_red_flag_screening',
        false // Single select
      );
      
      return {
        needMoreInfo: true,
        nextQuestion: expandedRedFlag.question,
        structuredQuestion: formattedRedFlagQuestion,
        triageLevel: 'uncertain', // Will be determined after red-flag screening
        reassurance: isAnxiousUser ? getReassuranceMessage() : null,
        healthContextAnswer: enrichedAnswers.health_context,
      };
    }
    
    // STEP 2: Fallback to existing body_part_red_flags.js logic
    console.log(`[BODY-PART-RED-FLAG] ⚠️ Expanded dataset returned no result, falling back to existing logic`);
    
    // Get body-part specific red-flag questions (existing logic)
    const bodyPartRedFlags = getBodyPartRedFlagQuestions(bodyPartLocation, language);
    
    if (bodyPartRedFlags && bodyPartRedFlags.length > 0) {
      // Check if user is answering a body-part red-flag question
      if (questionCount > 1 && Array.isArray(questionsAsked) && questionsAsked.length > 0) {
        const lastQuestion = questionsAsked[questionsAsked.length - 1];
        if (lastQuestion && typeof lastQuestion === 'string') {
          const normalizedLastQ = normalizeThaiText(lastQuestion.toLowerCase());
          
          // Check if last question was a body-part red-flag question
          const matchingRedFlag = bodyPartRedFlags.find(rf => {
            const normalizedRF = normalizeThaiText(rf.text.toLowerCase());
            return normalizedLastQ.includes(normalizedRF.substring(0, 20)) ||
                   normalizedRF.includes(normalizedLastQ.substring(0, 20));
          });
          
          if (matchingRedFlag) {
            // User answered a body-part red-flag question
            const isPositive = isBodyPartRedFlagPositive(symptom, matchingRedFlag.key);
            
            if (isPositive) {
              // CRITICAL: Positive red flag → Emergency immediately
              console.log(`[BODY-PART-RED-FLAG] 🚨 EMERGENCY detected: "${matchingRedFlag.key}" = positive`);
              console.log(`[BODY-PART-RED-FLAG] Body part: "${bodyPartLocation}", Answer: "${symptom}"`);
              
              // Store red-flag detection
              enrichedAnswers.body_part_red_flag_detected = matchingRedFlag.key;
              enrichedAnswers.redFlagDetected = true;
              enrichedAnswers.redFlagScreeningPassed = false;
              
              return {
                needMoreInfo: false,
                nextQuestion: null,
                triageLevel: 'emergency', // Immediate emergency
                redFlagDetected: true,
                redFlagScreeningPassed: false,
                bodyPartRedFlagDetected: matchingRedFlag.key,
                reassurance: isAnxiousUser ? getReassuranceMessage() : null,
                healthContextAnswer: enrichedAnswers.health_context,
              };
            } else {
              // Negative answer - mark this red flag as screened
              console.log(`[BODY-PART-RED-FLAG] ✅ Red flag "${matchingRedFlag.key}" = negative`);
              enrichedAnswers[`body_part_red_flag_${matchingRedFlag.key}`] = false;
            }
          }
        }
      }
      
      // Find next unscreened red-flag question
      const screenedKeys = new Set();
      questionsAsked.forEach(q => {
        if (typeof q === 'string') {
          const normalizedQ = normalizeThaiText(q.toLowerCase());
          bodyPartRedFlags.forEach(rf => {
            const normalizedRF = normalizeThaiText(rf.text.toLowerCase());
            if (normalizedQ.includes(normalizedRF.substring(0, 20)) || 
                normalizedRF.includes(normalizedQ.substring(0, 20))) {
              screenedKeys.add(rf.key);
            }
          });
        }
      });
      
      const unscreenedRedFlag = bodyPartRedFlags.find(rf => !screenedKeys.has(rf.key));
      
      if (unscreenedRedFlag) {
        // Ask next body-part red-flag question
        console.log(`[BODY-PART-RED-FLAG] 🔍 Asking body-part red-flag question: "${unscreenedRedFlag.text}"`);
        console.log(`[BODY-PART-RED-FLAG]   - Body part: "${bodyPartLocation}"`);
        console.log(`[BODY-PART-RED-FLAG]   - Red flag key: "${unscreenedRedFlag.key}"`);
        
        // Format red-flag question with Yes/No choices
        const { formatQuestionAsStructured } = await import('./question_formatter.js');
        const formattedRedFlagQuestion = formatQuestionAsStructured(
          unscreenedRedFlag.text,
          unscreenedRedFlag.key,
          language,
          2.5, // Step 2.5 (between body-part clarification and severity)
          'body_part_red_flag_screening',
          false // Single select
        );
        
        return {
          needMoreInfo: true,
          nextQuestion: unscreenedRedFlag.text,
          structuredQuestion: formattedRedFlagQuestion,
          triageLevel: 'uncertain', // Will be determined after red-flag screening
          reassurance: isAnxiousUser ? getReassuranceMessage() : null,
          healthContextAnswer: enrichedAnswers.health_context,
        };
      } else {
        console.log(`[BODY-PART-RED-FLAG] ⚠️ All red flags already screened for: "${bodyPartLocation}"`);
      }
    } else {
      console.log(`[BODY-PART-RED-FLAG] ⚠️ No red flags found for body part: "${bodyPartLocation}"`);
      console.log(`[BODY-PART-RED-FLAG]   - Mapped category: ${mapBodyPartToRedFlagCategory(bodyPartLocation)}`);
    }
  } else {
    // Debug why conditions weren't met
    if (!bodyPartLocation) {
      console.log(`[BODY-PART-RED-FLAG] ⚠️ Body part not clarified yet`);
    } else if (bodyPartLocation === 'uncertain' || bodyPartLocation === 'multiple') {
      console.log(`[BODY-PART-RED-FLAG] ⚠️ Body part is uncertain/multiple: "${bodyPartLocation}"`);
    } else if (baseTriageLevel === 'emergency') {
      console.log(`[BODY-PART-RED-FLAG] ⚠️ Already emergency, skipping body-part red flags`);
    } else if (questionCount < 2) {
      console.log(`[BODY-PART-RED-FLAG] ⚠️ questionCount (${questionCount}) < 2, not ready yet`);
    } else {
      const alreadyScreened = hasBodyPartRedFlagsScreened(bodyPartLocation, questionsAsked);
      console.log(`[BODY-PART-RED-FLAG] ⚠️ Red flags already screened: ${alreadyScreened}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔹 STEP 3+: Canonical Question Bank Integration (Q3-14)
  // ═══════════════════════════════════════════════════════════════════════════
  // CRITICAL: For questions 3-14, use Canonical Question Bank for clinically logical,
  // non-repetitive, doctor-like questioning organized by symptom group and categories
  // 
  // Integration point: After body-part clarification (Q2) and body-part red-flag screening (STEP 2.5)
  // Canonical Question Bank provides 650 clinically valid questions organized by:
  // - 16 symptom groups
  // - 10 canonical categories per group
  // - Priority-based selection
  
  let canonicalQuestion = null;
  let lastCategoryId = null;
  
  if (questionCount >= 3 && questionCount <= 14 && baseTriageLevel !== 'emergency') {
    try {
      // Map symptom to symptom group
      const symptomGroupMap = {
        'ปวดหัว': 'headache_neuro',
        'ปวดศีรษะ': 'headache_neuro',
        'เวียนหัว': 'headache_neuro',
        'ชา': 'headache_neuro',
        'อ่อนแรง': 'headache_neuro',
        'ไอ': 'respiratory',
        'น้ำมูก': 'respiratory',
        'คัดจมูก': 'respiratory',
        'หายใจลำบาก': 'respiratory',
        'เจ็บคอ': 'respiratory',
        'ปวดหู': 'ent',
        'หูอื้อ': 'ent',
        'ตาแดง': 'ent',
        'ปวดท้อง': 'gi',
        'ท้องเสีย': 'gi',
        'คลื่นไส้': 'gi',
        'อาเจียน': 'gi',
        'กรดไหลย้อน': 'gi',
        'ปัสสาวะแสบ': 'urinary',
        'ปัสสาวะบ่อย': 'urinary',
        'ผื่น': 'skin',
        'คัน': 'skin',
        'ปวด': 'musculoskeletal',
        'เจ็บ': 'musculoskeletal',
        'ไข้': 'fever_infection',
        'หนาวสั่น': 'fever_infection',
        'เจ็บหน้าอก': 'chest_cardio',
        'ใจสั่น': 'chest_cardio',
        'อ่อนเพลีย': 'general_symptoms',
        'เบื่ออาหาร': 'general_symptoms'
      };
      
      // Determine symptom group from normalized symptom
      let symptomGroup = 'general_symptoms'; // Default
      for (const [keyword, group] of Object.entries(symptomGroupMap)) {
        if (normalizedSymptom.includes(keyword)) {
          symptomGroup = group;
          break;
        }
      }
      
      // If intent has symptom_group, use it (more accurate)
      if (intent && intent.symptom_group) {
        symptomGroup = intent.symptom_group;
      }
      
      // Get last category ID from last asked question
      if (questionsAsked && questionsAsked.length > 0) {
        const lastQuestionId = questionsAsked[questionsAsked.length - 1];
        if (typeof lastQuestionId === 'string') {
          const { getQuestionById } = await import('./canonical_question_bank_loader.js');
          const lastQuestion = getQuestionById(lastQuestionId);
          if (lastQuestion) {
            lastCategoryId = lastQuestion.intent_type;
          }
        }
      }
      
      // Get body part
      const bodyPart = enrichedAnswers.body_part_location || enrichedAnswers.body_part || null;
      
      // Get severity and time-course
      const currentSeverity = severityLevel === SEVERITY_LEVELS.MILD ? 'mild' :
                              severityLevel === SEVERITY_LEVELS.SEVERE ? 'severe' :
                              'moderate';
      const currentTimeCourse = timeCourse || null;
      
      // Calculate confidence score (0.0-1.0)
      const confidenceScore = confidence / 100;
      
      // Select question from Canonical Question Bank
      const { selectQuestionFromCanonicalBank } = await import('./canonical_question_selector.js');
      
      const selectedQuestion = selectQuestionFromCanonicalBank({
        symptomGroup: symptomGroup,
        questionNumber: questionCount,
        questionsAsked: questionsAsked || [],
        lastCategoryId: lastCategoryId,
        severity: currentSeverity,
        timeCourse: currentTimeCourse,
        bodyPart: bodyPart,
        confidenceScore: confidenceScore,
        assessmentState: {
          flags: {
            emergency_detected: baseTriageLevel === 'emergency',
            severe_confirmed: currentSeverity === 'severe',
            mild_confirmed: currentSeverity === 'mild',
            body_part_unknown: !bodyPart,
            red_flag_positive: enrichedAnswers.redFlagDetected === true,
            confidence_high: confidenceScore >= 0.80,
            time_course_confirmed: !!currentTimeCourse,
            severity_confirmed: !!currentSeverity
          }
        },
        sessionSeed: sessionId ? parseInt(sessionId.slice(-8), 16) / 0xFFFFFFFF : Math.random()
      });
      
      if (selectedQuestion) {
        canonicalQuestion = selectedQuestion;
        console.log(`[CANONICAL-BANK] Selected question ${questionCount}: "${selectedQuestion.question_text_th}" (${selectedQuestion.intent_type})`);
      }
    } catch (error) {
      console.warn(`[CANONICAL-BANK] Error selecting question: ${error.message}`);
      // Fall through to existing question selection logic
    }
  }
  
  // MEDICAL-GRADE: Generate hypotheses after first question (non-emergency)
  // CRITICAL: After first question, system must generate hypothesis set (3-7 differential diagnoses)
  // ENHANCED: Pass enrichedAnswers to include body_part_location for better hypothesis ranking
  let hypotheses = null;
  if (questionCount > 0 && baseTriageLevel !== 'emergency') {
    const age = enrichedAnswers.age || (healthProfile && healthProfile.age) || null;
    const gender = enrichedAnswers.gender || (healthProfile && healthProfile.gender) || null;
    // Pass enrichedAnswers to include body_part_location for location-aware hypothesis ranking
    hypotheses = getHypotheses(normalizedSymptom, age, gender, enrichedAnswers);
    // CRITICAL: Check hypotheses is an array before accessing .length
    if (hypotheses && Array.isArray(hypotheses)) {
      console.log(`[HYPOTHESIS] Generated ${hypotheses.length} hypotheses for "${symptom}"`);
    } else {
      console.log(`[HYPOTHESIS] WARNING: getHypotheses returned invalid result:`, hypotheses);
      hypotheses = null;
    }
    
    // Update hypothesis confidences based on current answers
    if (hypotheses && hypotheses.length > 0) {
      // Update based on trajectory and time-course
      const trajectory = detectSeverityTrajectory(symptom) || enrichedAnswers.severity_trend;
      const duration = extractedDuration || (enrichedAnswers.duration ? parseInt(enrichedAnswers.duration) : null);
      const timeCourse = classifyTimeCourse(duration, trajectory, enrichedAnswers);
      
      if (trajectory || timeCourse) {
        hypotheses = updateHypothesisConfidence(hypotheses, symptom, '', enrichedAnswers);
        hypotheses = normalizeConfidences(hypotheses);
        console.log(`[HYPOTHESIS] Updated confidences based on trajectory: ${trajectory}, time-course: ${timeCourse}`);
      }
    }
  }

  // MEDICAL-GRADE: Determine severity and time-course for matrix decision
  // CRITICAL: Use trajectoryFromAnswer if available (extracted early from current answer like "ดีขึ้น")
  // This must be checked before severity/time-course to prevent false emergencies
  const trajectory = trajectoryFromAnswer || detectSeverityTrajectory(symptom) || enrichedAnswers.severity_trend || enrichedAnswers.severity_trajectory;
  
  // CRITICAL: Check previous answers for "ไม่มาก" (not severe) - this should override severity
  // User might have said "ไม่มาก" in response to an earlier question
  const hasNotSevereAnswer = Array.isArray(questionsAsked) && questionsAsked.length > 0 && 
    previousAnswers && Object.values(previousAnswers).some(answer => {
      if (typeof answer === 'string') {
        const normalized = normalizeThaiText(answer.toLowerCase());
        return normalized.includes('ไม่มาก') || normalized.includes('ไม่รุนแรง') || 
               normalized.includes('เบา') || normalized.includes('นิดหน่อย');
      }
      return false;
    });
  
  // CRITICAL: If trajectory is "improving" OR user said "ไม่มาก", force severity to be at most MODERATE
  // Improving symptoms or "ไม่มาก" answers should NEVER be classified as SEVERE
  let detectedSeverityRaw = detectedSeverity || enrichedAnswers.severity;
  if ((trajectory === 'improving' || hasNotSevereAnswer) && 
      (detectedSeverityRaw === 'high' || detectedSeverityRaw === 'severe')) {
    console.log(`[SEVERITY-OVERRIDE] Trajectory is "${trajectory}" or user said "ไม่มาก" → Downgrading severity from ${detectedSeverityRaw} to "medium"`);
    detectedSeverityRaw = 'medium'; // Force to medium if improving or not severe
  }
  
  const duration = extractedDuration || (enrichedAnswers.duration ? parseInt(enrichedAnswers.duration) : null);
  
  // CRITICAL IMPROVEMENT: Use intent time_course if available (from 700-intent dataset)
  // This is more accurate than text-based classification
  let timeCourse = intentTimeCourse || classifyTimeCourse(duration, trajectory, enrichedAnswers);
  
  if (intentTimeCourse) {
    console.log(`[TIMECOURSE-DETERMINATION] Using intent time_course: ${timeCourse} (from 700-intent dataset)`);
  }
  
  // CRITICAL IMPROVEMENT: Use intent severity if available (from 700-intent dataset)
  // Convert severity from 'high'/'medium'/'low' to 'severe'/'moderate'/'mild'
  let severityLevel = SEVERITY_LEVELS.MODERATE; // Default
  
  // CRITICAL SAFETY FIX: Check severity from structured question answers FIRST
  // If user selected "รบกวนมาก" or "รุนแรงผิดปกติ" from severity question → Force SEVERE
  const severityFromAnswer = enrichedAnswers.severity_level || 
                             enrichedAnswers.severity ||
                             enrichedAnswers.last_answer;
  if (severityFromAnswer && typeof severityFromAnswer === 'string') {
    const normalizedAnswer = normalizeThaiText(severityFromAnswer.toLowerCase());
    const severeAnswerKeywords = [
      'รบกวนมาก', 'รุนแรงผิดปกติ', 'รุนแรง', 'มาก', 'หนัก', 'ทนไม่ไหว',
      'ไม่ไหว', 'ไม่ไหวละ', 'หนักมาก', 'แย่มาก', 'รบกวนชีวิต',
      'ใช้ชีวิตไม่ได้', 'ทำอะไรไม่ได้', 'รบกวนมากๆ',
    ];
    if (severeAnswerKeywords.some(keyword => normalizedAnswer.includes(keyword))) {
      // Double-check: exclude if it says "ไม่รบกวนมาก" or "ไม่รุนแรง"
      if (!normalizedAnswer.includes('ไม่รบกวน') && 
          !normalizedAnswer.includes('ไม่รุนแรง') &&
          !normalizedAnswer.includes('ไม่มาก')) {
        severityLevel = SEVERITY_LEVELS.SEVERE;
        console.log(`[SEVERITY-DETERMINATION] ✅ Detected SEVERE from answer: "${severityFromAnswer}"`);
      }
    }
  }
  
  if (intentSeverity && severityLevel !== SEVERITY_LEVELS.SEVERE) {
    // Use intent's severity directly (most accurate - from structured dataset)
    // BUT: Don't override if we already detected SEVERE from answer
    severityLevel = intentSeverity === 'severe' ? SEVERITY_LEVELS.SEVERE :
                    intentSeverity === 'mild' ? SEVERITY_LEVELS.MILD :
                    SEVERITY_LEVELS.MODERATE;
    console.log(`[SEVERITY-DETERMINATION] Using intent severity: ${severityLevel} (from 700-intent dataset)`);
  } else if (detectedSeverityRaw === 'high' || detectedSeverityRaw === 'severe') {
    // Only set if not already SEVERE from answer
    if (severityLevel !== SEVERITY_LEVELS.SEVERE) {
      severityLevel = SEVERITY_LEVELS.SEVERE;
    }
  } else if (detectedSeverityRaw === 'low' || detectedSeverityRaw === 'mild') {
    severityLevel = SEVERITY_LEVELS.MILD;
  } else if (detectedSeverityRaw === 'medium' || detectedSeverityRaw === 'moderate') {
    severityLevel = SEVERITY_LEVELS.MODERATE;
  }
  
  // CRITICAL: If trajectory is "improving", ensure severity is NOT SEVERE
  // This prevents false emergency triggers
  if (trajectory === 'improving' && severityLevel === SEVERITY_LEVELS.SEVERE) {
    console.log(`[SEVERITY-OVERRIDE] Trajectory is "improving" → Forcing severity from SEVERE to MODERATE`);
    severityLevel = SEVERITY_LEVELS.MODERATE;
  }
  
  // Store trajectory, time-course, and severity level in answers
  if (trajectory && !enrichedAnswers.severity_trajectory) {
    enrichedAnswers.severity_trajectory = trajectory;
  }
  if (timeCourse && !enrichedAnswers.time_course) {
    enrichedAnswers.time_course = timeCourse;
  }
  if (severityLevel && !enrichedAnswers.severity_level) {
    enrichedAnswers.severity_level = severityLevel;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔹 STEP 2: Non-emergency → Severity × Time-course Logic
  // ═══════════════════════════════════════════════════════════════════════════
  // CRITICAL RULE 2: Always evaluate Severity + Time-course before concluding
  // Only proceed if NOT emergency (emergency already handled in STEP 1)
  // 
  // Purpose: Narrow down hypotheses and assign tentative triage level
  // Question selection adapts dynamically based on:
  // - Worsening vs improving trajectory
  // - Duration and progression pattern
  // Replaces fixed question trees with adaptive reasoning
  
  // MEDICAL-GRADE: Use Severity × Time-course Matrix to determine triage level
  // Pass symptom keyword for symptom-specific logic
  let matrixTriageLevel = null;
  if (severityLevel && timeCourse) {
    matrixTriageLevel = determineTriageFromMatrix(severityLevel, timeCourse, normalizedSymptom);
    console.log(`[STEP-2-SEVERITY-TIMECOURSE] Severity: ${severityLevel} × Time-course: ${timeCourse} → Triage: ${matrixTriageLevel}`);
  }
  
  // Calculate risk score (for backward compatibility and additional risk factors)
  let baseRiskScore = calculateRiskScore(normalizedSymptom, enrichedAnswers);
  
  // Adjust risk based on trajectory
  if (trajectory) {
    baseRiskScore = assessTrajectoryRisk(trajectory, detectedSeverityRaw, baseRiskScore);
    console.log(`[RISK-ADJUSTMENT] Trajectory: ${trajectory} → adjusted risk score: ${baseRiskScore}`);
  }
  
  // Adjust risk based on time-course
  if (timeCourse) {
    baseRiskScore = assessTimeCourseRisk(timeCourse, detectedSeverityRaw, baseRiskScore);
    console.log(`[RISK-ADJUSTMENT] Time-course: ${timeCourse} → adjusted risk score: ${baseRiskScore}`);
  }
  
  // Use matrix triage level if available, otherwise fall back to risk-based
  let triageLevel = matrixTriageLevel || determineTriageFromRisk(baseRiskScore);
  
  // CRITICAL: Map 'pharmacy' to 'gp' (Suk AI behaves as personal AI doctor)
  // A doctor recommends: Safe (self-care), Emergency, or Consult real doctor
  if (triageLevel === 'pharmacy') {
    triageLevel = 'gp';
    console.log(`[TRIAGE-MAPPING] Mapped 'pharmacy' → 'gp' (consult doctor)`);
  }
  
  // CRITICAL: Severe + Acute = Emergency always (matrix rule)
  // BUT: Multiple exceptions that override emergency:
  // 1. If trajectory is "improving" → NOT emergency (symptoms getting better)
  // 2. If user answered "ไม่มาก" (not severe) → NOT emergency
  // 3. If severity was downgraded due to improving trajectory → NOT emergency
  // 4. If detected severity is actually medium/low (not severe) → NOT emergency
  if (severityLevel === SEVERITY_LEVELS.SEVERE && timeCourse === TIMECOURSE_TYPES.ACUTE) {
    // Exception 1: Improving trajectory → NOT emergency (HIGHEST PRIORITY CHECK)
    if (trajectory === 'improving') {
      console.log(`[MATRIX-RULE] ⚠️ Severe + Acute BUT improving trajectory → Downgrade to GP (NOT emergency)`);
      console.log(`[MATRIX-RULE] Trajectory: ${trajectory}, Severity: ${severityLevel}, TimeCourse: ${timeCourse}`);
      // Force severity to MODERATE and continue to normal triage flow
      severityLevel = SEVERITY_LEVELS.MODERATE;
      // Continue to normal triage flow (don't return emergency)
    } 
    // Exception 2: User explicitly said "ไม่มาก" (not severe) in current or previous answers → NOT emergency
    else if ((symptom && typeof symptom === 'string' && 
             (normalizeThaiText(symptom).includes('ไม่มาก') || 
              normalizeThaiText(symptom).includes('ไม่รุนแรง') ||
              normalizeThaiText(symptom).includes('เบา') ||
              normalizeThaiText(symptom).includes('นิดหน่อย'))) ||
             hasNotSevereAnswer) {
      console.log(`[MATRIX-RULE] ⚠️ Severe + Acute BUT user said "ไม่มาก/ไม่รุนแรง" → Downgrade to GP (NOT emergency)`);
      // Force severity to MODERATE and continue to normal triage flow
      severityLevel = SEVERITY_LEVELS.MODERATE;
      // Continue to normal triage flow (don't return emergency)
    }
    // Exception 3: Check if detected severity is actually medium/low (not severe) → NOT emergency
    else if (detectedSeverityRaw === 'medium' || detectedSeverityRaw === 'moderate' || detectedSeverityRaw === 'low' || detectedSeverityRaw === 'mild') {
      console.log(`[MATRIX-RULE] ⚠️ Severe + Acute BUT detected severity is ${detectedSeverityRaw} → Downgrade to GP (NOT emergency)`);
      // Force severity to match detected severity
      if (detectedSeverityRaw === 'low' || detectedSeverityRaw === 'mild') {
        severityLevel = SEVERITY_LEVELS.MILD;
      } else {
        severityLevel = SEVERITY_LEVELS.MODERATE;
      }
      // Continue to normal triage flow (don't return emergency)
    }
    // Only trigger emergency if truly severe + acute + NOT improving + user didn't say "ไม่มาก" + severity is actually severe
    else {
      console.log(`[MATRIX-RULE] ✅ Severe + Acute → Emergency (matrix rule)`);
      console.log(`[MATRIX-RULE] Trajectory: ${trajectory}, Severity: ${severityLevel}, TimeCourse: ${timeCourse}, DetectedSeverity: ${detectedSeverityRaw}`);
      return {
        needMoreInfo: false,
        nextQuestion: null,
        triageLevel: 'emergency',
        reassurance: isAnxiousUser ? getReassuranceMessage() : null,
        healthContextAnswer: enrichedAnswers.health_context,
        hypotheses: hypotheses,
        severityTrajectory: trajectory,
        timeCourse: timeCourse,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔹 STEP 3: Confidence-based Question Loop (Medical-grade)
  // ═══════════════════════════════════════════════════════════════════════════
  // CRITICAL RULE 4: If not emergency and confidence < threshold, continue asking
  // 
  // Confidence Thresholds:
  // - Low (<60): ❌ Must ask more (insufficient information)
  // - Medium (60-79): ⚠️ Ask clarifying Q (need critical info)
  // - High (80-89): ✅ Can summarize + OTC / GP
  // - Very High (≥90): 🚨 Emergency หรือ firm plan
  // 
  // Confidence calculated from:
  // - Red flags ruled out (20 points)
  // - Symptom consistency (20 points)
  // - Severity stability (20 points)
  // - Time-course clarity (20 points)
  // - Health profile context (20 points)
  // 
  // If confidence < threshold: Ask hypothesis-targeted questions
  // Never conclude prematurely (behaves like cautious real doctor)
  
  // Health context check - REMOVED per user request
  // Always treat as answered to allow flow to continue
  const hasHealthContextAnswered = true;
  
  // MEDICAL-GRADE: Calculate confidence using medical-grade formula
  // Score = Symptom clarity + Severity certainty + Time-course certainty + Red flag exclusion + Context completeness
  // ENHANCED: Also use Question Bank confidence calculator for Q3+
  let confidence = 0;
  
  if (questionCount >= 3) {
    // Use Question Bank confidence calculator
    try {
      const { calculateConfidence: calculateQuestionBankConfidence } = await import('./confidence_calculator.js');
      const { loadQuestionBank } = await import('./question_bank_loader.js');
      const questionBank = loadQuestionBank();
      
      const qbConfidence = calculateQuestionBankConfidence({
        answers: enrichedAnswers,
        questionsAsked: questionsAsked || [],
        severity: severityLevel === SEVERITY_LEVELS.MILD ? 'mild' :
                  severityLevel === SEVERITY_LEVELS.SEVERE ? 'severe' :
                  'moderate',
        timeCourse: timeCourse,
        bodyPart: enrichedAnswers.body_part_location || enrichedAnswers.body_part || null,
        questionBank: questionBank
      });
      
      // Also calculate medical-grade confidence
      const confidenceResult = calculateMedicalGradeConfidence({
        symptom: symptom,
        answers: enrichedAnswers,
        severity: severityLevel,
        timeCourse: timeCourse,
        trajectory: trajectory,
        redFlagsScreened: enrichedAnswers.redFlagScreeningPassed === true,
        healthProfile: healthProfile,
        healthContextAnswered: hasHealthContextAnswered,
        intent: intent,
      });
      
      // Blend: 60% Question Bank + 40% Medical-grade
      confidence = (qbConfidence * 100 * 0.6) + (confidenceResult.score * 0.4);
      console.log(`[CONFIDENCE] Question Bank: ${(qbConfidence * 100).toFixed(1)}%, Medical-grade: ${confidenceResult.score.toFixed(1)}% → Blended: ${confidence.toFixed(1)}%`);
    } catch (error) {
      console.warn(`[CONFIDENCE] Error using Question Bank calculator, falling back to medical-grade: ${error.message}`);
      const confidenceResult = calculateMedicalGradeConfidence({
        symptom: symptom,
        answers: enrichedAnswers,
        severity: severityLevel,
        timeCourse: timeCourse,
        trajectory: trajectory,
        redFlagsScreened: enrichedAnswers.redFlagScreeningPassed === true,
        healthProfile: healthProfile,
        healthContextAnswered: hasHealthContextAnswered,
        intent: intent,
      });
      confidence = confidenceResult.score;
    }
  } else {
    // Use medical-grade confidence for Q1-Q2
    const confidenceResult = calculateMedicalGradeConfidence({
      symptom: symptom,
      answers: enrichedAnswers,
      severity: severityLevel,
      timeCourse: timeCourse,
      trajectory: trajectory,
      redFlagsScreened: enrichedAnswers.redFlagScreeningPassed === true,
      healthProfile: healthProfile,
      healthContextAnswered: hasHealthContextAnswered,
      intent: intent,
    });
    confidence = confidenceResult.score;
  }
  
  // MEDICAL-GRADE: Blend with hypothesis confidence if available (weighted average)
  if (hypotheses && hypotheses.length > 0) {
    const topHypothesis = hypotheses.sort((a, b) => 
      (b.confidence || b.adjustedProbability || 0) - (a.confidence || a.adjustedProbability || 0)
    )[0];
    const hypothesisConfidence = (topHypothesis.confidence || topHypothesis.adjustedProbability || 0) * 100;
    
    // Blend: 70% current confidence + 30% hypothesis confidence
    confidence = (confidence * 0.7) + (hypothesisConfidence * 0.3);
    console.log(`[STEP-3-CONFIDENCE] Current: ${confidence.toFixed(1)}% + Hypothesis: ${hypothesisConfidence.toFixed(1)}% → Final: ${confidence.toFixed(1)}%`);
  }
  
  // Cap at 100
  confidence = Math.min(confidence, 100);
  
  // MEDICAL-GRADE: Get confidence threshold based on triage level (preferred) or severity level
  // Use triage level if available (more accurate), otherwise fall back to severity
  const confidenceThreshold = triageLevel 
    ? getConfidenceThreshold(triageLevel)
    : getConfidenceThreshold(severityLevel);
  console.log(`[STEP-3-CONFIDENCE-THRESHOLD] ${triageLevel ? `Triage: ${triageLevel}` : `Severity: ${severityLevel}`} → Threshold: ${confidenceThreshold}%`);

  // MANDATORY CONFIDENCE CHECK: Must ask health context before summarizing (unless emergency)
  // CRITICAL: This question MUST be asked and answered before summarizing (unless emergency)
  // This is a safety requirement - don't summarize without confirming no missing health info
  // Even if we have mandatory health data, we still need to ask this catch-all question
  // NOTE: wasAskedHealthContext, hasHealthContextAnswer, and hasHealthContextAnswered are already declared above
  
  // Health context check - REMOVED per user request
  const needsHealthContext = false;
  
  // Stop conditions (from docs):
  // - emergency detected (already handled above)
  // - gp/self_care threshold reached (clear result) BUT only after minimum 4 questions
  // - confidence ≥ 80% (clear result) BUT only after minimum 4 questions
  // PROBLEM_DRIVEN_IMPLEMENTATION.md: Must stop when we have clear triage
  // REQUIREMENT: Must ask at least 4 questions before completing (unless emergency)
  // NEW REQUIREMENT: Must be able to confidently recommend 2 OTC options (for self_care)
  
  // MEDICAL-GRADE: Use Severity × Time-course Matrix stopping criteria
  // Check if we can stop and summarize using matrix-based logic
  const differentialCount = hypotheses ? hypotheses.filter(h => (h.confidence || h.adjustedProbability || 0) > 0.1).length : null;
  const hasComorbidity = healthProfile?.chronicDiseases?.length > 0 || enrichedAnswers.chronic_disease;
  const hasRiskAge = healthProfile?.age !== null && (healthProfile.age < 2 || healthProfile.age > 65);
  const hasNewSymptoms = enrichedAnswers.new_symptoms || false;
  const redFlagsScreened = enrichedAnswers.redFlagScreeningPassed === true;
  
  const stopCheck = canStopAndSummarize({
    severity: severityLevel,
    timeCourse: timeCourse,
    trajectory: trajectory,
    redFlagsScreened: redFlagsScreened,
    differentialCount: differentialCount,
    confidence: confidence,
    hasComorbidity: hasComorbidity,
    hasRiskAge: hasRiskAge,
    hasNewSymptoms: hasNewSymptoms,
    canRecommendOTC: canRecommendOTCs(symptom, enrichedAnswers, triageLevel, healthProfile),
    healthContextAnswered: hasHealthContextAnswered,
    triageLevel: triageLevel, // Pass triage level for threshold calculation
  });
  
  if (stopCheck.canStop) {
    console.log(`[STOP-CRITERIA] ✅ Can stop and summarize: ${stopCheck.reason}`);
    const finalTriage = triageLevel === 'uncertain' && confidence >= 60 
      ? 'gp' // If uncertain but have some confidence, default to GP for safety
      : triageLevel;
    
    return {
      needMoreInfo: false,
      nextQuestion: null,
      triageLevel: finalTriage,
      reassurance: isAnxiousUser ? getReassuranceMessage() : null,
      healthContextAnswer: enrichedAnswers.health_context,
      hypotheses: hypotheses,
      severityTrajectory: trajectory,
      timeCourse: timeCourse,
    };
  } else {
    console.log(`[STOP-CRITERIA] ❌ Cannot stop yet: ${stopCheck.reason}`);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔹 STEP 4: Mandatory Health Context Check - REMOVED per user request
  // ═══════════════════════════════════════════════════════════════════════════

  // MEDICAL-GRADE: Store hypotheses in answers for information gain-driven questioning
  if (hypotheses && hypotheses.length > 0) {
    enrichedAnswers.hypotheses = hypotheses;
    console.log(`[HYPOTHESIS] Stored ${hypotheses.length} hypotheses in answers for question selection`);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔹 MASTER PROMPT: Structured 7-Step Clinical Question Flow
  // ═══════════════════════════════════════════════════════════════════════════
  // Master Prompt Implementation: Follows strict 7-step flow
  // 
  // STEP 1: Intent Lock-In (Implicit) - Already done above
  // STEP 1.5: Body-Part Clarification (MANDATORY - After First Question) - Already handled above
  // STEP 2: Red-Flag Screening (MAX 2 questions)
  // STEP 3: Severity Calibration (2-3 questions)
  // STEP 4: Time-Course Disambiguation (2-3 questions)
  // STEP 5: Hypothesis-Targeted Symptoms (2-4 questions)
  // STEP 6: Health Context Safety Check - REMOVED per user request
  // STEP 7: Confidence Calculation & Stop Rule
  //
  // Strategy:
  // 1. Try structured flow first (Master Prompt compliance)
  // 2. If structured flow doesn't provide question → Use adaptive system
  // 3. Extract context from user answers to skip redundant questions
  // 4. Vary question phrasing to avoid robotic feel
  
  let nextQuestion = null;
  let structuredQuestionData = null; // Store structured question data for UI
  
  // CRITICAL: Skip structured flow if body-part clarification should happen
  // Body-part clarification MUST happen BEFORE structured flow when questionCount === 1
  // (This check is already done above, but we need to ensure structured flow doesn't override it)
  // Re-check conditions here to ensure we don't override body-part clarification
  const isSecondQuestionCheck = questionCount === 1 && 
                                Array.isArray(questionsAsked) && 
                                questionsAsked.length === 1;
  const originalSymptomForCheck = enrichedAnswers.original_symptom || 
                                 enrichedAnswers.symptom || 
                                 (questionCount === 1 ? primarySymptom : symptom) ||
                                 primarySymptom || 
                                 normalizedSymptom;
  const shouldSkipStructuredFlowForBodyPart = isSecondQuestionCheck && 
                                             !hasBodyPartClarified(enrichedAnswers) &&
                                             baseTriageLevel !== 'emergency' &&
                                             needsBodyPartClarification(originalSymptomForCheck, intent);
  
  if (shouldSkipStructuredFlowForBodyPart) {
    console.log(`[STRUCTURED-FLOW] ⚠️ Skipping structured flow - body-part clarification should have been asked but wasn't. This should not happen!`);
  }
  
  // PRIORITY 0: Canonical Question Bank (Q3-14)
  // CRITICAL: Use Canonical Question Bank for clinically logical, non-repetitive questioning
  // This takes precedence over structured flow for Q3-14
  if (canonicalQuestion && questionCount >= 3 && questionCount <= 14) {
    const { formatQuestionAsStructured } = await import('./question_formatter.js');
    const formattedQuestion = formatQuestionAsStructured(
      canonicalQuestion.question_text_th,
      canonicalQuestion.question_id,
      language,
      questionCount, // Use actual question count as step
      canonicalQuestion.intent_type,
      false // Single select (can be enhanced later)
    );
    
    if (formattedQuestion) {
      // Override choices with Canonical Question Bank choices
      formattedQuestion.choices = canonicalQuestion.choices || formattedQuestion.choices;
      structuredQuestionData = formattedQuestion;
      nextQuestion = canonicalQuestion.question_text_th;
      
      console.log(`[CANONICAL-BANK] Using Canonical Question Bank question: "${nextQuestion.substring(0, 50)}..."`);
      console.log(`[CANONICAL-BANK] Category: ${canonicalQuestion.intent_type}, Priority: ${canonicalQuestion.priority}`);
    }
  }
  
  // PRIORITY 0: Structured 7-Step Flow (Master Prompt)
  // CRITICAL: Use structured flow to ensure Master Prompt compliance
  // BUT: Skip if Canonical Question Bank question is available OR body-part clarification is needed
  if (!canonicalQuestion && !shouldSkipStructuredFlowForBodyPart) {
    try {
      // Get session seed for variation (ensures different questions each session)
      let sessionSeed = null;
      if (sessionId) {
        const variationEngine = getSessionVariationEngine(sessionId);
        sessionSeed = variationEngine.getSessionSeed();
      } else {
        // Fallback: generate seed from symptom + time
        const symptomHash = normalizedSymptom.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        sessionSeed = Math.floor(symptomHash + Date.now() % 10000);
      }
      
      const structuredQuestion = await generateNextStructuredQuestion({
        symptom: symptom,
        intent: intent,
        questionCount: questionCount,
        questionsAsked: questionsAsked,
        answers: enrichedAnswers,
        hypotheses: hypotheses,
        language: language,
        sessionSeed: sessionSeed, // Pass session seed for variation
      });
      
      if (structuredQuestion && structuredQuestion.question) {
        nextQuestion = structuredQuestion.question;
        structuredQuestionData = structuredQuestion; // Store for UI (includes choices)
        console.log(`[STRUCTURED-FLOW] Step ${structuredQuestion.step} (${structuredQuestion.stepName}): "${nextQuestion.substring(0, 50)}..."`);
        // Note: structuredQuestion.choices contains answer choices for UI
        // The UI should use these choices instead of generating its own
      }
    } catch (error) {
      console.warn(`[STRUCTURED-FLOW] Error generating structured question: ${error.message}`);
      // Fall through to adaptive system
    }
  } else {
    console.log(`[STRUCTURED-FLOW] Skipping structured flow - body-part clarification will be asked instead`);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔹 FALLBACK: Adaptive Question Selection (If structured flow doesn't provide question)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // PRIORITY 1: Hypothesis-Driven Selection (if hypotheses available)
  // This asks questions that differentiate between possible diagnoses
  if (hypotheses && Array.isArray(hypotheses) && hypotheses.length > 0 && questionCount > 0) {
    console.log(`[HYPOTHESIS-DRIVEN] Using information gain-driven question selection (${hypotheses.length} hypotheses)`);
    
    // Collect candidate questions from priority system
    const questionPriority = getNextQuestionPriority({
      severity: severityLevel,
      timeCourse: timeCourse,
      trajectory: trajectory,
      hasDuration: !!duration || !!enrichedAnswers.duration,
      hasImpact: !!enrichedAnswers.impact || !!enrichedAnswers.functional_impact,
      hasModifiers: !!enrichedAnswers.modifiers || !!enrichedAnswers.aggravating_factors || !!enrichedAnswers.relieving_factors,
      hasContext: hasHealthContextAnswered,
      questionsAsked: questionsAsked,
      answers: enrichedAnswers,
      symptom: symptom,
      hypotheses: hypotheses, // Pass for information gain calculation
    });
    
    // Also get adaptive questions from clinical reasoning
    enrichedAnswers.healthProfile = healthProfile;
    const adaptiveQuestion = getNextQuestionAdaptive(symptom, enrichedAnswers, questionsAsked, questionCount, null);
    
    // Collect all candidate questions
    const candidateQuestions = [];
    if (questionPriority && questionPriority.question) {
      candidateQuestions.push({
        text: questionPriority.question,
        category: questionPriority.category,
        priority: questionPriority.priority,
        informationGain: questionPriority.informationGain || 0.5,
      });
    }
    if (adaptiveQuestion) {
      candidateQuestions.push({
        text: adaptiveQuestion,
        category: 'adaptive',
        priority: 2,
        informationGain: 0.4,
      });
    }
    
    // Calculate information gain for each candidate based on hypotheses
    if (candidateQuestions.length > 0) {
      const questionsWithGain = candidateQuestions.map(q => ({
        ...q,
        informationGain: calculateInformationGain(q.text, hypotheses, enrichedAnswers),
      }));
      
      // Sort by information gain (highest first)
      questionsWithGain.sort((a, b) => b.informationGain - a.informationGain);
      
      // Select top question that hasn't been asked (enhanced duplicate detection)
      for (const q of questionsWithGain) {
        const wasAsked = Array.isArray(questionsAsked) && 
          questionsAsked.some(asked => {
            if (typeof asked !== 'string' || typeof q.text !== 'string') return false;
            const normalizedAsked = normalizeThaiText(asked.toLowerCase().trim());
            const normalizedQ = normalizeThaiText(q.text.toLowerCase().trim());
            
            // Check exact match
            if (normalizedAsked === normalizedQ) return true;
            
            // Check if one contains the other (for similar questions)
            if (normalizedAsked.includes(normalizedQ) || normalizedQ.includes(normalizedAsked)) {
              // Only consider similar if both are substantial (> 15 chars)
              if (normalizedAsked.length > 15 && normalizedQ.length > 15) return true;
            }
            
            // Check first 20 characters match (for very similar questions)
            if (normalizedAsked.length > 20 && normalizedQ.length > 20) {
              if (normalizedAsked.substring(0, 20) === normalizedQ.substring(0, 20)) return true;
            }
            
            return false;
          });
        
        if (!wasAsked) {
          // Translate question if language is English
          nextQuestion = translateQuestion(q.text, language);
          
          // Convert to structured format with appropriate choices
          // Check if this question has a key in QUESTION_CATEGORIES
          let questionKey = null;
          for (const category of Object.values(QUESTION_CATEGORIES)) {
            const foundQ = category.questions?.find(catQ => catQ.text === q.text || q.text.includes(catQ.text));
            if (foundQ) {
              questionKey = foundQ.key;
              break;
            }
          }
          
          const { formatQuestionAsStructured } = await import('./question_formatter.js');
          const formattedQuestion = formatQuestionAsStructured(
            nextQuestion,
            questionKey,
            language,
            5, // Step 5 for hypothesis-driven questions
            q.category || 'hypothesis_driven',
            questionKey === 'main_symptom' || questionKey === 'associated_symptoms'
          );
          
          if (formattedQuestion) {
            structuredQuestionData = formattedQuestion;
            console.log(`[HYPOTHESIS-DRIVEN] Converted to structured format with ${formattedQuestion.choices.length} choices`);
          }
          
          console.log(`[HYPOTHESIS-DRIVEN] Selected question with highest information gain (${q.informationGain.toFixed(2)}): "${q.category}"`);
          break;
        } else {
          console.log(`[HYPOTHESIS-DRIVEN] Skipping duplicate question: "${q.text.substring(0, 50)}..."`);
        }
      }
    }
  }
  
  // PRIORITY 2: Adaptive Priority System (if no hypothesis-driven question)
  if (!nextQuestion) {
    const questionPriority = getNextQuestionPriority({
      severity: severityLevel,
      timeCourse: timeCourse,
      trajectory: trajectory,
      hasDuration: !!duration || !!enrichedAnswers.duration,
      hasImpact: !!enrichedAnswers.impact || !!enrichedAnswers.functional_impact,
      hasModifiers: !!enrichedAnswers.modifiers || !!enrichedAnswers.aggravating_factors || !!enrichedAnswers.relieving_factors,
      hasContext: hasHealthContextAnswered,
      questionsAsked: questionsAsked,
      answers: enrichedAnswers,
      symptom: symptom, // NEW: Pass symptom for context extraction
      hypotheses: hypotheses, // NEW: Pass hypotheses for information gain
    });
    
    if (questionPriority && questionPriority.question) {
      // Enhanced duplicate detection - check semantic similarity, not just substring
      const wasAskedPriority = Array.isArray(questionsAsked) && 
        questionsAsked.some(q => {
          if (typeof q !== 'string' || typeof questionPriority.question !== 'string') return false;
          const normalizedAsked = normalizeThaiText(q.toLowerCase().trim());
          const normalizedQ = normalizeThaiText(questionPriority.question.toLowerCase().trim());
          
          // Check exact match
          if (normalizedAsked === normalizedQ) return true;
          
          // Check if one contains the other (for similar questions)
          if (normalizedAsked.includes(normalizedQ) || normalizedQ.includes(normalizedAsked)) {
            // Only consider similar if both are substantial (> 15 chars)
            if (normalizedAsked.length > 15 && normalizedQ.length > 15) return true;
          }
          
          // Check first 20 characters match (for very similar questions)
          if (normalizedAsked.length > 20 && normalizedQ.length > 20) {
            if (normalizedAsked.substring(0, 20) === normalizedQ.substring(0, 20)) return true;
          }
          
          return false;
        });
      
      if (!wasAskedPriority) {
        // Translate question if language is English
        nextQuestion = translateQuestion(questionPriority.question, language);
        
        // Convert to structured format with appropriate choices
        const { formatQuestionAsStructured } = await import('./question_formatter.js');
        const formattedQuestion = formatQuestionAsStructured(
          nextQuestion,
          null, // No key available from questionPriority
          language,
          5, // Step 5 for priority questions
          questionPriority.category || 'adaptive',
          false // Default to single-select
        );
        
        if (formattedQuestion) {
          structuredQuestionData = formattedQuestion;
          console.log(`[QUESTION-PRIORITY] Converted to structured format with ${formattedQuestion.choices.length} choices`);
        }
        
        console.log(`[QUESTION-PRIORITY] Using adaptive priority ${questionPriority.priority} question: "${questionPriority.category}"`);
      } else {
        console.log(`[QUESTION-PRIORITY] Skipping duplicate question: "${questionPriority.question.substring(0, 50)}..."`);
      }
    }
  }
  
  // PRIORITY 3: Fallback to adaptive clinical reasoning
  if (!nextQuestion) {
    enrichedAnswers.healthProfile = healthProfile;
    const sessionHistory = null; // Can be enhanced to load from database
    
    const adaptiveQuestion = getNextQuestionAdaptive(symptom, enrichedAnswers, questionsAsked, questionCount, sessionHistory);
    
    if (adaptiveQuestion) {
      // Translate question if language is English
      nextQuestion = translateQuestion(adaptiveQuestion, language);
      
      // Convert to structured format with appropriate choices
      // CRITICAL: Extract questionKey from OTC clarifying questions FIRST
      // This ensures proper choice generation for main_symptom questions
      const otcQuestion = QUESTION_CATEGORIES.otc_clarifying?.questions?.find(q => {
        // Try exact match first
        if (q.text === adaptiveQuestion) return true;
        // Try substring match (question contains the text)
        if (adaptiveQuestion.includes(q.text)) return true;
        // Try reverse match (text contains question - for partial matches)
        if (q.text.includes(adaptiveQuestion.split('?')[0])) return true;
        return false;
      });
      let questionKey = otcQuestion?.key || null;
      
      // Also check other categories if not found
      if (!questionKey) {
        for (const category of Object.values(QUESTION_CATEGORIES)) {
          const foundQ = category.questions?.find(catQ => {
            if (catQ.text === adaptiveQuestion) return true;
            if (adaptiveQuestion.includes(catQ.text)) return true;
            if (catQ.text.includes(adaptiveQuestion.split('?')[0])) return true;
            return false;
          });
          if (foundQ) {
            questionKey = foundQ.key;
            break;
          }
        }
      }
      
      // CRITICAL: If question contains "อาการหลัก" or "main symptom", force questionKey to 'main_symptom'
      if (!questionKey && (nextQuestion.includes('อาการหลัก') || nextQuestion.includes('main symptom'))) {
        questionKey = 'main_symptom';
        console.log(`[QUESTION-KEY] Detected main_symptom question, setting questionKey: ${questionKey}`);
      }
      
      // Import formatQuestionAsStructured
      const { formatQuestionAsStructured } = await import('./question_formatter.js');
      const formattedQuestion = formatQuestionAsStructured(
        nextQuestion,
        questionKey, // CRITICAL: Pass questionKey for proper choice generation
        language,
        5, // Step 5 for adaptive questions
        'adaptive',
        questionKey === 'main_symptom' || questionKey === 'associated_symptoms' // Multi-select for symptom selection
      );
      
      if (formattedQuestion && questionKey === 'main_symptom') {
        console.log(`[QUESTION-FORMATTER] main_symptom question formatted with ${formattedQuestion.choices.length} choices:`, formattedQuestion.choices);
      }
      
      if (formattedQuestion) {
        structuredQuestionData = formattedQuestion;
        console.log(`[ADAPTIVE-FALLBACK] Converted to structured format with ${formattedQuestion.choices.length} choices, allowMultiSelect: ${formattedQuestion.allowMultiSelect}`);
      }
      
      console.log(`[ADAPTIVE-FALLBACK] Using adaptive clinical reasoning question`);
    }
  }
  
  // CRITICAL: Emergency cases must stop at ≤3 questions (per SUK_AI_ASSESSMENT_FLOW.md)
  // If emergency is detected after question 1, we already returned above
  // But if emergency is detected later, ensure we stop immediately
  if (triageLevel === 'emergency' && questionCount >= 3) {
    console.log(`[EMERGENCY-STOP] Emergency detected at question ${questionCount} - stopping immediately (max 3 questions)`);
    return {
      needMoreInfo: false,
      nextQuestion: null,
      triageLevel: 'emergency',
      reassurance: isAnxiousUser ? getReassuranceMessage() : null,
      healthContextAnswer: enrichedAnswers.health_context,
      hypotheses: hypotheses,
      severityTrajectory: trajectory,
      timeCourse: timeCourse,
      structuredQuestion: structuredQuestionData, // Include for consistency
    };
  }

  // CRITICAL: If no new question found (all similar questions already asked), proceed to summary
  if (!nextQuestion && questionCount >= 3) {
    console.log(`[NO-NEW-QUESTIONS] All relevant questions already asked (${questionCount} questions). Proceeding to summary.`);
    return {
      needMoreInfo: false,
      nextQuestion: null,
      triageLevel: triageLevel === 'uncertain' ? 'gp' : triageLevel,
      reassurance: isAnxiousUser ? getReassuranceMessage() : null,
      healthContextAnswer: enrichedAnswers.health_context,
      hypotheses: hypotheses,
      severityTrajectory: trajectory,
      timeCourse: timeCourse,
    };
  }

  // Add reassurance if user is anxious
  let questionWithReassurance = nextQuestion;
  if (isAnxiousUser && nextQuestion) {
    questionWithReassurance = `${getReassuranceMessage()}\n\n${nextQuestion}`;
  }

  // Translate question if language is English
  const translatedQuestion = questionWithReassurance 
    ? translateQuestion(questionWithReassurance, language)
    : null;

  return {
    needMoreInfo: nextQuestion !== null,
    nextQuestion: translatedQuestion, // Return translated question
    triageLevel: triageLevel === 'uncertain' ? 'uncertain' : triageLevel,
    reassurance: isAnxiousUser ? getReassuranceMessage() : null,
    healthContextAnswer: enrichedAnswers.health_context, // Pass health_context answer back to session
    hypotheses: hypotheses, // Pass hypotheses for diagnosis generation
    severityTrajectory: trajectory, // Pass trajectory for diagnosis
    timeCourse: timeCourse, // Pass time-course for diagnosis
    confidence: Math.round(confidence), // Pass confidence score for metrics
    // Include structured question data for UI (contains choices, step, stepName, allowMultiSelect)
    // UI should use structuredQuestion.choices to display answer buttons
    structuredQuestion: structuredQuestionData,
  };
}
