import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import triageRoutes from './routes/triage.js';
import chatRoutes from './routes/chat.js';
import billingRoutes from './routes/billing.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSentry } from './middleware/sentry.js';

// Initialize Sentry if configured (async, but we don't wait)
initSentry().catch(() => {
  // Sentry initialization failed, continue without it
});

dotenv.config();

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

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`SukAI Backend running on port ${PORT}`);
});
