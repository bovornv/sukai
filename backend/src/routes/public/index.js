/**
 * PUBLIC API Routes
 * 
 * These endpoints are:
 * - Browser-safe (CORS enabled)
 * - User-authenticated (via x-user-id header)
 * - Proxy to PRIVATE APIs internally (direct function calls)
 * - Sanitized responses (no internal logic exposed)
 * 
 * Architecture:
 * Browser → /api/public/* → Direct call to private functions → Response
 * 
 * This ensures:
 * - Browser never calls /api/private/* directly
 * - Medical logic stays internal
 * - CORS only enabled on public endpoints
 * - No HTTP overhead for internal calls
 */

import express from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { optionalAuth } from '../../middleware/auth.js';

// Import private route handlers directly (server-to-server, no HTTP)
import { assessSymptom, getDiagnosis } from '../../functions/triage/index.js';
import { validateTriageAssess } from '../../middleware/validation.js';
import { supabaseAdmin } from '../../config/supabase.js';
import {
  getUserPendingNotifications,
  recordNotificationResponse,
} from '../../services/notification_scheduler.js';

const router = express.Router();

/**
 * POST /api/public/triage/assess
 * Submit symptom assessment
 * Browser-safe endpoint that calls private functions directly
 */
router.post('/triage/assess', optionalAuth, validateTriageAssess, asyncHandler(async (req, res) => {
  const userId = req.userId || req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide x-user-id header',
    });
  }
  
  const { session_id, symptom, previous_answers, language } = req.body;
  const lang = req.headers['x-language'] || language || 'th';
  
  // Direct call to private function (server-to-server, no HTTP)
  const result = await assessSymptom({
    sessionId: session_id,
    symptom,
    previousAnswers: previous_answers || {},
    userId: userId, // Always authenticated
    language: lang,
  });
  
  res.json(result);
}));

/**
 * GET /api/public/triage/diagnosis
 * Get diagnosis and recommendations
 * Browser-safe endpoint that calls private functions directly
 */
router.get('/triage/diagnosis', optionalAuth, asyncHandler(async (req, res) => {
  const userId = req.userId || req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide x-user-id header',
    });
  }
  
  const { session_id, language } = req.query;
  const lang = req.headers['x-language'] || language || 'th';
  
  if (!session_id) {
    return res.status(400).json({
      error: 'session_id is required',
    });
  }
  
  // Direct call to private function (server-to-server, no HTTP)
  const result = await getDiagnosis({
    sessionId: session_id,
    userId: userId, // Always authenticated
    language: lang,
  });
  
  res.json(result);
}));

/**
 * GET /api/public/triage/sessions
 * Get user's past triage sessions
 * Browser-safe endpoint that calls private functions directly
 */
router.get('/triage/sessions', optionalAuth, asyncHandler(async (req, res) => {
  const userId = req.userId || req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide x-user-id header',
    });
  }
  
  // Direct call to database (same as private route)
  const { data, error } = await supabaseAdmin
    .from('triage_sessions')
    .select('session_id, created_at, updated_at, triage_level, symptoms')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
  }
  
  res.json({ sessions: data || [] });
}));

/**
 * GET /api/public/notifications/user
 * Get user's pending notifications
 * Browser-safe endpoint that calls private functions directly
 */
router.get('/notifications/user', optionalAuth, asyncHandler(async (req, res) => {
  const userId = req.userId || req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide x-user-id header',
    });
  }
  
  // Direct call to private function (server-to-server, no HTTP)
  const notifications = await getUserPendingNotifications(userId);
  
  res.json({
    success: true,
    notifications: notifications,
    count: notifications.length,
  });
}));

/**
 * POST /api/public/notifications/:id/respond
 * Record user response to notification
 * Browser-safe endpoint that calls private functions directly
 */
