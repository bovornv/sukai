/**
 * Test script for Follow-up API
 * Run with: node backend/test_followup_api.js
 * 
 * This script tests:
 * 1. Follow-up check-in submission with all fields
 * 2. Confidence delta calculation
 * 3. Session confidence update
 * 4. Escalation logic
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Test session ID (use a real one from your database)
const TEST_SESSION_ID = process.env.TEST_SESSION_ID || 'test-session-123';

async function testFollowupCheckin() {
  console.log('🧪 Testing Follow-up API...\n');

  // Test Case 1: Complete follow-up with all fields
  console.log('📝 Test Case 1: Complete follow-up submission');
  try {
    const response = await fetch(`${BASE_URL}/followup/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123',
      },
      body: JSON.stringify({
        session_id: TEST_SESSION_ID,
        status: 'better',
        actions_taken: ['home_care', 'medication'],
        next_intent: 'recheck',
        notes: 'Feeling much better after taking medication',
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('   Check-in ID:', data.checkin?.id);
      console.log('   Confidence Delta:', data.confidence_delta);
      console.log('   Expected Delta: +0.30 (better: +0.15, home_care: +0.05, medication: +0.10)');
    } else {
      console.log('❌ Error:', data.error);
      console.log('   Details:', data.details);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  console.log('\n');

  // Test Case 2: Worse status (should trigger escalation)
  console.log('📝 Test Case 2: Worse status (escalation)');
  try {
    const response = await fetch(`${BASE_URL}/followup/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123',
      },
      body: JSON.stringify({
        session_id: TEST_SESSION_ID,
        status: 'worse',
        actions_taken: ['doctor'],
        next_intent: 'recheck',
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('   Confidence Delta:', data.confidence_delta);
      console.log('   Expected Delta: 0.00 (worse: -0.20, doctor: +0.20)');
      console.log('   ⚠️  Should trigger escalation logic');
    } else {
      console.log('❌ Error:', data.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  console.log('\n');

  // Test Case 3: Emergency action (should force emergency flag)
  console.log('📝 Test Case 3: Emergency action');
  try {
    const response = await fetch(`${BASE_URL}/followup/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123',
      },
      body: JSON.stringify({
        session_id: TEST_SESSION_ID,
        status: 'same',
        actions_taken: ['emergency'],
        next_intent: 'nothing',
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('   ⚠️  Should force emergency flag in triage_sessions');
    } else {
      console.log('❌ Error:', data.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  console.log('\n');

  // Test Case 4: Get check-ins
  console.log('📝 Test Case 4: Get check-ins for session');
  try {
    const response = await fetch(
      `${BASE_URL}/followup/checkins?session_id=${TEST_SESSION_ID}`,
      {
        headers: {
          'x-user-id': 'test-user-123',
        },
      }
    );

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('   Check-ins found:', data.checkins?.length || 0);
      if (data.checkins && data.checkins.length > 0) {
        console.log('   Latest check-in:');
        const latest = data.checkins[0];
        console.log('     Status:', latest.status);
        console.log('     Actions:', latest.actions_taken);
        console.log('     Next Intent:', latest.next_intent);
        console.log('     Confidence Delta:', latest.confidence_delta);
      }
    } else {
      console.log('❌ Error:', data.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  console.log('\n✅ Testing complete!');
}

// Run tests
testFollowupCheckin().catch(console.error);

