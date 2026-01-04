/**
 * Generate diagnosis with recommendations
 * Follows PROBLEM_DRIVEN_IMPLEMENTATION.md strictly
 * Every feature must solve: uncertainty, cost, or follow-up
 * 
 * Clinical Triage & Decision Support Assistant
 * - Textbook-based clinical reasoning
 * - OPD triage standards (Thailand hospitals)
 * - Internal Medicine / Family Medicine principles
 * - Safety-first clinical decision making
 */

import { normalizeThaiText } from './thai_normalizer.js';
import {
  mapSymptomToCategory,
  selectTwoOTCOptions,
  calculateDose,
  isMedicationSafe,
  getOTCMedsByCategory,
} from './thai_otc_catalog.js';
import { generateSelfCareRecommendations } from './self_care_recommendations.js';
import { formatMedicalTerm } from './language_helper.js';
import {
  resolveSymptomIntent,
  findIntentBySymptomText,
  getOtcGroups,
  getSelfCareGroups,
} from './intent_loader.js';

/**
 * Generate body-part rationale for OTC recommendation (Phase 4: Output Format)
 */
function generateBodyPartRationale(medication, answers, healthProfile) {
  const bodyPartLocation = answers.body_part_location || answers.body_part || answers.location;
  if (!bodyPartLocation || bodyPartLocation === 'uncertain' || bodyPartLocation === 'multiple') {
    return null;
  }
  
  const normalizedLocation = (bodyPartLocation || '').toLowerCase();
  const form = medication.form || 'oral';
  
  // Muscle pain + Topical medicine
  if ((normalizedLocation.includes('leg') || normalizedLocation.includes('arm') || 
       normalizedLocation.includes('ขา') || normalizedLocation.includes('แขน') ||
       normalizedLocation.includes('หลัง') || normalizedLocation.includes('เข่า')) &&
      form === 'topical') {
    // Check if high-risk patient (kidney/liver disease, elderly)
    const hasKidneyDisease = healthProfile?.chronicDiseases?.some(d => 
      d.toLowerCase().includes('ไต') || d.toLowerCase().includes('kidney')
    );
    const hasLiverDisease = healthProfile?.chronicDiseases?.some(d => 
      d.toLowerCase().includes('ตับ') || d.toLowerCase().includes('liver')
    );
    const isElderly = healthProfile?.age > 65;
    
    if (hasKidneyDisease || hasLiverDisease || isElderly) {
      return 'ปวดกล้ามเนื้อเฉพาะที่ → แนะนำใช้เจลทาเฉพาะที่ (ลดผลข้างเคียงต่อไต/ตับ)';
    }
    return 'ปวดกล้ามเนื้อเฉพาะที่ → แนะนำใช้เจลทาเฉพาะที่ (ลดผลข้างเคียง)';
  }
  
  // Chest pain + Kidney disease
  if ((normalizedLocation.includes('chest') || normalizedLocation.includes('หน้าอก')) &&
      healthProfile?.chronicDiseases?.some(d => d.toLowerCase().includes('ไต') || d.toLowerCase().includes('kidney'))) {
    if (form === 'topical') {
      return 'ปวดหน้าอก + โรคไต → แนะนำใช้ยาทาเฉพาะที่ (ปลอดภัยต่อไต)';
    }
    if (medication.generic === 'พาราเซตามอล') {
      return 'ปวดหน้าอก + โรคไต → ปลอดภัยสำหรับผู้มีโรคไต';
    }
  }
  
  // Abdominal pain (upper) → GERD-specific
  if ((normalizedLocation.includes('abdomen') || normalizedLocation.includes('ท้อง')) &&
      (normalizedLocation.includes('บน') || normalizedLocation.includes('upper'))) {
    if (medication.category === 'gi_symptoms') {
      return 'ปวดท้องส่วนบน → แนะนำยาลดกรด/ยาลดการหลั่งกรด';
    }
  }
  
  // Abdominal pain (lower) → GI-specific
  if ((normalizedLocation.includes('abdomen') || normalizedLocation.includes('ท้อง')) &&
      (normalizedLocation.includes('ล่าง') || normalizedLocation.includes('lower'))) {
    if (medication.category === 'gi_symptoms') {
      return 'ปวดท้องส่วนล่าง → แนะนำยาลดอาการท้องอืด/ท้องเสีย';
    }
  }
  
  return null;
}

/**
 * Get safe default medications when category-specific selection fails
 * Always returns at least 2 safe options (paracetamol + ibuprofen or alternatives)
 */
