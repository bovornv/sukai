# Suk AI API Classification

## Overview

All APIs are classified into **PUBLIC**, **PRIVATE**, and **INTERNAL** categories for security, PDPA compliance, and scalability.

## Classification Rules

### PUBLIC APIs (`/api/public/*`)
- ✅ **Read-only** (GET only)
- ✅ **No user data**
- ✅ **No personalized logic**
- ✅ **Safe for public access**
- ✅ **Open CORS** (any origin)
- ✅ **No authentication required**

**Examples:**
- Symptom taxonomy/intent lists
- Health education content
- General health information
- Public health statistics

### PRIVATE APIs (`/api/private/*`)
- ✅ **Require authentication** (`x-user-id` header)
- ✅ **User-bound data**
- ✅ **Medical decision logic**
- ✅ **Personalized recommendations**
- ✅ **Restricted CORS** (localhost + production domains)
- ✅ **Credentials support** (`Access-Control-Allow-Credentials: true`)

**Examples:**
- Triage assessment (`/api/private/triage/assess`)
- Diagnosis with recommendations (`/api/private/triage/diagnosis`)
- User session history (`/api/private/triage/sessions`)
- Notifications (`/api/private/notifications/*`)
- Follow-up check-ins (`/api/private/followup/*`)
- Billing/subscriptions (`/api/private/billing/*`)
- Device tokens (`/api/private/device-tokens/*`)

### INTERNAL APIs (`/api/internal/*`)
- ✅ **For cron jobs and admin operations**
- ✅ **Protected by CRON_SECRET or admin auth**
- ✅ **Restricted CORS**
- ✅ **System maintenance only**

**Examples:**
- Notification processing (`/api/internal/notifications/process`)
- Analytics (`/api/internal/analytics/*`)

## Complete Route List

### PUBLIC Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/public/health-info` | GET | General health information |
| `/api/public/symptom-taxonomy` | GET | Symptom taxonomy for autocomplete |

### PRIVATE Routes
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/private/triage/assess` | POST | ✅ | Medical assessment |
| `/api/private/triage/diagnosis` | GET | ✅ | Get diagnosis with recommendations |
| `/api/private/triage/sessions` | GET | ✅ | User's triage session history |
| `/api/private/chat/message` | POST | ✅ | Send chat message |
| `/api/private/billing/subscribe` | POST | ✅ | Subscribe to plan |
| `/api/private/followup/checkin` | POST | ✅ | Submit follow-up check-in |
| `/api/private/followup/checkins` | GET | ✅ | Get follow-up check-ins |
| `/api/private/notifications/user` | GET | ✅ | Get user's notifications |
| `/api/private/notifications/schedule` | POST | ✅ | Schedule notifications |
| `/api/private/notifications/:id/respond` | POST | ✅ | Respond to notification |
| `/api/private/notifications/:id/dismiss` | POST | ✅ | Dismiss notification |
| `/api/private/device-tokens/register` | POST | ✅ | Register device token |
| `/api/private/device-tokens/:token` | DELETE | ✅ | Unregister device token |
| `/api/private/device-tokens/user` | GET | ✅ | Get user's device tokens |

### INTERNAL Routes
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/internal/notifications/pending` | GET | CRON_SECRET | Get pending notifications |
| `/api/internal/notifications/process` | POST | CRON_SECRET | Process notifications |
| `/api/internal/notifications/:id/sent` | POST | CRON_SECRET | Mark notification sent |
| `/api/internal/analytics/performance` | GET | Admin | Performance metrics |

## CORS Rules

### PUBLIC APIs
```javascript
Access-Control-Allow-Origin: * (any origin)
Access-Control-Allow-Credentials: false
Access-Control-Allow-Methods: GET
```

### PRIVATE APIs
```javascript
Access-Control-Allow-Origin: http://localhost:* | https://sukai-production.up.railway.app
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, x-user-id, x-language
```

## Authentication

### PRIVATE APIs
All PRIVATE API requests **MUST** include:
```
x-user-id: <user_id>
```

**401 Unauthorized** response if missing:
```json
{
  "error": "Authentication required",
  "message": "This endpoint requires user authentication. Please provide x-user-id header."
}
```

### INTERNAL APIs
All INTERNAL API requests **MUST** include:
```
x-cron-secret: <CRON_SECRET>
```

## PDPA Compliance

This separation ensures:
1. ✅ **Clear data boundaries**: User data only in PRIVATE APIs
2. ✅ **Access control**: Authentication required for medical data
3. ✅ **Audit trail**: Clear separation for compliance logging
4. ✅ **Scalability**: Different rate limits, caching per API type
5. ✅ **Security**: CORS restrictions prevent unauthorized access

## Migration Status

- ✅ Backend routes reorganized
- ✅ Authentication middleware created
- ✅ CORS rules updated
- ⏳ Frontend migration in progress
- ⏳ Legacy routes still active (will be removed)

