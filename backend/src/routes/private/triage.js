/**
 * PRIVATE Triage Routes
 * 
 * These endpoints require authentication and handle:
 * - Medical assessment logic
 * - Triage decisions
 * - User-specific medical history
 * - Personalized recommendations
 */

import express from 'express';
import { assessSymptom, getDiagnosis } from '../../functions/triage/index.js';
import { validateTriageAssess } from '../../middleware/validation.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { supabaseAdmin } from '../../config/supabase.js';

const router = express.Router();

// POST /api/private/triage/assess
// Medical assessment - requires authentication
router.post('/assess', requireAuth, validateTriageAssess, asyncHandler(async (req, res) => {
  const { session_id, symptom, previous_answers, language } = req.body;
  const lang = req.headers['x-language'] || language || 'th';
  const userId = req.userId; // From auth middleware

  const result = await assessSymptom({
    sessionId: session_id,
    symptom,
    previousAnswers: previous_answers || {},
    userId: userId, // Always authenticated for PRIVATE routes
    language: lang,
  });

  res.json(result);
}));

// GET /api/private/triage/diagnosis
// Get diagnosis with recommendations - requires authentication
router.get('/diagnosis', requireAuth, asyncHandler(async (req, res) => {
  const { session_id, language } = req.query;
  const lang = req.headers['x-language'] || language || 'th';
  const userId = req.userId; // From auth middleware

  if (!session_id) {
    return res.status(400).json({
      error: 'session_id is required',
    });
  }

  const result = await getDiagnosis({
    sessionId: session_id,
    userId: userId, // Always authenticated for PRIVATE routes
    language: lang,
  });

  res.json(result);
}));

// GET /api/private/triage/sessions
// Get user's past triage sessions - requires authentication
router.get('/sessions', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId; // From auth middleware
  
  // Use supabaseAdmin to bypass RLS (backend doesn't have user's auth token)
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

export default router;