router.post('/notifications/:id/respond', optionalAuth, asyncHandler(async (req, res) => {
  const userId = req.userId || req.headers['x-user-id'];
  const { id } = req.params;
  const { response } = req.body;
  
  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide x-user-id header',
    });
  }
  
  if (!response) {
    return res.status(400).json({ 
      error: 'response is required' 
    });
  }
  
  const validResponses = ['improved', 'same', 'worse', 'unsure', 'skip', 'reassess', 'doctor'];
  if (!validResponses.includes(response)) {
    return res.status(400).json({ 
      error: `Invalid response. Must be one of: ${validResponses.join(', ')}` 
    });
  }
  
  // Direct call to private function (server-to-server, no HTTP)
  const success = await recordNotificationResponse(id, response);
  
  if (!success) {
    return res.status(500).json({ 
      error: 'Failed to record response' 
    });
  }
  
  res.json({ 
    success: true,
    message: 'Response recorded successfully' 
  });
}));

/**
 * POST /api/public/followup/checkin
 * Submit follow-up check-in
 * Browser-safe endpoint that calls private functions directly
 */
router.post('/followup/checkin', optionalAuth, asyncHandler(async (req, res) => {
  const userId = req.userId || req.headers['x-user-id'];
  const { session_id, status, actions_taken, next_intent, notes } = req.body;
  
  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide x-user-id header',
    });
  }
  
  if (!session_id || !status) {
    return res.status(400).json({ error: 'session_id and status are required' });
  }
  
  if (!['better', 'same', 'worse', 'unsure'].includes(status)) {
    return res.status(400).json({ error: 'status must be: better, same, worse, or unsure' });
  }

  const validActions = ['home_care', 'medication', 'doctor', 'emergency', 'nothing'];
  if (actions_taken && Array.isArray(actions_taken)) {
    const invalidActions = actions_taken.filter(a => !validActions.includes(a));
    if (invalidActions.length > 0) {
      return res.status(400).json({ 
        error: `Invalid actions: ${invalidActions.join(', ')}. Valid actions are: ${validActions.join(', ')}` 
      });
    }
  }

  const validIntents = ['recheck', 'medication', 'previous', 'nothing'];
  if (next_intent && !validIntents.includes(next_intent)) {
    return res.status(400).json({ 
      error: `Invalid next_intent: ${next_intent}. Valid intents are: ${validIntents.join(', ')}` 
    });
  }

  // Calculate confidence delta (same logic as private route)
  function calculateConfidenceDelta(status, actionsTaken = []) {
    let delta = 0;
    switch (status) {
      case 'better': delta += 0.15; break;
      case 'same': delta += 0.05; break;
      case 'worse': delta -= 0.20; break;
      case 'unsure': delta += 0.00; break;
    }
    actionsTaken.forEach(action => {
      switch (action) {
        case 'medication': delta += 0.10; break;
        case 'home_care': delta += 0.05; break;
        case 'doctor': delta += 0.20; break;
        case 'nothing': delta += 0.00; break;
      }
    });
    return Math.max(-1.0, Math.min(1.0, delta));
  }

  const confidenceDelta = calculateConfidenceDelta(status, actions_taken || []);
  
  // Direct database call (same as private route)
  const { data, error } = await supabaseAdmin
    .from('followup_checkins')
    .insert({
      session_id: session_id,
      user_id: userId,
      status: status,
      actions_taken: actions_taken || [],
      next_intent: next_intent || null,
      notes: notes || null,
      confidence_delta: confidenceDelta,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving follow-up check-in:', error);
    return res.status(500).json({ 
      error: 'Failed to save check-in', 
      details: error.message 
    });
  }

  // Update session confidence (same logic as private route)
  try {
    const { data: session } = await supabaseAdmin
      .from('triage_sessions')
      .select('confidence')
      .eq('session_id', session_id)
      .single();

    if (session) {
      const currentConfidence = session.confidence || 0;
      const newConfidence = Math.max(0, Math.min(100, currentConfidence + (confidenceDelta * 100)));
      
      await supabaseAdmin
        .from('triage_sessions')
        .update({ 
          confidence: Math.round(newConfidence),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', session_id);
    }
  } catch (err) {
    console.error('Error updating session confidence:', err);
  }
  
  res.json({ 
    success: true, 
    checkin: data,
    confidence_delta: confidenceDelta 
  });
}));

