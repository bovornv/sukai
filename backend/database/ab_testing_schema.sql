-- A/B Testing Schema for Suk AI
-- Run this in Supabase SQL Editor

-- A/B Test Assignments Table
-- Stores variant assignments for users (sticky assignment)
CREATE TABLE IF NOT EXISTS public.ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_name TEXT NOT NULL DEFAULT 'home_entry_v1',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT, -- For anonymous users
  variant TEXT NOT NULL CHECK (variant IN ('variantA', 'variantB')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B Test Events Table
-- Stores analytics events for A/B testing evaluation
CREATE TABLE IF NOT EXISTS public.ab_test_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_name TEXT NOT NULL DEFAULT 'home_entry_v1',
  variant TEXT NOT NULL CHECK (variant IN ('variantA', 'variantB')),
  event_type TEXT NOT NULL, -- 'home_page_viewed', 'assessment_started', 'assessment_completed', etc.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_id TEXT, -- For anonymous users
  session_id TEXT, -- Link to triage_sessions if applicable
  metadata JSONB DEFAULT '{}', -- Additional event data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_user_id ON ab_test_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_device_id ON ab_test_assignments(device_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_experiment ON ab_test_assignments(experiment_name, variant);

-- Partial unique indexes for sticky assignment (one variant per user/device per experiment)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ab_test_assignments_user_unique 
  ON ab_test_assignments(experiment_name, user_id) 
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ab_test_assignments_device_unique 
  ON ab_test_assignments(experiment_name, device_id) 
  WHERE device_id IS NOT NULL AND user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_ab_test_events_experiment ON ab_test_events(experiment_name, variant);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_event_type ON ab_test_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_user_id ON ab_test_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_device_id ON ab_test_events(device_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_created_at ON ab_test_events(created_at);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_session_id ON ab_test_events(session_id);

-- RLS Policies for A/B Testing Tables
ALTER TABLE public.ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own assignments
CREATE POLICY "Users can view their own ab test assignments"
  ON public.ab_test_assignments FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can insert their own assignments
CREATE POLICY "Users can insert their own ab test assignments"
  ON public.ab_test_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own events
CREATE POLICY "Users can view their own ab test events"
  ON public.ab_test_events FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can insert their own events
CREATE POLICY "Users can insert their own ab test events"
  ON public.ab_test_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Comments for documentation
COMMENT ON TABLE public.ab_test_assignments IS 'Stores A/B test variant assignments (sticky assignment)';
COMMENT ON TABLE public.ab_test_events IS 'Stores A/B test analytics events for evaluation';
COMMENT ON COLUMN public.ab_test_assignments.device_id IS 'Device ID for anonymous users (from local storage)';
COMMENT ON COLUMN public.ab_test_events.device_id IS 'Device ID for anonymous users';
COMMENT ON COLUMN public.ab_test_events.metadata IS 'Additional event data (question_count, triage_level, time_to_output_ms, etc.)';

