/**
 * Medical-Grade Clinical Reasoning Engine
 * Implements hypothesis-driven questioning with information gain
 * Based on Ada Health / NHS / ER decision support systems
 * 
 * Key principles:
 * 1. Symptom → Hypothesis Map (3-7 differential diagnoses)
 * 2. Information Gain-driven Questioning
 * 3. Bayesian Confidence Updating
 * 4. Severity Trajectory & Time-Course Logic
 */

import { getHypotheses, calculateInformationGain } from './hypothesis_map.js';
import { detectSeverityTrajectory, classifyTimeCourse, extractDuration } from './thai_normalizer.js';
import { normalizeThaiText } from './thai_normalizer.js';

/**
 * Update hypothesis confidence scores using Bayesian updating
 * After each answer, update probabilities based on evidence
 */
export function updateHypothesisConfidence(hypotheses, answer, question, answers = {}) {
  const normalizedAnswer = normalizeThaiText(answer).toLowerCase();
  const normalizedQuestion = normalizeThaiText(question).toLowerCase();
  
  return hypotheses.map(h => {
    let confidence = h.adjustedProbability || h.priorProbability;
    
    // Check if answer supports key features
    h.keyFeatures.forEach(feature => {
      const featureNorm = feature.toLowerCase();
      if (normalizedAnswer.includes(featureNorm) || normalizedQuestion.includes(featureNorm)) {
        // Increase confidence if answer matches key feature
        confidence *= 1.3; // 30% boost
      }
    });
    
    // Check if answer matches exclusion features
    h.exclusionFeatures.forEach(feature => {
      const featureNorm = feature.toLowerCase();
      if (normalizedAnswer.includes(featureNorm) || normalizedQuestion.includes(featureNorm)) {
        // Decrease confidence if answer matches exclusion feature
        confidence *= 0.5; // 50% reduction
      }
    });
    
    // Time-course matching
    const timeCourse = classifyTimeCourse(
      answers.duration ? parseInt(answers.duration) : null,
      detectSeverityTrajectory(answer),
      answers
    );
    
    if (timeCourse && h.timeCourse && h.timeCourse.includes(timeCourse)) {
      confidence *= 1.2; // 20% boost for matching time-course
    } else if (timeCourse && h.timeCourse && h.timeCourse.length > 0 && !h.timeCourse.includes(timeCourse)) {
      confidence *= 0.7; // 30% reduction for mismatched time-course
    }
    
    // Normalize to prevent overflow
    confidence = Math.max(0, Math.min(1, confidence));
    
    return {
      ...h,
      confidence: confidence,
    };
  });
}

/**
 * Normalize hypothesis confidences to sum to 1
 */
export function normalizeConfidences(hypotheses) {
  const total = hypotheses.reduce((sum, h) => sum + (h.confidence || h.adjustedProbability || 0), 0);
  if (total === 0) return hypotheses;
  
  return hypotheses.map(h => ({
    ...h,
    confidence: (h.confidence || h.adjustedProbability || 0) / total,
  }));
}

/**
 * Select next question based on information gain
 * Returns question with highest information gain that hasn't been asked
 */
export function selectQuestionByInformationGain(
  availableQuestions,
  hypotheses,
  questionsAsked,
  answers = {}
) {
  if (!availableQuestions || availableQuestions.length === 0) {
    return null;
  }
  
  // Filter out already asked questions
  const unaskedQuestions = availableQuestions.filter(q => {
    const questionText = typeof q === 'string' ? q : q.text;
    return !questionsAsked.some(asked => {
      const askedNorm = normalizeThaiText(asked).toLowerCase();
      const qNorm = normalizeThaiText(questionText).toLowerCase();
      return askedNorm.includes(qNorm.substring(0, 10)) || qNorm.includes(askedNorm.substring(0, 10));
    });
  });
  
  if (unaskedQuestions.length === 0) {
    return null;
  }
  
  // Calculate information gain for each question
  const questionsWithGain = unaskedQuestions.map(q => {
    const questionText = typeof q === 'string' ? q : q.text;
    const gain = calculateInformationGain(questionText, hypotheses, answers);
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
  return typeof bestQuestion.question === 'string' ? bestQuestion.question : bestQuestion.question.text;
}

/**
 * Check if we have sufficient confidence to conclude
 * Returns true if top hypothesis has confidence >= threshold
 */
export function hasSufficientConfidence(hypotheses, threshold = 0.70) {
  if (!hypotheses || hypotheses.length === 0) return false;
  
  const sortedHypotheses = [...hypotheses].sort((a, b) => 
    (b.confidence || b.adjustedProbability || 0) - (a.confidence || a.adjustedProbability || 0)
  );
  
  const topConfidence = sortedHypotheses[0].confidence || sortedHypotheses[0].adjustedProbability || 0;
  return topConfidence >= threshold;
}

/**
 * Get top hypotheses (for diagnosis explanation)
 */
export function getTopHypotheses(hypotheses, count = 3) {
  if (!hypotheses || hypotheses.length === 0) return [];
  
  const sorted = [...hypotheses].sort((a, b) => 
    (b.confidence || b.adjustedProbability || 0) - (a.confidence || a.adjustedProbability || 0)
  );
  
  return sorted.slice(0, count);
}

/**
 * Assess severity trajectory impact on risk
 * Medical-grade: Worsening symptoms increase risk even if current severity is low
 */
export function assessTrajectoryRisk(trajectory, currentSeverity, baseRiskScore) {
  if (trajectory === 'worsening') {
    // Worsening trajectory significantly increases risk
    return baseRiskScore + 15;
  } else if (trajectory === 'improving') {
    // Improving trajectory decreases risk slightly
    return Math.max(0, baseRiskScore - 5);
  } else if (trajectory === 'stable') {
    // Stable trajectory: no change
    return baseRiskScore;
  }
  
  return baseRiskScore;
}

/**
 * Assess time-course impact on triage decision
 * Medical-grade: Acute + severe or Progressive symptoms need urgent attention
 */
export function assessTimeCourseRisk(timeCourse, severity, baseRiskScore) {
  if (timeCourse === 'acute' && severity === 'high') {
    // Acute + severe = high risk
    return baseRiskScore + 20;
  } else if (timeCourse === 'progressive') {
    // Progressive symptoms = increasing risk
    return baseRiskScore + 15;
  } else if (timeCourse === 'chronic' && severity === 'low') {
    // Chronic + low severity = lower risk
    return Math.max(0, baseRiskScore - 5);
  }
  
  return baseRiskScore;
}
