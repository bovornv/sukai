-- Device Tokens Table
-- Stores FCM device tokens for push notifications

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  app_version TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Ensure one token per user per device (optional, can be relaxed)
  UNIQUE(user_id, token)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id 
  ON device_tokens(user_id) 
  WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_device_tokens_token 
  ON device_tokens(token);

CREATE INDEX IF NOT EXISTS idx_device_tokens_active 
  ON device_tokens(active) 
  WHERE active = TRUE;

-- Row Level Security Policies
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own device tokens
CREATE POLICY "Users can view their own device tokens"
  ON device_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own device tokens
CREATE POLICY "Users can insert their own device tokens"
  ON device_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own device tokens
CREATE POLICY "Users can update their own device tokens"
  ON device_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own device tokens
CREATE POLICY "Users can delete their own device tokens"
  ON device_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_used_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_device_tokens_timestamp
  BEFORE UPDATE ON device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_device_tokens_updated_at();

-- Function to deactivate old tokens (cleanup)
CREATE OR REPLACE FUNCTION deactivate_old_tokens()
RETURNS void AS $$
BEGIN
  -- Deactivate tokens not used in last 90 days
  UPDATE device_tokens
  SET active = FALSE
  WHERE active = TRUE
    AND last_used_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

