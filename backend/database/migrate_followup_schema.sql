-- Migration: Update followup_checkins table to support comprehensive follow-up data
-- Run this in Supabase SQL Editor

-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- Add actions_taken column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'followup_checkins' AND column_name = 'actions_taken'
  ) THEN
    ALTER TABLE public.followup_checkins 
    ADD COLUMN actions_taken TEXT[] DEFAULT '{}';
  END IF;

  -- Add next_intent column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'followup_checkins' AND column_name = 'next_intent'
  ) THEN
    ALTER TABLE public.followup_checkins 
    ADD COLUMN next_intent TEXT CHECK (next_intent IN ('recheck', 'medication', 'previous', 'nothing'));
  END IF;

  -- Add confidence_delta column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'followup_checkins' AND column_name = 'confidence_delta'
  ) THEN
    ALTER TABLE public.followup_checkins 
    ADD COLUMN confidence_delta DECIMAL(5,2) DEFAULT 0;
  END IF;
END $$;

-- Update status constraint to include 'unsure'
ALTER TABLE public.followup_checkins 
DROP CONSTRAINT IF EXISTS followup_checkins_status_check;

ALTER TABLE public.followup_checkins 
ADD CONSTRAINT followup_checkins_status_check 
CHECK (status IN ('better', 'same', 'worse', 'unsure'));

