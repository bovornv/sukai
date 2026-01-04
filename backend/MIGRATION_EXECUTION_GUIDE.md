# Database Migration Execution Guide

## Step 1: Execute Database Migration

### Option A: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run Migration Script**
   - Open file: `backend/database/add-medical-profile-fields.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

3. **Verify Migration**
   - Run verification query from `backend/database/verify-migration.sql`
   - Expected: 8 rows returned (one for each new column)

### Option B: Command Line (if using Supabase CLI)

```bash
cd backend/database
supabase db execute --file add-medical-profile-fields.sql
```

### Expected Output

```
Success. No rows returned
```

This is normal - the migration adds columns, it doesn't return data.

## Step 2: Verify Migration Success

### Run Verification Query

```sql
SELECT 
  column_name,
  data_type,
  is_nullable
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

### Expected Result

| column_name | data_type | is_nullable |
|------------|-----------|-------------|
| current_medications | ARRAY | YES |
| food_allergies | ARRAY | YES |
| is_breastfeeding | boolean | YES |
| is_pregnant | boolean | YES |
| occasional_medications | ARRAY | YES |
| other_allergies | ARRAY | YES |
| supplements | ARRAY | YES |
| surgery_history | ARRAY | YES |

**8 rows total** - All columns should exist and be nullable.

## Step 3: Test with Sample Data

### Create Test Profile (Optional)

```sql
-- Update your existing profile with test data
UPDATE public.user_profiles
SET 
  is_pregnant = false,
  is_breastfeeding = false,
  surgery_history = ARRAY['ผ่าตัดไส้ติ่ง'],
  current_medications = ARRAY['เมทฟอร์มิน'],
  occasional_medications = ARRAY['พาราเซตามอล'],
  supplements = ARRAY['วิตามินดี'],
  food_allergies = ARRAY['ถั่วลิสง'],
  other_allergies = ARRAY['ยาง']
WHERE id = '{your_user_id}';
```

Replace `{your_user_id}` with your actual user ID.

## Troubleshooting

### Error: Column already exists
**Solution:** This is fine - the migration uses `IF NOT EXISTS`, so it's safe to run multiple times.

### Error: Permission denied
**Solution:** 
- Check you're using the correct database role
- Verify RLS policies allow updates
- Try running as database owner

### Error: Table doesn't exist
**Solution:** 
- Run base schema first: `backend/database/schema.sql`
- Or run: `backend/database/create-user-profiles-with-health-fields.sql`

### Verification returns 0 rows
**Solution:**
- Check table name is correct: `user_profiles` (not `user_profile`)
- Verify you're querying the correct schema: `public.user_profiles`
- Check column names match exactly (case-sensitive)

## Next Steps After Migration

1. ✅ Migration executed successfully
2. ✅ Verification query returns 8 rows
3. ⏭️ Test backend integration (see `TESTING_MEDICAL_PROFILE.md`)
4. ⏭️ Monitor backend logs for profile loading
