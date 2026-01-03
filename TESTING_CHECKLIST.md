# API Security Testing Checklist

## Step 1: Backend Deployment & Testing

### 1.1 Deploy to Railway
- [ ] Commit all backend changes
- [ ] Push to GitHub
- [ ] Verify Railway deployment succeeds
- [ ] Check Railway logs for route registration

### 1.2 Test PUBLIC APIs (No Auth Required)
```bash
# Test PUBLIC health-info endpoint
curl -X GET https://sukai-production.up.railway.app/api/public/health-info

# Expected: 200 OK, no CORS errors
```

- [ ] PUBLIC APIs return 200 OK
- [ ] PUBLIC APIs work from any origin (CORS open)
- [ ] No authentication required

### 1.3 Test PRIVATE APIs Without Auth (Should Fail)
```bash
# Test PRIVATE triage/assess without x-user-id
curl -X POST https://sukai-production.up.railway.app/api/private/triage/assess \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test","symptom":"ปวดหัว"}'

# Expected: 401 Unauthorized
```

- [ ] PRIVATE APIs return 401 without `x-user-id`
- [ ] Error message is clear: "Authentication required"
- [ ] CORS headers are present (for allowed origins)

### 1.4 Test PRIVATE APIs With Auth (Should Work)
```bash
# Test PRIVATE triage/assess with x-user-id
curl -X POST https://sukai-production.up.railway.app/api/private/triage/assess \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "Origin: http://localhost:59268" \
  -d '{"session_id":"test","symptom":"ปวดหัว"}'

# Expected: 200 OK with triage response
```

- [ ] PRIVATE APIs return 200 with valid `x-user-id`
- [ ] CORS headers are present for localhost
- [ ] Response contains expected data

### 1.5 Test CORS for PRIVATE APIs
```bash
# Test from disallowed origin
curl -X OPTIONS https://sukai-production.up.railway.app/api/private/triage/assess \
  -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST"

# Expected: CORS headers may be missing or restricted
```

- [ ] PRIVATE APIs only allow localhost + production domains
- [ ] Other origins are blocked or restricted

## Step 2: Frontend Testing

### 2.1 Update Frontend Services
- [x] Update `triage_service.dart` to use `privateBaseUrl`
- [x] Update `notification_service.dart` to use `privateBaseUrl`
- [x] Update `followup_service.dart` to use `privateBaseUrl`
- [x] Update `billing_service.dart` to use `privateBaseUrl` + auth
- [x] Update `push_notification_service.dart` to use `privateBaseUrl`
- [x] Update `sessions_service.dart` to use `privateBaseUrl`
- [x] Update `chat_service.dart` to use `privateBaseUrl`

### 2.2 Test Frontend Calls
- [ ] Run Flutter Web app on `http://localhost:59268`
- [ ] Test symptom submission (should work with auth)
- [ ] Test notification fetching (should work with auth)
- [ ] Test follow-up check-in (should work with auth)
- [ ] Test billing subscription (should work with auth)
- [ ] Check browser console for errors

### 2.3 Verify Authentication Headers
- [ ] All PRIVATE API calls include `x-user-id` header
- [ ] Check Network tab in DevTools
- [ ] Verify headers are sent correctly

### 2.4 Test Error Handling
- [ ] Test with invalid/missing `x-user-id` (should show error)
- [ ] Test with expired session (should handle gracefully)
- [ ] Verify error messages are user-friendly

## Step 3: Remove Legacy Routes (After Frontend Migration)

### 3.1 Verify Frontend Migration Complete
- [ ] All frontend services use `/api/private/*` paths
- [ ] No references to old `/api/triage/*`, `/api/notifications/*`, etc.
- [ ] All tests pass

### 3.2 Remove Legacy Routes
- [ ] Remove legacy route imports from `server.js`
- [ ] Remove legacy route registrations
- [ ] Update documentation
- [ ] Deploy and verify

## Test Commands

### Test PUBLIC API
```bash
curl -X GET https://sukai-production.up.railway.app/api/public/health-info \
  -H "Origin: https://any-origin.com"
```

### Test PRIVATE API Without Auth (Should Fail)
```bash
curl -X POST https://sukai-production.up.railway.app/api/private/triage/assess \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:59268" \
  -d '{"session_id":"test","symptom":"ปวดหัว"}'
```

### Test PRIVATE API With Auth (Should Work)
```bash
curl -X POST https://sukai-production.up.railway.app/api/private/triage/assess \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "Origin: http://localhost:59268" \
  -d '{"session_id":"test","symptom":"ปวดหัว"}'
```

### Test OPTIONS Preflight
```bash
curl -X OPTIONS https://sukai-production.up.railway.app/api/private/triage/assess \
  -H "Origin: http://localhost:59268" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,x-user-id" \
  -v
```

## Expected Results

✅ **PUBLIC APIs**: Work from any origin, no auth required
✅ **PRIVATE APIs**: Require `x-user-id`, restricted CORS
✅ **401 Errors**: Clear error messages when auth missing
✅ **CORS**: Proper headers for allowed origins only
✅ **Frontend**: All services use `/api/private/*` paths
