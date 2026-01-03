/**
 * PRIVATE Billing Routes
 * 
 * These endpoints require authentication and handle:
 * - User subscriptions
 * - Payment processing
 */

import express from 'express';
import { subscribe } from '../../functions/billing/index.js';
import { validateBillingSubscribe } from '../../middleware/validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = express.Router();

// POST /api/private/billing/subscribe
// Subscribe to a plan - requires authentication
router.post('/subscribe', requireAuth, validateBillingSubscribe, asyncHandler(async (req, res) => {
  const { plan } = req.body;
  const userId = req.userId; // From auth middleware

  const result = await subscribe({
    plan,
    userId: userId, // Always authenticated
  });

  res.json(result);
}));

export default router;

