/**
 * PRIVATE Chat Routes
 * 
 * These endpoints require authentication and handle:
 * - User chat messages with medical context
 * - Conversation history
 */

import express from 'express';
import { sendMessage } from '../../functions/chat/index.js';
import { validateChatMessage } from '../../middleware/validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = express.Router();

// POST /api/private/chat/message
// Send chat message - requires authentication
router.post('/message', requireAuth, validateChatMessage, asyncHandler(async (req, res) => {
  const { session_id, message, history } = req.body;
  const userId = req.userId; // From auth middleware

  const result = await sendMessage({
    sessionId: session_id,
    message,
    history: history || [],
    userId: userId, // Always authenticated
  });

  res.json(result);
}));

export default router;

