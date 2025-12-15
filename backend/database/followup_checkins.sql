-- Follow-up Check-ins Table
-- Stores user follow-up responses for triage sessions

CREATE TABLE IF NOT EXISTS public.followup_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID,
  status TEXT NOT NULL CHECK (status IN ('better', 'same', 'worse')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key to user_profiles (optional, allows anonymous check-ins)
  CONSTRAINT fk_user FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_followup_checkins_session_id 
  ON followup_checkins(session_id);
CREATE INDEX IF NOT EXISTS idx_followup_checkins_user_id 
  ON followup_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_followup_checkins_created_at 
  ON followup_checkins(created_at DESC);

-- Row Level Security Policies
ALTER TABLE followup_checkins ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own check-ins
CREATE POLICY "Users can view their own check-ins"
  ON followup_checkins FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can insert their own check-ins
CREATE POLICY "Users can insert their own check-ins"
  ON followup_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can update their own check-ins
CREATE POLICY "Users can update their own check-ins"
  ON followup_checkins FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own check-ins
CREATE POLICY "Users can delete their own check-ins"
  ON followup_checkins FOR DELETE
  USING (auth.uid() = user_id);

