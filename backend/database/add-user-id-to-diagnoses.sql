-- Add user_id column to diagnoses table
-- This migration safely adds the user_id column if it doesn't exist

-- Step 1: Add user_id column if it doesn't exist
ALTER TABLE public.diagnoses
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 2: Create index for user_id if it doesn't exist (for faster queries)
CREATE INDEX IF NOT EXISTS idx_diagnoses_user_id ON public.diagnoses(user_id);

-- Step 3: Add comment for documentation
COMMENT ON COLUMN public.diagnoses.user_id IS 'User ID reference for filtering diagnoses by user';

-- Step 4: Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'diagnoses' 
  AND column_name = 'user_id';

