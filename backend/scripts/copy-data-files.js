#!/usr/bin/env node
/**
 * Copy data files from mobile/assets/data/ to backend/data/ for Railway deployment
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const MOBILE_DATA_DIR = path.join(PROJECT_ROOT, 'mobile/assets/data');
const BACKEND_DATA_DIR = path.join(PROJECT_ROOT, 'backend/data');

const FILES_TO_COPY = [
  'otc_medicines_master_th.csv',
  'otc_clinical_mapping.json',
  'question_bank_master.json',
  'canonical_question_bank.json',
  'bodypart_redflags_expanded.csv',
];

console.log('📋 Copying data files for Railway deployment...');
console.log(`   From: ${MOBILE_DATA_DIR}`);
console.log(`   To:   ${BACKEND_DATA_DIR}`);
console.log('');

// Create backend/data directory if it doesn't exist
if (!fs.existsSync(BACKEND_DATA_DIR)) {
  fs.mkdirSync(BACKEND_DATA_DIR, { recursive: true });
  console.log(`✅ Created directory: ${BACKEND_DATA_DIR}`);
}

let copied = 0;
let skipped = 0;
let errors = 0;

// Copy each file
for (const file of FILES_TO_COPY) {
  const sourcePath = path.join(MOBILE_DATA_DIR, file);
  const destPath = path.join(BACKEND_DATA_DIR, file);
  
  try {
    if (!fs.existsSync(sourcePath)) {
      console.log(`⚠️  File not found: ${file}`);
      skipped++;
      continue;
    }
    
    fs.copyFileSync(sourcePath, destPath);
    const stats = fs.statSync(destPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✅ Copied: ${file} (${sizeKB} KB)`);
    copied++;
  } catch (error) {
    console.error(`❌ Error copying ${file}:`, error.message);
    errors++;
  }
}

console.log('');
console.log(`✅ Done! Copied ${copied} files, skipped ${skipped}, errors ${errors}`);
console.log('');
console.log('📝 Next steps:');
console.log('   1. Review copied files: ls -lh backend/data/');
console.log('   2. Add to Git: git add backend/data/');
console.log('   3. Commit: git commit -m "fix: copy data files to backend/data/ for Railway"');
console.log('   4. Push: git push');

