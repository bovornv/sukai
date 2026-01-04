/**
 * Generate Master Clinical Mapping Table
 * 
 * This script generates the Master Clinical Mapping Table that links
 * Symptom × Severity × Time-course combinations to OTC medication recommendations
 * for 300-500 symptoms.
 * 
 * Run: node backend/scripts/generate_otc_clinical_mapping.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mapSymptomToCategory } from '../src/functions/triage/thai_otc_catalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load data sources
const symptomIntentsPath = path.join(__dirname, '../data/symptom_intents_master.json');
const otcMedicinesPath = path.join(__dirname, '../../mobile/assets/data/otc_medicines_master_th.csv');
const outputPath = path.join(__dirname, '../../mobile/assets/data/otc_clinical_mapping.json');

// Load symptom intents
const symptomIntents = JSON.parse(fs.readFileSync(symptomIntentsPath, 'utf8'));

// Load OTC medicines CSV
const otcMedicinesCSV = fs.readFileSync(otcMedicinesPath, 'utf8');
const otcMedicinesLines = otcMedicinesCSV.split('\n').filter(line => line.trim());
const otcMedicinesHeader = otcMedicinesLines[0].split(',');
const otcMedicines = otcMedicinesLines.slice(1).map(line => {
  const values = line.split(',');
  const medicine = {};
  otcMedicinesHeader.forEach((header, index) => {
    medicine[header] = values[index] || '';
  });
  return medicine;
});

// Normalize symptom group from CSV to catalog category
function normalizeSymptomGroup(csvGroup) {
  const mapping = {
    'Fever/Pain': 'fever_pain',
    'Pain-Neuro': 'fever_pain',
    'Respiratory-Nasal': 'nasal_congestion',
    'Cough/Throat': 'sore_throat_cough',
    'GI-Diarrhea': 'gi_symptoms',
    'GI-Bloating': 'gi_symptoms',
    'GI-Nausea': 'gi_symptoms',
    'GI-Reflux': 'gi_symptoms',
    'Skin-Allergy': 'skin_allergy',
    'Skin-Fungal': 'skin_allergy',
    'Skin-Bacterial': 'skin_allergy',
    'Urinary': 'urinary',
    'Muscle': 'fever_pain',
    'Eye': 'eye',
    'Ear': 'ear',
    'Sleep': 'sleep',
    'Anxiety': 'anxiety'
  };
  return mapping[csvGroup] || csvGroup.toLowerCase().replace(/\s+/g, '_');
}

// Get OTC medicines by symptom group
function getMedicinesBySymptomGroup(symptomGroup) {
  return otcMedicines.filter(med => {
    const csvGroup = med.symptom_group;
    const normalizedGroup = normalizeSymptomGroup(csvGroup);
    return normalizedGroup === symptomGroup;
  });
}

// Generate avoid lists from contraindications
function generateAvoidLists(medicines) {
  const avoidByCondition = {};
  const avoidByAge = { pediatric: [], elderly: [] };
  
  medicines.forEach(med => {
    const contraindications = med.contraindications || '';
    const medicineName = med.medicine_name;
    
    // Parse contraindications
    if (contraindications.includes('ไต') || contraindications.includes('โรคไต')) {
      if (!avoidByCondition.kidney_disease) avoidByCondition.kidney_disease = [];
      avoidByCondition.kidney_disease.push(medicineName);
    }
    if (contraindications.includes('ตับ') || contraindications.includes('โรคตับ')) {
      if (!avoidByCondition.liver_disease) avoidByCondition.liver_disease = [];
      avoidByCondition.liver_disease.push(medicineName);
    }
    if (contraindications.includes('กระเพาะ') || contraindications.includes('แผลกระเพาะ')) {
      if (!avoidByCondition.gastric_ulcer) avoidByCondition.gastric_ulcer = [];
      avoidByCondition.gastric_ulcer.push(medicineName);
    }
    if (contraindications.includes('ความดัน') || contraindications.includes('ความดันสูง')) {
      if (!avoidByCondition.hypertension) avoidByCondition.hypertension = [];
      avoidByCondition.hypertension.push(medicineName);
    }
    if (contraindications.includes('หอบหืด') || contraindications.includes('asthma')) {
      if (!avoidByCondition.asthma) avoidByCondition.asthma = [];
      avoidByCondition.asthma.push(medicineName);
    }
    if (contraindications.includes('ต้อหิน') || contraindications.includes('glaucoma')) {
      if (!avoidByCondition.glaucoma) avoidByCondition.glaucoma = [];
      avoidByCondition.glaucoma.push(medicineName);
    }
    if (contraindications.includes('หัวใจ') || contraindications.includes('heart')) {
      if (!avoidByCondition.heart_disease) avoidByCondition.heart_disease = [];
      avoidByCondition.heart_disease.push(medicineName);
    }
    
    // Adult-only medicines
    if (med.adult_only === 'true') {
      avoidByAge.pediatric.push(medicineName);
    }
  });
  
  return {
    avoid_list_by_condition: Object.keys(avoidByCondition).length > 0 ? avoidByCondition : {},
    avoid_list_by_age: avoidByAge.pediatric.length > 0 ? avoidByAge : {},
    avoid_list_by_severity: {}
  };
}

// Generate clinical rationale
function generateClinicalRationale(severity, timeCourse, symptomGroup) {
  const severityTh = {
    'mild': 'ไม่รุนแรง',
    'moderate': 'ปานกลาง',
    'severe': 'รุนแรง'
  };
  
  const timeCourseTh = {
    'acute': 'เป็นทันที',
    'subacute': 'เป็นมานาน',
    'progressive': 'แย่ลง',
    'recurrent': 'เป็นซ้ำ'
  };
  
  const medicineTypeTh = {
    'fever_pain': 'ยาลดปวด',
    'nasal_congestion': 'ยาแก้แพ้',
    'sore_throat_cough': 'ยาลดอาการไอ',
    'gi_symptoms': 'ยาทางเดินอาหาร',
    'skin_allergy': 'ยาทาแก้แพ้'
  };
  
  const severityText = severityTh[severity] || severity;
  const timeCourseText = timeCourseTh[timeCourse] || timeCourse;
  const medicineType = medicineTypeTh[symptomGroup] || 'ยา';
  
  if (severity === 'severe') {
    return `อาการรุนแรง → แนะนำ${medicineType}เบาๆ เพื่อบรรเทาอาการชั่วคราว แต่ควรพบแพทย์`;
  }
  
  return `อาการ${severityText}และ${timeCourseText} → แนะนำ${medicineType}เบาๆ หรือการดูแลตัวเอง`;
}

// Generate self-care guidance
function generateSelfCareGuidance(symptomGroup) {
  const guidance = {
    'fever_pain': [
      'พักผ่อนให้เพียงพอ',
      'ดื่มน้ำสะอาด',
      'หลีกเลี่ยงแสงจ้า',
      'ประคบเย็น'
    ],
    'nasal_congestion': [
      'พักผ่อนให้เพียงพอ',
      'ดื่มน้ำอุ่น',
      'หลีกเลี่ยงสารก่อภูมิแพ้',
      'ล้างจมูกด้วยน้ำเกลือ'
    ],
    'sore_throat_cough': [
      'พักผ่อนให้เพียงพอ',
      'ดื่มน้ำอุ่น',
      'หลีกเลี่ยงอากาศเย็น',
      'กลั้วคอด้วยน้ำเกลือ'
    ],
    'gi_symptoms': [
      'พักผ่อนให้เพียงพอ',
      'ดื่มน้ำสะอาด',
      'หลีกเลี่ยงอาหารรสจัด',
      'กินอาหารอ่อน'
    ],
    'skin_allergy': [
      'หลีกเลี่ยงสารก่อภูมิแพ้',
      'ไม่เกา',
      'ทายาให้บางๆ',
      'หลีกเลี่ยงแสงแดด'
    ]
  };
  
  return guidance[symptomGroup] || guidance['fever_pain'];
}

// Generate when to see doctor
function generateWhenToSeeDoctor(severity, timeCourse, symptomGroup) {
  const baseWarnings = {
    'mild': {
      'acute': ['อาการไม่ดีขึ้นใน 2-3 วัน', 'อาการรุนแรงขึ้น'],
      'subacute': ['อาการไม่ดีขึ้นใน 3-5 วัน', 'มีอาการใหม่'],
      'progressive': ['อาการแย่ลง', 'ไม่ดีขึ้นใน 24-48 ชม.'],
      'recurrent': ['อาการไม่ดีขึ้นใน 3-5 วัน', 'เป็นบ่อยขึ้น']
    },
    'moderate': {
      'acute': ['อาการไม่ดีขึ้นใน 2-3 วัน', 'อาการรุนแรงขึ้น'],
      'subacute': ['อาการไม่ดีขึ้นใน 3-5 วัน', 'มีอาการใหม่', 'อาการรุนแรงขึ้น'],
      'progressive': ['อาการแย่ลง', 'ไม่ดีขึ้นใน 24-48 ชม.', 'มีอาการใหม่'],
      'recurrent': ['อาการไม่ดีขึ้นใน 5-7 วัน', 'เป็นบ่อยขึ้น']
    },
    'severe': {
      'acute': ['อาการรุนแรง', 'ควรพบแพทย์ทันที'],
      'subacute': ['อาการรุนแรง', 'ควรพบแพทย์ทันที'],
      'progressive': ['อาการรุนแรง', 'ควรพบแพทย์ทันที'],
      'recurrent': ['อาการรุนแรง', 'ควรพบแพทย์']
    }
  };
  
  let warnings = baseWarnings[severity]?.[timeCourse] || baseWarnings['mild']['acute'];
  
  // Add symptom-specific warnings
  if (symptomGroup === 'fever_pain') {
    warnings.push('มีอาการทางระบบประสาท', 'มีไข้สูง');
  } else if (symptomGroup === 'nasal_congestion' || symptomGroup === 'sore_throat_cough') {
    warnings.push('มีไข้', 'หายใจลำบาก');
  } else if (symptomGroup === 'gi_symptoms') {
    warnings.push('ถ่ายเป็นเลือด', 'มีไข้');
  } else if (symptomGroup === 'skin_allergy') {
    warnings.push('ผื่นลาม', 'มีหนอง', 'หายใจลำบาก');
  }
  
  return [...new Set(warnings)]; // Remove duplicates
}

// Get OTC options for severity × time-course combination
function getOTCOptionsForSeverityTimecourse(symptomGroup, severity, timeCourse, medicines) {
  const firstLine = [];
  const secondLine = [];
  const alternative = [];
  
  medicines.forEach(med => {
    const isFirstLine = med.first_line === 'true';
    const isSecondLine = med.second_line === 'true';
    const isAlternative = med.alternative === 'true';
    
    if (isFirstLine) {
      firstLine.push(med.medicine_name);
    } else if (isSecondLine) {
      secondLine.push(med.medicine_name);
    } else if (isAlternative) {
      alternative.push(med.medicine_name);
    }
  });
  
  // Apply severity × time-course logic
  if (severity === 'severe') {
    // Severe: Only safest option (Paracetamol if available)
    const paracetamol = medicines.find(m => m.medicine_name === 'พาราเซตามอล');
    if (paracetamol) {
      return {
        otc_first_line: [],
        otc_second_line: ['พาราเซตามอล'],
        otc_alternative: []
      };
    }
    return {
      otc_first_line: [],
      otc_second_line: [],
      otc_alternative: []
    };
  }
  
  if (severity === 'mild' && timeCourse === 'acute') {
    // Mild + Acute: Prefer first-line, allow alternative (non-drug)
    return {
      otc_first_line: firstLine.slice(0, 1),
      otc_second_line: [],
      otc_alternative: alternative.length > 0 ? [alternative[0]] : ['การดูแลตัวเอง']
    };
  }
  
  if (severity === 'moderate' && timeCourse === 'subacute') {
    // Moderate + Subacute: Prefer first-line or second-line
    return {
      otc_first_line: firstLine.slice(0, 1),
      otc_second_line: secondLine.slice(0, 1),
      otc_alternative: alternative.slice(0, 1)
    };
  }
  
  if (timeCourse === 'progressive') {
    // Progressive: Restrict to safest options
    return {
      otc_first_line: firstLine.slice(0, 1),
      otc_second_line: [],
      otc_alternative: []
    };
  }
  
  // Default: Return all options
  return {
    otc_first_line: firstLine.slice(0, 2),
    otc_second_line: secondLine.slice(0, 1),
    otc_alternative: alternative.slice(0, 1)
  };
}

// Extract unique symptoms from intents
function extractUniqueSymptoms(intents) {
  const symptomMap = new Map();
  
  intents.forEach(intent => {
    const primarySymptom = intent.primary_symptom || intent.display_text_th;
    if (!primarySymptom) return;
    
    if (!symptomMap.has(primarySymptom)) {
      // Map symptom to category
      const symptomGroup = mapSymptomToCategory(primarySymptom) || intent.symptom_group || 'fever_pain';
      
      symptomMap.set(primarySymptom, {
        symptom_name_th: primarySymptom,
        symptom_name_en: intent.display_text_en || primarySymptom,
        symptom_group: symptomGroup,
        body_part: intent.location || null
      });
    }
  });
  
  return Array.from(symptomMap.values());
}

// Generate mappings for a symptom
function generateMappingsForSymptom(symptom) {
  const mappings = [];
  const severities = ['mild', 'moderate', 'severe'];
  const timeCourses = ['acute', 'subacute', 'progressive', 'recurrent'];
  
  const medicines = getMedicinesBySymptomGroup(symptom.symptom_group);
  if (medicines.length === 0) {
    console.warn(`⚠️  No medicines found for symptom group: ${symptom.symptom_group}`);
    return [];
  }
  
  severities.forEach(severity => {
    timeCourses.forEach(timeCourse => {
      // Skip severe + progressive (emergency)
      if (severity === 'severe' && timeCourse === 'progressive') {
        return;
      }
      
      const otcOptions = getOTCOptionsForSeverityTimecourse(
        symptom.symptom_group,
        severity,
        timeCourse,
        medicines
      );
      
      const avoidLists = generateAvoidLists(medicines);
      
      // Add severe avoid list
      if (severity === 'severe') {
        avoidLists.avoid_list_by_severity = { severe: ['all_otc'] };
      }
      
      const mapping = {
        symptom_id: `${symptom.symptom_group.toUpperCase()}_${severity.toUpperCase()}_${timeCourse.toUpperCase()}_${symptom.symptom_name_th.replace(/\s+/g, '_')}`,
        symptom_name_th: symptom.symptom_name_th,
        symptom_name_en: symptom.symptom_name_en,
        symptom_group: symptom.symptom_group,
        body_part: symptom.body_part,
        severity: severity,
        time_course: timeCourse,
        otc_first_line: otcOptions.otc_first_line,
        otc_second_line: otcOptions.otc_second_line,
        otc_alternative: otcOptions.otc_alternative,
        ...avoidLists,
        self_care_guidance: generateSelfCareGuidance(symptom.symptom_group),
        clinical_rationale: generateClinicalRationale(severity, timeCourse, symptom.symptom_group),
        when_to_see_doctor: generateWhenToSeeDoctor(severity, timeCourse, symptom.symptom_group)
      };
      
      mappings.push(mapping);
    });
  });
  
  return mappings;
}

// Main generation function
function generateMasterClinicalMappingTable() {
  console.log('🚀 Generating Master Clinical Mapping Table...\n');
  
  // Extract unique symptoms
  const uniqueSymptoms = extractUniqueSymptoms(symptomIntents.intents);
  console.log(`📊 Found ${uniqueSymptoms.length} unique symptoms\n`);
  
  // Generate mappings
  const allMappings = [];
  let processedCount = 0;
  
  // Prioritize high-frequency symptoms
  const highFrequencySymptoms = ['ปวดหัว', 'ปวดท้อง', 'เจ็บหน้าอก', 'ไอ', 'น้ำมูก'];
  const prioritizedSymptoms = [
    ...uniqueSymptoms.filter(s => highFrequencySymptoms.includes(s.symptom_name_th)),
    ...uniqueSymptoms.filter(s => !highFrequencySymptoms.includes(s.symptom_name_th))
  ];
  
  prioritizedSymptoms.forEach(symptom => {
    const mappings = generateMappingsForSymptom(symptom);
    allMappings.push(...mappings);
    processedCount++;
    
    if (processedCount % 10 === 0) {
      console.log(`✅ Processed ${processedCount}/${prioritizedSymptoms.length} symptoms...`);
    }
  });
  
  // Create output structure
  const output = {
    version: '1.0',
    last_updated: new Date().toISOString().split('T')[0],
    total_mappings: allMappings.length,
    mappings: allMappings
  };
  
  // Write to file
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  
  console.log(`\n✅ Master Clinical Mapping Table generated successfully!`);
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📊 Total mappings: ${allMappings.length}`);
  console.log(`📋 Symptoms covered: ${uniqueSymptoms.length}`);
  console.log(`🎯 Symptom groups: ${[...new Set(uniqueSymptoms.map(s => s.symptom_group))].join(', ')}`);
}

// Run generation
generateMasterClinicalMappingTable();

