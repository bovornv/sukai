-- Add Medical-Grade Profile Fields to user_profiles table
-- These fields support Ada-style medical-grade assessment flow

-- Add new columns for medical-grade profile data
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_pregnant BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_breastfeeding BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS surgery_history TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_medications TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS occasional_medications TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS supplements TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS food_allergies TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS other_allergies TEXT[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.is_pregnant IS 'ตั้งครรภ์ (true/false/null)';
COMMENT ON COLUMN public.user_profiles.is_breastfeeding IS 'ให้นมบุตร (true/false/null)';
COMMENT ON COLUMN public.user_profiles.surgery_history IS 'ประวัติผ่าตัดสำคัญ (array)';
COMMENT ON COLUMN public.user_profiles.current_medications IS 'ยาประจำที่ใช้อยู่ (array)';
COMMENT ON COLUMN public.user_profiles.occasional_medications IS 'ยาที่ใช้เป็นครั้งคราว (array)';
COMMENT ON COLUMN public.user_profiles.supplements IS 'อาหารเสริม / สมุนไพร (array)';
COMMENT ON COLUMN public.user_profiles.food_allergies IS 'แพ้อาหาร (array)';
COMMENT ON COLUMN public.user_profiles.other_allergies IS 'แพ้อื่นๆ (array)';
