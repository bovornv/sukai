import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Supabase environment variables not fully configured');
}

// Client for user-facing operations (uses anon key)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Admin client for server-side operations (uses service role key)
// Use this for operations that bypass RLS (Row Level Security)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

