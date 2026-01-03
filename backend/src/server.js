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

// CORS Configuration
// Allow localhost for development and production domains
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Allow localhost with any port
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      console.log(`✅ CORS: Allowing localhost origin: ${origin}`);
      return callback(null, true);
    }
    
    // Allow production domains
    const allowedOrigins = [
      'https://sukai-production.up.railway.app',
      // Add your production web app domain here when deployed
      // 'https://your-web-app-domain.com',
    ];
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Allowing production origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS: Unknown origin: ${origin} - allowing for debugging`);
      callback(null, true); // Temporarily allow all for debugging - change to callback(new Error(...)) in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-cron-secret', 'X-Requested-With', 'x-user-id', 'x-language'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400, // 24 hours
  preflightContinue: true, // Let our explicit OPTIONS handler handle preflight
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

// Middleware
// CRITICAL: CORS must be applied FIRST, before any routes
// Handle OPTIONS requests explicitly BEFORE cors middleware
// This MUST be the first middleware to catch all OPTIONS requests
app.use((req, res, next) => {
  // Handle OPTIONS (preflight) requests immediately
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    const requestedMethod = req.headers['access-control-request-method'];
    const requestedHeaders = req.headers['access-control-request-headers'];
    
    console.log('🔍 OPTIONS preflight request:', {
      origin,
      path: req.path,
      method: req.method,
      requestedMethod,
      requestedHeaders,
    });
    
    // Allow localhost with any port
    if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      console.log(`✅ OPTIONS: Allowing localhost origin: ${origin}`);
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret, X-Requested-With, x-user-id, x-language');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      return res.sendStatus(200);
    }
    
    // Allow production domains
    const allowedOrigins = [
      'https://sukai-production.up.railway.app',
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      console.log(`✅ OPTIONS: Allowing production origin: ${origin}`);
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret, X-Requested-With, x-user-id, x-language');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      return res.sendStatus(200);
    }
    
    // Default: allow all origins (for debugging)
    console.log(`✅ OPTIONS: Allowing origin (default): ${origin || '*'}`);
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret, X-Requested-With, x-user-id, x-language');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.sendStatus(200);
  }
  
  // For non-OPTIONS requests, continue to next middleware
  next();
});

// Apply CORS middleware to all routes
app.use(cors(corsOptions));

// Add CORS headers to all responses (including errors)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers for all responses
  if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (origin && ['https://sukai-production.up.railway.app'].includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (origin) {
    // Allow all for debugging
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret, X-Requested-With, x-user-id, x-language');
  
  next();
});

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