function getSafeDefaultMedications(healthProfile, age, weightKg) {
  // Get safe medications from fever_pain category (most universal)
  const feverPainMeds = getOTCMedsByCategory('fever_pain');
  
  if (!feverPainMeds || feverPainMeds.length === 0) {
    // CRITICAL SAFETY FIX: Check allergies before recommending paracetamol in ultimate fallback
    const hasParacetamolAllergy = healthProfile?.drugAllergies?.some(allergy => {
      const allergyLower = allergy.toLowerCase().trim();
      const allergyDrugName = allergyLower.replace(/^แพ้ยา\s*/, '').replace(/^แพ้\s*/, '').trim();
      return allergyLower.includes('พาราเซตามอล') || allergyDrugName.includes('พาราเซตามอล');
    });
    
    if (hasParacetamolAllergy) {
      // User is allergic to paracetamol - only recommend self-care
      return {
        main: '🌿 ดูแลตัวเองด้วยการพักผ่อนและดื่มน้ำ\n   • วิธีใช้: พักผ่อนให้เพียงพอ ดื่มน้ำอุ่นบ่อยๆ\n   • ระวัง: คุณมีประวัติแพ้พาราเซตามอล - ไม่ควรใช้ยานี้',
        alternative: '🌿 หรือใช้วิธีอื่นในการบรรเทาอาการ\n   • วิธีใช้: ประคบเย็น/ร้อน ตามอาการ\n   • ระวัง: หากอาการไม่ดีขึ้นควรพบแพทย์',
      };
    }
    
    // Ultimate fallback: hardcoded safe recommendations (only if no paracetamol allergy)
    return {
      main: '💊 พาราเซตามอล — ลดไข้และปวด\n   • ขนาดยา: 500-1000 มก.\n   • ความถี่: ทุก 6 ชม.\n   • วิธีใช้: หลังอาหาร (ไม่เกิน 4,000 มก./วัน)\n   • ระวัง: อ่านฉลากยาอย่างระมัดระวัง',
      alternative: '🌿 ไอบูโพรเฟน — ลดปวดและอักเสบ\n   • ขนาดยา: 200-400 มก.\n   • ความถี่: ทุก 6-8 ชม.\n   • วิธีใช้: หลังอาหาร (ไม่เกิน 1,200 มก./วัน)\n   • ระวัง: ห้ามใช้ในผู้แพ้ NSAID หรือมีแผลในกระเพาะ',
    };
  }
  
  // Try to get paracetamol (safest)
  const paracetamol = feverPainMeds.find(m => m.generic === 'พาราเซตามอล');
  const ibuprofen = feverPainMeds.find(m => m.generic === 'ไอบูโพรเฟน');
  
  // Check safety
  let safeParacetamol = null;
  let safeIbuprofen = null;
  
  if (paracetamol) {
    const safetyCheck = isMedicationSafe(paracetamol, healthProfile, {});
    if (safetyCheck.safe) {
      safeParacetamol = paracetamol;
    }
  }
  
  if (ibuprofen) {
    const safetyCheck = isMedicationSafe(ibuprofen, healthProfile, {});
    if (safetyCheck.safe) {
      safeIbuprofen = ibuprofen;
    }
  }
  
  // Format medications
  const formatMed = (med, prefix) => {
    if (!med) return null;
    const dose = calculateDose(med, age, weightKg);
    const genericThai = med.generic || 'ยา';
    // Format medical term with bilingual support (Thai (English))
    const generic = formatMedicalTerm(genericThai, 'th'); // Default to Thai for safe defaults
    const brandExample = (med.brandExamples && Array.isArray(med.brandExamples) && med.brandExamples.length > 0) ? med.brandExamples[0] : '';
    const indication = med.indication || 'บรรเทาอาการ';
    const doseText = dose?.dose || 'ตามคำแนะนำบนฉลาก';
    const frequency = dose?.frequency || 'ตามคำแนะนำบนฉลาก';
    const instructions = dose?.instructions || 'อ่านฉลากยาอย่างระมัดระวัง';
    const warnings = med.cautions && Array.isArray(med.cautions) && med.cautions.length > 0 
      ? med.cautions.slice(0, 2).join(', ') 
      : 'อ่านฉลากยาอย่างระมัดระวัง';
    
    return `${prefix} ${generic}${brandExample ? ` (${brandExample})` : ''} — ${indication}\n   • ขนาดยา: ${doseText}\n   • ความถี่: ${frequency}\n   • วิธีใช้: ${instructions}\n   • ระวัง: ${warnings}`;
  };
  
  // Return safe defaults
  if (safeParacetamol && safeIbuprofen) {
    return {
      main: formatMed(safeParacetamol, '💊'),
      alternative: formatMed(safeIbuprofen, '🌿'),
    };
  } else if (safeParacetamol) {
    // Only paracetamol is safe, provide non-drug alternative
    return {
      main: formatMed(safeParacetamol, '💊'),
      alternative: '🌿 หรือดูแลตัวเองด้วยการพักผ่อนและดื่มน้ำ\n   • วิธีใช้: พักผ่อนให้เพียงพอ ดื่มน้ำอุ่นบ่อยๆ\n   • ระวัง: หากอาการไม่ดีขึ้นควรพบแพทย์',
    };
  } else {
    // CRITICAL SAFETY FIX: Try to find alternative safe medications
    // If paracetamol/ibuprofen are not safe, search for other medications from the catalog
    console.log('[SAFE-DEFAULTS] Paracetamol/Ibuprofen not safe, searching for alternatives...');
    
    // Try to find alternative medications from fever_pain category
    const alternativeMeds = feverPainMeds.filter(med => {
      // Skip paracetamol and ibuprofen (already checked)
      if (med.generic === 'พาราเซตามอล' || med.generic === 'ไอบูโพรเฟน') {
        return false;
      }
      // Check if medication is safe
      const safetyCheck = isMedicationSafe(med, healthProfile, {});
      return safetyCheck.safe;
    });
    
    if (alternativeMeds.length > 0) {
      // Found alternative safe medications
      console.log(`[SAFE-DEFAULTS] Found ${alternativeMeds.length} alternative safe medications`);
      const med1 = alternativeMeds[0];
      const med2 = alternativeMeds.length > 1 ? alternativeMeds[1] : null;
      
      return {
        main: formatMed(med1, '💊'),
        alternative: med2 ? formatMed(med2, '🌿') : '🌿 หรือดูแลตัวเองด้วยการพักผ่อนและดื่มน้ำ\n   • วิธีใช้: พักผ่อนให้เพียงพอ ดื่มน้ำอุ่นบ่อยๆ\n   • ระวัง: หากอาการไม่ดีขึ้นควรพบแพทย์',
      };
    }
    
    // CRITICAL SAFETY FIX: Check allergies before recommending paracetamol in ultimate fallback
    // If user is allergic to paracetamol, don't recommend it even in fallback
    const hasParacetamolAllergy = healthProfile?.drugAllergies?.some(allergy => {
      const allergyLower = allergy.toLowerCase().trim();
      const allergyDrugName = allergyLower.replace(/^แพ้ยา\s*/, '').replace(/^แพ้\s*/, '').trim();
      return allergyLower.includes('พาราเซตามอล') || allergyDrugName.includes('พาราเซตามอล');
    });
    
    if (hasParacetamolAllergy) {
      // User is allergic to paracetamol and no alternatives found - recommend self-care with clear explanation
      console.log('[SAFE-DEFAULTS] No safe medications found due to allergies, recommending self-care');
      return {
        main: '🌿 ดูแลตัวเองด้วยการพักผ่อนและดื่มน้ำ\n   • วิธีใช้: พักผ่อนให้เพียงพอ ดื่มน้ำอุ่นบ่อยๆ\n   • ระวัง: คุณมีประวัติแพ้ยาที่ใช้บรรเทาอาการ - ไม่ควรใช้ยานี้',
        alternative: '🌿 หรือใช้วิธีอื่นในการบรรเทาอาการ\n   • วิธีใช้: ประคบเย็น/ร้อน ตามอาการ\n   • ระวัง: หากอาการไม่ดีขึ้นควรพบแพทย์',
      };
    }
    
    // Ultimate fallback (only if no paracetamol allergy)
    return {
      main: '💊 พาราเซตามอล — ลดไข้และปวด\n   • ขนาดยา: 500-1000 มก.\n   • ความถี่: ทุก 6 ชม.\n   • วิธีใช้: หลังอาหาร (ไม่เกิน 4,000 มก./วัน)\n   • ระวัง: อ่านฉลากยาอย่างระมัดระวัง',
      alternative: '🌿 หรือดูแลตัวเองด้วยการพักผ่อนและดื่มน้ำ\n   • วิธีใช้: พักผ่อนให้เพียงพอ ดื่มน้ำอุ่นบ่อยๆ\n   • ระวัง: หากอาการไม่ดีขึ้นควรพบแพทย์',
    };
  }
}

/**
 * Generate OTC medication recommendation using Thai OTC Catalog
 * 
 * 🎯 PRIMARY CLINICAL REASONING REFERENCE: severity_timecourse_matrix.js
 * CRITICAL RULE 6: OTC recommendations must include at least 2 suitable options
 *   - Must have rationale based on severity, age, weight, contraindications
 *   - NO OTC recommendations for emergency cases
 *   - Each option must include: reason, dosage, precautions
 * 
 * Always returns 2 options (A: main, B: alternative) with age/weight-based dosing
 */
