# Deployment and Testing Steps

## Step 1: Commit and Deploy Backend

### Files Changed
- `backend/src/middleware/auth.js` - NEW: Authentication middleware
- `backend/src/routes/public/index.js` - NEW: Public API routes
- `backend/src/routes/private/*` - NEW: Private API routes (6 files)
- `backend/src/routes/internal/*` - NEW: Internal API routes (2 files)
- `backend/src/server.js` - UPDATED: Route organization and CORS rules

### Commands to Run
```bash
cd /Users/bovorn/Desktop/aurasea/Projects/sukai

# Stage all backend changes
git add backend/src/middleware/auth.js
git add backend/src/routes/public
git add backend/src/routes/private
git add backend/src/routes/internal
git add backend/src/server.js
git add API_*.md TESTING_CHECKLIST.md FRONTEND_MIGRATION_SUMMARY.md

# Commit
git commit -m "Separate APIs into PUBLIC/PRIVATE/INTERNAL for security and PDPA compliance"

# Push to trigger Railway deployment
git push origin main
```

### Verify Deployment
1. Check Railway dashboard for deployment status
2. Check Railway logs for:
   - ✅ "Public API routes registered at /api/public"
   - ✅ "Private API routes registered at /api/private/*"
   - ✅ "Internal API routes registered at /api/internal/*"
   - ✅ "Legacy routes still active (will be removed after migration)"

## Step 2: Test Backend APIs

### 2.1 Test PUBLIC API (No Auth Required)
```bash
curl -X GET https://sukai-production.up.railway.app/api/public/health-info \
  -H "Origin: https://any-origin.com" \
  -v

# Expected: 200 OK, CORS headers present
```

### 2.2 Test PRIVATE API Without Auth (Should Return 401)
```bash
curl -X POST https://sukai-production.up.railway.app/api/private/triage/assess \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:59268" \
  -d '{"session_id":"test","symptom":"ปวดหัว"}' \
  -v

# Expected: 401 Unauthorized
# Response: {"error":"Authentication required","message":"This endpoint requires user authentication. Please provide x-user-id header."}
```

### 2.3 Test PRIVATE API With Auth (Should Work)
```bash
curl -X POST https://sukai-production.up.railway.app/api/private/triage/assess \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "Origin: http://localhost:59268" \
  -d '{"session_id":"test","symptom":"ปวดหัว"}' \
  -v

# Expected: 200 OK with triage response
# Check for CORS headers: Access-Control-Allow-Origin: http://localhost:59268
```

### 2.4 Test OPTIONS Preflight
```bash
curl -X OPTIONS https://sukai-production.up.railway.app/api/private/triage/assess \
  -H "Origin: http://localhost:59268" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,x-user-id" \
  -v

# Expected: 200 OK with CORS headers
```

## Step 3: Commit and Test Frontend

### Files Changed
- `mobile/lib/config/api_config.dart` - UPDATED: Added `privateBaseUrl` and `publicBaseUrl`
- `mobile/lib/services/triage_service.dart` - UPDATED: Use `privateBaseUrl`
- `mobile/lib/services/notification_service.dart` - UPDATED: Use `privateBaseUrl`
- `mobile/lib/services/followup_service.dart` - UPDATED: Use `privateBaseUrl`
- `mobile/lib/services/billing_service.dart` - UPDATED: Use `privateBaseUrl` + auth
- `mobile/lib/services/push_notification_service.dart` - UPDATED: Use `privateBaseUrl`
- `mobile/lib/services/sessions_service.dart` - UPDATED: Use `privateBaseUrl`
- `mobile/lib/services/chat_service.dart` - UPDATED: Use `privateBaseUrl`
- `mobile/lib/features/billing/pages/billing_page.dart` - UPDATED: Pass `ref` to BillingService

### Commands to Run
```bash
cd /Users/bovorn/Desktop/aurasea/Projects/sukai

# Stage all frontend changes
git add mobile/lib/config/api_config.dart
git add mobile/lib/services
git add mobile/lib/features/billing/pages/billing_page.dart
git add DEPLOYMENT_AND_TESTING_STEPS.md

# Commit
git commit -m "Migrate frontend services to use /api/private/* paths with authentication"

# Push
git push origin main
```

### Test Frontend
1. Run Flutter Web app: `flutter run -d chrome --web-port=59268`
2. Test features:
   - ✅ Submit symptom (should work with auth)
   - ✅ View notifications (should work with auth)
   - ✅ Submit follow-up check-in (should work with auth)
   - ✅ Subscribe to billing plan (should work with auth)
3. Check browser console:
   - ✅ No 401 errors
   - ✅ No CORS errors
   - ✅ All API calls succeed
4. Check Network tab:
   - ✅ All requests go to `/api/private/*` paths
   - ✅ All requests include `x-user-id` header
   - ✅ CORS headers present in responses

## Step 4: Remove Legacy Routes (After Testing)

### Verify Everything Works
- [ ] All frontend features work correctly
- [ ] No 401 errors in production
- [ ] All API calls use `/api/private/*` paths
- [ ] Authentication is enforced

### Remove Legacy Routes
```bash
# Edit backend/src/server.js
# Remove legacy route imports and registrations
# Commit and push
```

## Summary

✅ **Backend**: Routes separated into PUBLIC/PRIVATE/INTERNAL
✅ **Authentication**: PRIVATE APIs require `x-user-id` header
✅ **CORS**: Different rules for PUBLIC vs PRIVATE APIs
✅ **Frontend**: All services updated to use `/api/private/*` paths
✅ **Security**: Clear separation for PDPA compliance

**Status**: Ready for deployment and testing!

