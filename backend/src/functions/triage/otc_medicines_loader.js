/**
 * OTC Medicines CSV Loader
 * 
 * Loads and indexes expanded OTC medicines dataset from CSV file.
 * Provides fast lookup by symptom group, medical hierarchy, form, and generic name.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { normalizeThaiText } from './thai_normalizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache for loaded dataset
let datasetCache = null;
let datasetLoaded = false;

/**
 * OTC Medicine structure (mapped from CSV)
 */
export class OTCMedicine {
  constructor(row) {
    this.generic = row.medicine_name || '';
    this.englishGeneric = row.english_name || '';
    this.category = normalizeSymptomGroup(row.symptom_group);
    this.form = row.form || 'oral';
    this.medicalLine = determineMedicalLine(row);
    this.lineRationale = row.key_notes || '';
    this.adultOnly = row.adult_only === 'true' || row.adult_only === true;
    this.contraindications = parseContraindications(row.contraindications);
    
    // Store original CSV data for reference
    this._csvData = row;
  }
}

/**
 * Load OTC medicines dataset from CSV file
 * @returns {Promise<OTCMedicinesIndex>}
 */
export async function loadOTCMedicinesDataset() {
  if (datasetLoaded && datasetCache) {
    return datasetCache;
  }

  try {
    // Try multiple possible paths (for different deployment scenarios)
    const possiblePaths = [
      join(__dirname, '../../../data/otc_medicines_master_th.csv'), // backend/data/ (Railway deployment)
      join(__dirname, '../../../../mobile/assets/data/otc_medicines_master_th.csv'), // mobile/assets/data/ (local dev)
      join(process.cwd(), 'data/otc_medicines_master_th.csv'), // root/data/ (alternative)
      '/app/data/otc_medicines_master_th.csv', // Direct Railway path
    ];
    
    let csvPath = null;
    for (const testPath of possiblePaths) {
      try {
        readFileSync(testPath, 'utf-8'); // Test if file exists
        csvPath = testPath;
        console.log(`[OTC-LOADER] ✅ Found CSV file at: ${csvPath}`);
        break;
      } catch (err) {
        // File doesn't exist at this path, try next
        continue;
      }
    }
    
    if (!csvPath) {
      console.warn(`[OTC-LOADER] CSV file not found. Tried paths:`, possiblePaths);
      throw new Error(`OTC medicines CSV file not found. Tried: ${possiblePaths.join(', ')}`);
    }
    
    const csvContent = readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());
    const headerMap = {};
    headers.forEach((h, i) => {
      headerMap[h] = i;
    });

    // Parse data rows
    const medicines = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const row = parseCSVLine(line, headerMap);
      if (row.medicine_name) {
        medicines.push(new OTCMedicine(row));
      }
    }

    // Build indexes
    const index = buildIndexes(medicines);
    
    datasetCache = index;
    datasetLoaded = true;

    console.log(`[OTC-LOADER] ✅ Loaded ${medicines.length} medicines from CSV`);
    console.log(`[OTC-LOADER] ✅ Indexed by ${index.bySymptomGroup.size} symptom groups`);
    
    return index;
  } catch (error) {
    console.error('[OTC-LOADER] ❌ Failed to load CSV dataset:', error.message);
    datasetLoaded = false;
    datasetCache = null;
    throw error;
  }
}

/**
 * Parse CSV line into object
 */
function parseCSVLine(line, headerMap) {
  const values = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue.trim()); // Last value

  // Map values to headers
  const row = {};
  Object.keys(headerMap).forEach(header => {
    const index = headerMap[header];
    row[header] = values[index] || '';
  });

  return row;
}

/**
 * Normalize symptom group to catalog category
 */
