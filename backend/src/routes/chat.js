import express from 'express';
import { sendMessage } from '../functions/chat/index.js';
import { validateChatMessage } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/chat/message
router.post('/message', validateChatMessage, asyncHandler(async (req, res) => {
  const { session_id, message, history } = req.body;

  const result = await sendMessage({
    sessionId: session_id,
    message,
    history: history || [],
    userId: req.headers['x-user-id'] || null,
  });

  res.json(result);
}));

export default router;
