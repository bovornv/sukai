#!/usr/bin/env python3
"""
Generate all 700 symptom intents
Expands all primary symptoms with 10-12 intents each
"""

import json
import sys
from pathlib import Path
from expand_intents import expand_intents_for_symptom, PRIMARY_SYMPTOMS

def generate_all_intents():
    """Generate intents for all primary symptoms"""
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / 'data'
    
    # Load existing master file
    master_file = data_dir / 'symptom_intents_master.json'
    if master_file.exists():
        with open(master_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            existing_intents = data.get('intents', [])
    else:
        existing_intents = []
        data = {'version': '1.0', 'language': ['th', 'en'], 'intents': []}
    
    existing_ids = {intent.get('intent_id') for intent in existing_intents}
    
    # Generate intents for all primary symptoms
    all_new_intents = []
    total_by_symptom = {}
    
    print("🚀 Generating intents for all primary symptoms...\n")
    
    for system, symptoms in PRIMARY_SYMPTOMS.items():
        print(f"📋 {system.upper()}:")
        for symptom in symptoms:
            # Check if we already have intents for this symptom
            existing_count = sum(1 for i in existing_intents if i.get('primary_symptom') == symptom)
            
            if existing_count >= 10:
                print(f"  ✅ {symptom}: {existing_count} intents (skipping)")
                continue
            
            # Generate 12 intents per symptom (or more to reach 700 total)
            # Calculate how many more we need to reach 700
            current_total = len(existing_intents) + len(all_new_intents)
            remaining_for_700 = max(0, 700 - current_total)
            avg_needed = max(12 - existing_count, remaining_for_700 // max(len(PRIMARY_SYMPTOMS) - len(total_by_symptom), 1))
            needed = max(12 - existing_count, min(avg_needed, 15))  # Cap at 15 per symptom
            
            if needed > 0:
                intents = expand_intents_for_symptom(symptom, needed)
                new_intents = [i for i in intents if i['intent_id'] not in existing_ids]
                
                if new_intents:
                    all_new_intents.extend(new_intents)
                    for intent in new_intents:
                        existing_ids.add(intent['intent_id'])
                    
                    total_by_symptom[symptom] = len(new_intents)
                    print(f"  ✅ {symptom}: Generated {len(new_intents)} new intents")
                else:
                    print(f"  ⚠️  {symptom}: No new intents (duplicates)")
            else:
                print(f"  ✅ {symptom}: Already has {existing_count} intents")
    
    # Merge with existing
    data['intents'].extend(all_new_intents)
    
    # Sort by intent_id
    data['intents'].sort(key=lambda x: x.get('intent_id', ''))
    
    # Write to temporary file first (for sandbox compatibility)
    temp_file = data_dir / 'symptom_intents_generated_700.json'
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    # Also try to write to master (may fail in sandbox)
    try:
        output_file = data_dir / 'symptom_intents_master.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ Also written to {output_file}")
    except PermissionError:
        print(f"⚠️  Could not write to master file (sandbox restriction)")
        print(f"✅ Generated file saved to {temp_file}")
        print(f"📝 Please manually merge: python scripts/merge_intents.py data/symptom_intents_master.json data/symptom_intents_master.json {temp_file}")
    
    print(f"\n✅ Generated {len(all_new_intents)} new intents")
    print(f"✅ Total intents: {len(data['intents'])}")
    print(f"✅ Written to {output_file}")
    
    # Summary by symptom
    from collections import Counter
    symptom_counts = Counter(i.get('primary_symptom') for i in data['intents'])
    print(f"\n📊 Final summary by primary symptom:")
    for symptom, count in sorted(symptom_counts.items(), key=lambda x: -x[1]):
        print(f"  {symptom}: {count} intents")
    
    # Progress toward 700
    total = len(data['intents'])
    progress = (total / 700) * 100
    print(f"\n🎯 Progress: {total}/700 intents ({progress:.1f}%)")
    
    if total < 700:
        remaining = 700 - total
        avg_per_symptom = remaining / max(len(PRIMARY_SYMPTOMS), 1)
        print(f"📝 Need {remaining} more intents (~{avg_per_symptom:.0f} per symptom)")

if __name__ == '__main__':
    generate_all_intents()
