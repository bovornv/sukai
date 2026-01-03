/**
 * Performance Metrics Service
 * Tracks question count statistics and performance metrics
 * Target: 7-12 questions for non-emergency cases
 * Target: ≤3 questions for emergency cases
 */

import { supabaseAdmin } from '../../config/supabase.js';

/**
 * Record performance metrics when a session completes
 * @param {Object} sessionData - Session data including question_count, triage_level, etc.
 */
export async function recordSessionMetrics(sessionData) {
  const {
    sessionId,
    questionCount,
    triageLevel,
    confidence,
    userId,
    completedAt = new Date(),
  } = sessionData;

  try {
    // Log metrics for monitoring
    const isEmergency = triageLevel === 'emergency';
    const isWithinTarget = isEmergency 
      ? questionCount <= 3 
      : questionCount >= 7 && questionCount <= 12;

    console.log(`[PERFORMANCE-METRICS] Session ${sessionId}:`);
    console.log(`  - Question Count: ${questionCount}`);
    console.log(`  - Triage Level: ${triageLevel}`);
    console.log(`  - Confidence: ${confidence || 'N/A'}%`);
    console.log(`  - Target Met: ${isWithinTarget ? '✅' : '⚠️'}`);
    console.log(`  - Expected: ${isEmergency ? '≤3' : '7-12'} questions`);

    // Store metrics in triage_sessions table (already has question_count)
    // Additional metrics can be stored in a separate analytics table if needed
    // For now, we'll use the existing triage_sessions table and create views/queries

    return {
      success: true,
      questionCount,
      triageLevel,
      isWithinTarget,
      expectedRange: isEmergency ? '≤3' : '7-12',
    };
  } catch (error) {
    console.error('[PERFORMANCE-METRICS] Error recording metrics:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get performance statistics for a date range
 * @param {Object} options - Query options
 * @param {Date} options.startDate - Start date (default: 7 days ago)
 * @param {Date} options.endDate - End date (default: now)
 * @param {string} options.triageLevel - Filter by triage level (optional)
 * @returns {Object} Performance statistics
 */
export async function getPerformanceStats({
  startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  endDate = new Date(),
  triageLevel = null,
} = {}) {
  try {
    let query = supabaseAdmin
      .from('triage_sessions')
      .select('question_count, triage_level, confidence, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('question_count', 'is', null);

    if (triageLevel) {
      query = query.eq('triage_level', triageLevel);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        totalSessions: 0,
        averageQuestionCount: 0,
        emergencyAverage: 0,
        nonEmergencyAverage: 0,
        targetMetRate: 0,
        distribution: {},
      };
    }

    // Calculate statistics
    const emergencySessions = data.filter(s => s.triage_level === 'emergency');
    const nonEmergencySessions = data.filter(s => s.triage_level !== 'emergency');

    const emergencyQuestionCounts = emergencySessions.map(s => s.question_count || 0);
    const nonEmergencyQuestionCounts = nonEmergencySessions.map(s => s.question_count || 0);

    const emergencyAvg = emergencyQuestionCounts.length > 0
      ? emergencyQuestionCounts.reduce((a, b) => a + b, 0) / emergencyQuestionCounts.length
      : 0;

    const nonEmergencyAvg = nonEmergencyQuestionCounts.length > 0
      ? nonEmergencyQuestionCounts.reduce((a, b) => a + b, 0) / nonEmergencyQuestionCounts.length
      : 0;

    const overallAvg = data.length > 0
      ? data.reduce((sum, s) => sum + (s.question_count || 0), 0) / data.length
      : 0;

    // Calculate target met rate
    const emergencyTargetMet = emergencySessions.filter(s => (s.question_count || 0) <= 3).length;
    const nonEmergencyTargetMet = nonEmergencySessions.filter(s => {
      const count = s.question_count || 0;
      return count >= 7 && count <= 12;
    }).length;

    const totalTargetMet = emergencyTargetMet + nonEmergencyTargetMet;
    const targetMetRate = data.length > 0 ? (totalTargetMet / data.length) * 100 : 0;

    // Question count distribution
    const distribution = {};
    data.forEach(session => {
      const count = session.question_count || 0;
      const range = getQuestionCountRange(count);
      distribution[range] = (distribution[range] || 0) + 1;
    });

    return {
      totalSessions: data.length,
      emergencySessions: emergencySessions.length,
      nonEmergencySessions: nonEmergencySessions.length,
      averageQuestionCount: Math.round(overallAvg * 10) / 10,
      emergencyAverage: Math.round(emergencyAvg * 10) / 10,
      nonEmergencyAverage: Math.round(nonEmergencyAvg * 10) / 10,
      targetMetRate: Math.round(targetMetRate * 10) / 10,
      emergencyTargetMetRate: emergencySessions.length > 0
        ? Math.round((emergencyTargetMet / emergencySessions.length) * 100 * 10) / 10
        : 0,
      nonEmergencyTargetMetRate: nonEmergencySessions.length > 0
        ? Math.round((nonEmergencyTargetMet / nonEmergencySessions.length) * 100 * 10) / 10
        : 0,
      distribution,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  } catch (error) {
    console.error('[PERFORMANCE-METRICS] Error getting stats:', error);
    throw error;
  }
}

/**
 * Get question count range label
 * @param {number} count - Question count
 * @returns {string} Range label
 */
function getQuestionCountRange(count) {
  if (count <= 3) return '1-3';
  if (count <= 6) return '4-6';
  if (count <= 9) return '7-9';
  if (count <= 12) return '10-12';
  if (count <= 15) return '13-15';
  return '16+';
}

/**
 * Check if performance metrics are within acceptable ranges
 * @param {Object} stats - Performance statistics
 * @returns {Object} Health check results
 */
export function checkPerformanceHealth(stats) {
  const warnings = [];
  const alerts = [];

  // Check emergency question count
  if (stats.emergencyAverage > 3) {
    alerts.push({
      type: 'emergency_question_count',
      message: `Emergency cases averaging ${stats.emergencyAverage} questions (target: ≤3)`,
      severity: 'high',
    });
  }

  // Check non-emergency question count
  if (stats.nonEmergencyAverage < 7) {
    warnings.push({
      type: 'non_emergency_too_few',
      message: `Non-emergency cases averaging ${stats.nonEmergencyAverage} questions (target: 7-12)`,
      severity: 'medium',
    });
  } else if (stats.nonEmergencyAverage > 12) {
    warnings.push({
      type: 'non_emergency_too_many',
      message: `Non-emergency cases averaging ${stats.nonEmergencyAverage} questions (target: 7-12)`,
      severity: 'medium',
    });
  }

  // Check target met rate
  if (stats.targetMetRate < 70) {
    warnings.push({
      type: 'low_target_met_rate',
      message: `Only ${stats.targetMetRate}% of sessions meet target question counts`,
      severity: 'medium',
    });
  }

  return {
    healthy: alerts.length === 0 && warnings.length === 0,
    warnings,
    alerts,
    stats,
  };
}
