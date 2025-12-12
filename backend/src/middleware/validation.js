/**
 * Request validation middleware
 */

export function validateTriageAssess(req, res, next) {
  const { session_id, symptom } = req.body;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({
      error: 'session_id is required and must be a string',
    });
  }

  if (!symptom || typeof symptom !== 'string') {
    return res.status(400).json({
      error: 'symptom is required and must be a string',
    });
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

