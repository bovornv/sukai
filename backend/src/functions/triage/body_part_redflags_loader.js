/**
 * Body-Part Red-Flag Expanded Dataset Loader
 * 
 * Loads and indexes bodypart_redflags_expanded.csv for fast querying
 * Provides question selection logic with variation engine integration
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { normalizeThaiText } from './thai_normalizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * RedFlagRow structure (JavaScript object)
 * {
 *   body_part: string,
 *   symptom_keyword: string,
 *   severity_modifier: string,
 *   time_course_modifier: string,
 *   body_side_modifier: string,
 *   associated_symptom: string | null,
 *   population_risk: string,
 *   red_flag_question: string,
 *   emergency_if_yes: 'yes' | 'no',
 *   rationale: string,
 *   question_priority: '1' | '2' | '3' | '4',
 *   clinical_context: string
 * }
 */

/**
 * Question selection result (JavaScript object)
 * {
 *   question: string,
 *   emergencyIfYes: boolean,
 *   rationale: string,
 *   priority: string,
 *   clinicalContext: string,
 *   key: string  // Unique identifier for tracking
 * }
 */

/**
 * In-memory dataset cache
 */
let datasetCache = null;
let indexedDataset = null;

/**
 * Load CSV file and parse into structured data
 */
function loadDataset() {
  if (datasetCache) {
    return datasetCache;
  }

  try {
    // Try multiple possible paths (for different deployment scenarios)
    const possiblePaths = [
      join(__dirname, '../../../data/bodypart_redflags_expanded.csv'), // backend/data/ (Railway deployment)
      join(__dirname, '../../../../mobile/assets/data/bodypart_redflags_expanded.csv'), // mobile/assets/data/ (local dev)
      join(process.cwd(), 'data/bodypart_redflags_expanded.csv'), // root/data/ (alternative)
      '/app/data/bodypart_redflags_expanded.csv', // Direct Railway path
    ];
    
    let csvPath = null;
    for (const testPath of possiblePaths) {
      try {
        readFileSync(testPath, 'utf-8'); // Test if file exists
        csvPath = testPath;
        console.log(`[RED-FLAG-LOADER] ✅ Found CSV file at: ${csvPath}`);
        break;
      } catch (err) {
        // File doesn't exist at this path, try next
        continue;
      }
    }
    
    if (!csvPath) {
      console.warn(`[RED-FLAG-LOADER] CSV file not found. Tried paths:`, possiblePaths);
      throw new Error(`Body part red flags CSV file not found. Tried: ${possiblePaths.join(', ')}`);
    }
    
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      // Parse CSV line (handling quoted fields)
      const values = parseCSVLine(lines[i]);
      
      if (values.length !== headers.length) {
        console.warn(`[RED-FLAG-LOADER] Skipping malformed row ${i}: ${lines[i]}`);
        continue;
      }
      
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() || '';
      });
      
      // Convert empty strings to null for optional fields
      if (!row['associated_symptom']) row['associated_symptom'] = null;
      
      rows.push(row);
    }
    
    datasetCache = rows;
    console.log(`[RED-FLAG-LOADER] ✅ Loaded ${rows.length} rows from expanded dataset`);
    
    return rows;
  } catch (error) {
    console.error(`[RED-FLAG-LOADER] ❌ Failed to load dataset:`, error.message);
    return [];
  }
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

/**
 * Index dataset for fast querying
 */