/**
 * GET /api/public/followup/checkins
 * Get follow-up check-ins for a session
 * Browser-safe endpoint that calls private functions directly
 */
router.get('/followup/checkins', optionalAuth, asyncHandler(async (req, res) => {
  const userId = req.userId || req.headers['x-user-id'];
  const { session_id } = req.query;
  
  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide x-user-id header',
    });
  }
  
  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }
  
  // Direct database call (same as private route)
  const { data, error } = await supabaseAdmin
    .from('followup_checkins')
    .select('*')
    .eq('session_id', session_id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching check-ins:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch check-ins', 
      details: error.message 
    });
  }
  
  res.json({ checkins: data || [] });
}));

/**
 * GET /api/public/health-info
 * Get general health information (public, no auth required)
 */
router.get('/health-info', (req, res) => {
  res.json({
    message: 'Public health information endpoint',
    note: 'This endpoint provides general health information without user data',
  });
});

/**
 * GET /api/public/symptom-taxonomy
 * Get symptom taxonomy/intent list (public, no auth required)
 */
router.get('/symptom-taxonomy', (req, res) => {
  res.json({
    message: 'Symptom taxonomy endpoint',
    note: 'This will return public symptom taxonomy for autocomplete',
  });
});

/**
 * POST /api/public/device-tokens/register
 * Register or update a device token for push notifications
 * Browser-safe endpoint that calls private functions directly
 */
router.post('/device-tokens/register', optionalAuth, asyncHandler(async (req, res) => {
  const userId = req.userId || req.headers['x-user-id'];
  const { token, platform, app_version } = req.body;
  
  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide x-user-id header',
    });
  }
  
  if (!token) {
    return res.status(400).json({ 
      error: 'token is required' 
    });
  }
  
  const validPlatforms = ['ios', 'android', 'web'];
  if (platform && !validPlatforms.includes(platform)) {
    return res.status(400).json({ 
      error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` 
    });
  }
  
  // Direct database call (same as private route)
  try {
    const { data: existing } = await supabaseAdmin
      .from('device_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('token', token)
      .single();
    
    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from('device_tokens')
        .update({
          active: true,
          platform: platform || null,
          app_version: app_version || null,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      
      if (updateError) {
        throw updateError;
      }
      
      return res.json({
        success: true,
        message: 'Device token updated',
        token_id: existing.id,
      });
    } else {
      const { data, error } = await supabaseAdmin
        .from('device_tokens')
        .insert({
          user_id: userId,
          token: token,
          platform: platform || null,
          app_version: app_version || null,
          active: true,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return res.json({
        success: true,
        message: 'Device token registered',
        token_id: data.id,
      });
    }
  } catch (err) {
    console.error('Error registering device token:', err);
    return res.status(500).json({ 
      error: 'Failed to register device token',
      details: err.message 
    });
  }
}));

/**
 * DELETE /api/public/device-tokens/:token
 * Unregister a device token
 * Browser-safe endpoint that calls private functions directly
 */
router.delete('/device-tokens/:token', optionalAuth, asyncHandler(async (req, res) => {
  const userId = req.userId || req.headers['x-user-id'];
  const { token } = req.params;
  
  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide x-user-id header',
    });
  }
  
  // Direct database call (same as private route)
  try {
    const { error } = await supabaseAdmin
      .from('device_tokens')
      .update({ active: false })
      .eq('user_id', userId)
      .eq('token', token);
    
    if (error) {
      throw error;
    }
    
    return res.json({
      success: true,
      message: 'Device token unregistered',
    });
  } catch (err) {
    console.error('Error unregistering device token:', err);
    return res.status(500).json({ 
      error: 'Failed to unregister device token',
      details: err.message 
    });
  }
}));

export default router;
