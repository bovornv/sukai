-- Add Health Profile Fields to user_profiles table
-- Required fields: gender, birth_date (not age), weight, height, chronic_diseases, drug_allergies

-- Add new columns to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS chronic_diseases TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS drug_allergies TEXT[] DEFAULT '{}';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_birth_date ON public.user_profiles(birth_date);

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.gender IS 'เพศ: male, female, other';
COMMENT ON COLUMN public.user_profiles.birth_date IS 'วันเดือนปีเกิด (พ.ศ.) - ระบบคำนวณอายุเอง';
COMMENT ON COLUMN public.user_profiles.weight_kg IS 'น้ำหนัก (กก.)';
COMMENT ON COLUMN public.user_profiles.height_cm IS 'ส่วนสูง (ซม.)';
COMMENT ON COLUMN public.user_profiles.chronic_diseases IS 'โรคประจำตัว (array)';
COMMENT ON COLUMN public.user_profiles.drug_allergies IS 'แพ้ยา (array) - ถ้าไม่มีให้เป็น empty array';

