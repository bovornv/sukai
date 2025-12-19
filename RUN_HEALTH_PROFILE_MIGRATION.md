# Run Health Profile Migration in Supabase

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your SukAI project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Copy SQL Migration
Copy the entire contents of `backend/database/add-health-profile-fields.sql`:

```sql
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
```

### Step 3: Run SQL
1. Paste the SQL into the SQL Editor
2. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)
3. Wait for success message: "Success. No rows returned"

### Step 4: Verify Migration
Run this query to verify the columns were added:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;
```

You should see the new columns:
- `gender` (text)
- `birth_date` (date)
- `weight_kg` (numeric)
- `height_cm` (numeric)
- `chronic_diseases` (ARRAY)
- `drug_allergies` (ARRAY)

### Step 5: Test Health Profile Form
1. Run the Flutter app
2. Go to Profile page
3. Click "แก้ไขข้อมูลสุขภาพ"
4. Fill out the form and save
5. Verify data appears in Supabase Table Editor → `user_profiles`

---

## ✅ Success Indicators

- ✅ SQL runs without errors
- ✅ New columns appear in `user_profiles` table
- ✅ Health profile form saves data successfully
- ✅ Profile page displays health data

---

## 🐛 Troubleshooting

### Error: "column already exists"
**Solution**: The columns already exist. This is fine - the migration uses `IF NOT EXISTS` so it's safe to run again.

### Error: "relation user_profiles does not exist"
**Solution**: Run `backend/database/STEP1_SCHEMA.sql` first to create the table.

### Error: Permission denied
**Solution**: Make sure you're using the SQL Editor (not a restricted user). Use the service role key if needed.

---

**Migration Complete! 🎉**

After running this migration, the Health Profile Gate system will be fully functional.

