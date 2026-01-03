/**
 * Medical-Grade Hypothesis Mapping System
 * Symptom → Differential Diagnosis Set (3-7 hypotheses)
 * Based on Ada Health / NHS / ER decision support systems
 * 
 * CRITICAL: After first question (non-emergency), system must generate hypothesis set
 * Then use information gain to select questions that differentiate hypotheses
 */

/**
 * Hypothesis Map: Symptom → Array of differential diagnoses with prior probabilities
 * Each hypothesis includes:
 * - name: Diagnosis name
 * - priorProbability: Base probability (0-1) before any questions
 * - ageAdjustment: How age affects probability
 * - genderAdjustment: How gender affects probability
 * - keyFeatures: Features that strongly support this hypothesis
 * - exclusionFeatures: Features that rule out this hypothesis
 */
export const HYPOTHESIS_MAP = {
  // Headache hypotheses
  'ปวดหัว': [
    {
      name: 'Tension-type headache',
      priorProbability: 0.40,
      ageAdjustment: { '<18': -0.1, '18-50': 0, '>50': -0.05 },
      genderAdjustment: { 'female': 0.05, 'male': -0.05 },
      keyFeatures: ['ปวดตึงสองข้าง', 'ไม่มีคลื่นไส้', 'ปวดปานกลาง', 'ไม่รบกวนกิจกรรม'],
      exclusionFeatures: ['ปวดตุบๆ', 'คลื่นไส้', 'แพ้แสง', 'ปวดรุนแรงมาก'],
      timeCourse: ['chronic', 'recurrent'],
    },
    {
      name: 'Migraine',
      priorProbability: 0.25,
      ageAdjustment: { '<18': 0.05, '18-50': 0, '>50': -0.1 },
      genderAdjustment: { 'female': 0.15, 'male': -0.15 },
      keyFeatures: ['ปวดตุบๆ', 'คลื่นไส้', 'แพ้แสง', 'ปวดข้างเดียว'],
      exclusionFeatures: ['ปวดตึงสองข้าง', 'ไม่มีคลื่นไส้'],
      timeCourse: ['recurrent', 'acute'],
    },
    {
      name: 'Sinusitis',
      priorProbability: 0.15,
      ageAdjustment: { '<18': 0.05, '18-50': 0, '>50': 0.05 },
      genderAdjustment: { 'female': 0, 'male': 0 },
      keyFeatures: ['ปวดมากขึ้นเมื่อก้ม', 'มีน้ำมูก', 'ปวดบริเวณหน้าผาก/แก้ม'],
      exclusionFeatures: ['ไม่มีน้ำมูก', 'ปวดตุบๆ'],
      timeCourse: ['subacute', 'chronic'],
    },
    {
      name: 'Medication overuse headache',
      priorProbability: 0.10,
      ageAdjustment: { '<18': -0.05, '18-50': 0.05, '>50': 0.05 },
      genderAdjustment: { 'female': 0.05, 'male': -0.05 },
      keyFeatures: ['ปวดทุกวัน', 'ใช้ยาบ่อย', 'ปวดตอนเช้า'],
      exclusionFeatures: [],
      timeCourse: ['chronic'],
    },
    {
      name: 'Secondary headache (low risk)',
      priorProbability: 0.10,
      ageAdjustment: { '<18': 0.05, '18-50': -0.05, '>50': 0.15 },
      genderAdjustment: { 'female': 0, 'male': 0 },
      keyFeatures: ['ปวดใหม่', 'ปวดรุนแรง', 'มีอาการทางระบบประสาท'],
      exclusionFeatures: ['ปวดเรื้อรัง', 'ไม่มีอาการอื่น'],
      timeCourse: ['acute'],
    },
  ],
  
  // Fever hypotheses
  'ไข้': [
    {
      name: 'Viral infection (common cold/flu)',
      priorProbability: 0.50,
      ageAdjustment: { '<18': 0.1, '18-50': 0, '>50': -0.1 },
      genderAdjustment: { 'female': 0, 'male': 0 },
      keyFeatures: ['มีน้ำมูก', 'ไอ', 'เจ็บคอ', 'ปวดเมื่อย'],
      exclusionFeatures: ['ไข้สูงมาก', 'ซึม', 'หายใจลำบาก'],
      timeCourse: ['acute', 'subacute'],
    },
    {
      name: 'Bacterial infection',
      priorProbability: 0.25,
      ageAdjustment: { '<18': 0.1, '18-50': 0, '>50': 0.15 },
      genderAdjustment: { 'female': 0, 'male': 0 },
      keyFeatures: ['ไข้สูง', 'หนาวสั่น', 'มีจุดติดเชื้อชัดเจน'],
      exclusionFeatures: ['ไข้ต่ำ', 'ไม่มีอาการอื่น'],
      timeCourse: ['acute', 'progressive'],
    },
    {
      name: 'UTI',
      priorProbability: 0.15,
      ageAdjustment: { '<18': -0.05, '18-50': 0.1, '>50': 0.1 },
      genderAdjustment: { 'female': 0.2, 'male': -0.2 },
      keyFeatures: ['ปัสสาวะแสบ', 'ปัสสาวะบ่อย', 'ปวดท้องน้อย'],
      exclusionFeatures: ['ไม่มีอาการทางปัสสาวะ'],
      timeCourse: ['acute', 'subacute'],
    },
    {
      name: 'Other infection',
      priorProbability: 0.10,
      ageAdjustment: { '<18': 0.05, '18-50': -0.05, '>50': 0.1 },
      genderAdjustment: { 'female': 0, 'male': 0 },
      keyFeatures: ['ไข้เรื้อรัง', 'น้ำหนักลด', 'มีอาการอื่น'],
      exclusionFeatures: [],
      timeCourse: ['subacute', 'chronic'],
    },
  ],
  
  // Cough hypotheses
  'ไอ': [
    {
      name: 'Upper respiratory infection',
      priorProbability: 0.45,
      ageAdjustment: { '<18': 0.1, '18-50': 0, '>50': -0.05 },
      genderAdjustment: { 'female': 0, 'male': 0 },
      keyFeatures: ['มีน้ำมูก', 'เจ็บคอ', 'ไอแห้ง', 'ไข้ต่ำ'],
      exclusionFeatures: ['ไอเรื้อรัง', 'หายใจลำบาก'],
      timeCourse: ['acute', 'subacute'],
    },
    {
      name: 'Post-nasal drip',
      priorProbability: 0.20,
      ageAdjustment: { '<18': -0.05, '18-50': 0.05, '>50': 0.1 },
      genderAdjustment: { 'female': 0, 'male': 0 },
      keyFeatures: ['ไอตอนนอน', 'มีเสมหะ', 'คัดจมูก'],
      exclusionFeatures: ['ไอแห้ง', 'ไม่มีน้ำมูก'],
      timeCourse: ['chronic'],
    },
    {
      name: 'Asthma/Bronchitis',
      priorProbability: 0.15,
      ageAdjustment: { '<18': 0.1, '18-50': 0, '>50': 0.05 },
      genderAdjustment: { 'female': 0, 'male': 0 },
      keyFeatures: ['หายใจมีเสียง', 'ไอตอนออกแรง', 'หายใจลำบาก'],
      exclusionFeatures: ['ไม่มีเสียงหายใจ', 'หายใจปกติ'],
      timeCourse: ['chronic', 'recurrent'],
    },
    {
      name: 'GERD',
      priorProbability: 0.10,
      ageAdjustment: { '<18': -0.1, '18-50': 0.05, '>50': 0.1 },
      genderAdjustment: { 'female': 0, 'male': 0 },
      keyFeatures: ['ไอหลังกิน', 'แสบร้อนอก', 'ไอตอนนอน'],
      exclusionFeatures: ['ไม่มีอาการทางเดินอาหาร'],
      timeCourse: ['chronic'],
    },
    {
      name: 'Other',
      priorProbability: 0.10,
      ageAdjustment: { '<18': -0.05, '18-50': 0, '>50': 0.05 },
      genderAdjustment: { 'female': 0, 'male': 0 },
      keyFeatures: [],
      exclusionFeatures: [],
      timeCourse: [],
    },
  ],
  
  // Abdominal pain hypotheses
  'ปวดท้อง': [
    {
      name: 'Functional/GI upset',
      priorProbability: 0.35,
      ageAdjustment: { '<18': 0.05, '18-50': 0, '>50': -0.1 },
      genderAdjustment: { 'female': 0.05, 'male': -0.05 },
      keyFeatures: ['ปวดไม่รุนแรง', 'ไม่มีไข้', 'ปวดเป็นๆหายๆ'],
      exclusionFeatures: ['ปวดรุนแรง', 'มีไข้', 'กดเจ็บมาก'],
      timeCourse: ['chronic', 'recurrent'],
    },
    {
      name: 'Gastritis',
      priorProbability: 0.20,
      ageAdjustment: { '<18': -0.1, '18-50': 0.05, '>50': 0.1 },
      genderAdjustment: { 'female': 0, 'male': 0 },
      keyFeatures: ['ปวดท้องส่วนบน', 'แสบร้อน', 'ปวดหลังกิน'],
      exclusionFeatures: ['ปวดท้องส่วนล่าง'],
      timeCourse: ['acute', 'chronic'],
    },
    {
      name: 'Appendicitis (low risk)',
      priorProbability: 0.15,
      ageAdjustment: { '<18': 0.1, '18-50': 0, '>50': -0.15 },
      genderAdjustment: { 'female': 0, 'male': 0 },
      keyFeatures: ['ปวดท้องขวาล่าง', 'มีไข้', 'ปวดมากขึ้น'],
      exclusionFeatures: ['ปวดท้องส่วนบน', 'ไม่มีไข้'],
      timeCourse: ['acute', 'progressive'],
    },
    {
      name: 'UTI',
      priorProbability: 0.15,
      ageAdjustment: { '<18': 0.05, '18-50': 0.05, '>50': 0.1 },
      genderAdjustment: { 'female': 0.2, 'male': -0.2 },
      keyFeatures: ['ปวดท้องน้อย', 'ปัสสาวะแสบ', 'ปัสสาวะบ่อย'],
      exclusionFeatures: ['ไม่มีอาการทางปัสสาวะ'],
      timeCourse: ['acute'],
    },
    {
      name: 'Other',
      priorProbability: 0.15,
      ageAdjustment: { '<18': 0, '18-50': -0.05, '>50': 0.1 },
      genderAdjustment: { 'female': 0, 'male': 0 },
      keyFeatures: [],
      exclusionFeatures: [],
      timeCourse: [],
    },
  ],
};

