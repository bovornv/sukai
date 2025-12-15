import express from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/followup/checkin
// Submit a follow-up check-in for a session
router.post('/checkin', asyncHandler(async (req, res) => {
  const { session_id, status, notes } = req.body;
  const userId = req.headers['x-user-id'];
  
  if (!session_id || !status) {
    return res.status(400).json({ error: 'session_id and status are required' });
  }
  
  if (!['better', 'same', 'worse'].includes(status)) {
    return res.status(400).json({ error: 'status must be: better, same, or worse' });
  }
  
  // Save follow-up check-in
  const { data, error } = await supabase
    .from('followup_checkins')
    .insert({
      session_id: session_id,
      user_id: userId || null,
      status: status,
      notes: notes || null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving follow-up check-in:', error);
    return res.status(500).json({ error: 'Failed to save check-in' });
  }
  
  // Check if escalation needed (status = 'worse')
  if (status === 'worse') {
    // Get original triage level
    const { data: session } = await supabase
      .from('triage_sessions')
      .select('triage_level')
      .eq('session_id', session_id)
      .single();
    
    // Note: Escalation logic can be added here
    // For now, we just log it
    if (session && session.triage_level !== 'emergency') {
      console.log(`⚠️  Escalation needed for session ${session_id}: status worsened`);
    }
  }
  
  res.json({ success: true, checkin: data });
}));

// GET /api/followup/checkins?session_id=xxx
// Get follow-up check-ins for a session
router.get('/checkins', asyncHandler(async (req, res) => {
  const { session_id } = req.query;
  const userId = req.headers['x-user-id'];
  
  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }
  
  let query = supabase
    .from('followup_checkins')
    .select('*')
    .eq('session_id', session_id)
    .order('created_at', { ascending: false });
  
  // If user is authenticated, filter by user_id
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
  
  res.json({ checkins: data || [] });
}));

export default router;

