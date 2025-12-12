import express from 'express';
import { subscribe } from '../functions/billing/index.js';
import { validateBillingSubscribe } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/billing/subscribe
router.post('/subscribe', validateBillingSubscribe, asyncHandler(async (req, res) => {
  const { plan } = req.body;

  const result = await subscribe({
    plan,
    userId: req.headers['x-user-id'] || 'anonymous', // In production, use auth
  });

  res.json(result);
}));

export default router;
