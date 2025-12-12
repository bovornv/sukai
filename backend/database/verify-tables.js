/**
 * Verify that all tables were created successfully
 * Run with: node database/verify-tables.js
 */
import dotenv from 'dotenv';
import { supabaseAdmin } from '../src/config/supabase.js';

dotenv.config();

const REQUIRED_TABLES = [
  'user_profiles',
  'subscriptions',
  'triage_sessions',
  'diagnoses',
  'chat_messages',
];

async function verifyTables() {
  console.log('🔍 Verifying database tables...\n');

  const results = {
    success: [],
    missing: [],
    errors: [],
  };

  for (const tableName of REQUIRED_TABLES) {
    try {
      // Try to query the table (even if empty, it should exist)
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          results.missing.push(tableName);
          console.log(`❌ ${tableName} - Table not found`);
        } else {
          results.errors.push({ table: tableName, error: error.message });
          console.log(`⚠️  ${tableName} - Error: ${error.message}`);
        }
      } else {
        results.success.push(tableName);
        console.log(`✅ ${tableName} - Table exists`);
      }
    } catch (err) {
      results.errors.push({ table: tableName, error: err.message });
      console.log(`❌ ${tableName} - Exception: ${err.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Success: ${results.success.length}/${REQUIRED_TABLES.length}`);
  console.log(`❌ Missing: ${results.missing.length}`);
  console.log(`⚠️  Errors: ${results.errors.length}`);

  if (results.missing.length > 0) {
    console.log('\n❌ Missing tables:');
    results.missing.forEach((table) => console.log(`   - ${table}`));
    console.log('\n💡 Please run the SQL scripts in Supabase SQL Editor:');
    console.log('   1. Run STEP1_SCHEMA.sql');
    console.log('   2. Run STEP2_RLS_POLICIES.sql');
    process.exit(1);
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    results.errors.forEach(({ table, error }) => {
      console.log(`   - ${table}: ${error}`);
    });
  }

  if (results.success.length === REQUIRED_TABLES.length) {
    console.log('\n✅ All tables verified successfully!');
    console.log('🎉 Database setup complete!');
    return true;
  }

  return false;
}

verifyTables().catch(console.error);