function normalizeSymptomGroup(csvGroup) {
  const mapping = {
    'Fever/Pain': 'fever_pain',
    'Pain-Neuro': 'fever_pain', // Neuropathic pain → fever_pain category
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
    'Muscle': 'fever_pain', // Muscle pain → fever_pain category
    'Eye': 'eye',
    'Ear': 'ear',
    'Sleep': 'sleep',
    'Anxiety': 'anxiety'
  };

  return mapping[csvGroup] || csvGroup.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Determine medical line from CSV flags
 */
function determineMedicalLine(row) {
  if (row.first_line === 'true' || row.first_line === true) {
    return 'first_line';
  }
  if (row.second_line === 'true' || row.second_line === true) {
    return 'second_line';
  }
  if (row.alternative === 'true' || row.alternative === true) {
    return 'alternative';
  }
  // Default to alternative if none specified
  return 'alternative';
}

/**
 * Parse contraindications string into array
 */
function parseContraindications(contraindicationsStr) {
  if (!contraindicationsStr || contraindicationsStr.trim() === '—' || contraindicationsStr.trim() === '-') {
    return [];
  }

  // Split by space or comma
  return contraindicationsStr
    .split(/[\s,]+/)
    .map(c => c.trim())
    .filter(c => c.length > 0 && c !== '—' && c !== '-');
}

/**
 * Build indexes for fast lookup
 */
function buildIndexes(medicines) {
  const bySymptomGroup = new Map();
  const byMedicalLine = new Map();
  const byForm = new Map();
  const byGenericName = new Map();

  medicines.forEach(medicine => {
    // Index by symptom group
    if (!bySymptomGroup.has(medicine.category)) {
      bySymptomGroup.set(medicine.category, []);
    }
    bySymptomGroup.get(medicine.category).push(medicine);

    // Index by medical line
    if (!byMedicalLine.has(medicine.medicalLine)) {
      byMedicalLine.set(medicine.medicalLine, []);
    }
    byMedicalLine.get(medicine.medicalLine).push(medicine);

    // Index by form
    if (!byForm.has(medicine.form)) {
      byForm.set(medicine.form, []);
    }
    byForm.get(medicine.form).push(medicine);

    // Index by generic name (Thai and English)
    byGenericName.set(medicine.generic.toLowerCase(), medicine);
    if (medicine.englishGeneric) {
      byGenericName.set(medicine.englishGeneric.toLowerCase(), medicine);
    }
  });

  return {
    medicines,
    bySymptomGroup,
    byMedicalLine,
    byForm,
    byGenericName,
    totalMedicines: medicines.length,
    loadedAt: new Date()
  };
}

/**
 * Get medicines by symptom group
 * @param {string} symptomGroup - Normalized symptom group (e.g., 'fever_pain')
 * @returns {OTCMedicine[]}
 */
export function getMedicinesBySymptomGroup(symptomGroup) {
  if (!datasetLoaded || !datasetCache) {
    console.warn('[OTC-LOADER] ⚠️ Dataset not loaded, returning empty array');
    return [];
  }

  const normalizedGroup = symptomGroup.toLowerCase();
  return datasetCache.bySymptomGroup.get(normalizedGroup) || [];
}

/**
 * Get medicines by medical hierarchy
 * @param {string} hierarchy - 'first_line', 'second_line', or 'alternative'
 * @returns {OTCMedicine[]}
 */
export function getMedicinesByHierarchy(hierarchy) {
  if (!datasetLoaded || !datasetCache) {
    console.warn('[OTC-LOADER] ⚠️ Dataset not loaded, returning empty array');
    return [];
  }

  return datasetCache.byMedicalLine.get(hierarchy) || [];
}

/**
 * Get medicine by generic name (Thai or English)
 * @param {string} genericName - Generic name (Thai or English)
 * @returns {OTCMedicine | null}
 */
export function getMedicineByGenericName(genericName) {
  if (!datasetLoaded || !datasetCache) {
    console.warn('[OTC-LOADER] ⚠️ Dataset not loaded, returning null');
    return null;
  }

  const normalized = genericName.toLowerCase();
  return datasetCache.byGenericName.get(normalized) || null;
}

/**
 * Get medicines by form
 * @param {string} form - 'oral', 'topical', 'nasal', 'eye', 'ear'
 * @returns {OTCMedicine[]}
 */
export function getMedicinesByForm(form) {
  if (!datasetLoaded || !datasetCache) {
    console.warn('[OTC-LOADER] ⚠️ Dataset not loaded, returning empty array');
    return [];
  }

  return datasetCache.byForm.get(form) || [];
}

/**
 * Check if dataset is loaded
 * @returns {boolean}
 */
export function isDatasetLoaded() {
  return datasetLoaded && datasetCache !== null;
}

/**
 * Get dataset statistics
 * @returns {object}
 */
export function getDatasetStatistics() {
  if (!datasetLoaded || !datasetCache) {
    return {
      loaded: false,
      totalMedicines: 0,
      symptomGroups: 0,
      byHierarchy: {},
      byForm: {}
    };
  }

  const byHierarchy = {};
  ['first_line', 'second_line', 'alternative'].forEach(h => {
    byHierarchy[h] = datasetCache.byMedicalLine.get(h)?.length || 0;
  });

  const byForm = {};
  ['oral', 'topical', 'nasal', 'eye', 'ear'].forEach(f => {
    byForm[f] = datasetCache.byForm.get(f)?.length || 0;
  });

  return {
    loaded: true,
    totalMedicines: datasetCache.totalMedicines,
    symptomGroups: datasetCache.bySymptomGroup.size,
    byHierarchy,
    byForm,
    loadedAt: datasetCache.loadedAt
  };
}

/**
 * Reset dataset cache (for testing)
 */
export function resetDatasetCache() {
  datasetCache = null;
  datasetLoaded = false;
}

