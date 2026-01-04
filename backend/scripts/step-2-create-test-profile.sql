-- Step 2: Create Test Profile
-- Replace {your_user_id} with your actual UUID from Supabase Auth

-- Option 1: Update existing profile (Recommended)
UPDATE public.user_profiles
SET 
  -- Basic Information
  full_name = 'Test User Medical',
  gender = 'male',
  birth_date = '1990-01-15',
  weight_kg = 70.0,
  height_cm = 175.0,
  
  -- Health Background
  chronic_diseases = ARRAY['เบาหวาน'],
  
  -- Special Conditions
  is_pregnant = false,
  is_breastfeeding = false,
  
  -- Surgery History
  surgery_history = ARRAY['ผ่าตัดไส้ติ่ง (2020)'],
  
  -- Medications
  current_medications = ARRAY['เมทฟอร์มิน 500mg'],
  occasional_medications = ARRAY['พาราเซตามอล'],
  supplements = ARRAY['วิตามินดี'],
  
  -- Allergies (CRITICAL for testing safety checks)
  drug_allergies = ARRAY['พาราเซตามอล', 'แอสไพริน'],
  food_allergies = ARRAY['ถั่วลิสง'],
  other_allergies = ARRAY['ยาง']
WHERE id = 'fe1107c1-25f8-4202-9f4e-00dc911b61ae'::uuid;

-- Verify profile was updated
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
WHERE id = 'fe1107c1-25f8-4202-9f4e-00dc911b61ae'::uuid;

-- Expected output should show:
-- drug_allergies: {พาราเซตามอล,แอสไพริน}
-- current_medications: {เมทฟอร์มิน 500mg}
-- food_allergies: {ถั่วลิสง}
