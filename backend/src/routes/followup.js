import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * Calculate confidence adjustment based on follow-up responses
 * Maps follow-up answers to confidence adjustments per specification
 */
function calculateConfidenceDelta(status, actionsTaken = []) {
  let delta = 0;

  // Symptom status adjustments
  switch (status) {
    case 'better':
      delta += 0.15;
      break;
    case 'same':
      delta += 0.05;
      break;
    case 'worse':
      delta -= 0.20; // Trigger re-assessment prompt
      break;
    case 'unsure':
      delta += 0.00;
      break;
  }

  // Action taken adjustments
  actionsTaken.forEach(action => {
    switch (action) {
      case 'medication':
        delta += 0.10; // Took recommended medication
        break;
      case 'home_care':
        delta += 0.05; // Self-care at home
        break;
      case 'doctor':
        delta += 0.20; // External validation (saw doctor)
        break;
      case 'emergency':
        // Emergency care forces Emergency flag + reset flow
        // This is handled separately in escalation logic
        break;
      case 'nothing':
        delta += 0.00;
        break;
    }
  });

  // Cap delta between -1.0 and +1.0
  return Math.max(-1.0, Math.min(1.0, delta));
}

/**
 * Update triage session confidence based on follow-up
 */
async function updateSessionConfidence(sessionId, confidenceDelta) {
  try {
    // Get current session
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

    // Update session confidence
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
      console.log(`Updated confidence for session ${sessionId}: ${currentConfidence} → ${Math.round(newConfidence)} (delta: ${(confidenceDelta * 100).toFixed(1)}%)`);
    }
  } catch (err) {
    console.error('Error in updateSessionConfidence:', err);
  }
}

// POST /api/followup/checkin
// Submit a follow-up check-in for a session
router.post('/checkin', asyncHandler(async (req, res) => {
  const { session_id, status, actions_taken, next_intent, notes } = req.body;
  const userId = req.headers['x-user-id'];
  
  if (!session_id || !status) {
    return res.status(400).json({ error: 'session_id and status are required' });
  }
  
  if (!['better', 'same', 'worse', 'unsure'].includes(status)) {
    return res.status(400).json({ error: 'status must be: better, same, worse, or unsure' });
  }

  // Validate actions_taken if provided
  const validActions = ['home_care', 'medication', 'doctor', 'emergency', 'nothing'];
  if (actions_taken && Array.isArray(actions_taken)) {
    const invalidActions = actions_taken.filter(a => !validActions.includes(a));
    if (invalidActions.length > 0) {
      return res.status(400).json({ 
        error: `Invalid actions: ${invalidActions.join(', ')}. Valid actions are: ${validActions.join(', ')}` 
      });
    }
  }

  // Validate next_intent if provided
  const validIntents = ['recheck', 'medication', 'previous', 'nothing'];
  if (next_intent && !validIntents.includes(next_intent)) {
    return res.status(400).json({ 
      error: `Invalid next_intent: ${next_intent}. Valid intents are: ${validIntents.join(', ')}` 
    });
  }

  // Calculate confidence delta
  const confidenceDelta = calculateConfidenceDelta(status, actions_taken || []);
  
  // Save follow-up check-in
  // Use supabaseAdmin to bypass RLS (backend doesn't have user's auth token)
  const { data, error } = await supabaseAdmin
    .from('followup_checkins')
    .insert({
      session_id: session_id,
      user_id: userId || null,
      status: status,
      actions_taken: actions_taken || [],
      next_intent: next_intent || null,
      notes: notes || null,
      confidence_delta: confidenceDelta,
      // Don't set created_at explicitly - let database default handle it
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

  // Update session confidence
  await updateSessionConfidence(session_id, confidenceDelta);
  
  // Check if escalation needed (status = 'worse' or emergency action)
  const needsEscalation = status === 'worse' || 
    (actions_taken && actions_taken.includes('emergency'));
  
  if (needsEscalation) {
    // Get original triage level
    const { data: session } = await supabaseAdmin
      .from('triage_sessions')
      .select('triage_level')
      .eq('session_id', session_id)
      .single();
    
    if (session && session.triage_level !== 'emergency') {
      console.log(`⚠️  Escalation needed for session ${session_id}: status=${status}, actions=${actions_taken?.join(',')}`);
      
      // If emergency action was taken, update triage level
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

// GET /api/followup/checkins?session_id=xxx
// Get follow-up check-ins for a session
router.get('/checkins', asyncHandler(async (req, res) => {
  const { session_id } = req.query;
  const userId = req.headers['x-user-id'];
  
  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }
  
  // Use supabaseAdmin to bypass RLS (backend doesn't have user's auth token)
  let query = supabaseAdmin
    .from('followup_checkins')
    .select('*')
    .eq('session_id', session_id)
    .order('created_at', { ascending: false });
  
  // If user is authenticated, filter by user_id
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  
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
