-- Row Level Security Policies for SukAI
-- Run this in Supabase SQL Editor AFTER running schema.sql

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Subscriptions Policies
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Triage Sessions Policies
CREATE POLICY "Users can view their own triage sessions"
  ON public.triage_sessions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own triage sessions"
  ON public.triage_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own triage sessions"
  ON public.triage_sessions FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Diagnoses Policies
CREATE POLICY "Users can view their own diagnoses"
  ON public.diagnoses FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own diagnoses"
  ON public.diagnoses FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Chat Messages Policies
CREATE POLICY "Users can view their own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Note: For anonymous users (user_id IS NULL), they can still create sessions
-- but won't be able to view other users' data due to RLS

