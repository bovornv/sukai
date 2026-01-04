/**
 * Unify Clinical Datasets - Production-Safe Upgrade
 * 
 * This script:
 * 1. Adds symptom_group to intents
 * 2. Converts otc_group and self_care_group to arrays
 * 3. Ensures all required fields are present
 * 
 * Run: node backend/scripts/unify_clinical_datasets.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Symptom group mapping (based on body_system)
const SYMPTOM_GROUP_MAP = {
  'neurology': 'neurological',
  'gastrointestinal': 'gastrointestinal',
  'cardio': 'cardiovascular',
  'respiratory': 'respiratory',
  'musculoskeletal': 'musculoskeletal',
  'dermatology': 'dermatological',
  'urology': 'urological',
  'gynecology': 'gynecological',
  'ophthalmology': 'ophthalmological',
  'ent': 'ent',
  'general': 'general',
  'infectious': 'infectious',
};

// Load JSON file
const jsonPath = path.join(__dirname, '../data/symptom_intents_master.json');
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let updatedCount = 0;
let arrayConvertedCount = 0;

// Process each intent
for (const intent of jsonData.intents) {
  let updated = false;
  
  // 1. Add symptom_group if missing
  if (!intent.symptom_group) {
    const bodySystem = intent.body_system || 'general';
    intent.symptom_group = SYMPTOM_GROUP_MAP[bodySystem] || bodySystem;
    updated = true;
  }
  
  // 2. Convert otc_group to array if it's a string
  if (typeof intent.otc_group === 'string') {
    if (intent.otc_group.trim() === '') {
      intent.otc_group = [];
    } else {
      // Split by comma or pipe
      intent.otc_group = intent.otc_group
        .split(/[,|]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    arrayConvertedCount++;
    updated = true;
  } else if (!Array.isArray(intent.otc_group)) {
    intent.otc_group = [];
    updated = true;
  }
  
  // 3. Convert self_care_group to array if it's a string
  if (typeof intent.self_care_group === 'string') {
    if (intent.self_care_group.trim() === '') {
      intent.self_care_group = ['rest_hydration']; // Default
    } else {
      // Split by comma or pipe
      intent.self_care_group = intent.self_care_group
        .split(/[,|]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    arrayConvertedCount++;
    updated = true;
  } else if (!Array.isArray(intent.self_care_group)) {
    intent.self_care_group = ['rest_hydration']; // Default
    updated = true;
  }
  
  // 4. Ensure aliases are arrays
  if (!Array.isArray(intent.aliases_th)) {
    intent.aliases_th = intent.aliases_th ? [intent.aliases_th] : [];
    updated = true;
  }
  if (!Array.isArray(intent.aliases_en)) {
    intent.aliases_en = intent.aliases_en ? [intent.aliases_en] : [];
    updated = true;
  }
  
  // 5. Ensure severity_default and time_course_default exist (use severity_level and time_course)
  if (!intent.severity_default && intent.severity_level) {
    intent.severity_default = intent.severity_level;
    updated = true;
  }
  if (!intent.time_course_default && intent.time_course) {
    intent.time_course_default = intent.time_course;
    updated = true;
  }
  
  if (updated) {
    updatedCount++;
  }
}

// Save updated JSON
fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');

console.log(`✅ Updated ${updatedCount} intents`);
console.log(`📝 Converted ${arrayConvertedCount} string fields to arrays`);
console.log(`📝 Updated: ${jsonPath}`);

// Also update mobile version
const mobileJsonPath = path.join(__dirname, '../../mobile/assets/data/symptom_intents_master.json');
if (fs.existsSync(mobileJsonPath)) {
  fs.writeFileSync(mobileJsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
  console.log(`✅ Updated mobile version: ${mobileJsonPath}`);
}

