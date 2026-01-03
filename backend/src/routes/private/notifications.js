/**
 * PRIVATE Notification Routes
 * 
 * These endpoints require authentication and handle:
 * - User-specific notifications
 * - Follow-up scheduling
 * - Notification responses
 */

import express from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  scheduleFollowupNotifications,
  getUserPendingNotifications,
  recordNotificationResponse,
  dismissNotification,
} from '../../services/notification_scheduler.js';

const router = express.Router();

/**
 * POST /api/private/notifications/schedule
 * Schedule follow-up notifications for a session
 * Requires authentication
 */
router.post('/schedule', requireAuth, asyncHandler(async (req, res) => {
  const { session_id, symptom, has_red_flags } = req.body;
  const userId = req.userId; // From auth middleware
  
  if (!session_id || !symptom) {
    return res.status(400).json({ 
      error: 'session_id and symptom are required' 
    });
  }
  
  const success = await scheduleFollowupNotifications(
    session_id,
    userId, // Always authenticated
    symptom,
    has_red_flags || false
  );
  
  if (!success) {
    return res.status(500).json({ 
      error: 'Failed to schedule notifications' 
    });
  }
  
  res.json({ 
    success: true,
    message: 'Notifications scheduled successfully' 
  });
}));

/**
 * GET /api/private/notifications/user
 * Get current user's pending notifications
 * Requires authentication
 */
router.get('/user', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId; // From auth middleware
  
  const notifications = await getUserPendingNotifications(userId);
  
  res.json({
    success: true,
    notifications: notifications,
    count: notifications.length,
  });
}));

/**
 * POST /api/private/notifications/:id/respond
 * Record user response to notification
 * Requires authentication
 */
router.post('/:id/respond', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { response } = req.body;
  
  if (!response) {
    return res.status(400).json({ 
      error: 'response is required' 
    });
  }
  
  const validResponses = ['improved', 'same', 'worse', 'unsure', 'skip', 'reassess', 'doctor'];
  if (!validResponses.includes(response)) {
    return res.status(400).json({ 
      error: `Invalid response. Must be one of: ${validResponses.join(', ')}` 
    });
  }
  
  const success = await recordNotificationResponse(id, response);
  
  if (!success) {
    return res.status(500).json({ 
      error: 'Failed to record response' 
    });
  }
  
  res.json({ 
    success: true,
    message: 'Response recorded successfully' 
  });
}));

/**
 * POST /api/private/notifications/:id/dismiss
 * Dismiss notification (user skipped)
 * Requires authentication
 */
router.post('/:id/dismiss', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const success = await dismissNotification(id);
  
  if (!success) {
    return res.status(500).json({ 
      error: 'Failed to dismiss notification' 
    });
  }
  
  res.json({ 
    success: true,
    message: 'Notification dismissed' 
  });
}));

export default router;

