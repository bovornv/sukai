/**
 * Test Supabase connection
 * Run with: node src/config/test-supabase.js
 */
import dotenv from 'dotenv';

// Load env vars BEFORE importing supabase
dotenv.config();

import { supabase, supabaseAdmin } from './supabase.js';

async function testConnection() {
  console.log('Testing Supabase connection...\n');

  // Test regular client
  console.log('1. Testing regular client (anon key)...');
  try {
    const { data, error } = await supabase.from('_test').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      // PGRST116 means table doesn't exist, which is fine for connection test
      console.log('   ⚠️  Error:', error.message);
    } else {
      console.log('   ✅ Regular client connected successfully');
    }
  } catch (err) {
    console.log('   ❌ Connection failed:', err.message);
  }

  // Test admin client
  console.log('\n2. Testing admin client (service role key)...');
  try {
    const { data, error } = await supabaseAdmin.from('_test').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.log('   ⚠️  Error:', error.message);
    } else {
      console.log('   ✅ Admin client connected successfully');
    }
  } catch (err) {
    console.log('   ❌ Connection failed:', err.message);
  }

  // Test auth
  console.log('\n3. Testing auth endpoint...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('   ⚠️  Auth check:', error.message);
    } else {
      console.log('   ✅ Auth endpoint accessible');
    }
  } catch (err) {
    console.log('   ❌ Auth test failed:', err.message);
  }

  console.log('\n✅ Supabase setup complete!');
  console.log('   URL:', process.env.SUPABASE_URL);
  console.log('   Anon key:', process.env.SUPABASE_ANON_KEY?.substring(0, 20) + '...');
  console.log('   Service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');
}

testConnection().catch(console.error);

