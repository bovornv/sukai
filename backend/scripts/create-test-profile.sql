-- Create Test Profile with All Medical Fields
-- Use this to create a comprehensive test profile for backend testing
-- Replace {your_user_id} with your actual user ID from Supabase Auth

-- Option 1: Update existing profile
UPDATE public.user_profiles
SET 
  -- Basic Information (required)
  full_name = 'Test User Medical',
  gender = 'female',
  birth_date = '1990-01-15',
  weight_kg = 60.0,
  height_cm = 165.0,
  
  -- Health Background
  chronic_diseases = ARRAY['เบาหวาน', 'ความดันโลหิตสูง'],
  
  -- Special Conditions
  is_pregnant = false,
  is_breastfeeding = false,
  
  -- Surgery History
  surgery_history = ARRAY['ผ่าตัดไส้ติ่ง (2020)', 'ผ่าตัดถุงน้ำดี (2022)'],
  
  -- Medications
  current_medications = ARRAY['เมทฟอร์มิน 500mg', 'โลซาร์แทน 50mg'],
  occasional_medications = ARRAY['พาราเซตามอล'],
  supplements = ARRAY['วิตามินดี', 'แคลเซียม'],
  
  -- Allergies (CRITICAL for testing)
  drug_allergies = ARRAY['พาราเซตามอล', 'แอสไพริน'],
  food_allergies = ARRAY['ถั่วลิสง', 'กุ้ง'],
  other_allergies = ARRAY['ยาง', 'ฝุ่น']
WHERE id = '{your_user_id}'::uuid;

-- Option 2: Insert new test profile (if user doesn't exist in user_profiles)
-- First, create user in Supabase Auth, then run:
/*
INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  gender,
  birth_date,
  weight_kg,
  height_cm,
  chronic_diseases,
  is_pregnant,
  is_breastfeeding,
  surgery_history,
  current_medications,
  occasional_medications,
  supplements,
  drug_allergies,
  food_allergies,
  other_allergies
) VALUES (
  '{your_user_id}'::uuid,
  'test@example.com',
  'Test User Medical',
  'female',
  '1990-01-15',
  60.0,
  165.0,
  ARRAY['เบาหวาน', 'ความดันโลหิตสูง'],
  false,
  false,
  ARRAY['ผ่าตัดไส้ติ่ง'],
  ARRAY['เมทฟอร์มิน'],
  ARRAY['พาราเซตามอล'],
  ARRAY['วิตามินดี'],
  ARRAY['พาราเซตามอล', 'แอสไพริน'],
  ARRAY['ถั่วลิสง'],
  ARRAY['ยาง']
);
*/

-- Verify profile was created/updated
SELECT 
  full_name,
  gender,
  birth_date,
  weight_kg,
  height_cm,
  chronic_diseases,
  is_pregnant,
  is_breastfeeding,
  surgery_history,
  current_medications,
  occasional_medications,
  supplements,
  drug_allergies,
  food_allergies,
  other_allergies
FROM public.user_profiles
WHERE id = '{your_user_id}'::uuid;
