# Billing Function

Backend function for subscription management.

## API Endpoints

### POST /billing/subscribe
Subscribe to a plan.

**Request:**
```json
{
  "plan": "free | pro | premium_doctor"
}
```

**Response:**
```json
{
  "success": true,
  "plan": "pro",
  "expires_at": "ISO8601"
}
```

## Plans
- **free**: 3 checks/day, basic features
- **pro**: ฿99/month, unlimited checks
- **premium_doctor**: ฿299/case, human doctor review

See pricing_model_th_v1.md for details.
