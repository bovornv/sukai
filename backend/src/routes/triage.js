import express from 'express';
import { assessSymptom, getDiagnosis } from '../functions/triage/index.js';
import { validateTriageAssess } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/triage/assess
router.post('/assess', validateTriageAssess, asyncHandler(async (req, res) => {
  const { session_id, symptom, previous_answers } = req.body;

  const result = await assessSymptom({
    sessionId: session_id,
    symptom,
    previousAnswers: previous_answers || {},
    userId: req.headers['x-user-id'] || null,
  });

  res.json(result);
}));

// GET /api/triage/diagnosis
router.get('/diagnosis', asyncHandler(async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({
      error: 'session_id is required',
    });
  }

  const result = await getDiagnosis({
    sessionId: session_id,
    userId: req.headers['x-user-id'] || null,
  });

  res.json(result);
}));

export default router;
