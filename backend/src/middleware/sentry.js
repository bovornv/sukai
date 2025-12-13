/**
 * Sentry error tracking middleware
 * Install: npm install @sentry/node
 * 
 * Setup:
 * 1. Create account at https://sentry.io
 * 2. Create project for Node.js
 * 3. Get DSN from project settings
 * 4. Set SENTRY_DSN in environment variables
 * 
 * Note: Sentry is optional. If not installed, this module will work without errors.
 */

let Sentry = null;

export async function initSentry() {
  // Only initialize if SENTRY_DSN is set
  if (!process.env.SENTRY_DSN) {
    return;
  }

  try {
    // Dynamic import for ES modules (Sentry is optional)
    const sentryModule = await import('@sentry/node');
    Sentry = sentryModule.default || sentryModule;
    
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0, // Adjust based on traffic
    });
    
    console.log('✅ Sentry initialized');
  } catch (e) {
    // Sentry not installed - optional, just log and continue
    console.log('⚠️  Sentry not installed. Error tracking disabled.');
  }
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

