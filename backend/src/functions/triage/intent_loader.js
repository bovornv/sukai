/**
 * Intent Loader for Structured Symptom Intents (700-intent schema)
 * 
 * Supports loading intents from JSON file and mapping intent_id to structured data
 * Falls back to legacy text-based mapping if intent_id not found
 * 
 * Enhanced with:
 * - Confidence weight calculation
 * - OTC group mapping
 * - Emergency level detection
 * - Health profile requirement checking
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseAdmin } from '../../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let _cachedIntents = null;
let _intentById = null;
let _intentsByPrimarySymptom = null;
let _loadingPromise = null; // Prevent concurrent loads

/**
 * Load intents from external source (Supabase Storage or URL)
 */
async function loadIntentsFromExternal() {
  // Try Supabase Storage first
  const storagePath = process.env.INTENTS_STORAGE_PATH || 'data/symptom_intents_master.json';
  const storageBucket = process.env.INTENTS_STORAGE_BUCKET || 'app-data';
  
  try {
    console.log(`[IntentLoader] Attempting to load from Supabase Storage: ${storageBucket}/${storagePath}`);
    const { data, error } = await supabaseAdmin.storage
      .from(storageBucket)
      .download(storagePath);
    
    if (!error && data) {
      const text = await data.text();
      return JSON.parse(text);
    }
  } catch (err) {
    console.warn(`[IntentLoader] Failed to load from Supabase Storage: ${err.message}`);
  }
  
  // Try external URL if configured
  const externalUrl = process.env.INTENTS_EXTERNAL_URL;
  if (externalUrl) {
    try {
      console.log(`[IntentLoader] Attempting to load from external URL: ${externalUrl}`);
      const response = await fetch(externalUrl);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.warn(`[IntentLoader] Failed to load from external URL: ${err.message}`);
    }
  }
  
  return null;
}

/**
 * Load intents from JSON file (lazy loading, cached)
 * Supports multiple sources: local file, Supabase Storage, or external URL
 */
async function loadIntents() {
  if (_cachedIntents !== null) {
    return _cachedIntents;
  }
  
  // Prevent concurrent loads
  if (_loadingPromise) {
    return _loadingPromise;
  }
  
  _loadingPromise = (async () => {
    try {
      let data = null;
      
      // First, try external sources (Supabase Storage or URL) if configured
      if (process.env.INTENTS_STORAGE_PATH || process.env.INTENTS_EXTERNAL_URL) {
        data = await loadIntentsFromExternal();
        if (data) {
          console.log(`[IntentLoader] ✅ Loaded intents from external source`);
        }
      }
      
      // If external load failed, try local file system
      if (!data) {
        // Try multiple possible paths (for different deployment scenarios)
        const possiblePaths = [
          path.join(__dirname, '../../../data/symptom_intents_master.json'), // Local development
          path.join(process.cwd(), 'data/symptom_intents_master.json'), // Railway deployment
          path.join(process.cwd(), 'backend/data/symptom_intents_master.json'), // Alternative Railway path
          '/app/data/symptom_intents_master.json', // Direct Railway path
        ];
        
        let intentPath = null;
        for (const testPath of possiblePaths) {
          if (fs.existsSync(testPath)) {
            intentPath = testPath;
            console.log(`[IntentLoader] ✅ Found intents file at: ${intentPath}`);
            break;
          }
        }
        
        if (!intentPath) {
          // Log current working directory and __dirname for debugging
          console.warn(`[IntentLoader] Current working directory: ${process.cwd()}`);
          console.warn(`[IntentLoader] __dirname: ${__dirname}`);
          console.warn(`[IntentLoader] Intent file not found. Tried paths:`);
          possiblePaths.forEach(p => console.warn(`  - ${p}`));
          throw new Error(`Intent file not found. Tried: ${possiblePaths.join(', ')}`);
        }
        
        const jsonData = fs.readFileSync(intentPath, 'utf8');
        data = JSON.parse(jsonData);
      }
    
      _cachedIntents = data.intents || [];
      
      // Build index maps for fast lookup
      _intentById = {};
      _intentsByPrimarySymptom = {};
      
      for (const intent of _cachedIntents) {
        if (intent.intent_id) {
          _intentById[intent.intent_id] = intent;
        }
        
        // Index by primary symptom
        const primarySymptom = intent.primary_symptom || intent.primarySymptom;
        if (primarySymptom) {
          if (!_intentsByPrimarySymptom[primarySymptom]) {
            _intentsByPrimarySymptom[primarySymptom] = [];
          }
          _intentsByPrimarySymptom[primarySymptom].push(intent);
        }
      }
      
      console.log(`[IntentLoader] ✅ Loaded ${_cachedIntents.length} intents`);
      console.log(`[IntentLoader] ✅ Indexed ${Object.keys(_intentById).length} intent IDs`);
      console.log(`[IntentLoader] ✅ Indexed ${Object.keys(_intentsByPrimarySymptom).length} primary symptoms`);
      
      _loadingPromise = null;
      return _cachedIntents;
    } catch (error) {
      console.warn(`[IntentLoader] ❌ Failed to load intents: ${error.message}`);
      console.warn('[IntentLoader] ⚠️ Falling back to legacy text-based mapping');
      _cachedIntents = [];
      _intentById = {};
      _intentsByPrimarySymptom = {};
      _loadingPromise = null;
      return [];
    }
  })();
  
  return _loadingPromise;
}

