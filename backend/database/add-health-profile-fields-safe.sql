-- Add Health Profile Fields to user_profiles table (Safe Version)
-- This version checks if table exists first, creates it if needed, then adds columns

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add foreign key constraint if auth.users exists
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

-- Step 3: Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger for updated_at if not exists
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Add health profile columns (safe - uses IF NOT EXISTS)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS chronic_diseases TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS drug_allergies TEXT[] DEFAULT '{}';

-- Step 6: Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_birth_date ON public.user_profiles(birth_date);

-- Step 7: Add comments for documentation
COMMENT ON COLUMN public.user_profiles.gender IS 'เพศ: male, female, other';
COMMENT ON COLUMN public.user_profiles.birth_date IS 'วันเดือนปีเกิด (พ.ศ.) - ระบบคำนวณอายุเอง';
COMMENT ON COLUMN public.user_profiles.weight_kg IS 'น้ำหนัก (กก.)';
COMMENT ON COLUMN public.user_profiles.height_cm IS 'ส่วนสูง (ซม.)';
COMMENT ON COLUMN public.user_profiles.chronic_diseases IS 'โรคประจำตัว (array)';
COMMENT ON COLUMN public.user_profiles.drug_allergies IS 'แพ้ยา (array) - ถ้าไม่มีให้เป็น empty array';

