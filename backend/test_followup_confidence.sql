-- SQL Script to Verify Confidence Updates
-- Run this in Supabase SQL Editor after testing follow-up submissions

-- 1. Check follow-up check-ins with confidence deltas
SELECT 
  id,
  session_id,
  status,
  actions_taken,
  next_intent,
  confidence_delta,
  created_at
FROM followup_checkins
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check triage_sessions confidence updates
SELECT 
  session_id,
  triage_level,
  confidence,
  updated_at,
  created_at
FROM triage_sessions
WHERE session_id IN (
  SELECT DISTINCT session_id 
  FROM followup_checkins 
  ORDER BY created_at DESC 
  LIMIT 10
)
ORDER BY updated_at DESC;

-- 3. Verify confidence calculation
-- Expected: confidence should increase/decrease based on follow-up responses
SELECT 
  ts.session_id,
  ts.confidence AS current_confidence,
  SUM(fc.confidence_delta * 100) AS total_delta_applied,
  ts.confidence - COALESCE(SUM(fc.confidence_delta * 100), 0) AS original_confidence
FROM triage_sessions ts
LEFT JOIN followup_checkins fc ON ts.session_id = fc.session_id
WHERE ts.session_id IN (
  SELECT DISTINCT session_id 
  FROM followup_checkins 
  ORDER BY created_at DESC 
  LIMIT 5
)
GROUP BY ts.session_id, ts.confidence
ORDER BY ts.updated_at DESC;

-- 4. Check for escalation cases (worse status or emergency actions)
SELECT 
  fc.session_id,
  fc.status,
  fc.actions_taken,
  ts.triage_level,
  CASE 
    WHEN fc.status = 'worse' THEN '⚠️ Worse status - should trigger re-assessment'
    WHEN 'emergency' = ANY(fc.actions_taken) THEN '🚨 Emergency action - should force emergency flag'
    ELSE '✅ Normal follow-up'
  END AS escalation_status
FROM followup_checkins fc
LEFT JOIN triage_sessions ts ON fc.session_id = ts.session_id
WHERE fc.status = 'worse' OR 'emergency' = ANY(fc.actions_taken)
ORDER BY fc.created_at DESC
LIMIT 10;

