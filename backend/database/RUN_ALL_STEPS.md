# Run All Steps - Quick Guide

## Step 1: Run Schema SQL ✅

1. **Copy SQL**: Open `STEP1_SCHEMA.sql` in your editor
2. **Select All**: Cmd+A (or Ctrl+A)
3. **Copy**: Cmd+C (or Ctrl+C)
4. **Paste in Supabase**: 
   - Go to: https://supabase.com/dashboard/project/uuuqpiaclmleclsylfqh/sql/new
   - Click in the SQL editor
   - Paste: Cmd+V (or Ctrl+V)
5. **Run**: Click "Run" button or press Cmd+Enter (Ctrl+Enter)
6. **Wait**: Look for "Success" message

## Step 2: Run RLS Policies SQL ✅

1. **Clear Editor**: Select all in SQL editor and delete, or click "New Query"
2. **Copy SQL**: Open `STEP2_RLS_POLICIES.sql` in your editor
3. **Select All**: Cmd+A
4. **Copy**: Cmd+C
5. **Paste**: Paste into SQL editor (Cmd+V)
6. **Run**: Click "Run" or press Cmd+Enter
7. **Wait**: Look for "Success" message

## Step 3: Verify Tables ✅

Run this command to verify all tables were created:

```bash
cd backend
npm run verify:db
```

You should see:
```
✅ user_profiles - Table exists
✅ subscriptions - Table exists
✅ triage_sessions - Table exists
✅ diagnoses - Table exists
✅ chat_messages - Table exists

✅ All tables verified successfully!
```

## Step 4: Test Backend ✅

Start your backend server:

```bash
cd backend
npm start
```

Then test an API endpoint (in another terminal):

```bash
# Test triage endpoint
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-123", "symptom": "ปวดหัว"}'
```

Check Supabase Table Editor to see the data saved!

## Quick Copy Commands

If you're in the terminal, you can also:

```bash
# Display Step 1 SQL
cat backend/database/STEP1_SCHEMA.sql

# Display Step 2 SQL  
cat backend/database/STEP2_RLS_POLICIES.sql
```

Then copy-paste into Supabase SQL Editor.

