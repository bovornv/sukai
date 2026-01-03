/**
 * OTC Clinical Mapping Table Loader
 * 
 * Loads and queries the Master Clinical Mapping Table that links
 * Symptom × Severity × Time-course combinations to OTC medication recommendations.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mapSymptomToCategory } from './thai_otc_catalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for loaded mapping table
let mappingTableCache = null;

/**
 * Load Master Clinical Mapping Table from JSON file
 */
export function loadClinicalMappingTable() {
  if (mappingTableCache) {
    return mappingTableCache;
  }
  
  try {
    const mappingTablePath = path.join(__dirname, '../../../mobile/assets/data/otc_clinical_mapping.json');
    const mappingTableData = JSON.parse(fs.readFileSync(mappingTablePath, 'utf8'));
    mappingTableCache = mappingTableData;
    return mappingTableData;
  } catch (error) {
    console.error('[OTC_CLINICAL_MAPPING] Error loading mapping table:', error.message);
    return null;
  }
}

/**
 * Query mapping table for a specific symptom × severity × time-course combination
 * 
 * @param {string} symptom - Symptom name (Thai or English)
 * @param {string} severity - Severity level (mild, moderate, severe)
 * @param {string} timeCourse - Time-course (acute, subacute, progressive, recurrent)
 * @param {string} symptomGroup - Optional symptom group (if known)
 * @returns {Object|null} Mapping object or null if not found
 */
export function queryMappingTable(symptom, severity, timeCourse, symptomGroup = null) {
  const mappingTable = loadClinicalMappingTable();
  if (!mappingTable || !mappingTable.mappings) {
    return null;
  }
  
  // Determine symptom group if not provided
  if (!symptomGroup) {
    symptomGroup = mapSymptomToCategory(symptom);
  }
  
  if (!symptomGroup) {
    return null;
  }
  
  // Normalize inputs
  const normalizedSymptom = symptom.toLowerCase().trim();
  const normalizedSeverity = severity.toLowerCase().trim();
  const normalizedTimeCourse = timeCourse.toLowerCase().trim();
  const normalizedGroup = symptomGroup.toLowerCase().trim();
  
  // Try exact match first
  let mapping = mappingTable.mappings.find(m => 
    (m.symptom_name_th.toLowerCase() === normalizedSymptom ||
     m.symptom_name_en.toLowerCase() === normalizedSymptom) &&
    m.severity === normalizedSeverity &&
    m.time_course === normalizedTimeCourse &&
    m.symptom_group === normalizedGroup
  );
  
  // If not found, try symptom group match
  if (!mapping) {
    mapping = mappingTable.mappings.find(m => 
      m.symptom_group === normalizedGroup &&
      m.severity === normalizedSeverity &&
      m.time_course === normalizedTimeCourse
    );
  }
  
  return mapping || null;
}

/**
 * Get OTC options for a mapping, applying patient context filters
 * 
 * @param {Object} mapping - Mapping object from queryMappingTable
 * @param {Object} patientContext - Patient context (age, weight, diseases, allergies)
 * @returns {Object} Filtered OTC options with medical hierarchy
 */
export function getOTCOptionsForMapping(mapping, patientContext = {}) {
  if (!mapping) {
    return {
      first_line: [],
      second_line: [],
      alternative: [],
      clinical_rationale: '',
      self_care_guidance: [],
      when_to_see_doctor: []
    };
  }
  
  const { age, weight, chronicDiseases = [], drugAllergies = [] } = patientContext;
  
  // Filter OTC options based on patient context
  const filterMedicines = (medicines) => {
    return medicines.filter(med => {
      // Check avoid list by condition
      const avoidByCondition = mapping.avoid_list_by_condition || {};
      for (const disease of chronicDiseases) {
        const avoidList = avoidByCondition[disease];
        if (avoidList && avoidList.includes(med)) {
          return false;
        }
      }
      
      // Check avoid list by age
      const avoidByAge = mapping.avoid_list_by_age || {};
      if (age < 18) {
        const pediatricAvoid = avoidByAge.pediatric || [];
        if (pediatricAvoid.includes(med)) {
          return false;
        }
      }
      if (age > 65) {
        const elderlyAvoid = avoidByAge.elderly || [];
        if (elderlyAvoid.includes(med)) {
          return false;
        }
      }
      
      // Check avoid list by severity
      const avoidBySeverity = mapping.avoid_list_by_severity || {};
      if (mapping.severity === 'severe') {
        const severeAvoid = avoidBySeverity.severe || [];
        if (severeAvoid.includes('all_otc') || severeAvoid.includes(med)) {
          return false;
        }
      }
      
      // Check drug allergies
      if (drugAllergies.some(allergy => 
        med.toLowerCase().includes(allergy.toLowerCase()) ||
        allergy.toLowerCase().includes(med.toLowerCase())
      )) {
        return false;
      }
      
      return true;
    });
  };
  
  return {
    first_line: filterMedicines(mapping.otc_first_line || []),
    second_line: filterMedicines(mapping.otc_second_line || []),
    alternative: filterMedicines(mapping.otc_alternative || []),
    clinical_rationale: mapping.clinical_rationale || '',
    self_care_guidance: mapping.self_care_guidance || [],
    when_to_see_doctor: mapping.when_to_see_doctor || []
  };
}

/**
 * Get default mapping for a symptom group if specific mapping not found
 * 
 * @param {string} symptomGroup - Symptom group
 * @param {string} severity - Severity level
 * @param {string} timeCourse - Time-course
 * @returns {Object|null} Default mapping or null
 */
export function getDefaultMapping(symptomGroup, severity, timeCourse) {
  const mappingTable = loadClinicalMappingTable();
  if (!mappingTable || !mappingTable.mappings) {
    return null;
  }
  
  // Find any mapping for this symptom group × severity × time-course
  const mapping = mappingTable.mappings.find(m => 
    m.symptom_group === symptomGroup &&
    m.severity === severity &&
    m.time_course === timeCourse
  );
  
  return mapping || null;
}

/**
 * Clear cache (useful for testing or reloading)
 */
export function clearMappingTableCache() {
  mappingTableCache = null;
}

