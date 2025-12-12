/**
 * Fix missing user_profiles table and verify all tables
 * Run with: node database/fix-and-verify.js
 */
import dotenv from 'dotenv';
import { supabaseAdmin } from '../src/config/supabase.js';

dotenv.config();

const FIX_SQL = `
-- Fix: Create user_profiles table if missing
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint if auth.users exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    ALTER TABLE public.user_profiles 
    DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
    
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
`;

async function fixAndVerify() {
  console.log('🔧 Fixing missing user_profiles table...\n');

  try {
    // Try to create the table using raw SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: FIX_SQL });
    
    if (error) {
      // If RPC doesn't work, try direct query
      console.log('⚠️  RPC method not available, trying alternative...');
      // We'll need to run this manually in SQL Editor
      console.log('\n📋 Please run this SQL in Supabase SQL Editor:');
      console.log('─'.repeat(60));
      console.log(FIX_SQL);
      console.log('─'.repeat(60));
    } else {
      console.log('✅ user_profiles table created successfully!\n');
    }
  } catch (err) {
    console.log('⚠️  Could not auto-fix. Please run SQL manually.\n');
    console.log('📋 SQL to run in Supabase SQL Editor:');
    console.log('─'.repeat(60));
    console.log(FIX_SQL);
    console.log('─'.repeat(60));
  }

  // Verify all tables
  console.log('\n🔍 Verifying all tables...\n');
  
  const REQUIRED_TABLES = [
    'user_profiles',
    'subscriptions',
    'triage_sessions',
    'diagnoses',
    'chat_messages',
  ];

  const results = {
    success: [],
    missing: [],
  };

  for (const tableName of REQUIRED_TABLES) {
    try {
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(1);

      if (error && (error.code === 'PGRST116' || error.message.includes('does not exist'))) {
        results.missing.push(tableName);
        console.log(`❌ ${tableName} - Table not found`);
      } else {
        results.success.push(tableName);
        console.log(`✅ ${tableName} - Table exists`);
      }
    } catch (err) {
      results.missing.push(tableName);
      console.log(`❌ ${tableName} - Error: ${err.message}`);
    }
  }

  console.log('\n📊 Final Status:');
  console.log(`✅ Success: ${results.success.length}/${REQUIRED_TABLES.length}`);
  console.log(`❌ Missing: ${results.missing.length}`);

  if (results.missing.length > 0) {
    console.log('\n❌ Missing tables:');
    results.missing.forEach((table) => console.log(`   - ${table}`));
    console.log('\n💡 Run the fix SQL above in Supabase SQL Editor');
    return false;
  }

  console.log('\n🎉 All tables verified successfully!');
  console.log('✅ Database setup is 100% complete!');
  return true;
}

fixAndVerify().catch(console.error);

