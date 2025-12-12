# Quick Start: Run SQL Scripts

## Option 1: Copy-Paste Method (Easiest)

### Step 1: Open SQL Editor
1. Go to: https://supabase.com/dashboard/project/uuuqpiaclmleclsylfqh/sql
2. Sign in if prompted

### Step 2: Run Schema SQL
1. Open `backend/database/schema.sql` in your editor
2. Copy ALL contents (Cmd+A, Cmd+C)
3. Paste into Supabase SQL Editor
4. Click **Run** button (or press Cmd+Enter / Ctrl+Enter)
5. Wait for "Success" message

### Step 3: Run RLS Policies SQL
1. Open `backend/database/rls_policies.sql` in your editor
2. Copy ALL contents (Cmd+A, Cmd+C)
3. Paste into Supabase SQL Editor (clear previous SQL first)
4. Click **Run** button
5. Wait for "Success" message

### Step 4: Verify
1. Go to **Table Editor** in Supabase Dashboard
2. You should see these tables:
   - `user_profiles`
   - `subscriptions`
   - `triage_sessions`
   - `diagnoses`
   - `chat_messages`

## Option 2: Use Helper Script

```bash
cd backend/database
./run-sql.sh
```

This will display both SQL files for easy copy-paste.

## Troubleshooting

**Error: "relation already exists"**
- Tables already exist, that's OK! The `IF NOT EXISTS` clauses prevent errors.

**Error: "permission denied"**
- Make sure you're logged into the correct Supabase account
- Check that you're in the right project

**Error: "extension uuid-ossp does not exist"**
- This shouldn't happen, but if it does, Supabase should auto-create it
- Try running just the CREATE EXTENSION line first

## Next Steps

After running both SQL scripts:
1. Test your backend: `cd backend && npm start`
2. Test API endpoints - they should now save to Supabase!
3. Check Supabase Table Editor to see your data

