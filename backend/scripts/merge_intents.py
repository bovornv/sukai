#!/usr/bin/env python3
"""
Merge multiple intent JSON files into master dataset
Removes duplicates and ensures proper ordering
"""

import json
import sys
from pathlib import Path
from collections import OrderedDict

def load_json_file(filepath):
    """Load JSON file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def merge_intent_files(files, output_file):
    """Merge multiple intent JSON files"""
    all_intents = []
    seen_ids = set()
    
    # Load all files
    for filepath in files:
        if not Path(filepath).exists():
            print(f"⚠️  File not found: {filepath}")
            continue
            
        data = load_json_file(filepath)
        intents = data.get('intents', [])
        
        for intent in intents:
            intent_id = intent.get('intent_id')
            if intent_id and intent_id not in seen_ids:
                all_intents.append(intent)
                seen_ids.add(intent_id)
            elif intent_id:
                print(f"⚠️  Duplicate intent_id skipped: {intent_id}")
    
    # Sort by intent_id for consistency
    all_intents.sort(key=lambda x: x.get('intent_id', ''))
    
    # Create merged structure
    merged = {
        'version': '1.0',
        'language': ['th', 'en'],
        'intents': all_intents
    }
    
    # Write merged file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Merged {len(all_intents)} unique intents")
    print(f"✅ Written to {output_file}")
    
    # Print summary by primary symptom
    by_symptom = {}
    for intent in all_intents:
        symptom = intent.get('primary_symptom', 'unknown')
        by_symptom[symptom] = by_symptom.get(symptom, 0) + 1
    
    print("\n📊 Summary by primary symptom:")
    for symptom, count in sorted(by_symptom.items()):
        print(f"  {symptom}: {count} intents")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python merge_intents.py <output_file> <input1.json> [input2.json] ...")
        print("\nExample:")
        print("  python merge_intents.py data/symptom_intents_master.json \\")
        print("    data/symptom_intents_master.json \\")
        print("    data/symptom_intents_expanded.json \\")
        print("    data/symptom_intents_temp.json")
        sys.exit(1)
    
    output_file = sys.argv[1]
    input_files = sys.argv[2:]
    
    merge_intent_files(input_files, output_file)
