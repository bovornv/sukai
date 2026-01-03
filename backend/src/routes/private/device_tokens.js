/**
 * PRIVATE Device Token Routes
 * 
 * These endpoints require authentication and handle:
 * - User device token registration
 * - Push notification management
 */

import express from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/private/device-tokens/register
 * Register or update a device token - requires authentication
 */
router.post('/register', requireAuth, asyncHandler(async (req, res) => {
  const { token, platform, app_version } = req.body;
  const userId = req.userId; // From auth middleware
  
  if (!token) {
    return res.status(400).json({ 
      error: 'token is required' 
    });
  }
  
  const validPlatforms = ['ios', 'android', 'web'];
  if (platform && !validPlatforms.includes(platform)) {
    return res.status(400).json({ 
      error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` 
    });
  }
  
  try {
    const { data: existing } = await supabaseAdmin
      .from('device_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('token', token)
      .single();
    
    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from('device_tokens')
        .update({
          active: true,
          platform: platform || null,
          app_version: app_version || null,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      
      if (updateError) {
        throw updateError;
      }
      
      return res.json({
        success: true,
        message: 'Device token updated',
        token_id: existing.id,
      });
    } else {
      const { data, error } = await supabaseAdmin
        .from('device_tokens')
        .insert({
          user_id: userId,
          token: token,
          platform: platform || null,
          app_version: app_version || null,
          active: true,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return res.json({
        success: true,
        message: 'Device token registered',
        token_id: data.id,
      });
    }
  } catch (err) {
    console.error('Error registering device token:', err);
    return res.status(500).json({ 
      error: 'Failed to register device token',
      details: err.message 
    });
  }
}));

/**
 * DELETE /api/private/device-tokens/:token
 * Unregister a device token - requires authentication
 */
router.delete('/:token', requireAuth, asyncHandler(async (req, res) => {
  const { token } = req.params;
  const userId = req.userId; // From auth middleware
  
  try {
    const { error } = await supabaseAdmin
      .from('device_tokens')
      .update({ active: false })
      .eq('user_id', userId)
      .eq('token', token);
    
    if (error) {
      throw error;
    }
    
    return res.json({
      success: true,
      message: 'Device token unregistered',
    });
  } catch (err) {
    console.error('Error unregistering device token:', err);
    return res.status(500).json({ 
      error: 'Failed to unregister device token',
      details: err.message 
    });
  }
}));

/**
 * GET /api/private/device-tokens/user
 * Get user's active device tokens - requires authentication
 */
router.get('/user', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId; // From auth middleware
  
  try {
    const { data, error } = await supabaseAdmin
      .from('device_tokens')
      .select('id, platform, app_version, created_at, last_used_at')
      .eq('user_id', userId)
      .eq('active', true);
    
    if (error) {
      throw error;
    }
    
    return res.json({
      success: true,
      tokens: data || [],
      count: (data || []).length,
    });
  } catch (err) {
    console.error('Error fetching device tokens:', err);
    return res.status(500).json({ 
      error: 'Failed to fetch device tokens',
      details: err.message 
    });
  }
}));

export default router;