function indexDataset() {
  if (indexedDataset) {
    return indexedDataset;
  }
  
  const rows = loadDataset();
  
  const indexed = {
    // Primary index: body_part → symptom_keyword → rows[]
    byBodyPartAndSymptom: new Map(),
    
    // Secondary index: body_part → rows[]
    byBodyPart: new Map(),
    
    // Priority index: priority → rows[]
    byPriority: new Map(),
    
    // Question text index: question → row (for duplicate detection)
    byQuestionText: new Map(),
  };
  
  rows.forEach(row => {
    const bodyPart = normalizeThaiText(row.body_part?.toLowerCase() || '');
    const symptomKeyword = normalizeThaiText(row.symptom_keyword?.toLowerCase() || '');
    const priority = row.question_priority || '3';
    const question = row.red_flag_question || '';
    
    // Index by body_part + symptom_keyword
    if (!indexed.byBodyPartAndSymptom.has(bodyPart)) {
      indexed.byBodyPartAndSymptom.set(bodyPart, new Map());
    }
    const symptomMap = indexed.byBodyPartAndSymptom.get(bodyPart);
    if (!symptomMap.has(symptomKeyword)) {
      symptomMap.set(symptomKeyword, []);
    }
    symptomMap.get(symptomKeyword).push(row);
    
    // Index by body_part only
    if (!indexed.byBodyPart.has(bodyPart)) {
      indexed.byBodyPart.set(bodyPart, []);
    }
    indexed.byBodyPart.get(bodyPart).push(row);
    
    // Index by priority
    if (!indexed.byPriority.has(priority)) {
      indexed.byPriority.set(priority, []);
    }
    indexed.byPriority.get(priority).push(row);
    
    // Index by question text
    if (question) {
      indexed.byQuestionText.set(normalizeThaiText(question.toLowerCase()), row);
    }
  });
  
  indexedDataset = indexed;
  console.log(`[RED-FLAG-LOADER] ✅ Indexed dataset: ${rows.length} rows`);
  
  return indexedDataset;
}

/**
 * Check if question was already asked (semantic similarity)
 */
function wasQuestionAsked(questionText, questionsAsked = []) {
  if (!questionsAsked || questionsAsked.length === 0) {
    return false;
  }
  
  const normalizedQuestion = normalizeThaiText(questionText.toLowerCase());
  
  return questionsAsked.some(asked => {
    if (typeof asked !== 'string') return false;
    const normalizedAsked = normalizeThaiText(asked.toLowerCase());
    
    // Exact match
    if (normalizedQuestion === normalizedAsked) {
      return true;
    }
    
    // Substring match (if question contains key phrases)
    const keyPhrases = normalizedQuestion.split(' ').filter(w => w.length > 3);
    if (keyPhrases.length > 0) {
      const matchCount = keyPhrases.filter(phrase => normalizedAsked.includes(phrase)).length;
      return matchCount >= Math.ceil(keyPhrases.length * 0.7); // 70% phrase match
    }
    
    return false;
  });
}

/**
 * Match user profile to population risk
 */
function matchPopulationRisk(userProfile) {
  if (!userProfile) return 'general';
  
  if (userProfile.age > 65) {
    return 'elderly';
  }
  if (userProfile.age < 18) {
    return 'pediatric';
  }
  if (userProfile.isPregnant) {
    return 'pregnancy';
  }
  if (userProfile.chronicDiseases && userProfile.chronicDiseases.length > 0) {
    return 'chronic_disease';
  }
  
  return 'general';
}

/**
 * Select red flag question from expanded dataset
 * 
 * @param {string} bodyPart - Confirmed body part
 * @param {string} symptomKeyword - Initial symptom keyword
 * @param {string[]} questionsAsked - Previously asked questions
 * @param {object} userProfile - User profile (age, gender, isPregnant, chronicDiseases)
 * @returns {RedFlagQuestion | null}
 */
