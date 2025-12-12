# ✅ Database Setup Complete!

## What Was Done

### 1. Database Schema Created ✅
Created SQL schema file: `backend/database/schema.sql`
- `user_profiles` - Extended user profile data
- `subscriptions` - Subscription plans (free, pro, premium_doctor)
- `triage_sessions` - Triage assessment sessions with symptoms, answers, questions
- `diagnoses` - Final triage results with recommendations
- `chat_messages` - Chat conversation history

### 2. Row Level Security Policies Created ✅
Created RLS policies file: `backend/database/rls_policies.sql`
- Users can only view/update their own data
- Anonymous users can create sessions but can't see others' data
- Admin operations bypass RLS using service_role key

### 3. Functions Integrated with Supabase ✅

**Billing Function** (`backend/src/functions/billing/index.js`)
- Saves subscriptions to `subscriptions` table
- Deactivates old subscriptions when new one is created
- Returns subscription_id in response

**Triage Function** (`backend/src/functions/triage/index.js`)
- Saves sessions to `triage_sessions` table
- Loads sessions from database (with in-memory fallback)
- Saves final diagnoses to `diagnoses` table
- Supports anonymous users (user_id can be NULL)

**Chat Function** (`backend/src/functions/chat/index.js`)
- Saves both user messages and bot responses to `chat_messages` table
- Links messages to session_id and user_id
- Supports anonymous users

### 4. Routes Updated ✅
All routes now pass `userId` from headers to functions:
- `backend/src/routes/billing.js`
- `backend/src/routes/triage.js`
- `backend/src/routes/chat.js`

## Next Steps: Run SQL Scripts

### Step 1: Create Tables
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `uuuqpiaclmleclsylfqh`
3. Click **SQL Editor** (left sidebar)
4. Open `backend/database/schema.sql`
5. Copy all contents and paste into SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Enable RLS
1. Still in SQL Editor
2. Open `backend/database/rls_policies.sql`
3. Copy all contents and paste into SQL Editor
4. Click **Run**

### Step 3: Test
```bash
cd backend
npm start
```

Then test your API endpoints - they will now save data to Supabase!

## How It Works

### Anonymous Users
- Can create sessions, messages, and diagnoses
- `user_id` will be `NULL` in database
- RLS allows creation but prevents viewing others' data

### Authenticated Users
- Pass `x-user-id` header in API requests
- Data will be linked to their user_id
- Can view their own historical data

### Admin Operations
- Backend uses `supabaseAdmin` client (service_role key)
- Bypasses RLS for server-side operations
- Used for creating/updating data on behalf of users

## Database Structure

```
subscriptions
├── user_id (UUID, nullable)
├── plan (free|pro|premium_doctor)
├── status (active|expired|cancelled)
└── expires_at (TIMESTAMPTZ, nullable)

triage_sessions
├── session_id (TEXT, unique)
├── user_id (UUID, nullable)
├── symptoms (TEXT[])
├── answers (JSONB)
├── questions_asked (TEXT[])
├── question_count (INTEGER)
└── triage_level (self_care|pharmacy|gp|emergency|uncertain)

diagnoses
├── session_id (TEXT, FK to triage_sessions)
├── user_id (UUID, nullable)
├── triage_level (TEXT)
├── summary (TEXT)
└── recommendations (JSONB)

chat_messages
├── session_id (TEXT)
├── user_id (UUID, nullable)
├── message (TEXT)
├── response (TEXT)
└── is_from_user (BOOLEAN)
```

## Error Handling

All functions have graceful degradation:
- If database save fails, logs warning but continues
- Falls back to in-memory cache for triage sessions
- API responses still work even if DB is unavailable

## Testing

Test the integration:
```bash
# Test Supabase connection
npm run test:supabase

# Start server
npm start

# Test API (in another terminal)
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-123", "symptom": "ปวดหัว"}'
```

Then check Supabase Dashboard → Table Editor to see the data!

