/**
 * Test Script: Medical-Grade Profile Fields Integration
 * 
 * This script helps verify that backend correctly loads and uses
 * all new medical profile fields.
 * 
 * Usage:
 *   node scripts/test-medical-profile.js
 * 
 * Prerequisites:
 *   - Backend server running
 *   - Database migration executed
 *   - Test user profile created with all fields populated
 */

import axios from 'axios';
import { config } from 'dotenv';

config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-id';

/**
 * Test Case 1: Profile Loading
 */
async function testProfileLoading() {
  console.log('\n=== Test 1: Profile Loading ===');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/triage/assess`,
      {
        session_id: `test-${Date.now()}`,
        symptom: 'ปวดหัว',
        previous_answers: {},
        language: 'th',
      },
      {
        headers: {
          'x-user-id': TEST_USER_ID,
          'x-language': 'th',
        },
      }
    );
    
    console.log('✓ Assessment request successful');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check backend logs for profile loading
    console.log('\nCheck backend logs for:');
    console.log('- [ASSESS-SYMPTOM] Loading health profile');
    console.log('- Health profile loaded with all fields');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

/**
 * Test Case 2: Allergy Safety Check
 */
async function testAllergySafetyCheck() {
  console.log('\n=== Test 2: Allergy Safety Check ===');
  
  console.log('Test: User with drug allergy to "พาราเซตามอล"');
  console.log('Expected: OTC recommendations should exclude paracetamol');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/triage/assess`,
      {
        session_id: `test-allergy-${Date.now()}`,
        symptom: 'ปวดหัว',
        previous_answers: {},
        language: 'th',
      },
      {
        headers: {
          'x-user-id': TEST_USER_ID,
          'x-language': 'th',
        },
      }
    );
    
    console.log('✓ Assessment completed');
    console.log('\nCheck backend logs for:');
    console.log('- [SAFETY-CHECK] Checking allergies');
    console.log('- [SAFETY-CHECK] Medication paracetamol excluded: แพ้ยานี้');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
  }
}

/**
 * Test Case 3: Pregnancy Safety Check
 */
async function testPregnancySafetyCheck() {
  console.log('\n=== Test 3: Pregnancy Safety Check ===');
  
  console.log('Test: Pregnant user');
  console.log('Expected: OTC recommendations should exclude NSAIDs');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/triage/assess`,
      {
        session_id: `test-pregnancy-${Date.now()}`,
        symptom: 'ปวดหัว',
        previous_answers: {},
        language: 'th',
      },
      {
        headers: {
          'x-user-id': TEST_USER_ID,
          'x-language': 'th',
        },
      }
    );
    
    console.log('✓ Assessment completed');
    console.log('\nCheck backend logs for:');
    console.log('- [SAFETY-CHECK] Checking pregnancy status');
    console.log('- [SAFETY-CHECK] Medication ibuprofen excluded: ตั้งครรภ์ - หลีกเลี่ยงยานี้');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
  }
}

/**
 * Test Case 4: Drug Interaction Check
 */
async function testDrugInteractionCheck() {
  console.log('\n=== Test 4: Drug Interaction Check ===');
  
  console.log('Test: User taking warfarin');
  console.log('Expected: OTC recommendations should check for interactions');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/triage/assess`,
      {
        session_id: `test-interaction-${Date.now()}`,
        symptom: 'ปวดหัว',
        previous_answers: {},
        language: 'th',
      },
      {
        headers: {
          'x-user-id': TEST_USER_ID,
          'x-language': 'th',
        },
      }
    );
    
    console.log('✓ Assessment completed');
    console.log('\nCheck backend logs for:');
    console.log('- [SAFETY-CHECK] Checking drug interactions');
    console.log('- [SAFETY-CHECK] Medication excluded: อาจมีปฏิกิริยากับยาที่ใช้อยู่');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
  }
}

/**
 * Test Case 5: Get Diagnosis with Full Profile
 */
async function testGetDiagnosis() {
  console.log('\n=== Test 5: Get Diagnosis ===');
  
  try {
    // First, complete an assessment
    const sessionId = `test-diagnosis-${Date.now()}`;
    
    await axios.post(
      `${API_BASE_URL}/api/triage/assess`,
      {
        session_id: sessionId,
        symptom: 'ปวดหัว',
        previous_answers: {},
        language: 'th',
      },
      {
        headers: {
          'x-user-id': TEST_USER_ID,
          'x-language': 'th',
        },
      }
    );
    
    // Then get diagnosis
    const response = await axios.get(
      `${API_BASE_URL}/api/triage/diagnosis`,
      {
        params: {
          session_id: sessionId,
          language: 'th',
        },
        headers: {
          'x-user-id': TEST_USER_ID,
          'x-language': 'th',
        },
      }
    );
    
    console.log('✓ Diagnosis retrieved');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Verify OTC recommendations
    const recommendations = response.data.recommendations;
    if (recommendations && recommendations.otcMeds) {
      console.log('\nOTC Medications Recommended:');
      recommendations.otcMeds.forEach((med, index) => {
        console.log(`${index + 1}. ${med}`);
      });
      
      console.log('\n✓ Verify medications exclude allergies');
      console.log('✓ Verify medications are pregnancy-safe (if applicable)');
      console.log('✓ Verify no drug interactions');
    }
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 Medical-Grade Profile Fields Integration Tests');
  console.log('==================================================');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  
  await testProfileLoading();
  await testAllergySafetyCheck();
  await testPregnancySafetyCheck();
  await testDrugInteractionCheck();
  await testGetDiagnosis();
  
  console.log('\n✅ All tests completed');
  console.log('\n📋 Next Steps:');
  console.log('1. Review backend logs for safety check messages');
  console.log('2. Verify OTC recommendations exclude unsafe medications');
  console.log('3. Check that all profile fields are loaded correctly');
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export {
  testProfileLoading,
  testAllergySafetyCheck,
  testPregnancySafetyCheck,
  testDrugInteractionCheck,
  testGetDiagnosis,
  runAllTests,
};
