-- SukAI Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (using Supabase Auth users, but we can extend with profile data)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'premium_doctor')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan, status) WHERE status = 'active'
);

-- Triage sessions table
CREATE TABLE IF NOT EXISTS public.triage_sessions (
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

-- Diagnoses table (final triage results)
CREATE TABLE IF NOT EXISTS public.diagnoses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL REFERENCES triage_sessions(session_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  triage_level TEXT NOT NULL CHECK (triage_level IN ('self_care', 'pharmacy', 'gp', 'emergency', 'uncertain')),
  summary TEXT NOT NULL,
  recommendations JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  is_from_user BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_triage_sessions_user_id ON triage_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_triage_sessions_session_id ON triage_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_session_id ON diagnoses(session_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_user_id ON diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_triage_sessions_updated_at BEFORE UPDATE ON triage_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

