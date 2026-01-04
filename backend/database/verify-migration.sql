-- Verification Query for Medical-Grade Profile Fields Migration
-- Run this AFTER executing add-medical-profile-fields.sql

-- Check if all new columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN (
  'is_pregnant',
  'is_breastfeeding',
  'surgery_history',
  'current_medications',
  'occasional_medications',
  'supplements',
  'food_allergies',
  'other_allergies'
)
ORDER BY column_name;

-- Expected result: 8 rows should be returned
-- All should have data_type: boolean (for is_pregnant, is_breastfeeding) or ARRAY (for others)
-- All should have is_nullable: YES

-- Test insert with new fields
-- (This is just a test - don't run on production data)
/*
INSERT INTO public.user_profiles (
  id,
  full_name,
  gender,
  birth_date,
  weight_kg,
  height_cm,
  chronic_diseases,
  drug_allergies,
  is_pregnant,
  is_breastfeeding,
  surgery_history,
  current_medications,
  occasional_medications,
  supplements,
  food_allergies,
  other_allergies
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Test User',
  'female',
  '1990-01-01',
  60.0,
  165.0,
  ARRAY['เบาหวาน'],
  ARRAY['พาราเซตามอล'],
  false,
  false,
  ARRAY['ผ่าตัดไส้ติ่ง'],
  ARRAY['เมทฟอร์มิน'],
  ARRAY[]::text[],
  ARRAY['วิตามินดี'],
  ARRAY['ถั่วลิสง'],
  ARRAY['ยาง']
) ON CONFLICT (id) DO NOTHING;
*/
