#!/usr/bin/env python3
"""
Expand existing intents to reach exactly 700
Adds more intents to high-frequency symptoms
"""

import json
from pathlib import Path
from collections import Counter
from expand_intents import expand_intents_for_symptom

def expand_to_700():
    """Expand dataset to exactly 700 intents"""
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / 'data'
    
    # Load master file
    master_file = data_dir / 'symptom_intents_master.json'
    with open(master_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        existing_intents = data.get('intents', [])
    
    existing_ids = {intent.get('intent_id') for intent in existing_intents}
    current_total = len(existing_intents)
    target = 700
    needed = target - current_total
    
    print(f"📊 Current: {current_total} intents")
    print(f"🎯 Target: {target} intents")
    print(f"📝 Need: {needed} more intents\n")
    
    if needed <= 0:
        print("✅ Already at or above target!")
        return
    
    # Count intents per symptom
    symptom_counts = Counter(i.get('primary_symptom') for i in existing_intents)
    
    # Prioritize high-frequency symptoms for expansion
    # Add 2-3 more intents to top symptoms until we reach 700
    high_frequency_symptoms = [
        'ปวดหัว', 'ไอ', 'เจ็บหน้าอก', 'ปวดท้อง', 'เวียนหัว',
        'ไข้', 'เจ็บคอ', 'ปวดหลัง', 'หายใจลำบาก', 'ท้องเสีย',
        'คลื่นไส้', 'อาเจียน', 'ปวดฟัน', 'ปวดคอ', 'ใจสั่น',
    ]
    
    all_new_intents = []
    
    # Add intents to high-frequency symptoms
    for symptom in high_frequency_symptoms:
        if needed <= 0:
            break
        
        current_count = symptom_counts.get(symptom, 0)
        # Add 2-3 more intents per symptom
        to_add = min(3, needed)
        
        if to_add > 0:
            # Generate with higher starting index to avoid duplicates
            # Start from current_count + 1
            from expand_intents import generate_intent_id, DISPLAY_TEMPLATES, RED_FLAG_QUESTIONS, get_body_system, determine_emergency, generate_intent
            
            new_intents = []
            templates = DISPLAY_TEMPLATES.get(symptom, {
                'th': [symptom] * 20,
                'en': [symptom] * 20,
            })
            
            th_templates = templates['th']
            en_templates = templates['en']
            
            # Generate intents starting from current_count + 1
            for i in range(to_add):
                if needed <= 0:
                    break
                
                template_idx = (current_count + i) % len(th_templates)
                display_th = th_templates[template_idx] if template_idx < len(th_templates) else f'{symptom} {current_count + i + 1}'
                display_en = en_templates[template_idx] if template_idx < len(en_templates) else f'{symptom} {current_count + i + 1}'
                
                intent = generate_intent(symptom, current_count + i + 1, display_th, display_en)
                
                if intent['intent_id'] not in existing_ids:
                    new_intents.append(intent)
                    existing_ids.add(intent['intent_id'])
                    needed -= 1
            
            if new_intents:
                all_new_intents.extend(new_intents)
                for intent in new_intents:
                    existing_ids.add(intent['intent_id'])
                    symptom_counts[symptom] = symptom_counts.get(symptom, 0) + 1
                
                needed -= len(new_intents)
                print(f"✅ {symptom}: Added {len(new_intents)} intents (now {symptom_counts[symptom]} total)")
    
    # If still need more, add to other symptoms
    if needed > 0:
        all_symptoms = list(symptom_counts.keys())
        for symptom in all_symptoms:
            if needed <= 0:
                break
            
            current_count = symptom_counts.get(symptom, 0)
            if current_count < 15:  # Don't exceed 15 per symptom
                to_add = min(2, needed, 15 - current_count)
                
                if to_add > 0:
                    intents = expand_intents_for_symptom(symptom, to_add + 3)
                    new_intents = [
                        i for i in intents 
                        if i['intent_id'] not in existing_ids and len(all_new_intents) < (target - current_total)
                    ][:to_add]
                    
                    if new_intents:
                        all_new_intents.extend(new_intents)
                        for intent in new_intents:
                            existing_ids.add(intent['intent_id'])
                            symptom_counts[symptom] = symptom_counts.get(symptom, 0) + 1
                        
                        needed -= len(new_intents)
                        print(f"✅ {symptom}: Added {len(new_intents)} intents (now {symptom_counts[symptom]} total)")
    
    # Merge
    data['intents'].extend(all_new_intents)
    data['intents'].sort(key=lambda x: x.get('intent_id', ''))
    
    # Write
    temp_file = data_dir / 'symptom_intents_expanded_700.json'
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Generated {len(all_new_intents)} new intents")
    print(f"✅ Total intents: {len(data['intents'])}")
    print(f"✅ Written to {temp_file}")
    print(f"🎯 Progress: {len(data['intents'])}/700 ({len(data['intents'])/700*100:.1f}%)")
    
    # Summary
    final_counts = Counter(i.get('primary_symptom') for i in data['intents'])
    print(f"\n📊 Final summary (top 15):")
    for symptom, count in final_counts.most_common(15):
        print(f"  {symptom}: {count} intents")

if __name__ == '__main__':
    expand_to_700()
