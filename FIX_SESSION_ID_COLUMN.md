# Fix: Column `session_id` does not exist

## Problem
Railway logs show: `column triage_sessions.session_id does not exist`

This means the `triage_sessions` table in Supabase doesn't have the `session_id` column.

## Solution: Run SQL Fix in Supabase

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**

### Step 2: Run This SQL Script

```sql
-- Fix: Add session_id column if missing
DO $$
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'triage_sessions' 
    AND column_name = 'session_id'
  ) THEN
    -- Add session_id column
    ALTER TABLE public.triage_sessions 
    ADD COLUMN session_id TEXT;
    
    -- Make it unique
    ALTER TABLE public.triage_sessions 
    ADD CONSTRAINT triage_sessions_session_id_unique UNIQUE (session_id);
    
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_triage_sessions_session_id 
    ON triage_sessions(session_id);
    
    RAISE NOTICE 'Added session_id column';
  ELSE
    RAISE NOTICE 'session_id column already exists';
  END IF;
END $$;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'triage_sessions'
ORDER BY ordinal_position;
```

### Step 3: Verify
After running, you should see `session_id` in the column list.

### Step 4: Test Backend
The Railway backend should now work. Test:
```bash
curl https://sukai-production.up.railway.app/health
```

## Alternative: Recreate Table (if above doesn't work)

If the fix doesn't work, you may need to recreate the table:

```sql
-- Drop and recreate triage_sessions table
DROP TABLE IF EXISTS public.triage_sessions CASCADE;

CREATE TABLE public.triage_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  symptoms TEXT[] DEFAULT '{}',
  answers JSONB DEFAULT '{}',
  questions_asked TEXT[] DEFAULT '{}',
  question_count INTEGER DEFAULT 0,
  triage_level TEXT CHECK (triage_level IN ('self_care', 'pharmacy', 'gp', 'emergency', 'uncertain')),
  confidence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_triage_sessions_user_id ON triage_sessions(user_id);
CREATE INDEX idx_triage_sessions_session_id ON triage_sessions(session_id);
```

**Warning:** This will delete all existing triage sessions!

