# Supabase Setup Guide

## Quick Setup

1. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com) and sign up/login
   - Click "New Project"
   - Fill in project details (name, database password, region)
   - Wait for project to be created (~2 minutes)

2. **Get your credentials**
   - Go to Project Settings → API
   - You'll see:
     - **Project URL**: https://uuuqpiaclmleclsylfqh.supabase.co
     - **anon public key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjE0NDQsImV4cCI6MjA4MTA5NzQ0NH0.l1Zk76YxZsYOfsdAESZ0wA6D6nGu8G0UwxREkafOmec
     - **service_role secret key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUyMTQ0NCwiZXhwIjoyMDgxMDk3NDQ0fQ.k4V_Di3qrnGY6QimlBCOrEVAe7OgsKVjYOGf3Y4z5pg

3. **Create `.env` file** ✅ DONE
   - The `.env` file has been created with your credentials
   - Located at: `backend/.env`

4. **Verify setup**
   ```bash
   # Test Supabase connection
   node src/config/test-supabase.js
   
   # Or start the server
   npm start
   ```
   
   If configured correctly, you won't see any warnings about missing environment variables.

## Using Supabase in Your Code

### Example: Query data
```javascript
import { supabase } from '../config/supabase.js';

// Regular query (respects RLS)
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
```

### Example: Admin operation (bypass RLS)
```javascript
import { supabaseAdmin } from '../config/supabase.js';

// Admin query (bypasses RLS - use carefully!)
const { data, error } = await supabaseAdmin
  .from('subscriptions')
  .insert({ user_id: userId, plan: 'pro' });
```

## Security Notes

- ✅ **Anon key**: Safe for client-side use (with RLS policies)
- ❌ **Service role key**: Server-side only, never expose to client
- 🔒 Always set up Row Level Security (RLS) policies in Supabase dashboard
- 🔒 Use service role key only when you need to bypass RLS for admin operations

## ✅ Setup Complete!

Your Supabase configuration is ready to use. Test it with:
```bash
npm run test:supabase
```

## Next Steps: Database Setup

### 1. Create Database Schema

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → **SQL Editor**
2. Copy contents from `backend/database/schema.sql`
3. Paste and click **Run**

This creates all required tables:
- `user_profiles` - User profile data
- `subscriptions` - Subscription plans
- `triage_sessions` - Triage assessment sessions  
- `diagnoses` - Final triage results
- `chat_messages` - Chat conversation history

### 2. Set Up Row Level Security

1. Still in SQL Editor
2. Copy contents from `backend/database/rls_policies.sql`
3. Paste and click **Run**

This enables RLS so users can only see their own data.

### 3. Verify Integration

All functions are now integrated with Supabase:
- ✅ **Billing** - Saves subscriptions to database
- ✅ **Triage** - Saves sessions and diagnoses to database
- ✅ **Chat** - Saves messages to database

Test your API endpoints - they should now persist data!

See `backend/database/README.md` for detailed instructions.