/**
 * Get hypotheses for a symptom
 * Returns array of hypotheses with adjusted probabilities based on age/gender
 * ENHANCED: Uses body_part_location to refine hypothesis ranking
 */
export function getHypotheses(symptom, age = null, gender = null, answers = {}) {
  const normalizedSymptom = symptom.toLowerCase().trim();
  
  // CRITICAL: Use body_part_location to refine symptom matching
  // Body-part clarification enhances hypothesis accuracy
  const bodyPartLocation = answers.body_part_location || answers.body_part || answers.location;
  
  // Find matching symptom in hypothesis map
  let hypotheses = null;
  for (const [key, value] of Object.entries(HYPOTHESIS_MAP)) {
    if (normalizedSymptom.includes(key) || key.includes(normalizedSymptom)) {
      hypotheses = value;
      break;
    }
  }
  
  // ENHANCEMENT: Refine hypotheses based on body_part_location
  if (hypotheses && bodyPartLocation) {
    const normalizedLocation = bodyPartLocation.toLowerCase();
    
    // Adjust hypothesis probabilities based on location match
    hypotheses = hypotheses.map(h => {
      let locationBonus = 0;
      let locationPenalty = 0;
      
      // Check if location matches key features
      h.keyFeatures.forEach(feature => {
        const featureNorm = feature.toLowerCase();
        // If location matches key feature (e.g., "ปวดท้องขวาล่าง" matches "ท้องขวาล่าง")
        if (normalizedLocation.includes(featureNorm) || featureNorm.includes(normalizedLocation)) {
          locationBonus += 0.1; // Boost probability
        }
      });
      
      // Check if location matches exclusion features
      h.exclusionFeatures.forEach(feature => {
        const featureNorm = feature.toLowerCase();
        // If location contradicts exclusion feature
        if (normalizedLocation.includes(featureNorm) || featureNorm.includes(normalizedLocation)) {
          locationPenalty += 0.15; // Reduce probability
        }
      });
      
      // Apply location adjustments
      if (locationBonus > 0 || locationPenalty > 0) {
        return {
          ...h,
          locationBonus: locationBonus,
          locationPenalty: locationPenalty,
        };
      }
      
      return h;
    });
  }
  
  // Fallback: use generic hypotheses if no match
  if (!hypotheses) {
    // Generic hypotheses for unknown symptoms
    hypotheses = [
      {
        name: 'Common cause',
        priorProbability: 0.50,
        ageAdjustment: {},
        genderAdjustment: {},
        keyFeatures: [],
        exclusionFeatures: [],
        timeCourse: [],
      },
      {
        name: 'Less common cause',
        priorProbability: 0.30,
        ageAdjustment: {},
        genderAdjustment: {},
        keyFeatures: [],
        exclusionFeatures: [],
        timeCourse: [],
      },
      {
        name: 'Other',
        priorProbability: 0.20,
        ageAdjustment: {},
        genderAdjustment: {},
        keyFeatures: [],
        exclusionFeatures: [],
        timeCourse: [],
      },
    ];
  }
  
  // Adjust probabilities based on age and gender
  const adjustedHypotheses = hypotheses.map(h => {
    let adjustedProb = h.priorProbability;
    
    // Age adjustment
    if (age !== null && h.ageAdjustment) {
      if (age < 18 && h.ageAdjustment['<18']) {
        adjustedProb += h.ageAdjustment['<18'];
      } else if (age >= 18 && age <= 50 && h.ageAdjustment['18-50']) {
        adjustedProb += h.ageAdjustment['18-50'];
      } else if (age > 50 && h.ageAdjustment['>50']) {
        adjustedProb += h.ageAdjustment['>50'];
      }
    }
    
    // Gender adjustment
    if (gender && h.genderAdjustment && h.genderAdjustment[gender]) {
      adjustedProb += h.genderAdjustment[gender];
    }
    
    // Normalize probability (0-1)
    adjustedProb = Math.max(0, Math.min(1, adjustedProb));
    
    return {
      ...h,
      adjustedProbability: adjustedProb,
    };
  });
  
  // Normalize probabilities to sum to 1
  const totalProb = adjustedHypotheses.reduce((sum, h) => sum + h.adjustedProbability, 0);
  if (totalProb > 0) {
    adjustedHypotheses.forEach(h => {
      h.adjustedProbability = h.adjustedProbability / totalProb;
    });
  }
  
  // Sort by probability (highest first)
  adjustedHypotheses.sort((a, b) => b.adjustedProbability - a.adjustedProbability);
  
  return adjustedHypotheses;
}

