/**
 * Notification Scheduler Service
 * Handles scheduling and managing follow-up notifications (24-48 hours)
 * 
 * Features:
 * - Schedule notifications when assessment is saved
 * - Check for pending notifications
 * - Handle notification responses
 * - Update confidence model based on responses
 */

import { supabaseAdmin } from '../config/supabase.js';

/**
 * Schedule follow-up notifications for a session
 * Creates 24h and 48h notifications (and safety variant if needed)
 * 
 * @param {string} sessionId - Triage session ID
 * @param {string} userId - User ID
 * @param {string} symptom - Symptom text
 * @param {boolean} hasRedFlags - Whether session had red flags
 * @returns {Promise<boolean>} Success status
 */
export async function scheduleFollowupNotifications(sessionId, userId, symptom, hasRedFlags = false) {
  try {
    const now = new Date();
    
    // Calculate scheduled times
    const scheduled24h = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const scheduled48h = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
    
    // Determine notification types
    const type24h = hasRedFlags ? 'safety' : '24h';
    const type48h = hasRedFlags ? 'safety' : '48h';
    
    // Insert notifications
    const notifications = [
      {
        session_id: sessionId,
        user_id: userId || null,
        notification_type: type24h,
        scheduled_at: scheduled24h.toISOString(),
        symptom: symptom,
        has_red_flags: hasRedFlags,
      },
      {
        session_id: sessionId,
        user_id: userId || null,
        notification_type: type48h,
        scheduled_at: scheduled48h.toISOString(),
        symptom: symptom,
        has_red_flags: hasRedFlags,
      },
    ];
    
    const { data, error } = await supabaseAdmin
      .from('followup_notifications')
      .insert(notifications)
      .select();
    
    if (error) {
      console.error('Error scheduling notifications:', error);
      return false;
    }
    
    console.log(`✅ Scheduled ${notifications.length} notifications for session ${sessionId}`);
    return true;
  } catch (err) {
    console.error('Error in scheduleFollowupNotifications:', err);
    return false;
  }
}

/**
 * Get pending notifications ready to send
 * Returns notifications where scheduled_at <= now and not yet sent
 * 
 * @param {number} limit - Maximum number of notifications to return
 * @returns {Promise<Array>} Array of pending notifications
 */
export async function getPendingNotifications(limit = 100) {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabaseAdmin
      .from('followup_notifications')
      .select('*')
      .lte('scheduled_at', now)
      .is('sent_at', null)
      .eq('dismissed', false)
      .order('scheduled_at', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching pending notifications:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Error in getPendingNotifications:', err);
    return [];
  }
}

/**
 * Mark notification as sent
 * 
 * @param {string} notificationId - Notification ID
 * @returns {Promise<boolean>} Success status
 */
export async function markNotificationSent(notificationId) {
  try {
    const { error } = await supabaseAdmin
      .from('followup_notifications')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', notificationId);
    
    if (error) {
      console.error('Error marking notification as sent:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error in markNotificationSent:', err);
    return false;
  }
}

/**
 * Record notification response
 * Updates notification with user response and updates confidence model
 * 
 * @param {string} notificationId - Notification ID
 * @param {string} response - User response ('improved', 'same', 'worse', 'unsure', 'skip')
 * @returns {Promise<boolean>} Success status
 */
export async function recordNotificationResponse(notificationId, response) {
  try {
    // Get notification to find session_id
    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('followup_notifications')
      .select('session_id, notification_type')
      .eq('id', notificationId)
      .single();
    
    if (fetchError || !notification) {
      console.error('Notification not found:', notificationId);
      return false;
    }
    
    // Update notification
    const { error: updateError } = await supabaseAdmin
      .from('followup_notifications')
      .update({
        response: response,
        responded_at: new Date().toISOString(),
      })
      .eq('id', notificationId);
    
    if (updateError) {
      console.error('Error recording notification response:', updateError);
      return false;
    }
    
    // Calculate confidence delta based on response
    const confidenceDelta = calculateResponseConfidenceDelta(response);
    
    // Update session confidence (if not 'skip')
    if (response !== 'skip' && confidenceDelta !== 0) {
      await updateSessionConfidenceFromResponse(notification.session_id, confidenceDelta);
    }
    
    console.log(`✅ Recorded notification response: ${response} (delta: ${confidenceDelta})`);
    return true;
  } catch (err) {
    console.error('Error in recordNotificationResponse:', err);
    return false;
  }
}

/**
 * Calculate confidence delta from notification response
 * 
 * @param {string} response - User response
 * @returns {number} Confidence delta (-1.0 to +1.0)
 */
function calculateResponseConfidenceDelta(response) {
  switch (response) {
    case 'improved':
      return 0.15; // Positive signal
    case 'same':
      return 0.05; // Neutral, slight positive
    case 'worse':
      return -0.20; // Trigger reassessment
    case 'unsure':
      return 0.00; // No change
    case 'skip':
      return 0.00; // No penalty
    default:
      return 0.00;
  }
}

/**
 * Update session confidence based on notification response
 * 
 * @param {string} sessionId - Session ID
 * @param {number} confidenceDelta - Confidence adjustment
 */
async function updateSessionConfidenceFromResponse(sessionId, confidenceDelta) {
  try {
    // Get current session confidence
    const { data: session, error: fetchError } = await supabaseAdmin
      .from('triage_sessions')
      .select('confidence')
      .eq('session_id', sessionId)
      .single();
    
    if (fetchError || !session) {
      console.warn(`Session not found for confidence update: ${sessionId}`);
      return;
    }
    
    // Calculate new confidence (0-100 scale)
    const currentConfidence = session.confidence || 0;
    const newConfidence = Math.max(0, Math.min(100, currentConfidence + (confidenceDelta * 100)));
    
    // Update session
    const { error: updateError } = await supabaseAdmin
      .from('triage_sessions')
      .update({
        confidence: Math.round(newConfidence),
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId);
    
    if (updateError) {
      console.error('Error updating session confidence:', updateError);
    } else {
      console.log(`Updated confidence: ${currentConfidence} → ${Math.round(newConfidence)} (delta: ${(confidenceDelta * 100).toFixed(1)}%)`);
    }
  } catch (err) {
    console.error('Error in updateSessionConfidenceFromResponse:', err);
  }
}

/**
 * Dismiss notification (user skipped)
 * 
 * @param {string} notificationId - Notification ID
 * @returns {Promise<boolean>} Success status
 */
export async function dismissNotification(notificationId) {
  try {
    const { error } = await supabaseAdmin
      .from('followup_notifications')
      .update({ dismissed: true })
      .eq('id', notificationId);
    
    if (error) {
      console.error('Error dismissing notification:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error in dismissNotification:', err);
    return false;
  }
}

/**
 * Get user's pending notifications
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of pending notifications
 */
export async function getUserPendingNotifications(userId) {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabaseAdmin
      .from('followup_notifications')
      .select('*')
      .eq('user_id', userId)
      .lte('scheduled_at', now)
      .is('sent_at', null)
      .eq('dismissed', false)
      .order('scheduled_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Error in getUserPendingNotifications:', err);
    return [];
  }
}