export function selectRedFlagFromExpandedDataset(
  bodyPart,
  symptomKeyword,
  questionsAsked = [],
  userProfile = {}
) {
  const indexed = indexDataset();
  
  if (!indexed || indexed.byBodyPartAndSymptom.size === 0) {
    console.warn('[RED-FLAG-LOADER] ⚠️ Dataset not loaded, returning null');
    return null;
  }
  
  const normalizedBodyPart = normalizeThaiText((bodyPart || '').toLowerCase());
  const normalizedSymptomKeyword = normalizeThaiText((symptomKeyword || '').toLowerCase());
  
  // STEP 1: Filter by body_part + symptom_keyword
  let candidates = [];
  
  if (normalizedBodyPart && normalizedSymptomKeyword) {
    const symptomMap = indexed.byBodyPartAndSymptom.get(normalizedBodyPart);
    if (symptomMap) {
      candidates = symptomMap.get(normalizedSymptomKeyword) || [];
    }
  }
  
  // STEP 2: Fallback to body_part only
  if (candidates.length === 0 && normalizedBodyPart) {
    candidates = indexed.byBodyPart.get(normalizedBodyPart) || [];
  }
  
  // STEP 3: Filter out already-asked questions
  candidates = candidates.filter(c => !wasQuestionAsked(c.red_flag_question, questionsAsked));
  
  if (candidates.length === 0) {
    console.log(`[RED-FLAG-LOADER] ⚠️ No candidates found for body_part="${bodyPart}", symptom="${symptomKeyword}"`);
    return null;
  }
  
  // STEP 4: Boost priority for matching population risk
  const userPopulationRisk = matchPopulationRisk(userProfile);
  candidates.forEach(c => {
    if (c.population_risk === userPopulationRisk) {
      // Boost priority by moving to higher priority group
      if (c.question_priority === '3') c._boostedPriority = '2';
      if (c.question_priority === '2') c._boostedPriority = '1';
    }
  });
  
  // STEP 5: Rank by priority
  candidates.sort((a, b) => {
    const priorityA = a._boostedPriority || a.question_priority || '3';
    const priorityB = b._boostedPriority || b.question_priority || '3';
    
    // Priority 1 > Priority 2 > Priority 3 > Priority 4
    if (priorityA !== priorityB) {
      return priorityA.localeCompare(priorityB);
    }
    
    // Within same priority: Random selection (for variation)
    return Math.random() - 0.5;
  });
  
  // STEP 6: Select first question
  const selectedRow = candidates[0];
  
  if (!selectedRow) {
    return null;
  }
  
  console.log(`[RED-FLAG-LOADER] ✅ Selected question: Priority ${selectedRow.question_priority}, "${selectedRow.red_flag_question.substring(0, 50)}..."`);
  
  return {
    question: selectedRow.red_flag_question,
    emergencyIfYes: selectedRow.emergency_if_yes === 'yes',
    rationale: selectedRow.rationale,
    priority: selectedRow.question_priority,
    clinicalContext: selectedRow.clinical_context,
    key: `${selectedRow.body_part}_${selectedRow.symptom_keyword}_${selectedRow.question_priority}`,
  };
}

/**
 * Validate emergency logic integrity
 */
export function validateEmergencyLogicIntegrity() {
  const rows = loadDataset();
  
  // Group by body_part + symptom_keyword
  const groups = new Map();
  
  rows.forEach(row => {
    const key = `${row.body_part}+${row.symptom_keyword}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(row);
  });
  
  let isValid = true;
  
  for (const [key, groupRows] of groups.entries()) {
    const emergencyValues = new Set(groupRows.map(r => r.emergency_if_yes));
    
    // All rows in same group must have same emergency_if_yes
    if (emergencyValues.size > 1) {
      console.error(`[RED-FLAG-LOADER] ❌ Emergency logic inconsistency: ${key}`);
      console.error(`  Found values: ${Array.from(emergencyValues).join(', ')}`);
      isValid = false;
    }
  }
  
  if (isValid) {
    console.log(`[RED-FLAG-LOADER] ✅ Emergency logic integrity validated`);
  }
  
  return isValid;
}

/**
 * Get dataset statistics
 */
export function getDatasetStatistics() {
  const rows = loadDataset();
  const indexed = indexDataset();
  
  const stats = {
    totalRows: rows.length,
    emergencyRows: rows.filter(r => r.emergency_if_yes === 'yes').length,
    byPriority: {
      '1': rows.filter(r => r.question_priority === '1').length,
      '2': rows.filter(r => r.question_priority === '2').length,
      '3': rows.filter(r => r.question_priority === '3').length,
      '4': rows.filter(r => r.question_priority === '4').length,
    },
    byBodyPart: {},
    indexedBodyParts: indexed.byBodyPart.size,
  };
  
  rows.forEach(row => {
    const bodyPart = row.body_part;
    if (!stats.byBodyPart[bodyPart]) {
      stats.byBodyPart[bodyPart] = 0;
    }
    stats.byBodyPart[bodyPart]++;
  });
  
  return stats;
}

// Initialize on module load
indexDataset();
validateEmergencyLogicIntegrity();

