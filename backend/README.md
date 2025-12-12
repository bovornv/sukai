# SukAI Backend

Backend API for SukAI mobile app.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a project at [supabase.com](https://supabase.com)
   - Go to Project Settings → API
   - Copy your Project URL, `anon` public key, and `service_role` secret key

3. Create `.env` file in the `backend` directory:
```bash
# Server Configuration
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

4. Start server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

## Supabase Configuration

The backend uses Supabase for database operations. Two clients are available:

- **`supabase`**: Regular client using anon key (respects RLS policies)
- **`supabaseAdmin`**: Admin client using service role key (bypasses RLS)

Import them in your functions:
```javascript
import { supabase, supabaseAdmin } from '../config/supabase.js';
```

**Important**: 
- Use `supabaseAdmin` only for server-side operations that need to bypass Row Level Security
- Never expose the service role key to the client
- The anon key is safe to use in client-side code (with proper RLS policies)

## API Endpoints

### Triage

#### POST /api/triage/assess
Assess symptom and get triage response.

**Request:**
```json
{
  "session_id": "uuid",
  "symptom": "user symptom text",
  "previous_answers": {}
}
```

**Response:**
```json
{
  "need_more_info": true,
  "next_question": "question text or null",
  "triage_level": "self_care | pharmacy | gp | emergency | uncertain"
}
```

#### GET /api/triage/diagnosis
Get final diagnosis with recommendations.

**Query:** `?session_id=uuid`

**Response:**
```json
{
  "triage_level": "self_care",
  "summary": "short summary",
  "recommendations": {
    "home_care": ["item1", "item2"],
    "otc_meds": ["item1", "item2"],
    "when_to_see_doctor": ["item1", "item2"],
    "danger_signs": ["item1", "item2"],
    "additional_advice": ["item1", "item2"]
  }
}
```

### Chat

#### POST /api/chat/message
Send chat message to AI doctor.

**Request:**
```json
{
  "session_id": "uuid",
  "message": "user message",
  "history": []
}
```

**Response:**
```json
{
  "id": "message_id",
  "text": "doctor response",
  "is_from_user": false,
  "timestamp": "ISO8601"
}
```

### Billing

#### POST /api/billing/subscribe
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
  "expires_at": "ISO8601",
  "features": ["unlimited_checks", ...]
}
```

## Implementation Notes

- **Triage Logic**: Follows `prompts_clinical_triage_v2.md` strictly
  - Never repeats questions
  - Max 6 questions
  - Red flag detection
  - Stops when confidence ≥ 80% or triage clear

- **Chat Logic**: Follows `prompts_doctor_chat_v2.md` strictly
  - Warm, friendly tone
  - Short sentences
  - No medical jargon
  - Handles diagnosis requests and anxiety

- **Session Storage**: Currently in-memory (use Redis/DB in production)

## Production Considerations

1. Replace in-memory session storage with Redis or database
2. Add authentication middleware
3. Add rate limiting
4. Add logging and monitoring
5. Integrate with AI services (OpenAI, Anthropic, etc.) for enhanced responses
6. Add input validation and sanitization
7. Add error tracking (Sentry, etc.)
