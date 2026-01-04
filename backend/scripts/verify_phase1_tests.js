/**
 * Phase 1 Test Verification Script
 * 
 * This script helps verify Phase 1 test results by checking:
 * 1. Allergy filtering works correctly
 * 2. ≥2 medicines are always returned
 * 3. Console logs show expected messages
 * 
 * Usage:
 * node scripts/verify_phase1_tests.js
 */

import { selectTwoOTCOptions } from '../src/functions/triage/thai_otc_catalog.js';
import { isMedicationSafe } from '../src/functions/triage/thai_otc_catalog.js';

console.log('🧪 Phase 1 Test Verification Script\n');
console.log('=' .repeat(60));

// Test Profile A: Paracetamol Allergy
const profileA = {
  age: 50,
  weightKg: 70,
  drugAllergies: ['พาราเซตามอล'],
  chronicDiseases: [],
};

// Test Profile B: Multiple Allergies
const profileB = {
  age: 45,
  weightKg: 65,
  drugAllergies: ['พาราเซตามอล', 'ไอบูโพรเฟน'],
  chronicDiseases: [],
};

// Test Profile C: No Allergies (Control)
const profileC = {
  age: 35,
  weightKg: 60,
  drugAllergies: [],
  chronicDiseases: [],
};

const answers = {
  symptom: 'ปวดหัว',
  original_symptom: 'ปวดหัว',
  severity_level: 'moderate',
  time_course: 'acute',
};

async function runTest(testName, profile, expectedExclusions = []) {
  console.log(`\n📋 ${testName}`);
  console.log('-'.repeat(60));
  
  try {
    const otcOptions = await selectTwoOTCOptions(
      'fever_pain',
      profile,
      profile.age,
      profile.weightKg,
      answers
    );
    
    if (!otcOptions || !otcOptions.optionA) {
      console.log('❌ FAIL: No OTC options returned');
      return false;
    }
    
    // Check if excluded medicines are NOT in recommendations
    const optionAGeneric = otcOptions.optionA.medication.generic;
    const optionBGeneric = otcOptions.optionB?.medication?.generic;
    
    let excludedFound = false;
    for (const excluded of expectedExclusions) {
      if (optionAGeneric.includes(excluded) || 
          (optionBGeneric && optionBGeneric.includes(excluded))) {
        console.log(`❌ FAIL: Excluded medicine "${excluded}" found in recommendations`);
        excludedFound = true;
      }
    }
    
    if (excludedFound) {
      return false;
    }
    
    // Check ≥2 medicines requirement
    const medicineCount = (otcOptions.optionA ? 1 : 0) + 
                         (otcOptions.optionB ? 1 : 0) + 
                         (otcOptions.optionC ? 1 : 0);
    
    if (medicineCount < 2) {
      console.log(`❌ FAIL: Only ${medicineCount} medicine(s) returned (expected ≥2)`);
      return false;
    }
    
    console.log(`✅ PASS: ${medicineCount} medicines returned`);
    console.log(`   Option A: ${optionAGeneric}`);
    if (otcOptions.optionB) {
      console.log(`   Option B: ${otcOptions.optionB.medication.generic}`);
    }
    if (otcOptions.optionC) {
      console.log(`   Option C: ${otcOptions.optionC.medication.generic}`);
    }
    
    // Verify exclusions
    if (expectedExclusions.length > 0) {
      console.log(`✅ PASS: Excluded medicines not in recommendations: ${expectedExclusions.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function verifyAllergyFiltering() {
  console.log('\n🔍 Test 5.1: Paracetamol Allergy Exclusion');
  return await runTest(
    'Test 5.1: Paracetamol Allergy Exclusion',
    profileA,
    ['พาราเซตามอล']
  );
}

async function verifyMultipleAllergies() {
  console.log('\n🔍 Test 5.2: Multiple Drug Allergies');
  return await runTest(
    'Test 5.2: Multiple Drug Allergies',
    profileB,
    ['พาราเซตามอล', 'ไอบูโพรเฟน']
  );
}

async function verifyNormalCase() {
  console.log('\n🔍 Test 6.1: Normal Case (≥2 Medicines)');
  return await runTest(
    'Test 6.1: Normal Case',
    profileC,
    []
  );
}

async function verifyIsMedicationSafe() {
  console.log('\n🔍 Test 5.3: Allergy Matching (isMedicationSafe)');
  console.log('-'.repeat(60));
  
  const paracetamol = {
    generic: 'พาราเซตามอล',
    brandExamples: ['Tylenol', 'Paracetamol'],
    contraindications: ['แพ้พาราเซตามอล'],
  };
  
  // Test exact match
  const result1 = isMedicationSafe(paracetamol, profileA, {});
  if (result1.safe) {
    console.log('❌ FAIL: Exact match should exclude paracetamol');
    return false;
  }
  console.log('✅ PASS: Exact match excludes paracetamol');
  
  // Test substring match
  const profileSubstring = {
    ...profileA,
    drugAllergies: ['แพ้พาราเซตามอล'],
  };
  const result2 = isMedicationSafe(paracetamol, profileSubstring, {});
  if (result2.safe) {
    console.log('❌ FAIL: Substring match should exclude paracetamol');
    return false;
  }
  console.log('✅ PASS: Substring match excludes paracetamol');
  
  return true;
}

async function main() {
  console.log('\n🚀 Starting Phase 1 Test Verification...\n');
  
  const results = {
    test51: await verifyAllergyFiltering(),
    test52: await verifyMultipleAllergies(),
    test53: await verifyIsMedicationSafe(),
    test61: await verifyNormalCase(),
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Test 5.1: Paracetamol Exclusion     ${results.test51 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 5.2: Multiple Allergies        ${results.test52 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 5.3: Allergy Matching           ${results.test53 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 6.1: Normal Case (≥2 meds)      ${results.test61 ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r === true);
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('Phase 1 verification complete. Ready for Phase 2.');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('Please review failures above and fix issues.');
  }
  console.log('='.repeat(60));
}

// Run tests
main().catch(console.error);

