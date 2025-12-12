/**
 * Sentry error tracking middleware
 * Install: npm install @sentry/node
 * 
 * Setup:
 * 1. Create account at https://sentry.io
 * 2. Create project for Node.js
 * 3. Get DSN from project settings
 * 4. Set SENTRY_DSN in environment variables
 */

let Sentry;

try {
  Sentry = require('@sentry/node');
} catch (e) {
  // Sentry not installed - optional
  console.log('⚠️  Sentry not installed. Error tracking disabled.');
}

export function initSentry() {
  if (!Sentry || !process.env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0, // Adjust based on traffic
  });

  console.log('✅ Sentry initialized');
}

export function captureException(error, context = {}) {
  if (!Sentry) return;

  Sentry.withScope((scope) => {
    Object.keys(context).forEach((key) => {
      scope.setContext(key, context[key]);
    });
    Sentry.captureException(error);
  });
}

export function captureMessage(message, level = 'info') {
  if (!Sentry) return;
  Sentry.captureMessage(message, level);
}

