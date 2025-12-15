import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
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
  // Use supabaseAdmin to bypass RLS (backend doesn't have user's auth token)
  const { data, error } = await supabaseAdmin
    .from('followup_checkins')
    .insert({
      session_id: session_id,
      user_id: userId || null,
      status: status,
      notes: notes || null,
      // Don't set created_at explicitly - let database default handle it
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving follow-up check-in:', error);
    return res.status(500).json({ 
      error: 'Failed to save check-in', 
      details: error.message 
    });
  }
  
  // Check if escalation needed (status = 'worse')
  if (status === 'worse') {
    // Get original triage level
    // Use supabaseAdmin to bypass RLS
    const { data: session } = await supabaseAdmin
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
  
  // Use supabaseAdmin to bypass RLS (backend doesn't have user's auth token)
  let query = supabaseAdmin
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
    console.error('Error fetching check-ins:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch check-ins', 
      details: error.message 
    });
  }
  
  res.json({ checkins: data || [] });
}));

export default router;

