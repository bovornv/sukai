-- Fix: Create user_profiles table if missing
-- This might fail if auth.users doesn't exist, so we'll make it optional

-- Users table (using Supabase Auth users, but we can extend with profile data)
-- Note: If auth.users doesn't exist, remove the REFERENCES constraint
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint if auth.users exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    ALTER TABLE public.user_profiles 
    DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
    
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create trigger if not exists
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