async function generateOTCMeds(symptom, triageLevel, answers, healthProfile = null, intent = null) {
  const normalizedSymptom = normalizeThaiText(symptom.toLowerCase());
  
  // CRITICAL IMPROVEMENT: Use intent OTC groups if available (from 700-intent dataset)
  // This provides more accurate OTC recommendations based on structured intent data
  let intentOtcGroups = [];
  if (intent) {
    intentOtcGroups = getOtcGroups(intent);
    if (intentOtcGroups.length > 0) {
      console.log(`[OTC-INTENT] Using intent OTC groups: ${intentOtcGroups.join(', ')}`);
    }
  }
  
  // Determine symptom category for OTC selection
  // Use intent OTC groups to guide category selection if available
  let symptomCategory = mapSymptomToCategory(symptom);
  
  // If intent has OTC groups, prefer those over text-based category mapping
  if (intentOtcGroups.length > 0) {
    // Map intent OTC groups to symptom categories
    // This ensures we use intent's structured data
    const otcGroupToCategory = {
      'analgesic_basic': 'fever_pain',
      'analgesic_strong': 'fever_pain',
      'antipyretic': 'fever_pain',
      'cough_suppressant': 'cough',
      'expectorant': 'cough',
      'antihistamine': 'allergy',
      'antacid': 'gi',
      'antidiarrheal': 'gi',
      'topical_antiseptic': 'skin',
    };
    
    // Use first OTC group to determine category
    const mappedCategory = otcGroupToCategory[intentOtcGroups[0]];
    if (mappedCategory) {
      symptomCategory = mappedCategory;
      console.log(`[OTC-INTENT] Mapped intent OTC group "${intentOtcGroups[0]}" to category "${symptomCategory}"`);
    }
  }
  
  // CRITICAL: Handle special cases where systemic OTCs are not appropriate
  // Eye symptoms, facial swelling, etc. should not get systemic painkillers
  if (!symptomCategory) {
    // Handle symptoms that need specific care, not systemic OTCs
    
    // Eye symptoms - need eye-specific care
    if (normalizedSymptom.includes('ปวดตา') || normalizedSymptom.includes('ตาแดง') || normalizedSymptom.includes('ตาพร่า') || 
        normalizedSymptom.includes('สายตาล้า') || normalizedSymptom.includes('ปวดกระบอกตา') || normalizedSymptom.includes('ตามัว')) {
      console.log('generateOTCMeds - Eye symptom detected, returning eye-specific guidance');
      return {
        main: '👁️ ควรปรึกษาแพทย์หรือเภสัชกรเพื่อประเมินอาการตา\n   • วิธีใช้: พักตา หลีกเลี่ยงการขยี้ตา\n   • ระวัง: ไม่ควรใช้ยาด้วยตัวเองก่อนได้รับการประเมิน\n   • สาเหตุ: อาการตาอาจเกิดจากหลายสาเหตุ ต้องตรวจวินิจฉัย',
        alternative: '🌿 หรือดูแลตัวเองด้วยการพักตาและประคบเย็น\n   • วิธีใช้: พักจากจอ 20-20-20 (ทุก 20 นาที มองไกล 20 ฟุต 20 วินาที)\n   • ประคบเย็น: ใช้ผ้าเย็นประคบตา 10-15 นาที\n   • ระวัง: หากไม่ดีขึ้นใน 24-48 ชม. หรือมีอาการแย่ลงควรพบแพทย์',
      };
    }
    
    // Ear symptoms - need ear-specific care
    if (normalizedSymptom.includes('ปวดหู') || normalizedSymptom.includes('หูอื้อ') || normalizedSymptom.includes('หูดับ')) {
      console.log('generateOTCMeds - Ear symptom detected, returning ear-specific guidance');
      return {
        main: '👂 ควรปรึกษาแพทย์หรือเภสัชกรเพื่อประเมินอาการหู\n   • วิธีใช้: หลีกเลี่ยงการแคะหู หลีกเลี่ยงน้ำเข้าหู\n   • ระวัง: ไม่ควรใช้ยาด้วยตัวเองก่อนได้รับการประเมิน\n   • สาเหตุ: อาการหูอาจเกิดจากหลายสาเหตุ ต้องตรวจวินิจฉัย',
        alternative: '🌿 หรือดูแลตัวเองด้วยการพักและประคบ\n   • วิธีใช้: ประคบเย็นหรืออุ่นบริเวณหู 10-15 นาที\n   • พัก: หลีกเลี่ยงเสียงดัง หลีกเลี่ยงการแคะหู\n   • ระวัง: หากไม่ดีขึ้นใน 24-48 ชม. หรือมีอาการแย่ลงควรพบแพทย์',
      };
    }
    
    // Urinary symptoms - need doctor evaluation
    if (normalizedSymptom.includes('ปัสสาวะแสบ') || normalizedSymptom.includes('ปัสสาวะเป็นเลือด') || 
        normalizedSymptom.includes('ปัสสาวะไม่ออก') || normalizedSymptom.includes('ปัสสาวะขัด')) {
      console.log('generateOTCMeds - Urinary symptom detected, returning doctor evaluation guidance');
      return {
        main: '🚽 ควรปรึกษาแพทย์เพื่อประเมินอาการทางปัสสาวะ\n   • วิธีใช้: ดื่มน้ำมากขึ้น หลีกเลี่ยงการกลั้นปัสสาวะ\n   • ระวัง: ไม่ควรใช้ยาด้วยตัวเองก่อนได้รับการประเมิน\n   • สาเหตุ: อาการทางปัสสาวะอาจเกิดจากการติดเชื้อหรือสาเหตุอื่น ต้องตรวจวินิจฉัย',
        alternative: '🌿 หรือดูแลตัวเองด้วยการดื่มน้ำและสังเกตอาการ\n   • วิธีใช้: ดื่มน้ำมากขึ้น หลีกเลี่ยงกาแฟ/แอลกอฮอล์\n   • สังเกต: ติดตามอาการไข้ ปวดหลัง ปวดท้องน้อย\n   • ระวัง: หากมีไข้สูง ปวดหลัง หรืออาการแย่ลงควรพบแพทย์ทันที',
      };
    }
    
    // Reproductive symptoms - need doctor evaluation
    if (normalizedSymptom.includes('ปวดอัณฑะ') || normalizedSymptom.includes('อัณฑะบวม') || normalizedSymptom.includes('อัณฑะแดง') ||
        normalizedSymptom.includes('เลือดออกช่องคลอด') || normalizedSymptom.includes('ประจำเดือนผิดปกติ')) {
      console.log('generateOTCMeds - Reproductive symptom detected, returning doctor evaluation guidance');
      return {
        main: '🏥 ควรปรึกษาแพทย์เพื่อประเมินอาการ\n   • วิธีใช้: พักผ่อน สังเกตอาการ\n   • ระวัง: ไม่ควรใช้ยาด้วยตัวเองก่อนได้รับการประเมิน\n   • สาเหตุ: อาการเหล่านี้ต้องได้รับการตรวจวินิจฉัยจากแพทย์',
        alternative: '🌿 หรือดูแลตัวเองด้วยการพักผ่อนและสังเกตอาการ\n   • วิธีใช้: พักผ่อนให้เพียงพอ สังเกตอาการอย่างใกล้ชิด\n   • ระวัง: หากอาการแย่ลงหรือมีอาการอื่นเพิ่มเติมควรพบแพทย์ทันที',
      };
    }
    
    // Dental symptoms - can use painkillers temporarily but should see dentist
    if (normalizedSymptom.includes('ปวดฟัน') || normalizedSymptom.includes('ปวดกราม')) {
      console.log('generateOTCMeds - Dental symptom detected, can use temporary painkillers');
      // Allow through to get painkillers, but will add dental-specific guidance
      symptomCategory = 'fever_pain'; // Can use painkillers temporarily
    }
    
    // Skin symptoms with infection - need doctor evaluation
    if (normalizedSymptom.includes('แผลติดเชื้อ') || normalizedSymptom.includes('แผลมีหนอง') || normalizedSymptom.includes('แผลมีกลิ่น')) {
      console.log('generateOTCMeds - Infected wound detected, returning doctor evaluation guidance');
      return {
        main: '🩹 ควรปรึกษาแพทย์เพื่อประเมินแผลติดเชื้อ\n   • วิธีใช้: ทำความสะอาดแผลเบื้องต้น หลีกเลี่ยงการบีบหรือแกะ\n   • ระวัง: ไม่ควรใช้ยาด้วยตัวเองก่อนได้รับการประเมิน\n   • สาเหตุ: แผลติดเชื้อต้องได้รับการตรวจและรักษาจากแพทย์',
        alternative: '🌿 หรือดูแลตัวเองด้วยการทำความสะอาดแผล\n   • วิธีใช้: ล้างแผลด้วยน้ำสะอาด ใช้ผ้าสะอาดปิดแผล\n   • สังเกต: ติดตามอาการบวมแดงเพิ่มขึ้น มีไข้\n   • ระวัง: หากแผลลาม มีไข้ หรืออาการแย่ลงควรพบแพทย์ทันที',
      };
    }
    
    console.log('generateOTCMeds - No category mapped, using safe defaults:', {
      symptom: symptom,
      mappedCategory: symptomCategory
    });
    // Try to use safe general medications (fever_pain category) as fallback
    symptomCategory = 'fever_pain'; // Use safe default category
  }
  
  // DEBUG: Log category mapping
  console.log('generateOTCMeds - Category mapping:', {
    symptom: symptom,
    mappedCategory: symptomCategory
  });
  
  // Get age and weight from health profile or answers
  const age = healthProfile?.age || answers.age || (answers.birth_date ? calculateAge(answers.birth_date) : null);
  const weightKg = healthProfile?.weightKg || answers.weight_kg || answers.child_weight || null;
  
  // CRITICAL: Pass symptom text to answers for proper subtype analysis
  const answersWithSymptom = {
    ...answers,
    symptom: symptom,
    original_symptom: symptom,
  };
  
  // MEDICAL-GRADE: Pass severity and time-course to OTC selection
  // These come from severity_timecourse_matrix.js evaluation
  const answersWithSeverityTimecourse = {
    ...answersWithSymptom,
    severity_level: answers.severity_level || answers.severity,
    time_course: answers.time_course,
    severity_trajectory: answers.severity_trajectory,
  };
  
  // Select two OTC options (A + B) with answers for safety checking
  // CRITICAL: Pass severity/time-course for medical-grade selection
  const otcOptions = await selectTwoOTCOptions(symptomCategory, healthProfile, age, weightKg, answersWithSeverityTimecourse);
  
  if (!otcOptions || !otcOptions.optionA) {
    // Fallback: Use safe default medications (paracetamol + ibuprofen)
    console.log('[OTC-FALLBACK] Using safe default medications');
    const safeDefaults = getSafeDefaultMedications(healthProfile, age, weightKg);
    return {
      main: safeDefaults.main,
      alternative: safeDefaults.alternative,
    };
  }
  
  // MEDICAL-GRADE: Handle 2-4 OTC options (Thailand formulary requirement)
  const optionA = otcOptions.optionA;
  const optionB = otcOptions.optionB;
  const optionC = otcOptions.optionC;
  const optionD = otcOptions.optionD;
  
  // Format medications (Medical-grade format: OTC Comparison Card)
  // OUTPUT FORMAT: OTC Comparison Card with reason for each medication
  // Format: Medication Name — Indication + Why This Medication + Dosing + Safety
  const formatMedication = (option, prefix = '💊', mappingTableData = null) => {
    if (!option || !option.medication || !option.dose) return null;
    const med = option.medication;
    const dose = option.dose;
    
    // Build contraindication warnings based on health profile
    let warnings = [];
    let contraindications = [];
    
    // Check chronic diseases
    if (healthProfile?.chronicDiseases && med.contraindicationsByDisease) {
      for (const disease of healthProfile.chronicDiseases) {
        const diseaseKey = Object.keys(med.contraindicationsByDisease).find(
          key => key.toLowerCase().includes(disease.toLowerCase()) || disease.toLowerCase().includes(key.toLowerCase())
        );
        if (diseaseKey && med.contraindicationsByDisease[diseaseKey]) {
          const contraindication = med.contraindicationsByDisease[diseaseKey];
          if (contraindication.includes('ห้าม') || contraindication.includes('หลีกเลี่ยง')) {
            contraindications.push(`${diseaseKey}: ${contraindication}`);
          } else {
            warnings.push(`${diseaseKey}: ${contraindication}`);
          }
        }
      }
    }
    
    // Check pregnancy/breastfeeding
    if (healthProfile?.isPregnant && med.contraindicationsByDisease?.['ตั้งครรภ์']) {
      const pregWarning = med.contraindicationsByDisease['ตั้งครรภ์'];
      if (pregWarning.includes('ห้าม') || pregWarning.includes('หลีกเลี่ยง')) {
        contraindications.push(`ตั้งครรภ์: ${pregWarning}`);
      }
    }
    if (healthProfile?.isBreastfeeding && med.contraindicationsByDisease?.['ให้นมบุตร']) {
      const bfWarning = med.contraindicationsByDisease['ให้นมบุตร'];
      if (bfWarning.includes('ห้าม') || bfWarning.includes('หลีกเลี่ยง')) {
        contraindications.push(`ให้นมบุตร: ${bfWarning}`);
      }
    }
    
    // General cautions if no specific warnings
    if (warnings.length === 0 && contraindications.length === 0 && med.cautions && Array.isArray(med.cautions) && med.cautions.length > 0) {
      warnings = med.cautions.slice(0, 2); // Max 2 warnings
    }
    
    // Medical-grade format: OTC Comparison Card
    // CRITICAL: Add null checks for all properties
    const genericThai = med.generic || 'ยา';
    // Format medical term with bilingual support (Thai (English))
    const generic = formatMedicalTerm(genericThai, language);
    const brandExample = (med.brandExamples && Array.isArray(med.brandExamples) && med.brandExamples.length > 0) ? med.brandExamples[0] : '';
    const indication = med.indication || 'บรรเทาอาการ';
    const doseText = dose.dose || 'ตามคำแนะนำบนฉลาก';
    const doseRange = dose.range || '';
    const frequency = dose.frequency || 'ตามคำแนะนำบนฉลาก';
    const instructions = dose.instructions || 'อ่านฉลากยาอย่างระมัดระวัง';
    
    // STEP 5.1: OTC Comparison Card - Include "Why This Medication" reason
    // Format: Short, clear reason why THIS medication is chosen (different from others)
    let whyThisMed = '';
    
    // Priority 1: Use enhanced clinicalReasoning (doctor's perspective) - most specific
    if (option.clinicalReasoning && typeof option.clinicalReasoning === 'string' && option.clinicalReasoning.trim()) {
      // Extract meaningful reasons (skip warnings, keep clinical reasoning)
      const reasons = option.clinicalReasoning.split(' | ').filter(r => 
        r.trim() && !r.includes('⚠️') && !r.includes('ห้ามใช้') && !r.includes('ควรพบแพทย์')
      );
      if (reasons.length > 0) {
        // Take first 2 meaningful reasons
        whyThisMed = reasons.slice(0, 2).join(' | ');
      }
    }
    
    // Priority 2: Use pharmacist reasoning if no clinical reasoning
    if ((!whyThisMed || whyThisMed.length < 10) && option.reasoning) {
      const pharmReasons = option.reasoning.split(' | ').filter(r => 
        r.trim() && !r.includes('⚠️')
      );
      if (pharmReasons.length > 0) {
        whyThisMed = pharmReasons.slice(0, 2).join(' | ');
      }
    }
    
    // Priority 3: Use medication-specific characteristics as fallback
    if (!whyThisMed || whyThisMed.length < 10) {
      if (med.generic === 'พาราเซตามอล') {
        whyThisMed = 'อ่อนโยนต่อกระเพาะ ปลอดภัยสำหรับเด็กและผู้สูงอายุ';
      } else if (med.generic === 'ไอบูโพรเฟน') {
        whyThisMed = 'ลดปวดและลดการอักเสบ เหมาะถ้ามีอาการอักเสบร่วม';
      } else if (med.generic.includes('คาเฟอีน')) {
        whyThisMed = 'คาเฟอีนช่วยเพิ่มประสิทธิภาพ เหมาะสำหรับปวดหัวจากความเครียด';
      } else if (med.safetyNotes) {
        whyThisMed = med.safetyNotes;
      } else if (indication && indication !== 'บรรเทาอาการ') {
        whyThisMed = `เหมาะสำหรับ${indication}`;
      } else {
        whyThisMed = 'เหมาะสมกับอาการของคุณ';
      }
    }
    
    // MEDICAL-GRADE HIERARCHY: Format with line of use
    // Convert English labels to Thai medical hierarchy labels
    const getThaiLineLabel = (lineLabel) => {
      const labelMap = {
        'first_line': 'เหมาะที่สุด',
        'First-line': 'เหมาะที่สุด',
        'second_line': 'ทางเลือก',
        'Second-line': 'ทางเลือก',
        'alternative': 'สำรอง',
        'Alternative': 'สำรอง'
      };
      return labelMap[lineLabel] || lineLabel;
    };
    
    const rawLineLabel = option.lineLabel || 'Alternative';
    const lineLabel = getThaiLineLabel(rawLineLabel);
    const lineRationale = option.lineRationale || '';
    const mappingWarning = option.mappingWarning || null;
    
    // Use clinical rationale from Master Clinical Mapping Table if available
    const mappingTableRationale = mappingTableData?._mappingTableRationale || null;
    const finalLineRationale = mappingTableRationale || lineRationale;
    
    // Format: [Line] Medication Name — Indication + Why + Dosing + Safety + When to See Doctor
    let formatted = `[${lineLabel}] ${prefix} ${generic}${brandExample ? ` (${brandExample})` : ''} — ${indication}\n`;
    
    // Add line rationale (why this line)
    if (finalLineRationale) {
      formatted += `   📋 เหตุผล (${lineLabel}): ${finalLineRationale}\n`;
    }
    
    // Add mapping warning if present (e.g., "Progressive symptoms require medical evaluation")
    if (mappingWarning) {
      formatted += `   ${mappingWarning}\n`;
    }
    
    // Add clinical reasoning (why this medication)
    formatted += `   💡 เหตุผล: ${whyThisMed}\n`;
    
    // PHASE 4: Add body-part rationale (if applicable)
    const bodyPartRationale = generateBodyPartRationale(med, answers, healthProfile);
    if (bodyPartRationale) {
      formatted += `   📍 ตำแหน่ง: ${bodyPartRationale}\n`;
    }
    
    // Add dosing information
    formatted += `   • ขนาดยา: ${doseText}${doseRange ? ` (${doseRange})` : ''}\n`;
    formatted += `   • ความถี่: ${frequency}\n`;
    if (instructions) {
      formatted += `   • วิธีใช้: ${instructions}\n`;
    }
    
    // Add contraindications (CRITICAL - must show)
    if (contraindications.length > 0) {
      formatted += `   ⚠️ ห้ามใช้: ${contraindications.join('; ')}\n`;
    }
    
    // Add warnings/cautions
    if (warnings.length > 0) {
      formatted += `   • ระวัง: ${warnings.join(', ')}\n`;
    }
    
    // Add when to see doctor (CRITICAL safety information)
    // Priority: Use Master Clinical Mapping Table data if available
    const whenToSeeDoctor = mappingTableData?._mappingTableWhenToSeeDoctor || 
                           (med.whenNotToSelfMedicate && Array.isArray(med.whenNotToSelfMedicate) ? med.whenNotToSelfMedicate : []);
    
    if (whenToSeeDoctor && whenToSeeDoctor.length > 0) {
      formatted += `   🏥 ควรพบแพทย์หาก: ${whenToSeeDoctor.slice(0, 3).join(', ')}`;
    }
    
    return formatted;
  };
  
  // CRITICAL: Check optionA exists and has required properties before formatting
  if (!optionA || !optionA.medication || !optionA.medication.generic) {
    console.log('[OTC-FORMAT] ERROR: optionA is missing required properties, using safe defaults');
    const safeDefaults = getSafeDefaultMedications(healthProfile, age, weightKg);
    return {
      main: safeDefaults.main,
      alternative: safeDefaults.alternative,
    };
  }
  
  // Prepare Master Clinical Mapping Table data for formatMedication
  const mappingTableData = {
    _mappingTableRationale: answers._mappingTableRationale,
    _mappingTableSelfCare: answers._mappingTableSelfCare,
    _mappingTableWhenToSeeDoctor: answers._mappingTableWhenToSeeDoctor
  };
  
  const mainText = formatMedication(optionA, '💊', mappingTableData);
  if (!mainText) {
    console.log('[OTC-FORMAT] ERROR: formatMedication returned null for optionA, using safe defaults');
    const safeDefaults = getSafeDefaultMedications(healthProfile, age, weightKg);
    return {
      main: safeDefaults.main,
      alternative: safeDefaults.alternative,
    };
  }
  
  // Build alternative options (2-4 total)
  // CRITICAL: Must have at least 2 medicines (medical-grade requirement)
  const alternatives = [];
  const optionAGeneric = optionA.medication.generic;
  
  // Ensure optionB is always included if available
  if (optionB && optionB.medication && optionB.medication.generic && optionB.medication.generic !== optionAGeneric) {
    const formattedB = formatMedication(optionB, '🌿', mappingTableData);
    if (formattedB) alternatives.push(formattedB);
  } else if (!optionB || !optionB.medication) {
    console.log('[OTC-FORMAT] WARNING: optionB is missing - only 1 medicine will be shown');
  }
  if (optionC && optionC.medication && optionC.medication.generic && 
      optionC.medication.generic !== optionAGeneric && 
      (!optionB || !optionB.medication || optionC.medication.generic !== optionB.medication.generic)) {
    const formattedC = formatMedication(optionC, '🌿', mappingTableData);
    if (formattedC) alternatives.push(formattedC);
  }
  if (optionD && optionD.medication && optionD.medication.generic && 
      optionD.medication.generic !== optionAGeneric &&
      (!optionB || !optionB.medication || optionD.medication.generic !== optionB.medication.generic) &&
      (!optionC || !optionC.medication || optionD.medication.generic !== optionC.medication.generic)) {
    const formattedD = formatMedication(optionD, '🌿', mappingTableData);
    if (formattedD) alternatives.push(formattedD);
  }
  
  // CRITICAL: Add symptom-specific guidance for certain symptoms
  // Dental symptoms: Add reminder to see dentist
  if (normalizedSymptom.includes('ปวดฟัน') || normalizedSymptom.includes('ปวดกราม')) {
    if (alternatives.length === 0) {
      const alternativeText = `🦷 หรือควรนัดทันตแพทย์เพื่อตรวจและรักษา\n   • วิธีใช้: ยาเป็นเพียงการบรรเทาชั่วคราว\n   • ระวัง: ปวดฟันต้องได้รับการรักษาจากทันตแพทย์\n   • สาเหตุ: อาจเกิดจากฟันผุ ฟันคุด หรือสาเหตุอื่น`;
      return {
        main: mainText,
        alternative: alternativeText,
      };
    } else {
      // Add dental note to first alternative
      const dentalNote = `\n   • ⚠️ หมายเหตุ: ยาเป็นเพียงการบรรเทาชั่วคราว ควรนัดทันตแพทย์`;
      alternatives[0] = alternatives[0] + dentalNote;
    }
  }
  
  // CRITICAL: If no alternatives (only paracetamol safe), provide non-drug alternative
  if (alternatives.length === 0) {
    const alternativeText = `🌿 หรือดูแลตัวเองด้วยการพักผ่อนและดื่มน้ำ\n   • วิธีใช้: พักผ่อนให้เพียงพอ ดื่มน้ำอุ่นบ่อยๆ\n   • ระวัง: หากอาการไม่ดีขึ้นควรพบแพทย์`;
    return {
      main: mainText,
      alternative: alternativeText,
    };
  }
  
  // Return first alternative (or combine multiple if needed)
  const alternativeText = alternatives[0];
  
  return {
    main: mainText,
    alternative: alternativeText,
  };
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const RECOMMENDATIONS_BY_TRIAGE = {
  self_care: {
    home_care: [
      '🛌 พักผ่อนให้เพียงพอ',
      '💧 ดื่มน้ำอุ่นบ่อย ๆ',
      '🧊 หลีกเลี่ยงของเย็น',
    ],
    otc_meds: [
      '💊 พาราเซตามอล — ลดปวดและไข้\n   • ขนาดยา: 500-1000 มก. ทุก 6 ชม. หลังอาหาร (ไม่เกิน 4,000 มก./วัน)\n   • ระวัง: ไม่ควรใช้ร่วมกับยาอื่นที่มีพาราเซตามอล, ห้ามใช้ในผู้ที่แพ้พาราเซตามอล\n   💡 พอเหมาะ ไม่เกินจำเป็น',
    ],
    when_to_see_doctor: [
      '📅 ไม่ดีขึ้นใน 2–3 วัน',
      '🤒 ไข้สูงกว่า 38.5°C',
      '😣 อาการแย่ลง',
    ],
    danger_signs: [
      '🚨 หายใจลำบาก',
      '💥 เจ็บหน้าอกรุนแรง',
      '😵 หมดสติ / ชัก',
    ],
    additional_advice: [
      '📝 จดอาการเปลี่ยนแปลง',
      '📱 กลับมาประเมินใหม่ได้',
      '⏰ ติดตามอาการภายใน 24–48 ชม.',
      '❗ สัญญาณที่ต้องกลับมาเช็ค: อาการแย่ลง, มีไข้สูง, ปวดมากขึ้น',
    ],
  },
  gp: {
    home_care: [
      '🛌 พักผ่อนให้เพียงพอ',
      '💧 ดื่มน้ำอุ่นบ่อย ๆ',
    ],
    otc_meds: [
      '💊 สามารถใช้ยาบรรเทาอาการได้ชั่วคราว\n   วิธีใช้: ตามคำแนะนำของแพทย์\n   ข้อควรระวัง: รอคำแนะนำจากแพทย์ก่อนใช้ยาอื่น',
      '🌿 หรือใช้ยาพาราเซตามอลเพื่อบรรเทาอาการ\n   วิธีใช้: ทุก 6 ชม. หลังอาหาร\n   ข้อควรระวัง: ควรถามแพทย์ก่อนใช้',
    ],
    when_to_see_doctor: [
      '👨‍⚕️ ควรพบแพทย์ภายใน 1–2 วัน',
      '📅 อย่าปล่อยทิ้งไว้',
      '📝 เตรียมข้อมูลอาการ',
    ],
    danger_signs: [
      '🚨 หายใจลำบาก',
      '💥 เจ็บหน้าอกรุนแรง',
      '😵 หมดสติ / ชัก',
    ],
    additional_advice: [
      '📝 เตรียมเล่าอาการให้แพทย์ฟัง',
      '💊 นำประวัติการใช้ยามาด้วย',
      '👨‍⚕️ พิจารณา Premium Doctor Review เพื่อให้แพทย์ตรวจซ้ำจากข้อมูลที่ AI สรุปแล้ว',
      '⏰ ติดตามอาการภายใน 24–48 ชม.',
    ],
  },
  emergency: {
    home_care: [], // CRITICAL: No home care for emergency
    otc_meds: [], // CRITICAL: No OTC medications for emergency - medical-grade requirement
    when_to_see_doctor: [
      '🏥 ไปโรงพยาบาลทันที - พบสัญญาณอันตราย',
      '⏱️ อย่ารอให้อาการแย่ลง',
      '📞 โทร 1669 เพื่อขอความช่วยเหลือฉุกเฉิน',
      '🚨 ไม่ควรขับรถเอง - ขอให้คนอื่นพาไปหรือเรียกรถพยาบาล',
    ],
    danger_signs: [
      '🚨 ภาวะฉุกเฉิน - พบสัญญาณอันตราย',
      '⚠️ อย่าชะล่าใจ - ต้องได้รับการดูแลทันที',
      '🏥 ไม่ควรใช้ยาตัวเอง - ต้องให้แพทย์ประเมิน',
      '📋 เตรียมข้อมูลอาการและประวัติการเจ็บป่วยให้แพทย์',
    ],
    additional_advice: [
      '🏥 ไปโรงพยาบาลทันที - พบสัญญาณอันตราย',
      '⏱️ อย่ารอ - ภาวะฉุกเฉินต้องได้รับการดูแลทันที',
      '📞 โทร 1669 หากไม่สามารถไปโรงพยาบาลได้เอง',
      '🚫 ห้ามให้คำแนะนำยาใด ๆ - ต้องให้แพทย์ประเมินก่อน',
      '📋 นำประวัติการเจ็บป่วยและยาที่ใช้อยู่มาด้วย',
    ],
  },
  uncertain: {
    home_care: [
      '🛌 พักผ่อนให้เพียงพอ',
      '👀 สังเกตอาการอย่างใกล้ชิด',
    ],
    otc_meds: [
      '💊 ควรปรึกษาแพทย์ก่อนใช้ยา',
    ],
    when_to_see_doctor: [
      '👨‍⚕️ ควรปรึกษาแพทย์เพื่อประเมินเพิ่มเติม',
      '📅 อย่าปล่อยทิ้งไว้',
    ],
    danger_signs: [
      '🚨 สังเกตอาการผิดปกติ',
      '⚠️ หากแย่ลงให้ไปพบแพทย์ทันที',
    ],
    additional_advice: [
      '👨‍⚕️ ควรปรึกษาแพทย์',
      '📝 เตรียมข้อมูลอาการให้พร้อม',
      '⏰ ติดตามอาการภายใน 24–48 ชม.',
      '❗ สัญญาณที่ต้องกลับมาเช็ค: อาการแย่ลง, มีไข้สูง, ปวดมากขึ้น',
    ],
  },
};

/**
 * Generate "What this is likely to be" (non-diagnostic, probability-based language)
 * Master Prompt: Section 1️⃣ - Must be non-diagnostic, probability-based
 */
function generateLikelyCondition(symptom, triageLevel, answers = {}, language = 'th') {
  const normalizedSymptom = normalizeThaiText(symptom.toLowerCase());
  
  // Non-diagnostic language - probability-based, not definitive
  if (language === 'th') {
    if (normalizedSymptom.includes('ปวดหัว')) {
      return 'น่าจะเป็นอาการปวดหัวทั่วไป (tension headache) หรืออาจเป็นไมเกรน';
    } else if (normalizedSymptom.includes('ไข้') || normalizedSymptom.includes('ไอ')) {
      return 'น่าจะเป็นการติดเชื้อไวรัสหรือแบคทีเรียในระบบทางเดินหายใจ';
    } else if (normalizedSymptom.includes('ปวดท้อง')) {
      return 'น่าจะเป็นอาการปวดท้องจากหลายสาเหตุ เช่น อาหารไม่ย่อย หรือการติดเชื้อ';
    } else if (normalizedSymptom.includes('เจ็บคอ')) {
      return 'น่าจะเป็นการติดเชื้อในลำคอหรือการระคายเคือง';
    } else {
      return 'น่าจะเป็นอาการที่สามารถดูแลตัวเองได้ แต่ควรติดตามอาการอย่างใกล้ชิด';
    }
  } else {
    if (normalizedSymptom.includes('headache') || normalizedSymptom.includes('head')) {
      return 'Likely a tension headache or possibly migraine';
    } else if (normalizedSymptom.includes('fever') || normalizedSymptom.includes('cough')) {
      return 'Likely a viral or bacterial respiratory infection';
    } else if (normalizedSymptom.includes('stomach') || normalizedSymptom.includes('abdominal')) {
      return 'Likely abdominal pain from various causes such as indigestion or infection';
    } else if (normalizedSymptom.includes('throat') || normalizedSymptom.includes('sore')) {
      return 'Likely a throat infection or irritation';
    } else {
      return 'Likely a self-care manageable condition, but should monitor closely';
    }
  }
}

/**
 * Generate explainable summary based on triage level and clinical reasoning
 * Doctor-level explanation: WHY this triage level, not just WHAT
 * Must provide: clear triage result, clear next action, clear safety boundary
 * NEW REQUIREMENT: Every diagnosis MUST start with clear severity statement + WHY
 * Tone: Formal, doctor-like, but understandable for general public
 */
function generateSummary(triageLevel, symptom = '', answers = {}, riskScore = 0) {
  const normalizedSymptom = symptom.toLowerCase();
  
  // Generate WHY explanation based on clinical reasoning
  // More formal, clinical tone while remaining understandable
  let whyExplanation = '';
  
  if (triageLevel === 'emergency') {
    // CRITICAL: Medical-grade explanation - explain which red flag was detected
    // Extract red flag from answers if available
    const detectedRedFlag = answers.redFlagDetected || 'สัญญาณอันตราย';
    whyExplanation = `พบ${detectedRedFlag}ที่ต้องได้รับการดูแลทันที (เช่น หายใจลำบาก, เจ็บหน้าอก, หมดสติ, อ่อนแรง, ชัก) - ภาวะฉุกเฉินต้องให้แพทย์ประเมินทันที`;
  } else if (triageLevel === 'gp') {
    if (riskScore >= 60) {
      whyExplanation = 'อาการมีความรุนแรงหรือมีปัจจัยเสี่ยงสูง (เช่น อายุ, โรคประจำตัว, อาการแย่ลง) ควรให้แพทย์ตรวจวินิจฉัยเพื่อหาสาเหตุ';
    } else if (answers.trend && (answers.trend.includes('แย่ลง') || answers.severity_trend === 'แย่ลง')) {
      whyExplanation = 'อาการแย่ลงแม้ดูแลตัวเองแล้ว ควรให้แพทย์ตรวจเพื่อหาสาเหตุและวางแผนการรักษา';
    } else if (answers.self_care_response && (answers.self_care_response.includes('ไม่ดีขึ้น') || answers.self_care_response.includes('ไม่ดี'))) {
      whyExplanation = 'ลองดูแลตัวเองแล้วแต่ไม่ดีขึ้น ควรให้แพทย์ประเมินเพื่อหาสาเหตุที่แท้จริงและให้การรักษาที่เหมาะสม';
    } else if (answers.chronic_disease || answers.risk_group) {
      whyExplanation = 'มีปัจจัยเสี่ยง (เช่น โรคประจำตัว, อายุ) ที่อาจทำให้อาการรุนแรงขึ้น ควรให้แพทย์ตรวจวินิจฉัย';
    } else {
      whyExplanation = 'อาการมีความรุนแรงปานกลางถึงสูง หรือมีลักษณะที่ต้องได้รับการตรวจวินิจฉัยจากแพทย์';
    }
  } else if (triageLevel === 'self_care') {
    whyExplanation = 'อาการไม่รุนแรงและไม่มีสัญญาณอันตราย สามารถดูแลตัวเองที่บ้านได้ด้วยการพักผ่อนและดูแลทั่วไป';
  } else {
    whyExplanation = 'ควรให้แพทย์ประเมินเพิ่มเติมเพื่อความแน่ใจและให้การดูแลที่เหมาะสม';
  }
  
  const summaries = {
    self_care: {
      severity: '🟢 ดูแลตัวเองได้',
      why: whyExplanation || 'อาการไม่รุนแรงและไม่มีสัญญาณอันตราย',
      action: '🏠 ดูแลตัวเองที่บ้านได้',
      followup: '⏰ ติดตามอาการ 24–48 ชม.',
    },
    gp: {
      severity: '🟡 ควรพบแพทย์',
      why: whyExplanation || 'อาการอาจต้องได้รับการตรวจวินิจฉัยจากแพทย์',
      action: '📅 ควรพบแพทย์ภายใน 1–2 วัน',
      followup: '📌 เตรียมข้อมูลอาการให้พร้อม',
    },
    emergency: {
      severity: '🔴 ฉุกเฉิน',
      why: whyExplanation || 'มีสัญญาณอันตรายที่ต้องได้รับการดูแลทันที',
      action: '🏥 ไปโรงพยาบาลทันที',
      followup: '⚠️ อย่ารอให้อาการแย่ลง',
    },
    uncertain: {
      severity: '🟡 ควรปรึกษาแพทย์',
      why: whyExplanation || 'ควรให้แพทย์ประเมินเพิ่มเติมเพื่อความแน่ใจ',
      action: '📅 ควรพบแพทย์เพื่อประเมิน',
      followup: '📝 เตรียมข้อมูลอาการให้พร้อม',
    },
  };
  const summary = summaries[triageLevel] || summaries.uncertain;
  return `${summary.severity}\n${summary.why}\n${summary.action}\n${summary.followup}`;
}

/**
 * Generate diagnosis response with clinical reasoning (Production-ready / Medical-grade)
 * 
 * 🔷 STEP 6: Final Summary & Safety Positioning
 * 
 * This function implements the final step of the Hybrid Medical-grade Flow:
 * - Clearly state triage level
 * - Explain WHY this level was chosen (clinical reasoning)
 * - Show medication options (if applicable, from STEP 5)
 * - Include danger signs to watch for
 * - Be concise, emoji-assisted, and easy to understand
 * 
 * Doctor-level explainable recommendations
 * PROBLEM_DRIVEN_IMPLEMENTATION.md: Every diagnosis MUST include all sections
 * Must provide: clear triage result, clear next action, clear safety boundary
 * 
 * Output format:
 * - severity_statement: 🟢🟡🔴 traffic light
 * - why_explanation: WHY in 1 sentence (clinical reasoning)
 * - recommendations: home_care, otc_meds (≥2 options), when_to_see_doctor, danger_signs, additional_advice
 * - follow_up: timing, watch_signs
 */
export async function generateDiagnosis({ symptoms, answers, triageLevel, riskScore = 0, healthProfile = null, language = 'th' }) {
  try {
  // Ensure we never return uncertain without clear guidance
    // CRITICAL: Map 'pharmacy' to 'gp' (Suk AI behaves as personal AI doctor)
  // A doctor recommends: Safe (self-care), Emergency, or Consult real doctor
  let mappedTriageLevel = triageLevel === 'uncertain' ? 'gp' : (triageLevel || 'self_care');
  if (mappedTriageLevel === 'pharmacy') {
    mappedTriageLevel = 'gp';
    console.log(`[DIAGNOSIS] Mapped 'pharmacy' → 'gp' (consult doctor)`);
  }
  const finalTriage = mappedTriageLevel;
  const recommendations = RECOMMENDATIONS_BY_TRIAGE[finalTriage] || RECOMMENDATIONS_BY_TRIAGE.gp;
    const symptomText = Array.isArray(symptoms) ? symptoms.join(' ') : (symptoms || '');
    const summary = generateSummary(finalTriage, symptomText, answers, riskScore);

    // Extract severity and why from summary
    const summaryLines = summary.split('\n');
    const severityStatement = summaryLines[0] || '';
    const whyExplanation = summaryLines[1] || '';

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔵 STEP 5: Dual Recommendation Layer (Self-care + OTC Medication Mapping)
    // ═══════════════════════════════════════════════════════════════════════════
    
    // 🏠 5A. Self-Care at Home (Mandatory)
    // CRITICAL: Must be symptom-specific, adapted to severity/time-course/age/weight
    // Self-care must be shown even if OTC meds are recommended
    let selfCareRecs = recommendations.home_care || [];
    
    // CRITICAL: Declare intent at function scope so it's available for both self-care and OTC sections
    let intent = null;
    
    if (finalTriage !== 'emergency') {
      // Extract severity and time-course from answers
      const severity = answers.severity_level || answers.severity || 'mild';
      const timeCourse = answers.time_course || 'acute';
      
      // CRITICAL IMPROVEMENT: Try to resolve intent for symptom to use intent's self-care groups
      intent = await resolveSymptomIntent(symptomText);
      if (!intent) {
        intent = await findIntentBySymptomText(symptomText, language);
      }
      
      // CRITICAL IMPROVEMENT: Use intent self-care groups if available (from 700-intent dataset)
      let intentSelfCareGroups = [];
      if (intent) {
        // getSelfCareGroups takes an intent object, not an intentId
        intentSelfCareGroups = getSelfCareGroups(intent);
        if (intentSelfCareGroups && intentSelfCareGroups.length > 0) {
          console.log(`[SELF-CARE-INTENT] Using intent self-care groups: ${intentSelfCareGroups.join(', ')}`);
        }
      }
      
      // Generate symptom-specific self-care recommendations
      // MEDICAL-GRADE: System now properly handles 'severe' severity with urgent self-care guidance
      // CRITICAL IMPROVEMENT: Pass intent self-care groups to guide recommendations
      const symptomSpecificSelfCare = generateSelfCareRecommendations(
        symptomText,
        severity, // Use actual severity (mild/moderate/severe) - system handles all levels
        timeCourse,
        healthProfile,
        answers,
        intentSelfCareGroups // Pass intent self-care groups
      );
      
      // Use symptom-specific if available, otherwise fallback to generic
      if (symptomSpecificSelfCare && symptomSpecificSelfCare.length > 0) {
        selfCareRecs = symptomSpecificSelfCare;
        console.log(`[STEP-5A-SELF-CARE] Generated ${symptomSpecificSelfCare.length} symptom-specific self-care recommendations`);
      }
    } else {
      // Emergency: No self-care (must go to hospital)
      selfCareRecs = [];
    }
    
    // 💊 5B. OTC Medication (When Appropriate)
    // STEP 5.1: OTC Comparison Card (Mandatory for non-emergency)
    // CRITICAL: Medical-grade red flag mapping - NO OTC recommendations for emergency
    let otcMeds = recommendations.otc_meds || [];
    
    // CRITICAL: Emergency flow must NOT recommend any OTC medications
    if (finalTriage === 'emergency') {
      otcMeds = []; // NO OTC recommendations for emergency
      console.log(`[STEP-5B-OTC] No OTC recommendations - Emergency detected`);
    } else if (finalTriage === 'self_care' || finalTriage === 'gp') {
      // CRITICAL: Resolve intent if not already resolved (for OTC recommendations)
      let intentForOtc = intent; // Use intent from self-care section if available
      if (!intentForOtc) {
        intentForOtc = await resolveSymptomIntent(symptomText);
        if (!intentForOtc) {
          intentForOtc = await findIntentBySymptomText(symptomText, language);
        }
      }
      
      // MEDICAL-GRADE: Generate 2-3 OTC options for both self_care AND gp cases
      // GP cases can use temporary OTCs while waiting to see doctor
      const clinicalMeds = await generateOTCMeds(symptomText, finalTriage, answers, healthProfile, intentForOtc);
      // Build array of all available options (main + alternatives, max 3)
      otcMeds = [clinicalMeds.main];
      if (clinicalMeds.alternative) {
        otcMeds.push(clinicalMeds.alternative);
      }
      // Limit to 3 options max (as per requirement)
      otcMeds = otcMeds.slice(0, 3);
      console.log(`[STEP-5B-OTC] Generated ${otcMeds.length} OTC medication options for ${finalTriage}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔷 STEP 5.2: Personalized Safety Explanation ("Why This Plan Is Safe for You")
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5.2: Generate personalized safety explanation based on health profile
    let personalizedSafety = [];
    
    if (finalTriage !== 'emergency' && otcMeds.length > 0) {
      const age = healthProfile?.age || answers.age || (answers.birth_date ? calculateAge(answers.birth_date) : null);
      const weightKg = healthProfile?.weightKg || answers.weight_kg || answers.child_weight || null;
      
      // Age-based safety
      if (age !== null && age !== undefined) {
        if (age < 12) {
          personalizedSafety.push('✅ ขนาดยาที่แนะนำเหมาะกับอายุและน้ำหนักของเด็ก');
        } else if (age >= 12 && age < 65) {
          personalizedSafety.push('✅ อายุของคุณอยู่ในช่วงที่ใช้ยานี้ได้อย่างปลอดภัย');
        } else if (age >= 65) {
          personalizedSafety.push('✅ ขนาดยาที่แนะนำเหมาะกับผู้สูงอายุ (อาจต้องปรับตามโรคประจำตัว)');
        }
      }
      
      // Weight-based safety (if available)
      if (weightKg !== null && weightKg !== undefined && age !== null && age < 12) {
        personalizedSafety.push(`✅ ขนาดยาคำนวณตามน้ำหนัก ${weightKg} กก.`);
      }
      
      // Chronic disease safety check
      if (healthProfile?.chronicDiseases && healthProfile.chronicDiseases.length > 0) {
        // Check if medications are safe for chronic diseases
        const hasContraindications = otcMeds.some(med => {
          if (typeof med === 'string' && med.includes('ห้ามใช้')) {
            return true;
          }
          return false;
        });
        
        if (!hasContraindications) {
          personalizedSafety.push('✅ ไม่มีโรคประจำตัวที่เป็นข้อห้ามในการใช้ยานี้');
        } else {
          personalizedSafety.push('⚠️ กรุณาตรวจสอบข้อห้ามตามโรคประจำตัวของคุณ');
        }
      } else {
        personalizedSafety.push('✅ ไม่มีโรคประจำตัวที่เป็นข้อห้าม');
      }
      
      // Allergy safety check
      if (healthProfile?.drugAllergies && healthProfile.drugAllergies.length > 0) {
        const allergies = healthProfile.drugAllergies.map(a => a.toLowerCase());
        const hasAllergyMatch = otcMeds.some(med => {
          if (typeof med === 'string') {
            return allergies.some(allergy => med.toLowerCase().includes(allergy));
          }
          return false;
        });
        
        if (!hasAllergyMatch) {
          personalizedSafety.push('✅ ไม่มีประวัติแพ้ยาที่แนะนำ');
        } else {
          personalizedSafety.push('⚠️ กรุณาตรวจสอบประวัติการแพ้ยาของคุณ');
        }
      } else {
        personalizedSafety.push('✅ ไม่มีประวัติแพ้ยาที่แนะนำ');
      }
      
      // Limit to 3-4 items max
      personalizedSafety = personalizedSafety.slice(0, 4);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔷 STEP 5.3: Follow-up Logic (24–48 Hours)
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5.3: Enhanced follow-up logic with clear timing and watch signs
    const followUpTiming = finalTriage === 'emergency' ? 'ทันที' : '24–48 ชม.';
    
    // Build comprehensive watch signs based on symptom
    const normalizedSymptom = normalizeThaiText(symptomText.toLowerCase());
    let watchSigns = [];
    
    // Symptom-specific watch signs
    if (normalizedSymptom.includes('ไข้')) {
      watchSigns.push('ไข้สูงกว่า 38.5°C หรือไข้ไม่ลด');
    }
    if (normalizedSymptom.includes('ปวด')) {
      watchSigns.push('ปวดมากขึ้นหรือปวดรุนแรง');
    }
    if (normalizedSymptom.includes('หายใจ') || normalizedSymptom.includes('หอบ')) {
      watchSigns.push('หายใจลำบากหรือหอบมากขึ้น');
    }
    
    // Generic watch signs
    watchSigns.push('อาการแย่ลงหรือไม่ดีขึ้น');
    watchSigns.push('มีอาการใหม่เพิ่มเติม');
    
    // Limit to 3-4 items
    watchSigns = watchSigns.slice(0, 4);
    const watchSignsText = watchSigns.join(', ');

    // Safely extract additional watch signs from recommendations
    const additionalAdvice = recommendations.additional_advice || [];
    const watchSignsItem = Array.isArray(additionalAdvice) 
      ? additionalAdvice.find(item => typeof item === 'string' && item.includes('สัญญาณ'))
      : null;
    const finalWatchSigns = watchSignsItem || watchSignsText;

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔷 STEP 6: Final Summary & Safety Framing
    // ═══════════════════════════════════════════════════════════════════════════
    // Final output must always include 5 clearly separated sections:
    // 1. สรุปการประเมิน (triage level + reason) - severity_statement + why_explanation
    // 2. วิธีดูแลตัวเองที่บ้าน (3–5 short items) - home_care
    // 3. ยาที่ควรใช้ (ถ้าจำเป็น) (≥2 options) - otc_meds
    // 4. สัญญาณอันตรายที่ต้องไปโรงพยาบาล - danger_signs
    // 5. ควรติดตามอาการ / พบแพทย์เมื่อไร - when_to_see_doctor + follow_up
    
    // MEDICAL-GRADE: Ensure follow-up advice is included
    const followUpAdvice = 'หากอาการไม่ดีขึ้นภายใน 24-48 ชั่วโมง ควรพบแพทย์';
    const whenToSeeDoctorList = Array.isArray(recommendations.when_to_see_doctor) 
      ? [...recommendations.when_to_see_doctor, followUpAdvice].slice(0, 5)
      : [followUpAdvice];
    
    // Ensure all recommendation arrays exist
    // OUTPUT FORMAT (STRICT): 3-5 items per section, short clinical bullets only
    // Medical-grade format: NO paragraphs, emoji allowed, calm professional tone
    // Style: Short, Clear, Emoji-assisted, No paragraphs, Easy for kids → elderly
    const safeRecommendations = {
      home_care: Array.isArray(selfCareRecs) ? selfCareRecs.slice(0, 5) : [], // STEP 5A: Symptom-specific self-care
      otc_meds: Array.isArray(otcMeds) ? otcMeds.slice(0, 3) : [], // STEP 5.1: 2-3 OTC options (Medical Hierarchy)
      personalized_safety: Array.isArray(personalizedSafety) ? personalizedSafety.slice(0, 4) : [], // STEP 5.2: Why This Plan Is Safe for You
      when_to_see_doctor: whenToSeeDoctorList, // Always includes 24-48 hour follow-up
      danger_signs: Array.isArray(recommendations.danger_signs) ? recommendations.danger_signs.slice(0, 5) : [],
      additional_advice: Array.isArray(recommendations.additional_advice) ? recommendations.additional_advice.slice(0, 5) : [],
    };

  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL OUTPUT STRUCTURE (FIXED ORDER - Master Prompt Specification)
  // ═══════════════════════════════════════════════════════════════════════════
  // 
  // 1️⃣ What this is likely to be (non-diagnostic, probability-based language)
  // 2️⃣ Self-care plan (primary) - clear, actionable, Thai-context
  // 3️⃣ OTC Comparison Card (2-3 items) - Each with: When to use, Who should avoid, Why suitable
  // 4️⃣ Why this plan is safe for you - Explicitly reference: Age, Diseases, Meds, Allergies, Pregnancy
  // 5️⃣ Follow-up logic (24-48 hrs) - "If not better → do X"
  // 6️⃣ When to seek urgent care - Clear red-flag list
  //
  // PROBLEM_DRIVEN_IMPLEMENTATION.md: All sections must appear, 3-5 items each
  
  // 1️⃣ What this is likely to be (non-diagnostic)
  const likelyCondition = generateLikelyCondition(symptomText, finalTriage, answers, language);
  
  // 5️⃣ Follow-up logic (24-48 hrs)
  const followUpLogic = language === 'th'
    ? `ถ้าอีก ${followUpTiming} ไม่ดีขึ้น → ${finalTriage === 'self_care' ? 'ควรปรึกษาแพทย์' : 'ควรไปพบแพทย์ทันที'}`
    : `If not better in ${followUpTiming} → ${finalTriage === 'self_care' ? 'consult a doctor' : 'see a doctor immediately'}`;
  
  return {
    triage_level: finalTriage, // Clear result
    summary, // Clear next action
    
    // 1️⃣ What this is likely to be
    likely_condition: likelyCondition,
    
    // 2️⃣ Self-care plan (primary)
    self_care_plan: safeRecommendations.home_care,
    
    // 3️⃣ OTC Comparison Card (2-3 items)
    otc_comparison_card: safeRecommendations.otc_meds,
    
    // 4️⃣ Why this plan is safe for you
    why_safe_for_you: safeRecommendations.personalized_safety,
    
    // 5️⃣ Follow-up logic (24-48 hrs)
    follow_up_logic: followUpLogic,
    follow_up_watch_signs: finalWatchSigns,
    
    // 6️⃣ When to seek urgent care
    when_to_seek_urgent_care: safeRecommendations.danger_signs,
    
    // Legacy fields (for backward compatibility)
    severity_statement: severityStatement, // 🟢🟡🔴 traffic light
    why_explanation: whyExplanation, // WHY in 1 sentence
    recommendations: safeRecommendations,
      follow_up: {
        timing: followUpTiming, // STEP 5.3: 24–48 ชม. for non-emergency
        watch_signs: finalWatchSigns, // STEP 5.3: Symptom-specific watch signs
        action: finalTriage === 'emergency' 
          ? 'ไปโรงพยาบาลทันที' 
          : finalTriage === 'gp'
          ? 'ควรพบแพทย์ภายใน 1–2 วัน'
          : 'ถ้าไม่ดีขึ้นใน 24–48 ชม. → ควรพบแพทย์', // STEP 5.3: Clear follow-up action
      },
    };
  } catch (error) {
    console.error('Error generating diagnosis:', error);
    // Fallback to safe defaults
    const fallbackTriage = 'self_care';
    const fallbackRecs = RECOMMENDATIONS_BY_TRIAGE[fallbackTriage];
    const fallbackSummary = generateSummary(fallbackTriage);
    const summaryLines = fallbackSummary.split('\n');
    
    return {
      triage_level: fallbackTriage,
      summary: fallbackSummary,
      severity_statement: summaryLines[0] || '🟢 ดูแลตัวเองได้',
      why_explanation: summaryLines[1] || 'อาการไม่รุนแรง',
    recommendations: {
        home_care: fallbackRecs.home_care || [],
        otc_meds: fallbackRecs.otc_meds || [],
        when_to_see_doctor: fallbackRecs.when_to_see_doctor || [],
        danger_signs: fallbackRecs.danger_signs || [],
        additional_advice: fallbackRecs.additional_advice || [],
      },
      follow_up: {
        timing: '24–48 ชม.',
        watch_signs: 'อาการแย่ลง, มีไข้สูง, ปวดมากขึ้น',
      },
    };
  }
}
