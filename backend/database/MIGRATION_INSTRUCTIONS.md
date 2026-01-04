# Database Migration Instructions

## Add Medical-Grade Profile Fields

This migration adds new medical-grade profile fields to support Ada-style assessment flow.

### Step 1: Run the Migration

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `add-medical-profile-fields.sql`
4. Execute the SQL script

### Step 2: Verify Migration

Run this query to verify all columns were added:

```sql
SELECT column_name, data_type, is_nullable
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
```

### Step 3: Test Backend Integration

After migration, test that:
1. Backend loads all new fields from `user_profiles` table
2. `isMedicationSafe` function checks all allergies and medications
3. OTC recommendations respect pregnancy/breastfeeding status
4. Drug interaction checks work with current medications

### Rollback (if needed)

If you need to rollback, run:

```sql
ALTER TABLE public.user_profiles
DROP COLUMN IF EXISTS is_pregnant,
DROP COLUMN IF EXISTS is_breastfeeding,
DROP COLUMN IF EXISTS surgery_history,
DROP COLUMN IF EXISTS current_medications,
DROP COLUMN IF EXISTS occasional_medications,
DROP COLUMN IF EXISTS supplements,
DROP COLUMN IF EXISTS food_allergies,
DROP COLUMN IF EXISTS other_allergies;
```

**Note:** This will delete all data in these columns. Only use if absolutely necessary.
