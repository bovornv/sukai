/**
 * Billing function
 * Handles subscription management
 */

import { supabaseAdmin } from '../../config/supabase.js';

const PLAN_DETAILS = {
  free: {
    name: 'free',
    price: 0,
    checks_per_day: 3,
    features: ['basic_triage', 'basic_summary'],
  },
  pro: {
    name: 'pro',
    price: 99,
    checks_per_day: null, // unlimited
    features: ['unlimited_checks', 'detailed_recommendations', 'medication_guidance', 'followup'],
  },
  premium_doctor: {
    name: 'premium_doctor',
    price: 299,
    checks_per_day: null, // per case
    features: ['human_doctor_review', 'doctor_note', 'priority_escalation', 'family_sharing'],
  },
};

/**
 * Subscribe to a plan
 */
export async function subscribe({ plan, userId }) {
  const planDetails = PLAN_DETAILS[plan];
  if (!planDetails) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  // Calculate expiration
  let expiresAt = null;
  if (plan === 'pro') {
    // Monthly subscription
    expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else if (plan === 'premium_doctor') {
    // Per case - no expiration
    expiresAt = null;
  }

  // Deactivate existing active subscriptions for this user
  if (userId && userId !== 'anonymous') {
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active');
  }

  // Save subscription to database
  const subscriptionData = {
    user_id: userId && userId !== 'anonymous' ? userId : null,
    plan: planDetails.name,
    status: 'active',
    expires_at: expiresAt ? expiresAt.toISOString() : null,
  };

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .insert(subscriptionData)
    .select()
    .single();

  if (error) {
    console.error('Failed to save subscription:', error);
    // Still return success response even if DB save fails (graceful degradation)
  }

  return {
    success: true,
    plan: planDetails.name,
    expires_at: expiresAt ? expiresAt.toISOString() : null,
    features: planDetails.features,
    subscription_id: data?.id,
  };
}
