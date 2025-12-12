# Database Setup Instructions

## Step 1: Create Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Open `backend/database/schema.sql` and copy all contents
5. Paste into SQL Editor and click **Run**

This will create:
- `user_profiles` - Extended user profile data
- `subscriptions` - User subscription plans
- `triage_sessions` - Triage assessment sessions
- `diagnoses` - Final triage results
- `chat_messages` - Chat conversation history

## Step 2: Set Up Row Level Security

1. Still in SQL Editor
2. Open `backend/database/rls_policies.sql` and copy all contents
3. Paste into SQL Editor and click **Run**

This enables RLS and creates policies so:
- Users can only see their own data
- Anonymous users can create sessions but can't see other users' data
- Admin operations (using service_role key) bypass RLS

## Step 3: Verify Setup

Run the test script:
```bash
cd backend
npm run test:supabase
```

Then test your API endpoints - they should now save data to Supabase!

## Database Schema Overview

### subscriptions
- Stores user subscription plans (free, pro, premium_doctor)
- Tracks expiration dates
- One active subscription per user

### triage_sessions
- Stores triage assessment sessions
- Tracks symptoms, answers, questions asked
- Links to user_id when authenticated

### diagnoses
- Stores final triage results
- Contains summary and recommendations
- Linked to triage_sessions via session_id

### chat_messages
- Stores all chat messages (both user and bot)
- Linked to session_id and user_id
- Used for conversation history

## Notes

- All tables support anonymous users (user_id can be NULL)
- RLS policies allow anonymous users to create data but not view others'
- Use `supabaseAdmin` client in backend functions to bypass RLS when needed
- Indexes are created for performance on common queries

