# Verify Setup - Checklist

## ✅ Mobile App Configuration

- [x] `api_config.dart` created
- [x] `triage_service.dart` updated
- [x] `chat_service.dart` updated
- [x] `billing_service.dart` updated
- [ ] Test mobile app connects to backend

**To test:**
```bash
cd mobile
flutter run
# Test API calls work
```

## ✅ Deployment Guides

- [x] Railway guide (`DEPLOY_RAILWAY.md`)
- [x] Vercel guide (`DEPLOY_VERCEL.md`)
- [x] Render guide (`DEPLOY_RENDER.md`)
- [x] Quick deploy guide (`QUICK_DEPLOY.md`)
- [x] `vercel.json` config
- [x] `railway.json` config
- [ ] Backend deployed to production

**To deploy:**
```bash
# Choose one:
# Railway (easiest)
railway up

# Vercel
vercel

# Render
# Use dashboard at render.com
```

## ✅ Monitoring Setup

- [x] Sentry middleware (`src/middleware/sentry.js`)
- [x] Monitoring guide (`MONITORING_SETUP.md`)
- [x] Health check endpoint (`/health`)
- [x] Request logging (`src/middleware/logger.js`)
- [ ] Sentry account created
- [ ] Sentry DSN added to environment
- [ ] Uptime monitoring set up

**To set up Sentry:**
1. Sign up at https://sentry.io
2. Create Node.js project
3. Get DSN
4. Add to environment: `SENTRY_DSN=your-dsn`
5. Already integrated in code!

**To set up uptime monitoring:**
1. Go to https://uptimerobot.com
2. Add monitor for your backend URL
3. Get alerts if backend goes down

## ✅ Helper Scripts

- [x] `scripts/fix-user-profiles.sh` created
- [x] Script is executable
- [ ] user_profiles table fixed (optional)

**To fix user_profiles:**
```bash
cd backend
./scripts/fix-user-profiles.sh
# Follow instructions to run SQL in Supabase
```

## 🧪 Test Everything

### Test Backend Locally
```bash
cd backend
npm start
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test", "symptom": "ปวดหัว"}'
```

### Test Mobile App
```bash
cd mobile
flutter run
# Test triage, chat, billing features
```

### Verify Database
```bash
cd backend
npm run verify:db
```

## 📋 Next Actions

1. **Deploy backend** - Use Railway/Vercel/Render
2. **Update mobile app** - Set production URL
3. **Set up monitoring** - Sentry + UptimeRobot
4. **Test production** - Verify everything works

## 🎯 Status

- ✅ **Configuration**: Complete
- ✅ **Code**: Ready
- ✅ **Documentation**: Complete
- 🔄 **Deployment**: Ready to deploy
- 🔄 **Monitoring**: Ready to set up

Everything is prepared! Just deploy and configure monitoring.

