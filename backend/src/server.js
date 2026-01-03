import express from 'express';
import dotenv from 'dotenv';

// Legacy routes (for backward compatibility)
import triageRoutes from './routes/triage.js';
import chatRoutes from './routes/chat.js';
import billingRoutes from './routes/billing.js';
import followupRoutes from './routes/followup.js';
import notificationRoutes from './routes/notifications.js';
import deviceTokenRoutes from './routes/device_tokens.js';

// New PUBLIC/PRIVATE/INTERNAL routes
import publicRoutes from './routes/public/index.js';
import privateTriageRoutes from './routes/private/triage.js';
import privateChatRoutes from './routes/private/chat.js';
import privateBillingRoutes from './routes/private/billing.js';
import privateFollowupRoutes from './routes/private/followup.js';
import privateNotificationRoutes from './routes/private/notifications.js';
import privateDeviceTokenRoutes from './routes/private/device_tokens.js';
import internalNotificationRoutes from './routes/internal/notifications.js';
import internalAnalyticsRoutes from './routes/internal/analytics.js';

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

// CORS Configuration - Different rules for PUBLIC vs PRIVATE APIs
const getAllowedOrigin = (origin, isPublic = false) => {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    return null;
  }
  
  // PUBLIC APIs: Open CORS (any origin allowed)
  if (isPublic) {
    return origin; // Allow all origins for public APIs
  }
  
  // PRIVATE APIs: Restricted CORS (only allowed origins)
  // Allow localhost with any port (for Flutter Web development)
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    return origin;
  }
  
  // Allow production domains
  const allowedOrigins = [
    'https://sukai-production.up.railway.app',
    // Add your production web app domain here when deployed
    // 'https://your-web-app-domain.com',
  ];
  
  if (allowedOrigins.includes(origin)) {
    return origin;
  }
  
  // For debugging: allow all origins (remove in production if needed)
  return origin;
};

// CORS middleware factory - different rules for PUBLIC vs PRIVATE
const corsMiddleware = (isPublic = false) => {
  return (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigin = getAllowedOrigin(origin, isPublic);
    
    // Handle OPTIONS (preflight) requests
    if (req.method === 'OPTIONS') {
      if (allowedOrigin) {
        res.header('Access-Control-Allow-Origin', allowedOrigin);
        res.header('Access-Control-Allow-Credentials', isPublic ? 'false' : 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret, X-Requested-With, x-user-id, x-language');
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        return res.sendStatus(200);
      }
      return res.sendStatus(200);
    }
    
    // For all other requests, set CORS headers
    if (allowedOrigin) {
      res.header('Access-Control-Allow-Origin', allowedOrigin);
      res.header('Access-Control-Allow-Credentials', isPublic ? 'false' : 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret, X-Requested-With, x-user-id, x-language');
    }
    
    next();
  };
};

// Apply default CORS (for PRIVATE APIs) - will be overridden by route-specific middleware
app.use(corsMiddleware(false));

app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// API Routes - Separated into PUBLIC, PRIVATE, and INTERNAL
// ============================================================================

// PUBLIC APIs - Open CORS, no authentication required
app.use('/api/public', corsMiddleware(true), publicRoutes);
console.log('✅ Public API routes registered at /api/public');

// PRIVATE APIs - Restricted CORS, authentication required
app.use('/api/private/triage', corsMiddleware(false), privateTriageRoutes);
app.use('/api/private/chat', corsMiddleware(false), privateChatRoutes);
app.use('/api/private/billing', corsMiddleware(false), privateBillingRoutes);
app.use('/api/private/followup', corsMiddleware(false), privateFollowupRoutes);
app.use('/api/private/notifications', corsMiddleware(false), privateNotificationRoutes);
app.use('/api/private/device-tokens', corsMiddleware(false), privateDeviceTokenRoutes);
console.log('✅ Private API routes registered at /api/private/*');

// INTERNAL APIs - For cron jobs and admin operations
app.use('/api/internal/notifications', corsMiddleware(false), internalNotificationRoutes);
app.use('/api/internal/analytics', corsMiddleware(false), internalAnalyticsRoutes);
console.log('✅ Internal API routes registered at /api/internal/*');

// ============================================================================
// Legacy Routes (DEPRECATED - for backward compatibility during migration)
// ============================================================================
// These routes will be removed after frontend migration is complete
// TODO: Remove after frontend is updated to use /api/private/* paths

app.use('/api/triage', corsMiddleware(false), triageRoutes);
app.use('/api/chat', corsMiddleware(false), chatRoutes);
app.use('/api/billing', corsMiddleware(false), billingRoutes);
app.use('/api/followup', corsMiddleware(false), followupRoutes);
app.use('/api/notifications', corsMiddleware(false), notificationRoutes);
app.use('/api/device-tokens', corsMiddleware(false), deviceTokenRoutes);
console.log('⚠️  Legacy routes still active (will be removed after migration)');

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
