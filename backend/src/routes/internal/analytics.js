/**
 * INTERNAL Analytics Routes
 * 
 * These endpoints are for admin/internal use:
 * - Performance metrics
 * - System analytics
 * 
 * Protected by admin authentication or API key
 */

import express from 'express';
import { getPerformanceStats, checkPerformanceHealth } from '../../functions/analytics/performance_metrics.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/internal/analytics/performance
 * Get performance metrics for question counts
 * Protected by admin authentication (TODO: implement admin auth)
 */
router.get('/performance', asyncHandler(async (req, res) => {
  // TODO: Add admin authentication
  // For now, this is accessible but should be protected in production
  
  const { startDate, endDate, triageLevel } = req.query;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const stats = await getPerformanceStats({
    startDate: start,
    endDate: end,
    triageLevel: triageLevel || null,
  });

  const health = checkPerformanceHealth(stats);

  res.json({
    stats,
    health,
    targets: {
      emergency: '≤3 questions',
      nonEmergency: '7-12 questions',
    },
  });
}));

export default router;