/**
 * Check if symptom string is an intent_id (pattern: [A-Z_]+_[0-9]+)
 */
function isIntentId(symptom) {
  if (typeof symptom !== 'string') return false;
  // Pattern: HEADACHE_017, COUGH_042, etc.
  return /^[A-Z_]+_\d+$/.test(symptom.trim());
}

/**
 * Get intent by ID
 */
function getIntentById(intentId) {
  if (!_intentById) {
    // Load synchronously (will use cached result if already loading)
    loadIntents().catch(() => {
      // Ignore errors, fallback to legacy mapping
    });
  }
  return _intentById?.[intentId] || null;
}

/**
 * Get red-flag question from intent
 */
function getRedFlagQuestion(intent, language = 'th') {
  if (!intent) return null;
  
  if (language === 'th') {
    return intent.red_flag?.question?.th || intent.red_flag_question_th;
  } else {
    return intent.red_flag?.question?.en || intent.red_flag_question_en;
  }
}

/**
 * Check if intent requires emergency triage
 */
function isEmergencyIntent(intent) {
  if (!intent) return false;
  return intent.red_flag?.if_yes?.emergency === true || intent.red_flag_if_yes === true;
}

/**
 * Get primary symptom from intent
 */
function getPrimarySymptom(intent) {
  if (!intent) return null;
  return intent.primary_symptom;
}

/**
 * Resolve symptom to intent (if intent_id) or return null
 * NOTE: Now async because getIntentById is async
 */
export async function resolveSymptomIntent(symptom) {
  if (!symptom || typeof symptom !== 'string') return null;
  
  const trimmed = symptom.trim();
  
  // Check if it's an intent_id
  if (isIntentId(trimmed)) {
    const intent = await getIntentById(trimmed);
    if (intent) {
      return intent;
    }
    console.warn(`[IntentLoader] Intent ID not found: ${trimmed}`);
  }
  
  return null;
}

/**
 * Get red-flag question for symptom (supports both intent_id and text)
 * NOTE: Now async because resolveSymptomIntent is async
 */
export async function getRedFlagQuestionForSymptom(symptom, language = 'th') {
  // Try to resolve as intent_id first
  const intent = await resolveSymptomIntent(symptom);
  if (intent) {
    const question = await getRedFlagQuestion(intent.intent_id || intent.id, language);
    if (question) {
      return question;
    }
  }
  
  // Fallback to legacy text-based mapping
  return null; // Legacy system will handle this
}

/**
 * Check if symptom requires emergency triage (supports intent_id)
 * NOTE: Now async because resolveSymptomIntent is async
 */
export async function checkEmergencyFromIntent(symptom) {
  const intent = await resolveSymptomIntent(symptom);
  if (intent) {
    return isEmergencyIntent(intent);
  }
  
  // Fallback to legacy text-based check
  return false;
}

/**
 * Get primary symptom for mapping (supports intent_id)
 * NOTE: Now async because resolveSymptomIntent is async
 */
export async function getPrimarySymptomFromIntent(symptom) {
  const intent = await resolveSymptomIntent(symptom);
  if (intent) {
    return getPrimarySymptom(intent);
  }
  
  // Fallback: return symptom as-is (legacy system)
  return symptom;
}

/**
 * Get confidence weight from intent
 */
