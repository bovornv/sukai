/**
 * INTERNAL Notification Routes
 * 
 * These endpoints are for internal/admin use:
 * - Cron jobs
 * - Admin operations
 * - System maintenance
 * 
 * Protected by CRON_SECRET or admin authentication
 */

import express from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  getPendingNotifications,
  markNotificationSent,
} from '../../services/notification_scheduler.js';

const router = express.Router();

/**
 * GET /api/internal/notifications/pending
 * Get pending notifications ready to send (for cron job)
 * Protected by CRON_SECRET
 */
router.get('/pending', asyncHandler(async (req, res) => {
  const cronSecret = req.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET;
  
  if (expectedSecret && cronSecret !== expectedSecret) {
    return res.status(401).json({ 
      error: 'Unauthorized - CRON_SECRET required' 
    });
  }
  
  const limit = parseInt(req.query.limit) || 100;
  const notifications = await getPendingNotifications(limit);
  
  res.json({
    success: true,
    notifications: notifications,
    count: notifications.length,
  });
}));

/**
 * POST /api/internal/notifications/process
 * Process and send pending notifications (for cron job)
 * Protected by CRON_SECRET
 */
router.post('/process', asyncHandler(async (req, res) => {
  const cronSecret = req.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET;
  
  if (expectedSecret && cronSecret !== expectedSecret) {
    return res.status(401).json({ 
      error: 'Unauthorized - CRON_SECRET required' 
    });
  }
  
  const { processPendingNotifications } = await import('../../jobs/notification_sender.js');
  const result = await processPendingNotifications();
  
  res.json({
    success: true,
    result: result,
  });
}));

/**
 * POST /api/internal/notifications/:id/sent
 * Mark notification as sent (internal use by notification service)
 * Protected by CRON_SECRET
 */
router.post('/:id/sent', asyncHandler(async (req, res) => {
  const cronSecret = req.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET;
  
  if (expectedSecret && cronSecret !== expectedSecret) {
    return res.status(401).json({ 
      error: 'Unauthorized - CRON_SECRET required' 
    });
  }
  
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

