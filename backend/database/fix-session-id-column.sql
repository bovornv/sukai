-- Fix: Ensure session_id column exists in triage_sessions table
-- Run this in Supabase SQL Editor if you get "column session_id does not exist" error

-- Check if column exists, if not add it
DO $$
BEGIN
  -- Check if session_id column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'triage_sessions' 
    AND column_name = 'session_id'
  ) THEN
    -- Add session_id column if it doesn't exist
    ALTER TABLE public.triage_sessions 
    ADD COLUMN session_id TEXT;
    
    -- Make it unique if there's data
    ALTER TABLE public.triage_sessions 
    ADD CONSTRAINT triage_sessions_session_id_unique UNIQUE (session_id);
    
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_triage_sessions_session_id 
    ON triage_sessions(session_id);
    
    RAISE NOTICE 'Added session_id column to triage_sessions';
  ELSE
    RAISE NOTICE 'session_id column already exists';
  END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'triage_sessions'
ORDER BY ordinal_position;