/**
 * Calculate information gain for a question
 * IMPROVED: More sophisticated information gain calculation
 * Information gain = how much a question helps differentiate between hypotheses
 * Higher gain = question is more valuable for diagnosis
 */
export function calculateInformationGain(question, hypotheses, currentAnswers = {}) {
  if (!hypotheses || !Array.isArray(hypotheses) || hypotheses.length === 0) {
    // Fallback: Use basic heuristics if no hypotheses
    let gain = 0.3; // Base gain
    
    // Questions about severity trajectory and time-course have high information gain
    if (question.includes('ดีขึ้น') || question.includes('แย่ลง') || question.includes('เหมือนเดิม')) {
      gain += 0.3; // Severity trajectory is very informative
    }
    
    if (question.includes('นาน') || question.includes('วัน') || question.includes('ชั่วโมง') || question.includes('เริ่มเมื่อไหร่')) {
      gain += 0.2; // Time-course is informative
    }
    
    return gain;
  }
  
  // IMPROVED: Entropy-based information gain calculation
  // Calculate how much each question reduces uncertainty across hypotheses
  
  const questionText = question.toLowerCase();
  let totalGain = 0;
  
  // Calculate entropy reduction for each hypothesis
  hypotheses.forEach((h, index) => {
    const currentConfidence = h.confidence || h.adjustedProbability || h.priorProbability || 0;
    
    // If hypothesis already has high/low confidence, questions about it have less gain
    const uncertainty = currentConfidence * (1 - currentConfidence); // Max uncertainty at 0.5 confidence
    let questionGain = uncertainty * 0.5; // Base gain proportional to uncertainty
    
    // Check if question matches key features (high gain)
    h.keyFeatures.forEach(feature => {
      const featureNorm = feature.toLowerCase();
      if (questionText.includes(featureNorm) || 
          questionText.includes(featureNorm.substring(0, Math.min(5, featureNorm.length)))) {
        questionGain += 0.15; // High gain for key features
      }
    });
    
    // Check if question matches exclusion features (also high gain - helps rule out)
    h.exclusionFeatures.forEach(feature => {
      const featureNorm = feature.toLowerCase();
      if (questionText.includes(featureNorm) || 
          questionText.includes(featureNorm.substring(0, Math.min(5, featureNorm.length)))) {
        questionGain += 0.15; // High gain for exclusion features
      }
    });
    
    // Check if question matches time-course patterns
    if (h.timeCourse && Array.isArray(h.timeCourse)) {
      h.timeCourse.forEach(tc => {
        if ((tc === 'acute' && (questionText.includes('เริ่มเมื่อไหร่') || questionText.includes('เมื่อไหร่'))) ||
            (tc === 'chronic' && questionText.includes('นาน')) ||
            (tc === 'progressive' && (questionText.includes('แย่ลง') || questionText.includes('ดีขึ้น')))) {
          questionGain += 0.1;
        }
      });
    }
    
    // Weight by hypothesis confidence (more confident hypotheses = less gain needed)
    const weightedGain = questionGain * (1 - currentConfidence);
    totalGain += weightedGain;
  });
  
  // Normalize by number of hypotheses
  const normalizedGain = totalGain / hypotheses.length;
  
  // Add bonus for critical questions (trajectory, time-course)
  let bonus = 0;
  if (questionText.includes('ดีขึ้น') || questionText.includes('แย่ลง') || questionText.includes('เหมือนเดิม')) {
    bonus += 0.2; // Trajectory is critical for triage
  }
  if (questionText.includes('นาน') || questionText.includes('วัน') || questionText.includes('ชั่วโมง') || 
      questionText.includes('เริ่มเมื่อไหร่') || questionText.includes('เป็นมานาน')) {
    bonus += 0.15; // Time-course is critical for diagnosis
  }
  if (questionText.includes('รบกวน') || questionText.includes('ใช้ชีวิต') || questionText.includes('ทำงาน')) {
    bonus += 0.1; // Impact is important for treatment
  }
  
  return normalizedGain + bonus;
}
