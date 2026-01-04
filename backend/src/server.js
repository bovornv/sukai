import express from 'express';
import dotenv from 'dotenv';

// PUBLIC/PRIVATE/INTERNAL routes
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

// CRITICAL: Handle unhandled promise rejections to prevent server crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED PROMISE REJECTION:', reason);
  console.error('Promise:', promise);
  // Don't exit - log and continue (Railway will restart if needed)
});

process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
  // Don't exit immediately - let Express error handler deal with it
});

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

// CORS Configuration - CRITICAL: Only enable CORS on PUBLIC APIs
// PRIVATE APIs must NEVER be called from browsers
const getAllowedOrigin = (origin, isPublic = false) => {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    return null;
  }
  
  // PUBLIC APIs: Open CORS (browser-safe)
  if (isPublic) {
    // Allow localhost (dev) and production domains
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
    
    // For public APIs, allow any origin (can be restricted later if needed)
    return origin;
  }
  
  // PRIVATE APIs: BLOCK all browser requests (no CORS)
  // These should only be called server-to-server
  // Return null to block CORS headers
  return null;
};

// CORS middleware factory - CRITICAL: Only enable CORS on PUBLIC APIs
const corsMiddleware = (isPublic = false) => {
  return (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigin = getAllowedOrigin(origin, isPublic);
    
    // Debug logging for CORS
    if (isPublic) {
      console.log(`[CORS] ${req.method} ${req.path} - Origin: ${origin || 'none'}, Allowed: ${allowedOrigin || 'NO'}`);
    }
    
    // Handle OPTIONS (preflight) requests FIRST - CRITICAL for CORS
    if (req.method === 'OPTIONS') {
      // Only respond to OPTIONS with CORS headers if this is a PUBLIC API
      if (isPublic && allowedOrigin) {
        console.log(`[CORS] ✅ Allowing OPTIONS preflight for ${origin}`);
        res.header('Access-Control-Allow-Origin', allowedOrigin);
        res.header('Access-Control-Allow-Credentials', 'false');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, x-user-id, x-language');
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        return res.sendStatus(200);
      }
      // For PRIVATE APIs, block OPTIONS requests (no CORS)
      console.log(`[CORS] ❌ Blocking OPTIONS for private API: ${req.path}`);
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'This endpoint cannot be called from a browser. Use /api/public/* endpoints instead.' 
      });
    }
    
    // For all other requests, set CORS headers ONLY if this is a PUBLIC API
    if (isPublic && allowedOrigin) {
      res.header('Access-Control-Allow-Origin', allowedOrigin);
      res.header('Access-Control-Allow-Credentials', 'false');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, x-user-id, x-language');
      console.log(`[CORS] ✅ Set CORS headers for ${req.method} ${req.path} from ${origin}`);
    } else if (isPublic && !allowedOrigin) {
      console.log(`[CORS] ⚠️ Public API but origin not allowed: ${origin}`);
    }
    // For PRIVATE APIs, do NOT set CORS headers (browser will block)
    
    next();
  };
};

// Apply NO CORS by default (for PRIVATE APIs)
// This ensures /api/private/* cannot be called from browsers
app.use((req, res, next) => {
  // Only allow requests without Origin header (server-to-server) for private APIs
  if (req.path.startsWith('/api/private') && req.headers.origin) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Private APIs cannot be called from browsers. Use /api/public/* endpoints instead.' 
    });
  }
  next();
});

app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// API Routes - Separated into PUBLIC, PRIVATE, and INTERNAL
// ============================================================================

// PUBLIC APIs - Open CORS, browser-safe
// CRITICAL: CORS middleware must be applied BEFORE routes
app.use('/api/public', corsMiddleware(true));
app.use('/api/public', publicRoutes);
console.log('✅ Public API routes registered at /api/public (CORS enabled)');

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

// Legacy routes removed - all frontend services now use /api/private/* paths

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