export function getConfidenceWeight(intent) {
  if (!intent) return 0.05; // Default weight
  
  return intent.confidence?.weight || 
         intent.confidence_weight || 
         0.05;
}

/**
 * Get OTC groups from intent
 */
export function getOtcGroups(intent) {
  if (!intent) return [];
  
  const otcGroup = intent.recommendation_mapping?.otc_group || 
                   intent.otc_group;
  
  if (Array.isArray(otcGroup)) {
    return otcGroup;
  } else if (typeof otcGroup === 'string' && otcGroup.trim()) {
    return otcGroup.split(',').map(g => g.trim()).filter(g => g);
  }
  
  return [];
}

/**
 * Get self-care groups from intent
 */
export function getSelfCareGroups(intent) {
  if (!intent) return ['rest_hydration']; // Default
  
  const selfCareGroup = intent.recommendation_mapping?.self_care_group || 
                        intent.self_care_group;
  
  if (Array.isArray(selfCareGroup)) {
    return selfCareGroup;
  } else if (typeof selfCareGroup === 'string' && selfCareGroup.trim()) {
    return selfCareGroup.split(',').map(g => g.trim()).filter(g => g);
  }
  
  return ['rest_hydration']; // Default
}

/**
 * Get all intents for a primary symptom
 */
export function getIntentsByPrimarySymptom(primarySymptom) {
  if (!_intentsByPrimarySymptom) {
    // Load synchronously (will use cached result if already loading)
    loadIntents().catch(() => {
      // Ignore errors, fallback to legacy mapping
    });
  }
  return _intentsByPrimarySymptom?.[primarySymptom] || [];
}

/**
 * Get severity level from intent (if available)
 * Returns intent's severity_level or null
 */
export function getSeverityFromIntent(intent) {
  if (!intent) return null;
  
  // Support both nested and flat structures
  const severity = intent.clinical_context?.severity || 
                   intent.severity_level;
  
  if (severity && ['mild', 'moderate', 'severe'].includes(severity.toLowerCase())) {
    return severity.toLowerCase();
  }
  
  return null;
}

/**
 * Get time course from intent (if available)
 * Returns intent's time_course or null
 */
export function getTimeCourseFromIntent(intent) {
  if (!intent) return null;
  
  // Support both nested and flat structures
  const timeCourse = intent.clinical_context?.time_course || 
                     intent.time_course;
  
  if (timeCourse && ['acute', 'subacute', 'progressive', 'chronic', 'recurrent'].includes(timeCourse.toLowerCase())) {
    return timeCourse.toLowerCase();
  }
  
  return null;
}

/**
 * Get clinical context from intent (severity + time_course)
 * Returns { severity, timeCourse } or null
 */
export function getClinicalContextFromIntent(intent) {
  if (!intent) return null;
  
  const severity = getSeverityFromIntent(intent);
  const timeCourse = getTimeCourseFromIntent(intent);
  
  if (severity || timeCourse) {
    return { severity, timeCourse };
  }
  
  return null;
}

/**
 * Find best matching intent for symptom text
 * Uses fuzzy matching to find intent with matching display_text
 */
export function findIntentBySymptomText(symptomText, language = 'th') {
  if (!symptomText || typeof symptomText !== 'string') return null;
  
  if (!_cachedIntents) {
    // Load synchronously (will use cached result if already loading)
    loadIntents().catch(() => {
      // Ignore errors, fallback to legacy mapping
    });
  }
  
  const normalizedText = symptomText.toLowerCase().trim();
  
  // Try exact match first
  for (const intent of _cachedIntents) {
    const displayText = language === 'th' 
      ? (intent.display_text_th || intent.display?.th || '')
      : (intent.display_text_en || intent.display?.en || '');
    
    if (displayText.toLowerCase().trim() === normalizedText) {
      return intent;
    }
  }
  
  // Try partial match (symptom text contains intent display text or vice versa)
  for (const intent of _cachedIntents) {
    const displayText = language === 'th' 
      ? (intent.display_text_th || intent.display?.th || '')
      : (intent.display_text_en || intent.display?.en || '');
    
    const normalizedDisplay = displayText.toLowerCase().trim();
    
    if (normalizedText.includes(normalizedDisplay) || 
        normalizedDisplay.includes(normalizedText)) {
      return intent;
    }
  }
  
  return null;
}

// Initialize on module load
loadIntents();
