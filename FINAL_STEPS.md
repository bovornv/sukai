# Final Steps 1-3

## Step 1: Test Backend Deployment

Wait 2-3 minutes for Railway to finish deploying, then test:

```bash
curl https://sukai-production.up.railway.app/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"..."}
```

**If it fails:**
- Check Railway dashboard for deployment status
- Check deployment logs for errors
- Verify environment variables are set correctly

## Step 2: Clean Flutter Project

```bash
cd mobile
flutter clean
```

This removes build artifacts and prepares for a fresh build.

## Step 3: Get Dependencies & Run

```bash
flutter pub get
flutter run
```

Your mobile app will now connect to the production backend at:
`https://sukai-production.up.railway.app/api`

## Quick Test Commands

**Test backend health:**
```bash
curl https://sukai-production.up.railway.app/health
```

**Test triage endpoint:**
```bash
curl -X POST https://sukai-production.up.railway.app/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test123","symptom":"headache"}'
```

**Test chat endpoint:**
```bash
curl -X POST https://sukai-production.up.railway.app/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test123","message":"Hello"}'
```

## Troubleshooting

**Backend not responding?**
- Check Railway dashboard → Service → Deployments
- View logs to see errors
- Verify all environment variables are set

**Flutter build fails?**
- Make sure Flutter is installed: `flutter doctor`
- Check `pubspec.yaml` for dependencies
- Try: `flutter pub cache repair`

## ✅ Deployment Complete!

Your backend is live at: **https://sukai-production.up.railway.app**

Your mobile app is configured to use production backend!

🎉 **Congratulations! Your SukAI app is deployed!**

