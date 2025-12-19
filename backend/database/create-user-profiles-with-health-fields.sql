-- Create user_profiles table with health profile fields (if it doesn't exist)
-- This creates the table AND adds all health profile fields in one go

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  -- Health Profile Fields
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  birth_date DATE,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  chronic_diseases TEXT[] DEFAULT '{}',
  drug_allergies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint if auth.users exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    -- Drop existing constraint if it exists
    ALTER TABLE public.user_profiles 
    DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
    
    -- Add foreign key constraint
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at if not exists
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_birth_date ON public.user_profiles(birth_date);

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.gender IS 'เพศ: male, female, other';
COMMENT ON COLUMN public.user_profiles.birth_date IS 'วันเดือนปีเกิด (พ.ศ.) - ระบบคำนวณอายุเอง';
COMMENT ON COLUMN public.user_profiles.weight_kg IS 'น้ำหนัก (กก.)';
COMMENT ON COLUMN public.user_profiles.height_cm IS 'ส่วนสูง (ซม.)';
COMMENT ON COLUMN public.user_profiles.chronic_diseases IS 'โรคประจำตัว (array)';
COMMENT ON COLUMN public.user_profiles.drug_allergies IS 'แพ้ยา (array) - ถ้าไม่มีให้เป็น empty array';

