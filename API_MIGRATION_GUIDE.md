# API Migration Guide: PUBLIC vs PRIVATE Separation

## Overview

Suk AI APIs have been reorganized into **PUBLIC**, **PRIVATE**, and **INTERNAL** categories for improved security, PDPA compliance, and scalability.

## API Classification

### PUBLIC APIs (`/api/public/*`)
- **Purpose**: Read-only, no user data, general health information
- **CORS**: Open (any origin)
- **Authentication**: None required
- **Use Cases**: Symptom taxonomy, health education, public health data

### PRIVATE APIs (`/api/private/*`)
- **Purpose**: User-bound, medical logic, personalized recommendations
- **CORS**: Restricted (localhost + production domains)
- **Authentication**: **REQUIRED** (`x-user-id` header)
- **Use Cases**: Triage, diagnosis, notifications, follow-ups, billing, device tokens

### INTERNAL APIs (`/api/internal/*`)
- **Purpose**: Cron jobs, admin operations, system maintenance
- **CORS**: Restricted
- **Authentication**: CRON_SECRET or admin auth
- **Use Cases**: Notification processing, analytics

## Route Mapping

### Frontend Migration Required

| Old Route | New Route | Status |
|-----------|-----------|--------|
| `POST /api/triage/assess` | `POST /api/private/triage/assess` | ✅ Requires auth |
| `GET /api/triage/diagnosis` | `GET /api/private/triage/diagnosis` | ✅ Requires auth |
| `GET /api/triage/sessions` | `GET /api/private/triage/sessions` | ✅ Requires auth |
| `POST /api/chat/message` | `POST /api/private/chat/message` | ✅ Requires auth |
| `POST /api/billing/subscribe` | `POST /api/private/billing/subscribe` | ✅ Requires auth |
| `POST /api/followup/checkin` | `POST /api/private/followup/checkin` | ✅ Requires auth |
| `GET /api/followup/checkins` | `GET /api/private/followup/checkins` | ✅ Requires auth |
| `GET /api/notifications/user` | `GET /api/private/notifications/user` | ✅ Requires auth |
| `POST /api/notifications/schedule` | `POST /api/private/notifications/schedule` | ✅ Requires auth |
| `POST /api/notifications/:id/respond` | `POST /api/private/notifications/:id/respond` | ✅ Requires auth |
| `POST /api/notifications/:id/dismiss` | `POST /api/private/notifications/:id/dismiss` | ✅ Requires auth |
| `POST /api/device-tokens/register` | `POST /api/private/device-tokens/register` | ✅ Requires auth |
| `DELETE /api/device-tokens/:token` | `DELETE /api/private/device-tokens/:token` | ✅ Requires auth |
| `GET /api/device-tokens/user` | `GET /api/private/device-tokens/user` | ✅ Requires auth |

## Frontend Changes Required

### 1. Update API Base URLs

**File**: `mobile/lib/config/api_config.dart`

```dart
class ApiConfig {
  // ... existing code ...
  
  // Private API base URL (requires authentication)
  static const String privateBaseUrl = 'https://sukai-production.up.railway.app/api/private';
  
  // Public API base URL (no authentication)
  static const String publicBaseUrl = 'https://sukai-production.up.railway.app/api/public';
}
```

### 2. Update Service Classes

**Example**: `mobile/lib/services/triage_service.dart`

```dart
// OLD:
final response = await _dio.post(
  '$baseUrl/triage/assess',
  // ...
);

// NEW:
final response = await _dio.post(
  '${ApiConfig.privateBaseUrl}/triage/assess',
  // ...
);
```

### 3. Ensure Authentication Headers

All PRIVATE API calls **MUST** include `x-user-id` header:

```dart
final headers = <String, String>{
  'x-user-id': userId, // REQUIRED for all PRIVATE APIs
  'x-language': language,
};
```

## Backward Compatibility

**Legacy routes are still active** during migration period:
- Old routes (`/api/triage/*`, `/api/notifications/*`, etc.) still work
- They will be removed after frontend migration is complete
- **All legacy routes now require authentication** (breaking change)

## Security Benefits

1. **PDPA Compliance**: Clear separation of user data vs public data
2. **CORS Security**: PUBLIC APIs have open CORS, PRIVATE APIs are restricted
3. **Authentication Enforcement**: PRIVATE APIs always require `x-user-id`
4. **Scalability**: Easy to add rate limiting, caching per API type
5. **Audit Trail**: Clear distinction for compliance logging

## Testing Checklist

- [ ] Update all API calls to use `/api/private/*` paths
- [ ] Ensure all PRIVATE API calls include `x-user-id` header
- [ ] Test authentication failures (401 errors)
- [ ] Verify CORS works for both PUBLIC and PRIVATE APIs
- [ ] Test legacy routes still work (during migration)
- [ ] Remove legacy route usage after migration complete

## Timeline

1. **Phase 1** (Current): New routes active, legacy routes still work
2. **Phase 2** (After frontend update): Frontend uses new routes
3. **Phase 3** (Future): Legacy routes removed

