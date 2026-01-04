# A/B Testing Database Setup

## Step 1: Create A/B Testing Tables

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Open `backend/database/ab_testing_schema.sql` and copy all contents
5. Paste into SQL Editor and click **Run**

This will create:
- `ab_test_assignments` - Stores variant assignments (sticky assignment)
- `ab_test_events` - Stores analytics events for evaluation

## Step 2: Verify Tables

Run this query in SQL Editor to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ab_test_assignments', 'ab_test_events');
```

You should see both tables listed.

## Step 3: Test Backend API

The backend API endpoints are now available:

- `GET /api/ab-testing/variant?device_id=<device_id>` - Get or assign variant
- `POST /api/ab-testing/track` - Track single event
- `POST /api/ab-testing/sync` - Sync multiple events
- `GET /api/ab-testing/analytics` - Get analytics summary

## Database Schema

### ab_test_assignments
- Stores variant assignments (variantA or variantB)
- Sticky assignment: Once assigned, user stays in that variant
- Supports both authenticated users (user_id) and anonymous users (device_id)

### ab_test_events
- Stores all analytics events
- Event types: `home_page_viewed`, `assessment_started`, `assessment_completed`, `emergency_detected`, `first_useful_output`, `return_visit`
- Metadata field stores additional data (question_count, triage_level, time_to_output_ms, etc.)

## Analytics Metrics

The analytics endpoint calculates:
- **Assessment start rate**: % of users who start assessment after viewing home page
- **Assessment completion rate**: % of users who complete assessment after starting
- **Emergency detection rate**: % of emergencies detected within ≤3 questions
- **Average time to first output**: Time from assessment start to first question
- **7-day return rate**: % of users who return within 7 days

## Next Steps

1. Run the SQL script in Supabase
2. Test the API endpoints
3. Mobile app will automatically sync events to backend
4. View analytics at `/api/ab-testing/analytics`

