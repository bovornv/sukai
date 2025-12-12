# Monitoring Setup Guide

## Option 1: Sentry (Recommended)

### Setup

1. **Create Sentry Account**
   - Go to https://sentry.io
   - Sign up for free account
   - Create new project → Node.js

2. **Install Sentry**
   ```bash
   cd backend
   npm install @sentry/node
   ```

3. **Get DSN**
   - Copy DSN from Sentry project settings
   - Add to `.env`:
     ```env
     SENTRY_DSN=https://your-dsn@sentry.io/project-id
     ```

4. **Initialize Sentry**
   - Already set up in `src/middleware/sentry.js`
   - Add to `src/server.js`:
     ```javascript
     import { initSentry } from './middleware/sentry.js';
     initSentry();
     ```

5. **Test**
   - Errors will automatically be sent to Sentry
   - Check Sentry dashboard for errors

### Usage

Errors are automatically captured. You can also manually capture:

```javascript
import { captureException, captureMessage } from './middleware/sentry.js';

try {
  // your code
} catch (error) {
  captureException(error, { context: 'additional info' });
}
```

## Option 2: LogRocket

1. Sign up at https://logrocket.com
2. Install: `npm install logrocket`
3. Initialize in `server.js`
4. See LogRocket docs for setup

## Option 3: Datadog

1. Sign up at https://datadoghq.com
2. Install: `npm install dd-trace`
3. Initialize in `server.js`
4. See Datadog docs for setup

## Option 4: Simple Logging

For basic monitoring, use the built-in logger:
- Already implemented in `src/middleware/logger.js`
- Logs all requests with status codes
- Check application logs for errors

## Recommended Setup

1. **Sentry** - Error tracking
2. **Built-in logger** - Request logging
3. **Supabase Dashboard** - Database monitoring
4. **Uptime monitoring** - UptimeRobot, Pingdom, etc.

## Uptime Monitoring

Set up uptime monitoring for your deployed backend:

1. **UptimeRobot** (Free)
   - Go to https://uptimerobot.com
   - Add monitor → HTTP(s)
   - Enter your backend URL
   - Get alerts if backend goes down

2. **Pingdom**
   - Similar setup
   - More features, paid plans

## Health Check Endpoint

Your backend already has a health check:
```
GET /health
```

Use this for uptime monitoring.

