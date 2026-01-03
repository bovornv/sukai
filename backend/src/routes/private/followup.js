/**
 * PRIVATE Follow-up Routes
 * 
 * These endpoints require authentication and handle:
 * - User follow-up check-ins
 * - Confidence adjustments
 * - Session history
 */

import express from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';

const router = express.Router();

/**
 * Calculate confidence adjustment based on follow-up responses
 */
function calculateConfidenceDelta(status, actionsTaken = []) {
  let delta = 0;

  switch (status) {
    case 'better':
      delta += 0.15;
      break;
    case 'same':
      delta += 0.05;
      break;
    case 'worse':
      delta -= 0.20;
      break;
    case 'unsure':
      delta += 0.00;
      break;
  }

  actionsTaken.forEach(action => {
    switch (action) {
      case 'medication':
        delta += 0.10;
        break;
      case 'home_care':
        delta += 0.05;
        break;
      case 'doctor':
        delta += 0.20;
        break;
      case 'nothing':
        delta += 0.00;
        break;
    }
  });

  return Math.max(-1.0, Math.min(1.0, delta));
}

async function updateSessionConfidence(sessionId, confidenceDelta) {
  try {
    const { data: session, error: fetchError } = await supabaseAdmin
      .from('triage_sessions')
      .select('confidence')
      .eq('session_id', sessionId)
      .single();

    if (fetchError || !session) {
      console.warn(`Session not found for confidence update: ${sessionId}`);
      return;
    }

    const currentConfidence = session.confidence || 0;
    const newConfidence = Math.max(0, Math.min(100, currentConfidence + (confidenceDelta * 100)));

    const { error: updateError } = await supabaseAdmin
      .from('triage_sessions')
      .update({ 
        confidence: Math.round(newConfidence),
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('Error updating session confidence:', updateError);
    } else {
      console.log(`Updated confidence for session ${sessionId}: ${currentConfidence} → ${Math.round(newConfidence)}`);
    }
  } catch (err) {
    console.error('Error in updateSessionConfidence:', err);
  }
}

// POST /api/private/followup/checkin
// Submit a follow-up check-in - requires authentication
router.post('/checkin', requireAuth, asyncHandler(async (req, res) => {
  const { session_id, status, actions_taken, next_intent, notes } = req.body;
  const userId = req.userId; // From auth middleware
  
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

  const confidenceDelta = calculateConfidenceDelta(status, actions_taken || []);
  
  const { data, error } = await supabaseAdmin
    .from('followup_checkins')
    .insert({
      session_id: session_id,
      user_id: userId, // Always authenticated
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

  await updateSessionConfidence(session_id, confidenceDelta);
  
  const needsEscalation = status === 'worse' || 
    (actions_taken && actions_taken.includes('emergency'));
  
  if (needsEscalation) {
    const { data: session } = await supabaseAdmin
      .from('triage_sessions')
      .select('triage_level')
      .eq('session_id', session_id)
      .single();
    
    if (session && session.triage_level !== 'emergency') {
      if (actions_taken && actions_taken.includes('emergency')) {
        await supabaseAdmin
          .from('triage_sessions')
          .update({ 
            triage_level: 'emergency',
            updated_at: new Date().toISOString()
          })
          .eq('session_id', session_id);
      }
    }
  }
  
  res.json({ 
    success: true, 
    checkin: data,
    confidence_delta: confidenceDelta 
  });
}));

// GET /api/private/followup/checkins
// Get follow-up check-ins for a session - requires authentication
router.get('/checkins', requireAuth, asyncHandler(async (req, res) => {
  const { session_id } = req.query;
  const userId = req.userId; // From auth middleware
  
  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }
  
  const { data, error } = await supabaseAdmin
    .from('followup_checkins')
    .select('*')
    .eq('session_id', session_id)
    .eq('user_id', userId) // Always filter by authenticated user
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

export default router;

