-- Follow-up Notifications Table
-- Stores scheduled notifications for 24-48 hour follow-ups after assessments
-- Supports notification scheduling, sending, and response tracking

CREATE TABLE IF NOT EXISTS public.followup_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('24h', '48h', 'safety')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  response TEXT CHECK (response IN ('improved', 'same', 'worse', 'unsure', 'skip', 'reassess', 'doctor')),
  dismissed BOOLEAN DEFAULT FALSE,
  symptom TEXT,
  has_red_flags BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_session FOREIGN KEY (session_id) 
    REFERENCES triage_sessions(session_id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled 
  ON followup_notifications(scheduled_at) 
  WHERE sent_at IS NULL AND dismissed = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_session 
  ON followup_notifications(session_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user 
  ON followup_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_pending 
  ON followup_notifications(scheduled_at, sent_at, dismissed) 
  WHERE sent_at IS NULL AND dismissed = FALSE;

-- Row Level Security Policies
ALTER TABLE followup_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON followup_notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can insert their own notifications (via backend)
CREATE POLICY "Backend can insert notifications"
  ON followup_notifications FOR INSERT
  WITH CHECK (true); -- Backend uses service role

-- Policy: Users can update their own notifications (respond, dismiss)
CREATE POLICY "Users can update their own notifications"
  ON followup_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON followup_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_followup_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_followup_notifications_timestamp
  BEFORE UPDATE ON followup_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_followup_notifications_updated_at();

