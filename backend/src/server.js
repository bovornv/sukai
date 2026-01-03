import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import triageRoutes from './routes/triage.js';
import chatRoutes from './routes/chat.js';
import billingRoutes from './routes/billing.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSentry } from './middleware/sentry.js';

dotenv.config();

// Initialize Sentry if configured (after dotenv.config() so env vars are loaded)
initSentry().catch(() => {
  // Sentry initialization failed, continue without it
});

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️  Missing required environment variables:', missingVars.join(', '));
  console.warn('⚠️  Create a .env file with Supabase credentials. See .env.example');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/triage', triageRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/billing', billingRoutes);

// Import followup routes dynamically
import followupRoutes from './routes/followup.js';
app.use('/api/followup', followupRoutes);

// Notification routes
import notificationRoutes from './routes/notifications.js';
app.use('/api/notifications', notificationRoutes);
console.log('✅ Notification routes registered at /api/notifications');

// Device token routes
import deviceTokenRoutes from './routes/device_tokens.js';
app.use('/api/device-tokens', deviceTokenRoutes);

// Analytics routes (temporarily disabled - not critical for notification system)
// Uncomment when analytics dependencies are fully set up
// (async () => {
//   try {
//     const analyticsRoutes = await import('./routes/analytics.js');
//     app.use('/api/analytics', analyticsRoutes.default);
//     console.log('✅ Analytics routes registered at /api/analytics');
//   } catch (error) {
//     console.warn('⚠️  Analytics routes not available:', error.message);
//   }
// })();

// Optional: Enable node-cron for in-process scheduling (development)
// For production, use Railway Cron Jobs instead
if (process.env.ENABLE_NODE_CRON === 'true') {
  import('node-cron').then((cron) => {
    import('./jobs/notification_sender.js').then(({ processPendingNotifications }) => {
      // Run every 15 minutes
      cron.default.schedule('*/15 * * * *', async () => {
        console.log('🔄 Running notification sender job (node-cron)...');
        await processPendingNotifications();
      });
      console.log('✅ Node-cron enabled: Notification sender will run every 15 minutes');
    });
  }).catch((err) => {
    console.warn('⚠️  Node-cron not available, use Railway Cron Jobs instead');
  });
}

// A/B Testing routes removed - locked to Variant A (Calm Doctor) only

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`SukAI Backend running on port ${PORT}`);
});
