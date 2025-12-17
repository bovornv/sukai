/**
 * Quick test script for adaptive triage engine
 * Tests risk scoring, adaptive questioning, and explainable recommendations
 */

import { calculateRiskScore, determineTriageFromRisk, selectNextQuestion } from './src/functions/triage/clinical_reasoning.js';

console.log('🧪 Testing Adaptive Triage Engine\n');

// Test 1: Risk Scoring
console.log('📊 Test 1: Risk Scoring');
console.log('─'.repeat(50));

const testCases = [
  {
    name: 'Low Risk - Mild Symptom',
    symptom: 'ปวดหัวนิดหน่อย',
    answers: { severity: 'เบา' },
    expected: 'self_care',
  },
  {
    name: 'Medium Risk - Moderate Symptom',
    symptom: 'ปวดหัว',
    answers: { severity: 'ปานกลาง', trend: 'เหมือนเดิม' },
    expected: 'pharmacy',
  },
  {
    name: 'High Risk - Severe + Worsening',
    symptom: 'ปวดหัว',
    answers: { severity: 'รุนแรง', trend: 'แย่ลง', self_care_response: 'ไม่ดีขึ้น' },
    expected: 'gp',
  },
  {
    name: 'Emergency - Red Flag',
    symptom: 'ปวดหัว หายใจลำบาก',
    answers: {},
    expected: 'emergency',
  },
  {
    name: 'Context Extraction - Duration + Worsening',
    symptom: 'ปวดหัว 2 วันแล้ว ไม่ดีขึ้น',
    answers: {},
    expected: 'gp',
  },
];

testCases.forEach((testCase, index) => {
  const riskScore = calculateRiskScore(testCase.symptom, testCase.answers);
  const triageLevel = determineTriageFromRisk(riskScore);
  const passed = triageLevel === testCase.expected;
  
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log(`   Symptom: "${testCase.symptom}"`);
  console.log(`   Answers: ${JSON.stringify(testCase.answers)}`);
  console.log(`   Risk Score: ${riskScore} points`);
  console.log(`   Triage Level: ${triageLevel}`);
  console.log(`   Expected: ${testCase.expected}`);
  console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}`);
});

// Test 2: Adaptive Questioning
console.log('\n\n📝 Test 2: Adaptive Questioning');
console.log('─'.repeat(50));

const questioningTests = [
  {
    name: 'Context Already Provided - Should Skip Duration',
    symptom: 'ปวดหัว 2 วันแล้ว',
    answers: {},
    questionsAsked: [],
    questionCount: 0,
    shouldSkip: ['นานเท่าไหร่'],
  },
  {
    name: 'Worsening Mentioned - Should Skip Trend',
    symptom: 'ปวดหัว แย่ลง',
    answers: {},
    questionsAsked: [],
    questionCount: 0,
    shouldSkip: ['แย่ลง'],
  },
  {
    name: 'Red Flag Present - Should Ask Red Flags First',
    symptom: 'ปวดหัว',
    answers: {},
    questionsAsked: [],
    questionCount: 0,
    shouldAsk: ['หายใจ', 'เจ็บหน้าอก'],
  },
  {
    name: 'High Risk - Should Ask Associated Symptoms',
    symptom: 'ปวดหัว',
    answers: { severity: 'รุนแรง', trend: 'แย่ลง' },
    questionsAsked: [],
    questionCount: 3,
    shouldAsk: ['ไข้', 'คลื่นไส้'],
  },
];

questioningTests.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}`);
  console.log(`   Symptom: "${test.symptom}"`);
  console.log(`   Answers: ${JSON.stringify(test.answers)}`);
  
  const nextQuestion = selectNextQuestion(
    test.symptom,
    test.answers,
    test.questionsAsked,
    test.questionCount
  );
  
  if (nextQuestion) {
    console.log(`   Next Question: "${nextQuestion}"`);
    
    if (test.shouldSkip) {
      const skipped = test.shouldSkip.some(keyword => nextQuestion.includes(keyword));
      console.log(`   ${skipped ? '❌ FAIL (Should skip this question)' : '✅ PASS (Question skipped correctly)'}`);
    } else if (test.shouldAsk) {
      const asked = test.shouldAsk.some(keyword => nextQuestion.includes(keyword));
      console.log(`   ${asked ? '✅ PASS (Asking relevant question)' : '❌ FAIL (Should ask this)'}`);
    }
  } else {
    console.log(`   No question (may be correct if enough info)`);
  }
});

// Test 3: Risk Accumulation
console.log('\n\n📈 Test 3: Risk Accumulation');
console.log('─'.repeat(50));

const accumulationTest = {
  symptom: 'ปวดหัว',
  steps: [
    { step: 'Initial', answers: {}, expectedRange: [0, 20] },
    { step: 'Add Severity', answers: { severity: 'รุนแรง' }, expectedRange: [30, 50] },
    { step: 'Add Trend', answers: { severity: 'รุนแรง', trend: 'แย่ลง' }, expectedRange: [50, 70] },
    { step: 'Add Self-Care', answers: { severity: 'รุนแรง', trend: 'แย่ลง', self_care_response: 'ไม่ดีขึ้น' }, expectedRange: [65, 85] },
  ],
};

console.log('\nRisk Score Progression:');
accumulationTest.steps.forEach((step, index) => {
  const riskScore = calculateRiskScore(accumulationTest.symptom, step.answers);
  const triageLevel = determineTriageFromRisk(riskScore);
  const inRange = riskScore >= step.expectedRange[0] && riskScore <= step.expectedRange[1];
  
  console.log(`\n${index + 1}. ${step.step}`);
  console.log(`   Answers: ${JSON.stringify(step.answers)}`);
  console.log(`   Risk Score: ${riskScore} (expected: ${step.expectedRange[0]}-${step.expectedRange[1]})`);
  console.log(`   Triage Level: ${triageLevel}`);
  console.log(`   ${inRange ? '✅ PASS' : '❌ FAIL'}`);
});

console.log('\n\n✅ Testing Complete!\n');
console.log('Next Steps:');
console.log('1. Test with real API calls');
console.log('2. Verify questions adapt in UI');
console.log('3. Check explainable recommendations');

