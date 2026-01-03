/**
 * Notification Routes
 * Handles follow-up notification scheduling, sending, and responses
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  scheduleFollowupNotifications,
  getPendingNotifications,
  markNotificationSent,
  recordNotificationResponse,
  dismissNotification,
  getUserPendingNotifications,
} from '../services/notification_scheduler.js';
import { processPendingNotifications } from '../jobs/notification_sender.js';

const router = express.Router();

console.log('📋 Notification routes module loaded');

/**
 * POST /api/notifications/schedule
 * Schedule follow-up notifications for a session
 * Called automatically when assessment is saved
 */
router.post('/schedule', asyncHandler(async (req, res) => {
  const { session_id, user_id, symptom, has_red_flags } = req.body;
  
  if (!session_id || !symptom) {
    return res.status(400).json({ 
      error: 'session_id and symptom are required' 
    });
  }
  
  const success = await scheduleFollowupNotifications(
    session_id,
    user_id || req.headers['x-user-id'],
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
 * GET /api/notifications/pending
 * Get pending notifications ready to send (for cron job or scheduled task)
 * Returns notifications where scheduled_at <= now and not yet sent
 */
router.get('/pending', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  
  const notifications = await getPendingNotifications(limit);
  
  res.json({
    success: true,
    notifications: notifications,
    count: notifications.length,
  });
}));

/**
 * GET /api/notifications/process
 * Test endpoint - returns info about pending notifications (for testing)
 */
router.get('/process', asyncHandler(async (req, res) => {
  console.log('📬 GET /api/notifications/process called');
  const pending = await getPendingNotifications(10);
  
  res.json({
    success: true,
    message: 'Use POST method to process notifications',
    pending_count: pending.length,
    pending_notifications: pending.map(n => ({
      id: n.id,
      session_id: n.session_id,
      notification_type: n.notification_type,
      scheduled_at: n.scheduled_at,
      status: n.status
    }))
  });
}));

/**
 * POST /api/notifications/process
 * Process and send pending notifications (for cron job)
 * This endpoint can be called by Railway Cron or external scheduler
 */
router.post('/process', asyncHandler(async (req, res) => {
  // Optional: Add authentication for cron endpoint
  const cronSecret = req.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET;
  
  if (expectedSecret && cronSecret !== expectedSecret) {
    return res.status(401).json({ 
      error: 'Unauthorized' 
    });
  }
  
  const result = await processPendingNotifications();
  
  res.json({
    success: true,
    result: result,
  });
}));

/**
 * GET /api/notifications/user
 * Get current user's pending notifications (for in-app display)
 */
router.get('/user', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ 
      error: 'User ID required' 
    });
  }
  
  const notifications = await getUserPendingNotifications(userId);
  
  res.json({
    success: true,
    notifications: notifications,
    count: notifications.length,
  });
}));

/**
 * POST /api/notifications/:id/respond
 * Record user response to notification
 */
router.post('/:id/respond', asyncHandler(async (req, res) => {
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
 * POST /api/notifications/:id/dismiss
 * Dismiss notification (user skipped)
 */
router.post('/:id/dismiss', asyncHandler(async (req, res) => {
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

/**
 * POST /api/notifications/:id/sent
 * Mark notification as sent (internal use by notification service)
 */
router.post('/:id/sent', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const success = await markNotificationSent(id);
  
  if (!success) {
    return res.status(500).json({ 
      error: 'Failed to mark notification as sent' 
    });
  }
  
  res.json({ 
    success: true,
    message: 'Notification marked as sent' 
  });
}));

export default router;
