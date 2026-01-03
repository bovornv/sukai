/**
 * PUBLIC API Routes
 * 
 * These endpoints are:
 * - Read-only (GET only)
 * - No user data
 * - No personalized logic
 * - Safe for public access
 * - Open CORS (any origin)
 * 
 * Suitable for:
 * - Symptom taxonomy/intent lists
 * - Health education content
 * - General health information
 * - Public health data
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/public/health-info
 * Get general health information (symptom taxonomy, body systems, etc.)
 * This is public data - no user authentication required
 */
router.get('/health-info', (req, res) => {
  // TODO: Implement public health information endpoint
  // This could return symptom taxonomy, body systems, general health tips
  res.json({
    message: 'Public health information endpoint',
    note: 'This endpoint will provide general health information without user data',
  });
});

/**
 * GET /api/public/symptom-taxonomy
 * Get symptom taxonomy/intent list (for autocomplete, suggestions)
 * Public data - safe for anyone to access
 */
router.get('/symptom-taxonomy', (req, res) => {
  // TODO: Return symptom taxonomy without user-specific data
  res.json({
    message: 'Symptom taxonomy endpoint',
    note: 'This will return public symptom taxonomy for autocomplete',
  });
});

export default router;

