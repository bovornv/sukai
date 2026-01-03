/**
 * Request validation middleware
 */

export function validateTriageAssess(req, res, next) {
  const { session_id, symptom } = req.body;

  // Debug logging
  console.log('[VALIDATION] Request body:', JSON.stringify(req.body));
  console.log('[VALIDATION] session_id:', session_id, 'type:', typeof session_id);
  console.log('[VALIDATION] symptom:', symptom, 'type:', typeof symptom);

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({
      error: 'session_id is required and must be a string',
    });
  }

  // Symptom can be empty string for answers (not first input)
  // Handle null, undefined, and non-string types
  if (symptom !== undefined && symptom !== null && typeof symptom !== 'string') {
    return res.status(400).json({
      error: 'symptom must be a string (can be empty for answers)',
    });
  }

  // Normalize: convert null/undefined to empty string for consistency
  if (symptom === null || symptom === undefined) {
    req.body.symptom = '';
  }

  next();
}

export function validateChatMessage(req, res, next) {
  const { session_id, message } = req.body;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({
      error: 'session_id is required and must be a string',
    });
  }

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      error: 'message is required and must be a string',
    });
  }

  next();
}

export function validateBillingSubscribe(req, res, next) {
  const { plan } = req.body;

  if (!plan || !['free', 'pro', 'premium_doctor'].includes(plan)) {
    return res.status(400).json({
      error: 'plan is required and must be one of: free, pro, premium_doctor',
    });
  }

  next();
}

