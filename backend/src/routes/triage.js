import express from 'express';
import { assessSymptom, getDiagnosis } from '../functions/triage/index.js';
import { validateTriageAssess } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// POST /api/triage/assess
router.post('/assess', validateTriageAssess, asyncHandler(async (req, res) => {
  // CRITICAL: Set CORS headers explicitly
  const origin = req.headers.origin;
  if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret, X-Requested-With, x-user-id, x-language');

  const { session_id, symptom, previous_answers, language } = req.body;
  // Get language from header or body (default to 'th')
  const lang = req.headers['x-language'] || language || 'th';

  const result = await assessSymptom({
    sessionId: session_id,
    symptom,
    previousAnswers: previous_answers || {},
    userId: req.headers['x-user-id'] || null,
    language: lang, // Pass language to backend function
  });

  res.json(result);
}));

// GET /api/triage/diagnosis
router.get('/diagnosis', asyncHandler(async (req, res) => {
  // CRITICAL: Set CORS headers explicitly
  const origin = req.headers.origin;
  if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret, X-Requested-With, x-user-id, x-language');

  const { session_id, language } = req.query;
  // Get language from header or query (default to 'th')
  const lang = req.headers['x-language'] || language || 'th';

  if (!session_id) {
    return res.status(400).json({
      error: 'session_id is required',
    });
  }

  const result = await getDiagnosis({
    sessionId: session_id,
    userId: req.headers['x-user-id'] || null,
    language: lang, // Pass language to backend function
  });

  res.json(result);
}));

// GET /api/triage/sessions
// Get user's past triage sessions
router.get('/sessions', asyncHandler(async (req, res) => {
  // CRITICAL: Set CORS headers explicitly
  const origin = req.headers.origin;
  if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret, X-Requested-With, x-user-id, x-language');

  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
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
